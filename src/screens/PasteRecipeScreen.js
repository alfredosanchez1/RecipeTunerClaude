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
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useRecipe } from '../context/RecipeContext';
import aiService from '../services/aiService';

const PasteRecipeScreen = ({ navigation }) => {
  const theme = useTheme();
  const { saveRecipe } = useRecipe();

  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedRecipe, setExtractedRecipe] = useState(null);

  const handleProcessText = async () => {
    const textToProcess = (pastedText || '').trim();
    if (!textToProcess) {
      Alert.alert('Error', 'Por favor, pega o escribe el texto de la receta.');
      return;
    }

    setIsProcessing(true);
    try {
      const prompt = `Analiza el siguiente texto y extrae la información de la receta:

${textToProcess}

Responde en formato JSON exactamente así:
{
  "title": "título de la receta",
  "description": "descripción breve",
  "ingredients": [{"name": "ingrediente", "amount": "cantidad"}],
  "instructions": ["paso 1", "paso 2", "paso 3"],
  "cookingTime": "tiempo estimado",
  "servings": "número de porciones",
  "cuisine": "tipo de cocina",
  "difficulty": "Fácil/Intermedio/Difícil"
}`;

      let result;
      try {
        result = await aiService.extractRecipeFromText(prompt, textToProcess);
      } catch (error) {
        // Crear receta básica si falla la extracción con IA
        result = {
          title: 'Receta desde Memoria',
          description: 'Receta extraída de texto pegado',
          ingredients: [{ name: 'Ver texto original para detalles', amount: '' }],
          instructions: [textToProcess],
          cookingTime: '30-60 min',
          servings: '2',
          cuisine: 'General',
          difficulty: 'Media'
        };
      }

      setExtractedRecipe(result);
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar el texto.');
      console.error('Error processing text:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!extractedRecipe) {
      Alert.alert('Error', 'No hay receta para guardar.');
      return;
    }

    try {
      const recipeData = {
        title: extractedRecipe.title || 'Receta desde Memoria',
        description: extractedRecipe.description || 'Receta extraída de texto pegado',
        cuisine: extractedRecipe.cuisine || 'General',
        difficulty: extractedRecipe.difficulty || 'Media',
        cookingTime: extractedRecipe.cookingTime || '30-60 min',
        servings: parseInt(extractedRecipe.servings) || 2,
        ingredients: extractedRecipe.ingredients || [],
        instructions: extractedRecipe.instructions || [],
        dietaryRestrictions: [],
        source: 'paste_text',
        originalText: pastedText,
        createdAt: new Date().toISOString(),
      };

      // Navegar a la pantalla de solicitud de adaptación
      navigation.navigate('AdaptationRequest', {
        recipeData: recipeData,
        source: 'paste_text'
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la receta.');
      console.error('Error saving recipe:', error);
    }
  };

  const renderExtractedRecipe = () => {
    if (!extractedRecipe) return null;

    return (
      <Card style={styles.recipeCard}>
        <Card.Content>
          <Title style={styles.recipeTitle}>{extractedRecipe.title}</Title>

          {extractedRecipe.description && (
            <Text style={styles.recipeDescription}>{extractedRecipe.description}</Text>
          )}

          <View style={styles.recipeDetails}>
            <Text style={styles.detailText}>Cocina: {extractedRecipe.cuisine}</Text>
            <Text style={styles.detailText}>Dificultad: {extractedRecipe.difficulty}</Text>
            <Text style={styles.detailText}>Tiempo: {extractedRecipe.cookingTime}</Text>
            <Text style={styles.detailText}>Porciones: {extractedRecipe.servings}</Text>
          </View>

          {extractedRecipe.ingredients && extractedRecipe.ingredients.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredientes:</Text>
              {extractedRecipe.ingredients.map((ingredient, index) => (
                <Text key={index} style={styles.ingredientText}>
                  • {ingredient.name}: {ingredient.amount}
                </Text>
              ))}
            </View>
          )}

          {extractedRecipe.instructions && extractedRecipe.instructions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instrucciones:</Text>
              {extractedRecipe.instructions.map((instruction, index) => (
                <Text key={index} style={styles.instructionText}>
                  {index + 1}. {instruction}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.recipeActions}>
            <Button
              mode="contained"
              onPress={handleSaveRecipe}
              style={styles.saveButton}
              icon="content-save"
            >
              Tunear Receta
            </Button>
          </View>
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
          <Icon name="content-paste" size={50} color={theme.colors.primary} />
          <Title style={styles.headerTitle}>Enviar desde Memoria</Title>
          <Text style={styles.headerSubtitle}>
            Pega el texto de tu receta copiado desde cualquier lugar
          </Text>
        </View>

        <Card style={styles.inputCard}>
          <Card.Content>
            <Text style={styles.inputLabel}>Texto de la receta:</Text>
            <TextInput
              multiline
              numberOfLines={12}
              value={pastedText}
              onChangeText={setPastedText}
              placeholder="Pega aquí el texto de tu receta copiado desde un PDF, mensaje, correo, etc..."
              style={styles.textInput}
              disabled={isProcessing}
            />

            <View style={styles.actionContainer}>
              <Button
                mode="contained"
                onPress={handleProcessText}
                style={styles.processButton}
                icon="auto-fix"
                disabled={isProcessing || !pastedText.trim()}
                loading={isProcessing}
              >
                {isProcessing ? 'Procesando...' : 'Tunear Receta con IA'}
              </Button>
            </View>
          </Card.Content>
        </Card>

        {renderExtractedRecipe()}

        <View style={styles.backButton}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            icon="arrow-left"
            disabled={isProcessing}
          >
            Volver
          </Button>
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
  inputCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    minHeight: 250,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  actionContainer: {
    alignItems: 'center',
  },
  processButton: {
    paddingVertical: 8,
    paddingHorizontal: 30,
  },
  recipeCard: {
    margin: 20,
    backgroundColor: '#fff',
  },
  recipeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  recipeDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  recipeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  ingredientText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 10,
    marginBottom: 5,
  },
  instructionText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 10,
    marginBottom: 8,
    lineHeight: 20,
  },
  recipeActions: {
    marginTop: 20,
    alignItems: 'center',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 30,
  },
  backButton: {
    padding: 20,
    alignItems: 'center',
  },
});

export default PasteRecipeScreen;