import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button, Card, Title, Paragraph, Chip } from 'react-native-paper';
import imageService from '../services/imageService';
import aiService from '../services/aiService';
import { useUser } from '../context/UserContext';
import { useRecipe } from '../context/RecipeContext';

const CameraRecipeScreen = () => {
  const navigation = useNavigation();
  const { preferences } = useUser();
  const { saveRecipe } = useRecipe();
  
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [extractedRecipe, setExtractedRecipe] = useState(null);
  const [permissions, setPermissions] = useState({ camera: false, mediaLibrary: false });

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const perms = await imageService.requestPermissions();
      setPermissions(perms);
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const takePhoto = async () => {
    try {
      if (!permissions.camera) {
        Alert.alert(
          'Permiso Requerido',
          'Necesitamos acceso a la cámara para tomar fotos de recetas.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Configuración', onPress: () => checkPermissions() }
          ]
        );
        return;
      }

      const imageData = await imageService.takePhoto();
      if (imageData) {
        setCapturedImage(imageData);
        setAnalysisResult(null);
        setExtractedRecipe(null);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto. Inténtalo de nuevo.');
      console.error('Error taking photo:', error);
    }
  };

  const pickImage = async () => {
    try {
      if (!permissions.mediaLibrary) {
        Alert.alert(
          'Permiso Requerido',
          'Necesitamos acceso a la galería para seleccionar imágenes.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Configuración', onPress: () => checkPermissions() }
          ]
        );
        return;
      }

      const imageData = await imageService.pickImage();
      if (imageData) {
        setCapturedImage(imageData);
        setAnalysisResult(null);
        setExtractedRecipe(null);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen. Inténtalo de nuevo.');
      console.error('Error picking image:', error);
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) {
      Alert.alert('Error', 'Primero debes capturar o seleccionar una imagen.');
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log('📱 CameraScreen: Iniciando análisis de imagen');
      // Analizar imagen con Google Vision API
      const visionResult = await imageService.analyzeRecipeImage(capturedImage);
      console.log('📱 CameraScreen: Resultado del análisis:', visionResult);
      setAnalysisResult(visionResult);

      // Si se detectó texto, extraer receta con IA
      if (visionResult.text && visionResult.extractedRecipe) {
        console.log('📱 CameraScreen: Receta ya extraída en visionResult');
        setExtractedRecipe(visionResult.extractedRecipe);
      } else if (visionResult.text) {
        console.log('📱 CameraScreen: Extrayendo receta del texto detectado');
        // Extraer receta del texto detectado
        const recipe = await imageService.extractRecipeFromText(visionResult.text);
        console.log('📱 CameraScreen: Receta extraída:', recipe);
        setExtractedRecipe(recipe);
      } else {
        console.log('📱 CameraScreen: No se detectó texto en el análisis');
      }

      Alert.alert(
        'Análisis Completado',
        'La imagen ha sido analizada exitosamente. Revisa los resultados abajo.'
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo analizar la imagen. Inténtalo de nuevo.');
      console.error('Error analyzing image:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveExtractedRecipe = async () => {
    if (!analysisResult || !analysisResult.text) {
      Alert.alert('Error', 'No hay texto extraído para procesar.');
      return;
    }

    try {
      // Crear receta básica desde el análisis
      let recipeData;

      if (extractedRecipe) {
        // Si ya tenemos receta estructurada, usarla
        recipeData = {
          title: analysisResult.title || extractedRecipe.title || 'Receta Extraída',
          description: extractedRecipe.description || 'Receta extraída de imagen',
          cuisine: 'General',
          difficulty: 'Media',
          cookingTime: '30-60 min',
          servings: 2,
          ingredients: extractedRecipe.ingredients?.map(ing => ({
            name: ing.name,
            amount: ing.amount || 'al gusto',
          })) || [],
          instructions: extractedRecipe.instructions || [],
          image: capturedImage.uri,
          dietaryRestrictions: [],
          source: 'camera',
          confidence: analysisResult.confidence || 0.8,
        };
      } else {
        // Si solo tenemos texto, crear receta básica
        recipeData = {
          title: analysisResult.title || 'Receta Extraída',
          description: 'Receta extraída de imagen con OCR',
          cuisine: 'General',
          difficulty: 'Media',
          cookingTime: '30-60 min',
          servings: 2,
          ingredients: [{ name: 'Ver texto extraído para detalles', amount: '' }],
          instructions: [analysisResult.text],
          image: capturedImage.uri,
          dietaryRestrictions: [],
          source: 'camera',
          confidence: analysisResult.confidence || 0.8,
        };
      }

      // Navegar a la pantalla de solicitud de adaptación
      navigation.navigate('AdaptationRequest', {
        recipeData: recipeData,
        source: 'camera'
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la receta. Inténtalo de nuevo.');
      console.error('Error saving recipe:', error);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setExtractedRecipe(null);
  };

  const renderImagePreview = () => {
    if (!capturedImage) return null;

    return (
      <Card style={styles.imageCard}>
        <Card.Cover source={{ uri: capturedImage.uri }} />
        <Card.Content style={styles.imageCardContent}>
          <Title>Imagen Capturada</Title>
          <Paragraph>
            Tamaño: {Math.round(capturedImage.fileSize / 1024)} KB
          </Paragraph>
          <View style={styles.imageActions}>
            <Button mode="outlined" onPress={retakePhoto} style={styles.actionButton}>
              Volver a Tomar
            </Button>
            <Button
              mode="contained"
              onPress={analyzeImage}
              disabled={isAnalyzing}
              style={styles.actionButton}
            >
              {isAnalyzing ? 'Convirtiendo...' : 'Pasar a Texto'}
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    return (
      <Card style={styles.resultCard}>
        <Card.Content>
          <Title>Resultado del Análisis</Title>

          {analysisResult.title && (
            <View style={styles.resultSection}>
              <Paragraph style={styles.sectionTitle}>Título de la Receta:</Paragraph>
              <Text style={styles.recipeTitle}>{analysisResult.title}</Text>
            </View>
          )}

          {analysisResult.text && (
            <View style={styles.resultSection}>
              <Paragraph style={styles.sectionTitle}>Texto Detectado:</Paragraph>
              <Text style={styles.detectedText}>{analysisResult.text}</Text>
            </View>
          )}

          {analysisResult.labels && analysisResult.labels.length > 0 && (
            <View style={styles.resultSection}>
              <Paragraph style={styles.sectionTitle}>Etiquetas Detectadas:</Paragraph>
              <View style={styles.labelsContainer}>
                {analysisResult.labels.map((label, index) => (
                  <Chip key={index} style={styles.labelChip} mode="outlined">
                    {label}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          <Paragraph style={styles.confidenceText}>
            Confianza: {Math.round(analysisResult.confidence * 100)}%
          </Paragraph>

          {analysisResult.text && (
            <View style={styles.analysisActions}>
              <Button
                mode="contained"
                onPress={saveExtractedRecipe}
                style={styles.tuneButton}
                icon="auto-fix"
              >
                Continuar con Tuneado
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };


  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Capturar Receta con Cámara</Title>
        <Paragraph style={styles.headerSubtitle}>
          Toma una foto de tu receta o selecciona una imagen de la galería para extraerla automáticamente con IA
        </Paragraph>
      </View>

      <View style={styles.cameraActions}>
        <Button 
          mode="contained" 
          icon="camera" 
          onPress={takePhoto}
          style={styles.cameraButton}
          disabled={!permissions.camera}
        >
          Tomar Foto
        </Button>
        
        <Button 
          mode="outlined" 
          icon="image" 
          onPress={pickImage}
          style={styles.galleryButton}
          disabled={!permissions.mediaLibrary}
        >
          Seleccionar de Galería
        </Button>
      </View>

      {!permissions.camera && !permissions.mediaLibrary && (
        <Card style={styles.permissionCard}>
          <Card.Content>
            <Title>Permisos Requeridos</Title>
            <Paragraph>
              Para usar esta función, necesitamos acceso a la cámara y galería.
            </Paragraph>
            <Button mode="contained" onPress={checkPermissions} style={styles.permissionButton}>
              Solicitar Permisos
            </Button>
          </Card.Content>
        </Card>
      )}

      {renderImagePreview()}
      
      {isAnalyzing && (
        <Card style={styles.loadingCard}>
          <Card.Content style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Analizando imagen con IA...</Text>
            <Text style={styles.loadingSubtext}>Esto puede tomar unos segundos</Text>
          </Card.Content>
        </Card>
      )}

      {renderAnalysisResult()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  cameraActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  cameraButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#4CAF50',
  },
  galleryButton: {
    flex: 1,
    marginLeft: 10,
    borderColor: '#4CAF50',
  },
  permissionCard: {
    margin: 20,
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
  },
  permissionButton: {
    marginTop: 10,
    backgroundColor: '#f39c12',
  },
  imageCard: {
    margin: 20,
    backgroundColor: '#fff',
  },
  imageCardContent: {
    paddingTop: 15,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  resultCard: {
    margin: 20,
    backgroundColor: '#fff',
  },
  resultSection: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  detectedText: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  labelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  labelChip: {
    marginBottom: 5,
  },
  confidenceText: {
    marginTop: 10,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
  },
  analysisActions: {
    marginTop: 20,
    alignItems: 'center',
  },
  tuneButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
  },
  loadingCard: {
    margin: 20,
    backgroundColor: '#fff',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default CameraRecipeScreen;
