import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Title,
  Text,
  useTheme,
  Card,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useUser } from '../context/UserContext';
import { useRecipe } from '../context/RecipeContext';
import aiService from '../services/aiService';

const AdaptationRequestScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const { preferences } = useUser();
  const { saveRecipeWithAdaptation } = useRecipe();

  // Recibir datos de la receta desde la pantalla anterior
  const { recipeData, source } = route.params || {};

  const [userComments, setUserComments] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const generateAdaptationPrompt = (originalRecipe, userPreferences, userComment = "") => {
    return `
Eres un chef experto y nutricionista especializado en adaptar recetas. Tu tarea es modificar la receta proporcionada para que se ajuste perfectamente a las necesidades específicas del usuario.

=== INFORMACIÓN DEL USUARIO ===
RESTRICCIONES DIETÉTICAS: ${userPreferences.dietaryRestrictions?.join(', ') || 'Ninguna'}
ALERGIAS ALIMENTARIAS: ${userPreferences.allergies?.join(', ') || 'Ninguna'}
INTOLERANCIAS: ${userPreferences.intolerances?.join(', ') || 'Ninguna'}
PREFERENCIAS DE COCINA: ${userPreferences.preferredCuisines?.join(', ') || 'Ninguna'}
NIVEL DE HABILIDAD: ${userPreferences.cookingSkillLevel || 'Intermedio'}
TAMAÑO DE PORCIÓN PREFERIDO: ${userPreferences.servingSize || 'Sin preferencia'} personas
INGREDIENTES QUE NO LE GUSTAN: ${userPreferences.dislikedIngredients?.join(', ') || 'Ninguno'}
COMENTARIO ADICIONAL DEL USUARIO: "${userComment}"

=== RECETA ORIGINAL ===
${JSON.stringify(originalRecipe, null, 2)}

=== INSTRUCCIONES CRÍTICAS ===
1. SEGURIDAD PRIMERO: Elimina TODOS los ingredientes que causen alergias o sean incompatibles con las restricciones
2. MANTÉN LA ESENCIA: Conserva el sabor y concepto general de la receta
3. SUSTITUCIONES INTELIGENTES: Usa ingredientes que mantengan textura y sabor similares
4. OPTIMIZA NUTRICIÓN: Mejora el perfil nutricional cuando sea posible
5. SÉ ESPECÍFICO: Indica cantidades exactas y técnicas específicas
6. AJUSTA PORCIONES: Adapta la receta al tamaño de porción preferido del usuario

=== REGLAS DE SUSTITUCIÓN ===
- Para VEGANOS: Sin productos animales (carne, lácteos, huevos, miel, gelatina)
- Para VEGETARIANOS: Sin carne, pero permite lácteos y huevos
- Para KETO: Máximo 5g carbohidratos netos por porción
- Para SIN GLUTEN: Eliminar trigo, cebada, centeno, avena no certificada
- Para DIABÉTICOS: Evitar azúcares añadidos, usar edulcorantes naturales
- Para HIPERTENSOS: Reducir sodio a menos de 140mg por porción
- Para INTOLERANCIA A LACTOSA: Usar alternativas sin lactosa

Responde ÚNICAMENTE en este formato JSON exacto (sin texto adicional):

{
  "success": true,
  "title": "título adaptado de la receta",
  "description": "descripción breve adaptada (máximo 2 líneas)",
  "ingredients": [
    {
      "name": "nombre del ingrediente adaptado",
      "amount": "cantidad numérica",
      "unit": "unidad de medida",
      "originalIngredient": "ingrediente original que reemplazó (si aplica)",
      "substitutionReason": "razón del cambio (si aplica)"
    }
  ],
  "instructions": [
    "paso 1 adaptado con técnica específica",
    "paso 2 adaptado...",
    "paso 3 adaptado..."
  ],
  "cookingTime": {
    "prep": "tiempo de preparación en minutos",
    "cook": "tiempo de cocción en minutos",
    "total": "tiempo total en minutos"
  },
  "servings": "número de porciones",
  "cuisine": "tipo de cocina",
  "difficulty": "Fácil/Intermedio/Difícil",
  "nutrition": {
    "calories": "calorías por porción (estimado)",
    "protein": "proteína en gramos",
    "carbs": "carbohidratos en gramos",
    "fat": "grasas en gramos",
    "fiber": "fibra en gramos",
    "sodium": "sodio en mg"
  },
  "adaptationSummary": {
    "majorChanges": ["cambio importante 1", "cambio importante 2"],
    "substitutions": [
      {
        "original": "ingrediente original",
        "replacement": "sustituto usado",
        "reason": "razón específica del cambio"
      }
    ],
    "nutritionImprovements": ["mejora nutricional 1", "mejora 2"],
    "timeAdjustments": "explicación de ajustes de tiempo si los hubo"
  },
  "tips": [
    "consejo específico para esta adaptación",
    "tip de preparación relevante",
    "sugerencia de presentación"
  ],
  "warnings": [
    "advertencia importante si aplica"
  ],
  "alternatives": {
    "ingredients": [
      {
        "ingredient": "ingrediente adaptado",
        "alternatives": ["alternativa 1", "alternativa 2"]
      }
    ],
    "cookingMethods": "métodos alternativos de cocción si aplican"
  },
  "shoppingNotes": [
    "dónde encontrar ingrediente especial",
    "marca recomendada para producto específico"
  ]
}

Si la receta NO PUEDE adaptarse completamente a las restricciones del usuario, responde:
{
  "success": false,
  "reason": "explicación específica de por qué no se puede adaptar",
  "suggestions": [
    "sugerencia de receta alternativa 1",
    "sugerencia de receta alternativa 2"
  ]
}`;
  };

  const handleAdaptRecipe = async () => {
    setIsProcessing(true);

    try {
      // Debug logging
      console.log('🔍 AdaptationRequestScreen: Iniciando adaptación');
      console.log('📊 Datos de receta:', JSON.stringify(recipeData, null, 2));
      console.log('⚙️ Preferencias:', JSON.stringify(preferences, null, 2));
      console.log('💬 Comentarios del usuario:', userComments);

      // Usar el prompt mejorado
      const adaptationPrompt = generateAdaptationPrompt(recipeData, preferences || {}, userComments);
      console.log('📝 Prompt generado:', adaptationPrompt.substring(0, 500) + '...');

      console.log('🤖 Enviando a OpenAI...');
      const adaptedRecipe = await aiService.adaptWithOpenAI(adaptationPrompt);
      console.log('✅ Respuesta de OpenAI:', JSON.stringify(adaptedRecipe, null, 2));

      // Validar la respuesta de la IA
      if (!adaptedRecipe.success) {
        Alert.alert(
          'No se pudo adaptar la receta',
          adaptedRecipe.reason || 'La receta no puede adaptarse completamente a tus restricciones.',
          [
            {
              text: 'Intentar de nuevo',
              onPress: () => setIsProcessing(false)
            }
          ]
        );
        return;
      }

      // Procesar ingredientes con la nueva estructura
      const processedIngredients = adaptedRecipe.ingredients?.map(ing => ({
        name: ing.name,
        amount: `${ing.amount || ''} ${ing.unit || ''}`.trim(),
        originalIngredient: ing.originalIngredient,
        substitutionReason: ing.substitutionReason
      })) || [];

      // Preparar datos de la receta original
      const originalRecipeData = {
        ...recipeData,
        source: source,
        createdAt: new Date().toISOString(),
        isAdapted: false
      };

      // Preparar datos de la receta adaptada
      const adaptedRecipeData = {
        title: adaptedRecipe.title || recipeData.title,
        description: adaptedRecipe.description || recipeData.description,
        cuisine: adaptedRecipe.cuisine || recipeData.cuisine,
        difficulty: adaptedRecipe.difficulty || recipeData.difficulty,
        cookingTime: adaptedRecipe.cookingTime?.total || recipeData.cookingTime,
        prepTime: adaptedRecipe.cookingTime?.prep,
        cookTime: adaptedRecipe.cookingTime?.cook,
        servings: parseInt(adaptedRecipe.servings) || recipeData.servings,
        ingredients: processedIngredients,
        instructions: adaptedRecipe.instructions || recipeData.instructions,

        // Nuevos campos del prompt mejorado
        nutrition: adaptedRecipe.nutrition,
        adaptationSummary: adaptedRecipe.adaptationSummary,
        tips: adaptedRecipe.tips,
        warnings: adaptedRecipe.warnings,
        alternatives: adaptedRecipe.alternatives,
        shoppingNotes: adaptedRecipe.shoppingNotes,

        // Metadatos de adaptación
        userComments: userComments,
        userPreferences: preferences,
        source: source,
        isAdapted: true,
        adapted: true,
        adaptedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        dietaryRestrictions: preferences?.dietaryRestrictions || [],
      };

      // Guardar ambas recetas usando la nueva función
      const savedRecipes = await saveRecipeWithAdaptation(originalRecipeData, adaptedRecipeData);

      Alert.alert(
        '¡Recetas Guardadas Exitosamente!',
        `Se guardaron tanto la receta original como la adaptada. ${adaptedRecipe.adaptationSummary?.majorChanges?.length || 0} cambios principales realizados según tus preferencias.`,
        [
          {
            text: 'Ver Todas las Recetas',
            onPress: () => navigation.navigate('Recipes', { filter: 'original', hideAdaptButton: true }),
          },
          {
            text: 'Ver Receta Adaptada',
            onPress: () => navigation.navigate('RecipeDetail', {
              recipe: savedRecipes.adapted,
              isAdapted: true,
              returnTo: 'Recipes',
              returnParams: { filter: 'adapted', hideAdaptButton: true }
            }),
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error en handleAdaptRecipe:', error);
      console.error('❌ Error stack:', error.stack);
      Alert.alert('Error', `No se pudo adaptar la receta: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para limpiar HTML de texto
  const cleanHtmlText = (text) => {
    if (!text || typeof text !== 'string') return text;

    return text
      .replace(/<[^>]*>/g, '') // Remover todas las etiquetas HTML
      .replace(/&nbsp;/g, ' ') // Reemplazar espacios no separables
      .replace(/&amp;/g, '&') // Reemplazar &amp; por &
      .replace(/&lt;/g, '<') // Reemplazar &lt; por <
      .replace(/&gt;/g, '>') // Reemplazar &gt; por >
      .replace(/&quot;/g, '"') // Reemplazar &quot; por "
      .replace(/&#39;/g, "'") // Reemplazar &#39; por '
      .replace(/\s+/g, ' ') // Reemplazar múltiples espacios por uno solo
      .trim(); // Remover espacios al inicio y final
  };

  const buildPreferencesText = () => {
    if (!preferences) return 'Sin preferencias específicas';

    const sections = [];

    if (preferences.dietaryRestrictions?.length > 0) {
      sections.push(`Restricciones dietéticas: ${preferences.dietaryRestrictions.join(', ')}`);
    }

    if (preferences.allergies?.length > 0) {
      sections.push(`Alergias: ${preferences.allergies.join(', ')}`);
    }

    if (preferences.dislikedIngredients?.length > 0) {
      sections.push(`Ingredientes que no le gustan: ${preferences.dislikedIngredients.join(', ')}`);
    }

    if (preferences.preferredCuisines?.length > 0) {
      sections.push(`Cocinas preferidas: ${preferences.preferredCuisines.join(', ')}`);
    }

    if (preferences.cookingSkillLevel) {
      sections.push(`Nivel de cocina: ${preferences.cookingSkillLevel}`);
    }

    if (preferences.servingSize) {
      sections.push(`Tamaño de porción preferido: ${preferences.servingSize} personas`);
    }

    return sections.length > 0 ? sections.join('\n') : 'Sin preferencias específicas';
  };

  const renderRecipePreview = () => {
    if (!recipeData) return null;

    return (
      <Card style={styles.previewCard}>
        <Card.Content>
          <Title style={styles.previewTitle}>Receta a Adaptar:</Title>
          <Text style={styles.recipeTitle}>{recipeData.title}</Text>

          {recipeData.description && (
            <Text style={styles.recipeDescription}>{cleanHtmlText(recipeData.description)}</Text>
          )}

          <View style={styles.recipeInfo}>
            <Text style={styles.infoText}>Cocina: {recipeData.cuisine || 'General'}</Text>
            <Text style={styles.infoText}>Dificultad: {recipeData.difficulty || 'Media'}</Text>
            <Text style={styles.infoText}>Tiempo: {recipeData.cookingTime || '30-60 min'}</Text>
            <Text style={styles.infoText}>Porciones: {recipeData.servings || '2'}</Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderUserPreferences = () => {
    const preferencesText = buildPreferencesText();

    if (preferencesText === 'Sin preferencias específicas') {
      return (
        <Card style={styles.preferencesCard}>
          <Card.Content>
            <Title style={styles.preferencesTitle}>Tus Preferencias:</Title>
            <Text style={styles.noPreferencesText}>
              No tienes preferencias configuradas. Ve a "Mi Perfil" → "Preferencias" para configurarlas.
            </Text>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Profile', { screen: 'Preferences' })}
              style={styles.configureButton}
              icon="cog"
            >
              Configurar Preferencias
            </Button>
          </Card.Content>
        </Card>
      );
    }

    return (
      <Card style={styles.preferencesCard}>
        <Card.Content>
          <Title style={styles.preferencesTitle}>Tus Preferencias:</Title>
          <Text style={styles.preferencesText}>{preferencesText}</Text>
        </Card.Content>
      </Card>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Icon name="auto-fix" size={50} color={theme.colors.primary} />
          <Title style={styles.headerTitle}>Adaptar Receta con IA</Title>
          <Text style={styles.headerSubtitle}>
            Agrega comentarios específicos para personalizar tu receta
          </Text>
        </View>

        {renderRecipePreview()}
        {renderUserPreferences()}

        <Card style={styles.commentsCard}>
          <Card.Content>
            <Title style={styles.commentsTitle}>Comentarios Adicionales:</Title>
            <Text style={styles.commentsSubtitle}>
              Agrega solicitudes específicas, sustituciones o cambios que quieras que la IA considere:
            </Text>

            <TextInput
              multiline
              numberOfLines={6}
              value={userComments}
              onChangeText={setUserComments}
              placeholder="Ejemplo: 'Hazlo más picante', 'Sustituye la carne por pollo', 'Haz una versión vegetariana', 'Reduce las calorías', etc..."
              style={styles.commentsInput}
              disabled={isProcessing}
            />

            <View style={styles.exampleChips}>
              <Text style={styles.exampleTitle}>Ejemplos:</Text>
              <View style={styles.chipsContainer}>
                <Chip
                  mode="outlined"
                  onPress={() => setUserComments('Hazlo más saludable')}
                  style={styles.exampleChip}
                >
                  Hazlo más saludable
                </Chip>
                <Chip
                  mode="outlined"
                  onPress={() => setUserComments('Versión vegetariana')}
                  style={styles.exampleChip}
                >
                  Versión vegetariana
                </Chip>
                <Chip
                  mode="outlined"
                  onPress={() => setUserComments('Más picante')}
                  style={styles.exampleChip}
                >
                  Más picante
                </Chip>
                <Chip
                  mode="outlined"
                  onPress={() => setUserComments('Reduce las calorías')}
                  style={styles.exampleChip}
                >
                  Reduce calorías
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.actionContainer}>
          {isProcessing ? (
            <Card style={styles.processingCard}>
              <Card.Content style={styles.processingContent}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.processingText}>Adaptando receta con IA...</Text>
                <Text style={styles.processingSubtext}>Esto puede tomar unos momentos</Text>
              </Card.Content>
            </Card>
          ) : (
            <>
              <Button
                mode="contained"
                onPress={handleAdaptRecipe}
                style={styles.adaptButton}
                icon="auto-fix"
                disabled={!recipeData}
              >
                Adaptar Receta con IA
              </Button>

              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                icon="arrow-left"
              >
                Volver
              </Button>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  previewCard: {
    margin: 20,
    backgroundColor: '#fff',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
    textAlign: 'center',
  },
  recipeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
  recipeInfo: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  preferencesCard: {
    margin: 20,
    backgroundColor: '#fff',
  },
  preferencesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  preferencesText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
  },
  noPreferencesText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  configureButton: {
    alignSelf: 'center',
  },
  commentsCard: {
    margin: 20,
    backgroundColor: '#fff',
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  commentsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  commentsInput: {
    backgroundColor: '#f8f9fa',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  exampleChips: {
    marginTop: 10,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exampleChip: {
    marginBottom: 8,
  },
  actionContainer: {
    padding: 20,
    alignItems: 'center',
  },
  adaptButton: {
    paddingVertical: 8,
    paddingHorizontal: 30,
    marginBottom: 15,
    backgroundColor: '#4CAF50',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 30,
  },
  processingCard: {
    backgroundColor: '#fff',
    width: '100%',
  },
  processingContent: {
    alignItems: 'center',
    padding: 30,
  },
  processingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  processingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default AdaptationRequestScreen;