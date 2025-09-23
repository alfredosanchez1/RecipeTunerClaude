import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.999; // MÁXIMO ANCHO POSIBLE
const CARD_SPACING = 0; // SIN ESPACIADO

const RecipeSlider = ({ recipes, onRecipePress, title = 'Recetas Encontradas' }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef(null);

  const scrollToIndex = (index) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * (CARD_WIDTH + CARD_SPACING),
        animated: true,
      });
    }
    setActiveIndex(index);
  };

  const nextRecipe = () => {
    if (activeIndex < recipes.length - 1) {
      scrollToIndex(activeIndex + 1);
    }
  };

  const prevRecipe = () => {
    if (activeIndex > 0) {
      scrollToIndex(activeIndex - 1);
    }
  };

  if (!recipes || recipes.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {recipes.length} receta{recipes.length !== 1 ? 's' : ''} encontrada{recipes.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.sliderContainer}>
        {/* Botón Anterior - Compacto */}
        {activeIndex > 0 && (
          <TouchableOpacity style={styles.navButton} onPress={prevRecipe}>
            <Ionicons name="chevron-back" size={18} color="#007AFF" />
          </TouchableOpacity>
        )}

        {/* Carrusel de Recetas - LAYOUT SÚPER COMPACTO */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          decelerationRate="fast"
          contentContainerStyle={styles.scrollContent}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_SPACING)
            );
            setActiveIndex(index);
          }}
        >
          {recipes.map((recipe, index) => (
            <TouchableOpacity
              key={recipe.id || index}
              style={styles.recipeCard}
              onPress={() => onRecipePress(recipe)}
              activeOpacity={0.8}
            >
              {/* Imagen de la Receta - ALTURA AL 70% */}
              <View style={styles.imageContainer}>
                {recipe.imageUrl ? (
                  <Image source={{ uri: recipe.imageUrl }} style={styles.recipeImage} />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons name="restaurant-outline" size={20} color="#ccc" />
                  </View>
                )}
              </View>

              {/* SOLO LO ESENCIAL: Título, Porciones y Tiempo */}
              <View style={styles.recipeInfo}>
                {/* Título de la Receta */}
                <Text style={styles.recipeTitle} numberOfLines={2}>
                  {recipe.title}
                </Text>
                
                {/* Solo Metadatos Esenciales */}
                <View style={styles.metadata}>
                  <View style={styles.metaItem}>
                    <Ionicons name="people-outline" size={10} color="#666" />
                    <Text style={styles.metaText}>{recipe.servings || 4} porc.</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={10} color="#666" />
                    <Text style={styles.metaText}>{recipe.cookingTime || 30} min</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="trending-up-outline" size={10} color="#666" />
                    <Text style={styles.metaText}>{recipe.difficulty || 'medium'}</Text>
                  </View>
                </View>

                {/* Botón de Acción */}
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => onRecipePress(recipe)}
                >
                  <Text style={styles.actionButtonText}>
                    {recipe.isExtracted ? 'Ver Detalles' : 'Extraer Receta'}
                  </Text>
                  <Ionicons 
                    name={recipe.isExtracted ? "eye-outline" : "download-outline"} 
                    size={10} 
                    color="white" 
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Botón Siguiente - Compacto */}
        {activeIndex < recipes.length - 1 && (
          <TouchableOpacity style={styles.navButton} onPress={nextRecipe}>
            <Ionicons name="chevron-forward" size={18} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Indicadores de Página */}
      {recipes.length > 1 && (
        <View style={styles.pagination}>
          {recipes.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.paginationDot,
                index === activeIndex && styles.paginationDotActive
              ]}
              onPress={() => scrollToIndex(index)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10, // Mínimo
  },
  header: {
    paddingHorizontal: 14, // Mínimo
    marginBottom: 10, // Mínimo
  },
  title: {
    fontSize: 18, // Reducido
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 2, // Mínimo
  },
  subtitle: {
    fontSize: 13, // Reducido
    color: '#6c757d',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    width: 32, // Más pequeño
    height: 32, // Más pequeño
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0, // SIN PADDING
  },
  recipeCard: {
    width: CARD_WIDTH,
    backgroundColor: 'white',
    borderRadius: 10, // Reducido
    marginRight: CARD_SPACING,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 98, // 140 * 0.7 = 98px (70% de la altura original)
    backgroundColor: '#f8f9fa',
    justifyContent: 'center', // Centrar verticalmente
    alignItems: 'center', // Centrar horizontalmente
    overflow: 'hidden', // Ocultar partes que se salgan del contenedor
  },
  recipeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover', // Cambiado a 'cover' para llenar todo el contenedor sin márgenes
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  recipeInfo: {
    padding: 6, // PADDING MÍNIMO para máximo espacio
  },
  recipeTitle: {
    fontSize: 13, // LETRAS PEQUEÑAS
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4, // MÍNIMO
    lineHeight: 16,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6, // MÍNIMO
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 9, // LETRAS MUY PEQUEÑAS
    color: '#666',
    marginLeft: 2, // MÍNIMO
  },
  actionButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6, // MÍNIMO
    borderRadius: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 10, // LETRAS PEQUEÑAS
    fontWeight: '600',
    marginRight: 2, // MÍNIMO
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10, // Mínimo
  },
  paginationDot: {
    width: 5, // Más pequeño
    height: 5, // Más pequeño
    borderRadius: 2.5,
    backgroundColor: '#dee2e6',
    marginHorizontal: 2, // Mínimo
  },
  paginationDotActive: {
    backgroundColor: '#007AFF',
    width: 8, // Más pequeño
    height: 8, // Más pequeño
    borderRadius: 4,
  },
});

export default RecipeSlider;
