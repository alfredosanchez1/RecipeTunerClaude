import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import recipeExtractionService from '../../services/recipeExtractionService';
import { getRecipeIconInfo, getRecipeEmoji, determineRecipeType } from '../../utils/recipeIcons';

const ImportRecipeScreen = () => {
  // 🥖 VERSIÓN CON EMOJIS DE COMIDA 🥖
  console.log('🍝 IMPORT SCREEN - VERSIÓN CON EMOJIS CARGADA 🍝');
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recipePreview, setRecipePreview] = useState(null);
  const navigation = useNavigation();

  const processUrl = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Por favor ingresa una URL válida');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      Alert.alert('Error', 'Por favor ingresa una URL válida que comience con http:// o https://');
      return;
    }

    setIsProcessing(true);
    setRecipePreview(null);

    try {
      console.log('🚀 EXTRAYENDO RECETA COMPLETA DESDE URL:', url);

      // Extraemos directamente la receta completa
      const fullRecipe = await recipeExtractionService.extractRecipeFromUrl(url);

      console.log('✅ RECETA COMPLETA EXTRAÍDA, NAVEGANDO A ADAPTACIÓN');

      // Preparar datos para AdaptationRequest
      const recipeData = {
        title: fullRecipe.title || 'Receta Importada',
        description: fullRecipe.description || 'Receta importada desde web',
        cuisine: fullRecipe.cuisine || 'General',
        difficulty: fullRecipe.difficulty || 'Media',
        cookingTime: fullRecipe.cookingTime || fullRecipe.totalTime || '30-60 min',
        servings: parseInt(fullRecipe.servings) || 2,
        ingredients: fullRecipe.ingredients || [],
        instructions: fullRecipe.instructions || [],
        dietaryRestrictions: [],
        source: 'web_import',
        imageUrl: fullRecipe.imageUrl,
        sourceUrl: url,
        createdAt: new Date().toISOString(),
      };

      // Navegar directamente a la pantalla de solicitud de adaptación
      navigation.navigate('AdaptationRequest', {
        recipeData: recipeData,
        source: 'web_import'
      });

    } catch (error) {
      console.error('❌ ERROR EN EXTRACCIÓN:', error);
      Alert.alert(
        'Error al extraer la receta',
        'No se pudo extraer la receta de esta URL. Por favor verifica que:\n\n• La URL sea correcta\n• La página contenga una receta válida\n• Tengas conexión a internet\n\nIntenta con una URL diferente.',
        [
          { text: 'OK', onPress: () => setUrl('') }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!recipePreview) return;

    setIsProcessing(true);
    try {
      console.log('🚀 EXTRAYENDO RECETA COMPLETA...');

      // Extraemos la receta completa con todos los ingredientes e instrucciones
      const fullRecipe = await recipeExtractionService.extractRecipeFromUrl(recipePreview.sourceUrl);

      // Fusionamos el preview con la receta completa para tener la mejor información
      const finalRecipe = {
        ...fullRecipe,
        title: recipePreview.title,
        servings: recipePreview.servings,
        cookingTime: recipePreview.totalTime,
        imageUrl: recipePreview.imageUrl || fullRecipe.imageUrl,
        isImported: true
      };

      console.log('✅ RECETA COMPLETA EXTRAÍDA');

      // Preparar datos para AdaptationRequest
      const recipeData = {
        title: finalRecipe.title || 'Receta Importada',
        description: finalRecipe.description || 'Receta importada desde web',
        cuisine: finalRecipe.cuisine || 'General',
        difficulty: finalRecipe.difficulty || 'Media',
        cookingTime: finalRecipe.cookingTime || finalRecipe.totalTime || '30-60 min',
        servings: parseInt(finalRecipe.servings) || 2,
        ingredients: finalRecipe.ingredients || [],
        instructions: finalRecipe.instructions || [],
        dietaryRestrictions: [],
        source: 'web_import',
        imageUrl: finalRecipe.imageUrl,
        sourceUrl: recipePreview.sourceUrl,
        createdAt: new Date().toISOString(),
      };

      // Navegar a la pantalla de solicitud de adaptación
      navigation.navigate('AdaptationRequest', {
        recipeData: recipeData,
        source: 'web_import'
      });

    } catch (error) {
      console.error('❌ ERROR EXTRAYENDO RECETA COMPLETA:', error);
      Alert.alert('Error', 'No se pudo extraer la receta completa. Intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditPreview = () => {
    // Opción para que el usuario edite los datos antes de continuar
    Alert.alert(
      'Editar Información',
      'Esta función te permitirá editar los datos extraídos antes de continuar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar sin editar', onPress: handleConfirmImport }
      ]
    );
  };

  const openUrl = () => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Importar Receta desde URL</Text>
        <Text style={styles.subtitle}>
          Pega la URL de una receta y confirma los datos extraídos antes de importar
        </Text>
        <Text style={{color: 'red', fontSize: 12, textAlign: 'center', marginTop: 5}}>
          🔧 VERSIÓN ACTUALIZADA - PUERTO 8083 🔧
        </Text>
      </View>

      <View style={styles.urlSection}>
        <Text style={styles.sectionTitle}>URL de la Receta</Text>
        
        <View style={styles.urlExamples}>
          <Text style={styles.examplesTitle}>Ejemplos de URLs que funcionan:</Text>
          <Text style={styles.exampleUrl}>• allrecipes.com/recipe/...</Text>
          <Text style={styles.exampleUrl}>• food.com/recipe/...</Text>
          <Text style={styles.exampleUrl}>• blogs de cocina con recetas</Text>
        </View>
        
        <View style={styles.urlInputContainer}>
          <TextInput
            style={styles.urlInput}
            placeholder="https://ejemplo.com/receta"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {url ? (
            <TouchableOpacity style={styles.openUrlButton} onPress={openUrl}>
              <Ionicons name="open-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity
          style={[styles.processButton, (!url.trim() || isProcessing) && styles.disabledButton]}
          onPress={processUrl}
          disabled={!url.trim() || isProcessing}
        >
          {isProcessing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.loadingText}>Preparando receta para adaptación...</Text>
            </View>
          ) : (
            <Text style={styles.processButtonText}>Adaptar la Receta de esta dirección</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* NUEVA SECCIÓN DE PREVIEW DE CONFIRMACIÓN */}
      {recipePreview && (
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>¿Es correcta esta información?</Text>

          <View style={styles.previewCard}>
            {/* Emoji representativo del platillo */}
            <View style={styles.emojiContainer}>
              <Text style={styles.recipeEmoji}>
                {recipePreview.emoji || '🍽️'}
              </Text>
              <Text style={styles.emojiLabel}>
                Tipo: {recipePreview.recipeType || 'PLATILLO'}
              </Text>
            </View>

            <View style={styles.previewContent}>
              <Text style={styles.previewTitle}>{recipePreview.title}</Text>

              {recipePreview.description && (
                <Text style={styles.previewDescription}>{recipePreview.description}</Text>
              )}

              {/* Mostrar algunos ingredientes si están disponibles */}
              {recipePreview.ingredients && recipePreview.ingredients.length > 0 && (
                <View style={styles.ingredientsPreview}>
                  <Text style={styles.ingredientsTitle}>Ingredientes principales:</Text>
                  <Text style={styles.ingredientsList} numberOfLines={4}>
                    {recipePreview.ingredients.slice(0, 4).join(', ')}
                    {recipePreview.ingredients.length > 4 && ', y más...'}
                  </Text>
                  <Text style={{fontSize: 10, color: 'gray', marginTop: 5}}>
                    DEBUG: {recipePreview.ingredients.length} ingredientes encontrados
                  </Text>
                </View>
              )}

              <View style={styles.previewInfo}>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Ionicons name="list-outline" size={20} color="#007AFF" />
                    <Text style={styles.infoLabel}>Ingredientes</Text>
                    <Text style={styles.infoValue}>{recipePreview.ingredientsCount}</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Ionicons name="time-outline" size={20} color="#007AFF" />
                    <Text style={styles.infoLabel}>Tiempo total</Text>
                    <Text style={styles.infoValue}>{recipePreview.totalTime} min</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Ionicons name="people-outline" size={20} color="#007AFF" />
                    <Text style={styles.infoLabel}>Porciones</Text>
                    <Text style={styles.infoValue}>{recipePreview.servings}</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#28a745" />
                    <Text style={styles.infoLabel}>Confianza</Text>
                    <Text style={styles.infoValue}>{recipePreview.confidence}%</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.detailsText}>
                  Prep: {recipePreview.preparationTime} min • Cocción: {recipePreview.cookingTime} min
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditPreview}
            >
              <Ionicons name="pencil-outline" size={20} color="#007AFF" />
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmImport}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="white" />
                  <Text style={styles.confirmButtonText}>Tunear Receta</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Consejos</Text>
        <View style={styles.tipItem}>
          <Ionicons name="bulb-outline" size={20} color="#FFD700" />
          <Text style={styles.tipText}>
            Funciona mejor con páginas de recetas populares como AllRecipes, Food.com, etc.
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="bulb-outline" size={20} color="#FFD700" />
          <Text style={styles.tipText}>
            Revisa que los datos extraídos sean correctos antes de importar la receta.
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="bulb-outline" size={20} color="#FFD700" />
          <Text style={styles.tipText}>
            Si algo no se ve bien, puedes editarlo después de importar la receta.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 22,
  },
  urlSection: {
    padding: 20,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  urlExamples: {
    marginBottom: 16,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  exampleUrl: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  urlInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    marginBottom: 16,
  },
  urlInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#212529',
  },
  openUrlButton: {
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#dee2e6',
  },
  processButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  processButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 10,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  recipesSection: {
    padding: 20,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipePreview: {
    marginTop: 8,
  },
  recipeCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 16,
    lineHeight: 22,
  },
  recipeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  importButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  importButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsSection: {
    padding: 20,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 32,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 12,
    lineHeight: 20,
  },
  basicExtractionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  basicExtractionText: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 10,
    lineHeight: 20,
  },
  debugButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // NUEVOS ESTILOS PARA EL PREVIEW
  previewSection: {
    padding: 20,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emojiContainer: {
    width: '100%',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
  },
  recipeEmoji: {
    fontSize: 80,
    textAlign: 'center',
    marginBottom: 8,
  },
  emojiLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  ingredientsPreview: {
    marginBottom: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    minHeight: 120,
  },
  ingredientsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
  },
  ingredientsList: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 24,
    flexWrap: 'wrap',
    textAlign: 'left',
    flex: 1,
  },
  previewContent: {
    padding: 16,
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
    lineHeight: 28,
  },
  previewDescription: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 16,
    lineHeight: 22,
  },
  previewInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    textAlign: 'center',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginTop: 2,
    textAlign: 'center',
  },
  detailsRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  detailsText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: 'white',
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#28a745',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ImportRecipeScreen;
