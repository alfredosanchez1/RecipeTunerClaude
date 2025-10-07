import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
// VERSION 2.0 - FILTRADO IMPLEMENTADO
import {
  Searchbar,
  Chip,
  Button,
  Text,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useRecipe } from '../context/RecipeContext';
import { useUser } from '../context/UserContext';
import RecipeCard from '../components/RecipeCard';
import FilterModal from '../components/FilterModal';
import EmptyState from '../components/EmptyState';

const RecipesScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const { recipes, adaptedRecipes, isLoading } = useRecipe();
  const { preferences } = useUser();

  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  // Obtener parámetros de navegación
  const hideAdaptButton = route.params?.hideAdaptButton;
  const filterParam = route.params?.filter;

  console.log('🏗️ RECIPES SCREEN - Initial setup UPDATED');
  console.log('📋 route.params:', route.params);
  console.log('🎯 filterParam:', filterParam);

  // Configurar el filtro inicial directamente basado en los parámetros
  const getInitialViewMode = () => {
    if (filterParam === 'adapted') {
      console.log('✅ Initializing with adapted filter');
      return 'adapted';
    } else if (filterParam === 'original') {
      console.log('✅ Initializing with original filter');
      return 'original';
    } else {
      console.log('⚠️ No filter param, defaulting to original');
      return 'original';
    }
  };

  const [viewMode, setViewMode] = useState(getInitialViewMode());

  // Actualizar viewMode cuando cambien los parámetros de navegación
  useEffect(() => {
    const filter = route.params?.filter;

    console.log('🔍 RECIPES SCREEN - useEffect triggered');
    console.log('📋 route.params:', route.params);
    console.log('🎯 filter param:', filter);

    if (filter === 'adapted') {
      console.log('✅ Setting viewMode to adapted');
      setViewMode('adapted');
    } else if (filter === 'original') {
      console.log('✅ Setting viewMode to original');
      setViewMode('original');
    } else {
      console.log('⚠️ No filter param, defaulting to original');
      setViewMode('original');
    }
  }, [route.params]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simular recarga de datos
    setTimeout(() => setRefreshing(false), 1000);
  };

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleRecipePress = (recipe) => {
    if (recipe.isAdapted) {
      // Es una receta adaptada - usar RecipeDetail con parámetro especial
      navigation.push('RecipeDetail', {
        recipe,
        isAdapted: true,
        returnTo: 'Recipes',
        returnParams: { filter: 'adapted', hideAdaptButton: true }
      });
    } else {
      // Es una receta original
      navigation.push('RecipeDetail', {
        recipe,
        returnTo: 'Recipes',
        returnParams: { filter: 'original', hideAdaptButton: true }
      });
    }
  };

  const handleAdaptRecipe = (recipe) => {
    navigation.push('RecipeDetail', { 
      recipe,
      showAdaptButton: true 
    });
  };

  const getDisplayRecipes = () => {
    let displayRecipes = [];

    console.log('🧮 getDisplayRecipes called');
    console.log('📊 Current viewMode:', viewMode);
    console.log('📝 Total recipes:', recipes.length);
    console.log('🔄 isAdapted values:', recipes.map(r => r.isAdapted));

    // FORZAR EL FILTRADO CORRECTO
    // filterParam ya está declarado en el nivel del componente
    console.log('🎯 FORCE CHECK - filterParam:', filterParam);

    if (filterParam === 'adapted') {
      // Forzar mostrar solo adaptadas
      displayRecipes = recipes.filter(recipe => recipe.isAdapted === true);
      console.log('🔵 FORCED Adapted filter - filtered result:', displayRecipes.length);
    } else if (filterParam === 'original') {
      // Forzar mostrar solo originales
      displayRecipes = recipes.filter(recipe => recipe.isAdapted === false || !recipe.isAdapted);
      console.log('🟢 FORCED Original filter - filtered result:', displayRecipes.length);
    } else {
      // Usar viewMode normal
      switch (viewMode) {
        case 'original':
          displayRecipes = recipes.filter(recipe => !recipe.isAdapted);
          console.log('🟢 Original filter - filtered result:', displayRecipes.length);
          break;
        case 'adapted':
          displayRecipes = recipes.filter(recipe => recipe.isAdapted);
          console.log('🔵 Adapted filter - filtered result:', displayRecipes.length);
          break;
        default:
          displayRecipes = recipes; // Todas las recetas
          console.log('🟡 All filter - showing all:', displayRecipes.length);
          break;
      }
    }

    // Aplicar filtro de búsqueda si existe
    if (searchQuery) {
      displayRecipes = displayRecipes.filter(recipe =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log('🔍 Search applied - final result:', displayRecipes.length);
    }

    console.log('📋 Final recipe titles:', displayRecipes.map(r => r.title));
    return displayRecipes;
  };

  const renderRecipeItem = ({ item }) => (
    <RecipeCard
      recipe={item}
      onPress={() => handleRecipePress(item)}
      onAdapt={undefined}
      showAdaptButton={false}
      isAdapted={item.isAdapted}
      style={styles.recipeCard}
    />
  );

  const renderEmptyState = () => {
    if (isLoading) return null;

    let icon = 'food-off';
    let title = 'No hay recetas';
    let description = 'Aún no tienes recetas guardadas';
    let actionText = 'Volver al Inicio';
    let onAction = () => navigation.navigate('Home');

    if (viewMode === 'adapted') {
      icon = 'robot-off';
      title = 'No hay adaptaciones';
      description = 'Adapta una receta existente con IA para verla aquí';
      actionText = 'Ver Recetas';
      onAction = () => setViewMode('all');
    } else if (searchQuery) {
      icon = 'filter-off';
      title = 'No se encontraron resultados';
      description = 'Intenta ajustar la búsqueda';
      actionText = 'Limpiar Búsqueda';
      onAction = () => setSearchQuery('');
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


  const renderHeader = () => {
    // INDICADOR VISUAL PARA VERIFICAR FILTRADO
    // filterParam ya está declarado en el nivel del componente
    const debugText = filterParam ? `FILTRO: ${filterParam.toUpperCase()}` : 'SIN FILTRO';
    const displayRecipes = getDisplayRecipes();

    return (
    <View style={styles.header}>
      {/* INDICADOR DEBUG TEMPORAL */}
      <View style={{backgroundColor: 'yellow', padding: 10, marginBottom: 10}}>
        <Text style={{color: 'black', fontWeight: 'bold', textAlign: 'center'}}>
          🚨 DEBUG: {debugText} - Mostrando: {displayRecipes.length} de {recipes.length} recetas
        </Text>
      </View>

      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          icon="arrow-left"
          style={styles.backButton}
          compact
        >
          Atrás
        </Button>
      </View>

      {/* Search Bar */}
      <Searchbar
        placeholder="Buscar recetas..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={theme.colors.primary}
      />

      {/* View Mode Tabs - Ocultos para simplificar UX */}
      {/*
      <View style={styles.viewModeContainer}>
        <Button
          mode={viewMode === 'all' ? 'contained' : 'outlined'}
          onPress={() => setViewMode('all')}
          style={styles.viewModeButton}
          compact
        >
          Todas ({recipes.length})
        </Button>
        <Button
          mode={viewMode === 'original' ? 'contained' : 'outlined'}
          onPress={() => setViewMode('original')}
          style={styles.viewModeButton}
          compact
        >
          Originales ({recipes.filter(r => !r.isAdapted).length})
        </Button>
        <Button
          mode={viewMode === 'adapted' ? 'contained' : 'outlined'}
          onPress={() => setViewMode('adapted')}
          style={styles.viewModeButton}
          compact
        >
          Adaptadas ({recipes.filter(r => r.isAdapted).length})
        </Button>
      </View>
      */}

      {/* Active Search */}
      {searchQuery && (
        <View style={styles.activeFilters}>
          <Text style={styles.filtersLabel}>Búsqueda activa:</Text>
          <View style={styles.filterChips}>
            <Chip
              icon="magnify"
              onClose={() => setSearchQuery('')}
              style={styles.filterChip}
            >
              "{searchQuery}"
            </Chip>
          </View>
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
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Cargando recetas...</Text>
      </View>
    );
  }

  const displayRecipes = getDisplayRecipes();

  // INDICADOR VISUAL ADICIONAL
  // filterParam ya está declarado arriba
  const adaptedCount = recipes.filter(r => r.isAdapted).length;
  const originalCount = recipes.filter(r => !r.isAdapted).length;

  // Log final para debugging
  console.log('🎯 FINAL RENDER - viewMode:', viewMode);
  console.log('🎯 FINAL RENDER - Total recipes:', recipes.length);
  console.log('🎯 FINAL RENDER - Displaying:', displayRecipes.length);
  console.log('🎯 FINAL RENDER - Display titles:', displayRecipes.map(r => `${r.title} (isAdapted: ${r.isAdapted})`));

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


      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        onDismiss={() => setShowFilters(false)}
        onApply={() => setShowFilters(false)}
        currentFilters={{}}
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
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 10,
  },
  backButtonContainer: {
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  backButton: {
    borderColor: '#4CAF50',
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
});

export default RecipesScreen;
