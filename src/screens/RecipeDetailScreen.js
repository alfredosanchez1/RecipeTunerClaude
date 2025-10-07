import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useRecipe } from '../context/RecipeContext';
import { useUser } from '../context/UserContext';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import remindersService from '../services/remindersService';

const RecipeDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { recipe: routeRecipe, recipeId, isAdapted, returnTo, returnParams } = route.params || {};
  const { recipes, deleteRecipe, adaptRecipeWithAI } = useRecipe();
  const { user } = useUser();

  // Si se pasa recipe directamente, usarlo; si no, buscar por recipeId
  const recipe = routeRecipe || recipes.find(r => r.id === recipeId);
  const [isAdapting, setIsAdapting] = useState(false);

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Receta no encontrada</Text>
      </View>
    );
  }

  const handleGoBack = () => {
    if (returnTo && returnParams) {
      // Navegar específicamente a la pantalla de origen con sus parámetros
      navigation.navigate(returnTo, returnParams);
    } else {
      // Fallback a goBack si no hay información específica
      navigation.goBack();
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Receta',
      '¿Estás seguro de que quieres eliminar esta receta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteRecipe(recipe.id);
            handleGoBack();
          },
        },
      ]
    );
  };

  const handleAdaptWithAI = async () => {
    setIsAdapting(true);
    try {
      const adaptedRecipe = await adaptRecipeWithAI(recipe, user.preferences);

      // Navegar directamente a la receta adaptada
      navigation.push('RecipeDetail', {
        recipe: adaptedRecipe,
        isAdapted: true,
        returnTo: 'Recipes',
        returnParams: { filter: 'adapted', hideAdaptButton: true }
      });

      Alert.alert(
        'Éxito',
        'Receta adaptada exitosamente con información nutricional completa.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo adaptar la receta. Inténtalo de nuevo.');
    } finally {
      setIsAdapting(false);
    }
  };

  const handleExportToReminders = () => {
    remindersService.showExportOptions(recipe);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {recipe.isAdapted && (
          <View style={styles.headerTop}>
            <View style={styles.adaptedBadge}>
              <Icon name="robot" size={16} color="#fff" />
              <Text style={styles.adaptedBadgeText}>Tuneada</Text>
            </View>
          </View>
        )}
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.description}>{recipe.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información General</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cocina:</Text>
          <Text style={styles.infoValue}>{recipe.cuisine}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dificultad:</Text>
          <Text style={styles.infoValue}>{recipe.difficulty}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tiempo de cocción:</Text>
          <Text style={styles.infoValue}>{recipe.cookTime || recipe.cookingTime || 'No especificado'} {(recipe.cookTime || recipe.cookingTime) ? 'minutos' : ''}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Porciones:</Text>
          <Text style={styles.infoValue}>{recipe.servings}</Text>
        </View>
      </View>

      {recipe.nutrition && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Información Nutricional (por porción)</Text>
          <View style={styles.nutritionGrid}>
            {recipe.nutrition.calories && (
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Calorías</Text>
                <Text style={styles.nutritionValue}>{recipe.nutrition.calories}</Text>
                <Text style={styles.nutritionUnit}>kcal</Text>
              </View>
            )}
            {recipe.nutrition.protein && (
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Proteína</Text>
                <Text style={styles.nutritionValue}>{recipe.nutrition.protein}</Text>
                <Text style={styles.nutritionUnit}>g</Text>
              </View>
            )}
            {recipe.nutrition.carbs && (
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Carbohidratos</Text>
                <Text style={styles.nutritionValue}>{recipe.nutrition.carbs}</Text>
                <Text style={styles.nutritionUnit}>g</Text>
              </View>
            )}
            {recipe.nutrition.fat && (
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Grasas</Text>
                <Text style={styles.nutritionValue}>{recipe.nutrition.fat}</Text>
                <Text style={styles.nutritionUnit}>g</Text>
              </View>
            )}
            {recipe.nutrition.fiber && (
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Fibra</Text>
                <Text style={styles.nutritionValue}>{recipe.nutrition.fiber}</Text>
                <Text style={styles.nutritionUnit}>g</Text>
              </View>
            )}
            {recipe.nutrition.sodium && (
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>Sodio</Text>
                <Text style={styles.nutritionValue}>{recipe.nutrition.sodium}</Text>
                <Text style={styles.nutritionUnit}>mg</Text>
              </View>
            )}
          </View>
          <Text style={styles.nutritionDisclaimer}>
            💡 Valores nutricionales estimados basados en ingredientes estándar
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredientes</Text>
        {recipe.ingredients && recipe.ingredients.map((ingredient, index) => {
          // Manejar tanto la estructura antigua (string) como la nueva (objeto)
          const ingredientText = typeof ingredient === 'string'
            ? ingredient
            : `${ingredient.name}${ingredient.amount ? ` - ${ingredient.amount}` : ''}${ingredient.unit ? ` ${ingredient.unit}` : ''}`;

          return (
            <Text key={index} style={styles.ingredient}>
              • {ingredientText}
            </Text>
          );
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instrucciones</Text>
        {recipe.instructions.map((instruction, index) => (
          <View key={index} style={styles.instructionRow}>
            <Text style={styles.instructionNumber}>{index + 1}.</Text>
            <Text style={styles.instruction}>{instruction}</Text>
          </View>
        ))}
      </View>

      {recipe.dietaryRestrictions && recipe.dietaryRestrictions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restricciones Dietéticas</Text>
          <View style={styles.tagsContainer}>
            {recipe.dietaryRestrictions.map((restriction, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{restriction}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {recipe.tags && recipe.tags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Etiquetas</Text>
          <View style={styles.tagsContainer}>
            {recipe.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {recipe.tips && recipe.tips.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consejos</Text>
          {recipe.tips.map((tip, index) => (
            <Text key={index} style={styles.ingredient}>
              💡 {tip}
            </Text>
          ))}
        </View>
      )}

      {recipe.warnings && recipe.warnings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advertencias</Text>
          {recipe.warnings.map((warning, index) => (
            <Text key={index} style={[styles.ingredient, { color: '#FF3B30' }]}>
              ⚠️ {warning}
            </Text>
          ))}
        </View>
      )}

      {recipe.shoppingNotes && recipe.shoppingNotes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛒 Notas de Compra</Text>
          {recipe.shoppingNotes.map((note, index) => (
            <Text key={index} style={styles.shoppingNote}>
              🛍️ {note}
            </Text>
          ))}
        </View>
      )}

      {recipe.alternatives && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 Alternativas</Text>

          {recipe.alternatives.ingredients && recipe.alternatives.ingredients.length > 0 && (
            <View style={styles.alternativesSubsection}>
              <Text style={styles.alternativesSubtitle}>Ingredientes Alternativos:</Text>
              {recipe.alternatives.ingredients.map((alt, index) => (
                <View key={index} style={styles.alternativeItem}>
                  <Text style={styles.alternativeIngredient}>
                    🥄 {alt.ingredient}
                  </Text>
                  <Text style={styles.alternativesList}>
                    Puedes usar: {alt.alternatives.join(', ')}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {recipe.alternatives.cookingMethods && (
            <View style={styles.alternativesSubsection}>
              <Text style={styles.alternativesSubtitle}>Métodos de Cocción Alternativos:</Text>
              <Text style={styles.cookingMethodText}>
                👨‍🍳 {recipe.alternatives.cookingMethods}
              </Text>
            </View>
          )}
        </View>
      )}

      {recipe.isAdapted && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Información de Adaptación</Text>

          {recipe.adaptedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fecha de adaptación:</Text>
              <Text style={styles.infoValue}>
                {new Date(recipe.adaptedAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          )}

          {recipe.originalRecipeId && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Basada en receta original:</Text>
              <Text style={styles.infoValue}>ID: {recipe.originalRecipeId}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estado:</Text>
            <Text style={[styles.infoValue, styles.adaptedStatus]}>
              🤖 Adaptada con IA
            </Text>
          </View>
        </View>
      )}

      {recipe.adaptationSummary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 Resumen de Adaptación</Text>

          {recipe.adaptationSummary.majorChanges && recipe.adaptationSummary.majorChanges.length > 0 && (
            <View style={styles.adaptationSubsection}>
              <Text style={styles.adaptationSubtitle}>Cambios Principales:</Text>
              {recipe.adaptationSummary.majorChanges.map((change, index) => (
                <Text key={index} style={styles.adaptationItem}>
                  • {change}
                </Text>
              ))}
            </View>
          )}

          {recipe.adaptationSummary.substitutions && recipe.adaptationSummary.substitutions.length > 0 && (
            <View style={styles.adaptationSubsection}>
              <Text style={styles.adaptationSubtitle}>Sustituciones de Ingredientes:</Text>
              {recipe.adaptationSummary.substitutions.map((sub, index) => (
                <View key={index} style={styles.substitutionItem}>
                  <Text style={styles.substitutionText}>
                    <Text style={styles.substitutionOriginal}>{sub.original}</Text>
                    {' → '}
                    <Text style={styles.substitutionReplacement}>{sub.replacement}</Text>
                  </Text>
                  <Text style={styles.substitutionReason}>{sub.reason}</Text>
                </View>
              ))}
            </View>
          )}

          {recipe.adaptationSummary.nutritionImprovements && recipe.adaptationSummary.nutritionImprovements.length > 0 && (
            <View style={styles.adaptationSubsection}>
              <Text style={styles.adaptationSubtitle}>Mejoras Nutricionales:</Text>
              {recipe.adaptationSummary.nutritionImprovements.map((improvement, index) => (
                <Text key={index} style={styles.adaptationItem}>
                  💚 {improvement}
                </Text>
              ))}
            </View>
          )}

          {recipe.adaptationSummary.timeAdjustments && (
            <View style={styles.adaptationSubsection}>
              <Text style={styles.adaptationSubtitle}>Ajustes de Tiempo:</Text>
              <Text style={styles.adaptationItem}>⏱️ {recipe.adaptationSummary.timeAdjustments}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.homeButton]}
          onPress={() => navigation.navigate('HomeMain')}
        >
          <Text style={styles.buttonText}>🏠 Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.remindersButton]}
          onPress={handleExportToReminders}
        >
          <Text style={[styles.buttonText, styles.notesButtonText]}>📝 Enviar a Notas iPhone</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={styles.buttonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  adaptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#34C759',
    borderRadius: 15,
  },
  adaptedBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  adaptedStatus: {
    color: '#34C759',
    fontWeight: '600',
  },
  ingredient: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  instructionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 10,
    minWidth: 25,
  },
  instruction: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    padding: 20,
    gap: 15,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  homeButton: {
    backgroundColor: '#007AFF',
  },
  remindersButton: {
    backgroundColor: '#FFD60A',
  },
  adaptButton: {
    backgroundColor: '#FF9500',
  },
  editButton: {
    backgroundColor: '#34C759',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  notesButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  // Estilos para la sección de adaptación
  adaptationSubsection: {
    marginBottom: 20,
  },
  adaptationSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 5,
  },
  adaptationItem: {
    fontSize: 14,
    color: '#555',
    marginLeft: 10,
    marginBottom: 5,
    lineHeight: 20,
  },
  substitutionItem: {
    marginLeft: 10,
    marginBottom: 12,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  substitutionText: {
    fontSize: 14,
    marginBottom: 4,
  },
  substitutionOriginal: {
    color: '#FF3B30',
    fontWeight: '500',
    textDecorationLine: 'line-through',
  },
  substitutionReplacement: {
    color: '#34C759',
    fontWeight: '600',
  },
  substitutionReason: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  // Estilos para la sección nutricional
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  nutritionItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  nutritionUnit: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  nutritionDisclaimer: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  // Estilos para notas de compra
  shoppingNote: {
    fontSize: 14,
    color: '#555',
    marginLeft: 10,
    marginBottom: 8,
    lineHeight: 20,
    paddingLeft: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  // Estilos para alternativas
  alternativesSubsection: {
    marginBottom: 20,
  },
  alternativesSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 5,
  },
  alternativeItem: {
    marginLeft: 10,
    marginBottom: 12,
    paddingLeft: 15,
    paddingRight: 10,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  alternativeIngredient: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  alternativesList: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  cookingMethodText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 10,
    marginBottom: 8,
    lineHeight: 20,
    paddingLeft: 15,
    paddingRight: 10,
    paddingVertical: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
});

export default RecipeDetailScreen;
