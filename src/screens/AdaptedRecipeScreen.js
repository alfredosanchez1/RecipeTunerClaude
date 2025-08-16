import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRecipe } from '../context/RecipeContext';
import RecipeCard from '../components/RecipeCard';
import EmptyState from '../components/EmptyState';

const AdaptedRecipeScreen = () => {
  const navigation = useNavigation();
  const { adaptedRecipes, deleteRecipe } = useRecipe();
  const [viewMode, setViewMode] = useState('all'); // 'all', 'recent', 'favorites'

  const getFilteredRecipes = () => {
    switch (viewMode) {
      case 'recent':
        return adaptedRecipes
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10);
      case 'favorites':
        return adaptedRecipes.filter(recipe => recipe.isFavorite);
      default:
        return adaptedRecipes;
    }
  };

  const handleRecipePress = (recipe) => {
    navigation.navigate('RecipeDetail', { recipeId: recipe.id });
  };

  const handleAdaptWithAI = (recipe) => {
    navigation.navigate('AddRecipe', { 
      originalRecipe: recipe,
      isAdaptation: true 
    });
  };

  const handleDeleteRecipe = (recipeId) => {
    Alert.alert(
      'Eliminar Receta Adaptada',
      '¿Estás seguro de que quieres eliminar esta receta adaptada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteRecipe(recipeId),
        },
      ]
    );
  };

  const renderRecipeItem = ({ item }) => (
    <RecipeCard
      recipe={item}
      onPress={() => handleRecipePress(item)}
      onAdaptWithAI={() => handleAdaptWithAI(item)}
      onDelete={() => handleDeleteRecipe(item.id)}
      showAdaptButton={false}
      showDeleteButton={true}
    />
  );

  const renderEmptyState = () => {
    if (adaptedRecipes.length === 0) {
      return (
        <EmptyState
          icon="🍳"
          title="No hay recetas adaptadas"
          description="Las recetas que adaptes con IA aparecerán aquí. ¡Comienza creando tu primera receta!"
          actionText="Crear Receta"
          onAction={() => navigation.navigate('AddRecipe')}
        />
      );
    }

    if (getFilteredRecipes().length === 0) {
      return (
        <EmptyState
          icon="🔍"
          title="No se encontraron resultados"
          description="Intenta cambiar los filtros o crear una nueva receta adaptada."
          actionText="Crear Receta"
          onAction={() => navigation.navigate('AddRecipe')}
        />
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recetas Adaptadas con IA</Text>
        <Text style={styles.subtitle}>
          {adaptedRecipes.length} receta{adaptedRecipes.length !== 1 ? 's' : ''} adaptada{adaptedRecipes.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'all' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('all')}
        >
          <Text style={[styles.viewModeText, viewMode === 'all' && styles.viewModeTextActive]}>
            Todas ({adaptedRecipes.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'recent' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('recent')}
        >
          <Text style={[styles.viewModeText, viewMode === 'recent' && styles.viewModeTextActive]}>
            Recientes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'favorites' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('favorites')}
        >
          <Text style={[styles.viewModeText, viewMode === 'favorites' && styles.viewModeTextActive]}>
            Favoritas
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={getFilteredRecipes()}
        renderItem={renderRecipeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddRecipe')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: '#007AFF',
  },
  viewModeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  viewModeTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 100,
  },
  separator: {
    height: 15,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AdaptedRecipeScreen;
