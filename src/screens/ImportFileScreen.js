import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Button,
  Title,
  Text,
  useTheme,
  Card,
  TextInput,
  Divider,
} from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Linking } from 'react-native';
// Ya no necesitamos expo-file-system porque usamos fetch nativo
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useRecipe } from '../context/RecipeContext';
import aiService from '../services/aiService';

const ImportFileScreen = ({ navigation }) => {
  const theme = useTheme();
  const { saveRecipe } = useRecipe();

  const [isProcessing, setIsProcessing] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [extractedRecipe, setExtractedRecipe] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');

  const processFileWithAI = async (file) => {
    setIsProcessing(true);
    try {
      console.log('🤖 Procesando archivo con OpenAI:', file.name);

      // Convertir archivo a base64 usando fetch
      const response = await fetch(file.uri);
      const blob = await response.blob();

      // Convertir blob a base64
      const base64File = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1]; // Remover el prefijo data:
          resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      console.log('📄 Archivo convertido a base64, tamaño:', Math.round(base64File.length / 1024), 'KB');

      // Para PDFs grandes, usar fallback a texto simple
      if (file.mimeType.includes('pdf') && base64File.length > 4000000) { // ~3MB limit
        console.log('⚠️ PDF muy grande, usando fallback a extracción de texto simple');

        // Crear receta básica con información del archivo
        result = {
          title: `Receta de ${file.name.replace(/\.[^/.]+$/, "")}`,
          description: 'Receta extraída de archivo PDF. Por favor, revisa y edita los ingredientes e instrucciones.',
          ingredients: [
            { name: 'Ver archivo PDF original para ingredientes completos', amount: '' }
          ],
          instructions: [
            'Consultar archivo PDF original para instrucciones detalladas',
            'Editar esta receta con los ingredientes y pasos correctos'
          ],
          cookingTime: '30-60 min',
          servings: '4',
          cuisine: 'General',
          difficulty: 'Media'
        };
      } else {
        // Archivo pequeño, procesar con IA
        console.log('📄 Procesando archivo con IA...');

        const fileType = file.mimeType.includes('pdf') ? 'PDF' : file.mimeType.includes('word') ? 'Word' : 'de texto';
        const prompt = `Eres un experto chef y analista de documentos. Tu tarea es procesar este archivo ${fileType} y extraer una receta completa.

PASOS A SEGUIR:
1. PRIMERO: Lee y convierte todo el contenido del archivo ${fileType} a texto
2. SEGUNDO: Analiza el texto extraído para identificar una receta
3. TERCERO: Estructura la información de la receta en el formato JSON requerido

INSTRUCCIONES ESPECÍFICAS:
- Extrae TODOS los ingredientes con sus cantidades exactas
- Extrae TODAS las instrucciones paso a paso
- Identifica el título, tiempo de cocción, porciones y tipo de cocina
- Si hay varias recetas en el archivo, elige la principal o más completa

Responde ÚNICAMENTE en formato JSON exactamente así:
{
  "title": "título exacto de la receta",
  "description": "descripción breve de la receta",
  "ingredients": [{"name": "ingrediente", "amount": "cantidad exacta"}],
  "instructions": ["paso 1 completo", "paso 2 completo", "paso 3 completo"],
  "cookingTime": "tiempo estimado",
  "servings": "número de porciones",
  "cuisine": "tipo de cocina",
  "difficulty": "Fácil/Intermedio/Difícil"
}`;

        // Enviar a OpenAI para extracción (no adaptación)
        let result;
        try {
          // Usar método específico para extracción de archivos
          result = await aiService.extractRecipeFromFile(prompt, file.mimeType, base64File);
        } catch (error) {
          console.error('❌ Error procesando con IA:', error);
          // Fallback: crear receta básica
          result = {
            title: `Receta de ${file.name.replace(/\.[^/.]+$/, "")}`,
            description: 'Receta extraída de archivo con IA',
            ingredients: [{ name: 'Ver archivo original para detalles', amount: '' }],
            instructions: ['Revisar archivo original para instrucciones completas'],
            cookingTime: '30-60 min',
            servings: '2',
            cuisine: 'General',
            difficulty: 'Media'
          };
        }
      }

      setExtractedRecipe(result);
      setPastedText(`Receta extraída del archivo: ${file.name}\n\nTítulo: ${result.title}\nDescripción: ${result.description}`);

      // Navegar directamente a AdaptationRequest con la receta extraída
      const recipeData = {
        title: result.title || 'Receta Importada',
        description: result.description || 'Receta extraída de archivo',
        cuisine: result.cuisine || 'General',
        difficulty: result.difficulty || 'Media',
        cookingTime: result.cookingTime || '30-60 min',
        servings: parseInt(result.servings) || 2,
        ingredients: result.ingredients || [],
        instructions: result.instructions || [],
        dietaryRestrictions: [],
        source: 'file_import',
        originalText: `Archivo: ${file.name}`,
        selectedFile: {
          name: file.name,
          type: file.mimeType,
          size: file.size
        },
        createdAt: new Date().toISOString(),
      };

      // Ir a la pantalla de solicitud de adaptación
      navigation.navigate('AdaptationRequest', {
        recipeData: recipeData,
        source: 'file_import'
      });

    } catch (error) {
      console.error('❌ Error procesando archivo:', error);
      console.error('❌ Error stack:', error.stack);
      Alert.alert('Error', `No se pudo procesar el archivo: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/plain',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);

        // Función para compartir archivo y permitir que el usuario lo abra
        const shareFileToOpen = async () => {
          try {
            console.log('📂 Compartiendo archivo para abrir:', file.name);

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
              await Sharing.shareAsync(file.uri, {
                mimeType: file.mimeType,
                dialogTitle: `Abrir con...`,
              });
              console.log('✅ Archivo compartido para apertura');
              return true;
            }

            return false;
          } catch (error) {
            console.log('❌ Error compartiendo archivo:', error);
            return false;
          }
        };

        // Procesar cualquier tipo de archivo directamente con OpenAI
        Alert.alert(
          'Archivo Seleccionado',
          `Archivo: ${file.name}\nTipo: ${file.mimeType || 'Desconocido'}\n\n¿Quieres procesar este archivo directamente con IA para extraer la receta?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Procesar con IA',
              onPress: () => processFileWithAI(file)
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo.');
      console.error('Error selecting file:', error);
    }
  };

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
          title: 'Receta Importada',
          description: 'Receta extraída de texto',
          ingredients: [{ name: 'Ver texto original para detalles', amount: '' }],
          instructions: [textToProcess],
          cookingTime: '30-60 min',
          servings: '2',
          cuisine: 'General',
          difficulty: 'Media'
        };
      }

      setExtractedRecipe(result);

      // Navegar directamente a AdaptationRequest con la receta extraída
      const recipeData = {
        title: result.title || 'Receta Importada',
        description: result.description || 'Receta extraída de texto',
        cuisine: result.cuisine || 'General',
        difficulty: result.difficulty || 'Media',
        cookingTime: result.cookingTime || '30-60 min',
        servings: parseInt(result.servings) || 2,
        ingredients: result.ingredients || [],
        instructions: result.instructions || [],
        dietaryRestrictions: [],
        source: 'text_import',
        originalText: textToProcess,
        selectedFile: null,
        createdAt: new Date().toISOString(),
      };

      // Ir a la pantalla de solicitud de adaptación
      navigation.navigate('AdaptationRequest', {
        recipeData: recipeData,
        source: 'text_import'
      });

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
        title: extractedRecipe.title || 'Receta Importada',
        description: extractedRecipe.description || 'Receta extraída de texto',
        cuisine: extractedRecipe.cuisine || 'General',
        difficulty: extractedRecipe.difficulty || 'Media',
        cookingTime: extractedRecipe.cookingTime || '30-60 min',
        servings: parseInt(extractedRecipe.servings) || 2,
        ingredients: extractedRecipe.ingredients || [],
        instructions: extractedRecipe.instructions || [],
        dietaryRestrictions: [],
        source: 'text_import',
        originalText: pastedText,
        selectedFile: selectedFile ? {
          name: selectedFile.name,
          type: selectedFile.mimeType,
          size: selectedFile.size
        } : null,
        createdAt: new Date().toISOString(),
      };

      // Navegar a la pantalla de solicitud de adaptación
      navigation.navigate('AdaptationRequest', {
        recipeData: recipeData,
        source: 'file_import'
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la receta.');
      console.error('Error saving recipe:', error);
    }
  };

  const renderSelectedFile = () => {
    if (!selectedFile) return null;

    const getFileIcon = (mimeType) => {
      if (mimeType === 'text/plain') return 'file-document-outline';
      if (mimeType === 'application/pdf') return 'file-pdf-box';
      if (mimeType.includes('word')) return 'file-word-box';
      return 'file-document';
    };

    const getFileColor = (mimeType) => {
      if (mimeType === 'text/plain') return '#4CAF50';
      if (mimeType === 'application/pdf') return '#F44336';
      if (mimeType.includes('word')) return '#2196F3';
      return '#666';
    };

    return (
      <Card style={styles.fileInfoCard}>
        <Card.Content>
          <View style={styles.fileHeader}>
            <Icon
              name={getFileIcon(selectedFile.mimeType)}
              size={40}
              color={getFileColor(selectedFile.mimeType)}
            />
            <View style={styles.fileDetails}>
              <Text style={styles.fileName}>{selectedFile.name}</Text>
              <Text style={styles.fileSize}>
                {selectedFile.size ? `${Math.round(selectedFile.size / 1024)} KB` : 'Tamaño desconocido'}
              </Text>
            </View>
          </View>

          {selectedFile.mimeType === 'text/plain' && fileContent && (
            <View style={styles.filePreview}>
              <Text style={styles.previewLabel}>Vista previa:</Text>
              <Text style={styles.previewText} numberOfLines={3}>
                {fileContent}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
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
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Icon name="file-document" size={50} color={theme.colors.primary} />
          <Title style={styles.headerTitle}>Importar Archivo</Title>
          <Text style={styles.headerSubtitle}>
            Selecciona un archivo y será procesado automáticamente con IA
          </Text>
        </View>

        <Card style={styles.optionsCard}>
          <Card.Content>
            <Text style={styles.optionsTitle}>Seleccionar archivo:</Text>
            <Text style={styles.optionsSubtitle}>
              Procesa archivos .txt, .pdf y .docx directamente con IA
            </Text>

            <Button
              mode="contained"
              onPress={handleSelectFile}
              style={styles.selectFileButton}
              icon="file-upload"
              disabled={isProcessing}
            >
              Seleccionar Archivo
            </Button>
          </Card.Content>
        </Card>

        {renderSelectedFile()}

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
    </View>
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
    minHeight: 200,
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
  optionsCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 8,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  optionsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  selectFileButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  divider: {
    marginVertical: 15,
  },
  orText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
  },
  fileInfoCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 8,
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  fileDetails: {
    flex: 1,
    marginLeft: 15,
  },
  fileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  fileSize: {
    fontSize: 14,
    color: '#666',
  },
  filePreview: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
});

export default ImportFileScreen;