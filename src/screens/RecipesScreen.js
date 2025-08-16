import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  Searchbar,
  Chip,
  Button,
  Text,
  useTheme,
  ActivityIndicator,
  FAB,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useRecipe } from '../context/RecipeContext';
import { useUser } from '../context/UserContext';
import RecipeCard from '../components/RecipeCard';
import FilterModal from '../components/FilterModal';
import EmptyState from '../components/EmptyState';

const RecipesScreen = ({ navigation }) => {
  const theme = useTheme();
  const { recipes, adaptedRecipes, isLoading, searchQuery, filters, searchRecipes, setFilters, clearFilters, getFilteredRecipes } = useRecipe();
  const { preferences } = useUser();
  
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'original', 'adapted'

  const onRefresh = async () => {
    setRefreshing(true);
    // Simular recarga de datos
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleSearch = (query) => {
    searchRecipes(query);
  };

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    clearFilters();
  };

  const handleRecipePress = (recipe) => {
    if (recipe.originalRecipeId) {
      // Es una receta adaptada
      navigation.navigate('AdaptedRecipe', { recipe });
    } else {
      // Es una receta original
      navigation.navigate('RecipeDetail', { recipe });
    }
  };

  const handleAdaptRecipe = (recipe) => {
    navigation.navigate('RecipeDetail', { 
      recipe,
      showAdaptButton: true 
    });
  };

  const getDisplayRecipes = () => {
    let displayRecipes = [];
    
    switch (viewMode) {
      case 'original':
        displayRecipes = recipes;
        break;
      case 'adapted':
        displayRecipes = adaptedRecipes;
        break;
      default:
        displayRecipes = [...recipes, ...adaptedRecipes];
        break;
    }

    return getFilteredRecipes().filter(recipe => {
      if (viewMode === 'original') return !recipe.originalRecipeId;
      if (viewMode === 'adapted') return recipe.originalRecipeId;
      return true;
    });
  };

  const renderRecipeItem = ({ item }) => (
    <RecipeCard
      recipe={item}
      onPress={() => handleRecipePress(item)}
      onAdapt={item.originalRecipeId ? undefined : () => handleAdaptRecipe(item)}
      showAdaptButton={!item.originalRecipeId}
      style={styles.recipeCard}
    />
  );

  const renderEmptyState = () => {
    if (isLoading) return null;
    
    let icon = 'food-off';
    let title = 'No hay recetas';
    let description = 'Comienza agregando tu primera receta';
    let actionText = 'Agregar Receta';
    let onAction = () => navigation.navigate('AddRecipe');

    if (viewMode === 'adapted') {
      icon = 'robot-off';
      title = 'No hay adaptaciones';
      description = 'Adapta una receta existente con IA para verla aquí';
      actionText = 'Ver Recetas';
      onAction = () => setViewMode('all');
    } else if (searchQuery || Object.values(filters).some(f => f && f.length > 0)) {
      icon = 'filter-off';
      title = 'No se encontraron resultados';
      description = 'Intenta ajustar los filtros o la búsqueda';
      actionText = 'Limpiar Filtros';
      onAction = handleClearFilters;
    }

    return (
      <EmptyState
        icon={icon}
        title={title}
        description={description}
        actionText={actionText}
        onAction={onAction}
      />
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Buscar recetas..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={theme.colors.primary}
      />

      {/* View Mode Tabs */}
      <View style={styles.viewModeContainer}>
        <Button
          mode={viewMode === 'all' ? 'contained' : 'outlined'}
          onPress={() => setViewMode('all')}
          style={styles.viewModeButton}
          compact
        >
          Todas ({recipes.length + adaptedRecipes.length})
        </Button>
        <Button
          mode={viewMode === 'original' ? 'contained' : 'outlined'}
          onPress={() => setViewMode('original')}
          style={styles.viewModeButton}
          compact
        >
          Originales ({recipes.length})
        </Button>
        <Button
          mode={viewMode === 'adapted' ? 'contained' : 'outlined'}
          onPress={() => setViewMode('adapted')}
          style={styles.viewModeButton}
          compact
        >
          Adaptadas ({adaptedRecipes.length})
        </Button>
      </View>

      {/* Active Filters */}
      {(Object.values(filters).some(f => f && f.length > 0) || searchQuery) && (
        <View style={styles.activeFilters}>
          <Text style={styles.filtersLabel}>Filtros activos:</Text>
          <View style={styles.filterChips}>
            {searchQuery && (
              <Chip
                icon="magnify"
                onClose={() => searchRecipes('')}
                style={styles.filterChip}
              >
                "{searchQuery}"
              </Chip>
            )}
            {filters.cuisine && (
              <Chip
                icon="flag"
                onClose={() => setFilters({ cuisine: '' })}
                style={styles.filterChip}
              >
                {filters.cuisine}
              </Chip>
            )}
            {filters.difficulty && (
              <Chip
                icon="star"
                onClose={() => setFilters({ difficulty: '' })}
                style={styles.filterChip}
              >
                {filters.difficulty}
              </Chip>
            )}
            {filters.cookingTime && (
              <Chip
                icon="clock"
                onClose={() => setFilters({ cookingTime: '' })}
                style={styles.filterChip}
              >
                {filters.cookingTime}
              </Chip>
            )}
            {filters.dietaryRestrictions.map((restriction, index) => (
              <Chip
                key={index}
                icon="food-apple"
                onClose={() => {
                  const newRestrictions = filters.dietaryRestrictions.filter(r => r !== restriction);
                  setFilters({ dietaryRestrictions: newRestrictions });
                }}
                style={styles.filterChip}
              >
                {restriction}
              </Chip>
            ))}
          </View>
          <Button
            mode="text"
            onPress={handleClearFilters}
            textColor={theme.colors.error}
            compact
          >
            Limpiar todos
          </Button>
        </View>
      )}

      {/* Filter Button */}
      <View style={styles.filterButtonContainer}>
        <Button
          mode="outlined"
          onPress={() => setShowFilters(true)}
          icon="filter-variant"
          style={styles.filterButton}
        >
          Filtros
        </Button>
      </View>
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Cargando recetas...</Text>
      </View>
    );
  }

  const displayRecipes = getDisplayRecipes();

  return (
    <View style={styles.container}>
      <FlatList
        data={displayRecipes}
        renderItem={renderRecipeItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB for adding new recipe */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddRecipe')}
        label="Nueva Receta"
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        onDismiss={() => setShowFilters(false)}
        onApply={handleFilter}
        currentFilters={filters}
        userPreferences={preferences}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 100, // Space for FAB
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 10,
  },
  searchBar: {
    marginBottom: 15,
    elevation: 2,
  },
  viewModeContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  viewModeButton: {
    flex: 1,
  },
  activeFilters: {
    marginBottom: 15,
  },
  filtersLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#666',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    marginBottom: 5,
  },
  filterButtonContainer: {
    alignItems: 'center',
  },
  filterButton: {
    borderColor: '#4CAF50',
  },
  recipeCard: {
    marginHorizontal: 20,
    marginBottom: 15,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
  },
});

export default RecipesScreen;
