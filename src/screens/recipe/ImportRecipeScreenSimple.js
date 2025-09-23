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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getRecipeEmoji, determineRecipeType } from '../../utils/recipeIcons';

const ImportRecipeScreenSimple = () => {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recipePreview, setRecipePreview] = useState(null);
  const navigation = useNavigation();

  // Mock data para testing
  const mockProcessUrl = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Por favor ingresa una URL válida');
      return;
    }

    setIsProcessing(true);

    // Simular carga
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock preview con datos fijos para testing - AHORA CON EMOJIS
    const mockRecipe = {
      title: "Pasta Carbonara Clásica",
      description: "Una deliciosa pasta italiana con huevo, queso pecorino y panceta",
      ingredients: ["Espaguetis", "Huevos", "Queso Pecorino", "Panceta", "Pimienta negra"],
      totalTime: 30,
      servings: 4,
      cuisine: "italiana"
    };

    // Detectar tipo automáticamente y obtener emoji
    const detectedType = determineRecipeType(mockRecipe);
    const recipeEmoji = getRecipeEmoji(detectedType);

    const mockPreview = {
      ...mockRecipe,
      recipeType: detectedType,
      emoji: recipeEmoji,
      emojiSize: 80
    };

    console.log('🧪 MOCK PREVIEW CARGADO:', mockPreview);
    setRecipePreview(mockPreview);
    setIsProcessing(false);
  };

  const handleConfirmImport = () => {
    Alert.alert('Éxito', 'Receta importada correctamente');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🥖 VERSIÓN EMOJIS - TEST</Text>
        <Text style={styles.subtitle}>
          Probando sistema de emojis de comida
        </Text>
      </View>

      <View style={styles.urlSection}>
        <Text style={styles.sectionTitle}>URL de la Receta</Text>

        <View style={styles.urlInputContainer}>
          <TextInput
            style={styles.urlInput}
            placeholder="https://ejemplo.com/receta (cualquier texto)"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={[styles.processButton, (!url.trim() || isProcessing) && styles.disabledButton]}
          onPress={mockProcessUrl}
          disabled={!url.trim() || isProcessing}
        >
          {isProcessing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.loadingText}>Simulando carga...</Text>
            </View>
          ) : (
            <Text style={styles.processButtonText}>PROBAR EMOJIS DE COMIDA</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* NUEVA SECCIÓN DE PREVIEW */}
      {recipePreview && (
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>¿Es correcta esta información?</Text>

          <View style={styles.previewCard}>
            {/* Emoji representativo del platillo */}
            <View style={styles.emojiContainer}>
              <Text style={[styles.recipeEmoji, { fontSize: recipePreview.emojiSize }]}>
                {recipePreview.emoji}
              </Text>
              <Text style={styles.emojiLabel}>
                Tipo: {recipePreview.recipeType}
              </Text>
            </View>

            <View style={styles.previewContent}>
              <Text style={styles.previewTitle}>{recipePreview.title}</Text>

              {recipePreview.description && (
                <Text style={styles.previewDescription}>{recipePreview.description}</Text>
              )}

              {/* INGREDIENTES CON LAYOUT MEJORADO */}
              {recipePreview.ingredients && recipePreview.ingredients.length > 0 && (
                <View style={styles.ingredientsPreview}>
                  <Text style={styles.ingredientsTitle}>Ingredientes principales:</Text>
                  <View style={styles.ingredientsContainer}>
                    <Text style={styles.ingredientsList}>
                      {recipePreview.ingredients.slice(0, 4).join(', ')}
                      {recipePreview.ingredients.length > 4 && ', y más...'}
                    </Text>
                  </View>
                  <Text style={styles.debugText}>
                    ✅ {recipePreview.ingredients.length} ingredientes • Layout mejorado
                  </Text>
                </View>
              )}

              {/* Información rápida */}
              <View style={styles.previewInfo}>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Ionicons name="people-outline" size={20} color="#007AFF" />
                    <Text style={styles.infoLabel}>Porciones</Text>
                    <Text style={styles.infoValue}>{recipePreview.servings}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="time-outline" size={20} color="#007AFF" />
                    <Text style={styles.infoLabel}>Tiempo total</Text>
                    <Text style={styles.infoValue}>{recipePreview.totalTime} min</Text>
                  </View>
                </View>
              </View>

              {/* Botones de acción */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.confirmButton]}
                  onPress={handleConfirmImport}
                >
                  <Text style={styles.confirmButtonText}>✅ Confirmar Importación</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  urlSection: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: 16,
    marginHorizontal: 16,
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
    color: '#1F2937',
    marginBottom: 16,
  },
  urlInputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  urlInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  processButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  processButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
  },
  previewSection: {
    padding: 20,
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
  },
  recipeEmoji: {
    textAlign: 'center',
    marginBottom: 8,
  },
  emojiLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  previewContent: {
    padding: 20,
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 28,
  },
  previewDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 22,
  },
  ingredientsPreview: {
    marginBottom: 20,
    paddingVertical: 24,
    paddingHorizontal: 24,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    minHeight: 140,
  },
  ingredientsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  ingredientsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  ingredientsList: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 26,
    textAlign: 'left',
  },
  debugText: {
    fontSize: 11,
    color: '#059669',
    marginTop: 12,
    fontWeight: '500',
  },
  previewInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#059669',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ImportRecipeScreenSimple;