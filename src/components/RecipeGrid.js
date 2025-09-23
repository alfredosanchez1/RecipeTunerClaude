import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRecipeIconInfo, getRecipeEmoji, determineRecipeType } from '../utils/recipeIcons';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columnas con márgenes

const RecipeGrid = ({ recipes, onRecipePress, showExtractButton = true }) => {
  // Forzar actualización de cache - versión con emojis
  const renderRecipeCard = (recipe, index) => {
    // Usar emoji si está disponible, si no, usar sistema de iconos
    const recipeType = recipe.recipeType || determineRecipeType(recipe);
    const emoji = recipe.emoji || getRecipeEmoji(recipeType);
    const iconInfo = getRecipeIconInfo(recipe); // Fallback

    return (
      <TouchableOpacity
        key={recipe.id || index}
        style={styles.recipeCard}
        onPress={() => onRecipePress(recipe)}
        activeOpacity={0.8}
      >
        {/* Emoji representativo del platillo */}
        <View style={styles.emojiContainer}>
          <Text style={styles.recipeEmoji}>
            {emoji}
          </Text>

          {/* Badge de dificultad */}
          {recipe.difficulty && (
            <View style={[styles.difficultyBadge, styles[`difficulty${recipe.difficulty}`]]}>
              <Text style={styles.difficultyText}>
                {recipe.difficulty === 'easy' ? 'Fácil' :
                 recipe.difficulty === 'medium' ? 'Media' : 'Difícil'}
              </Text>
            </View>
          )}
        </View>

        {/* Contenido de la tarjeta */}
        <View style={styles.cardContent}>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {recipe.title}
          </Text>

          {recipe.description && (
            <Text style={styles.recipeDescription} numberOfLines={2}>
              {recipe.description}
            </Text>
          )}

          {/* Información de ingredientes */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <View style={styles.ingredientsInfo}>
              <Ionicons name="list-outline" size={14} color="#666" />
              <Text style={styles.ingredientsText} numberOfLines={1}>
                {recipe.ingredients.length} ingredientes
              </Text>
            </View>
          )}

          {/* Información rápida */}
          <View style={styles.quickInfo}>
            {recipe.servings && (
              <View style={styles.infoItem}>
                <Ionicons name="people-outline" size={14} color="#666" />
                <Text style={styles.infoText}>{recipe.servings}</Text>
              </View>
            )}
            {recipe.cookingTime && (
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.infoText}>{recipe.cookingTime}m</Text>
              </View>
            )}
          </View>

          {/* Botón de acción */}
          {showExtractButton && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: iconInfo.color || '#007AFF' }]}
              onPress={() => onRecipePress(recipe)}
            >
              <Text style={styles.actionButtonText}>
                {recipe.isExtracted ? 'Importar' : 'Extraer'}
              </Text>
              <Ionicons
                name={recipe.isExtracted ? "download-outline" : "arrow-forward"}
                size={16}
                color="white"
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {recipes.map((recipe, index) => renderRecipeCard(recipe, index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  recipeCard: {
    width: cardWidth,
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  emojiContainer: {
    position: 'relative',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
  },
  recipeEmoji: {
    fontSize: 50,
    textAlign: 'center',
  },
  difficultyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyeasy: {
    backgroundColor: '#28a745',
  },
  difficultymedium: {
    backgroundColor: '#ffc107',
  },
  difficultyhard: {
    backgroundColor: '#dc3545',
  },
  difficultyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
    flex: 1,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  recipeDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 16,
  },
  ingredientsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ingredientsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  quickInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RecipeGrid;