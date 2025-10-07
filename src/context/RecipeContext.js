import React, { createContext, useContext, useReducer, useEffect } from 'react';
import realmDatabaseV2 from '../services/realmDatabaseV2';
import aiService from '../services/aiService';
import { useAuth } from './AuthContext';
import { migrateNewItems } from '../services/migration/realmToSupabase';
import { supabase, TABLES } from '../services/supabase/client';

const RecipeContext = createContext();

const initialState = {
  recipes: [],
  isLoading: false,
  error: null,
  searchTerm: '',
  activeFilters: [],
  currentRecipe: null
};

function recipeReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'LOAD_RECIPES':
      return { ...state, recipes: action.payload, isLoading: false, error: null };

    case 'ADD_RECIPE':
      return { ...state, recipes: [...state.recipes, action.payload] };

    case 'UPDATE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.map(recipe =>
          recipe.id === action.payload.id ? action.payload : recipe
        )
      };

    case 'DELETE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.filter(recipe => recipe.id !== action.payload)
      };

    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };

    case 'SET_ACTIVE_FILTERS':
      return { ...state, activeFilters: action.payload };

    case 'SET_CURRENT_RECIPE':
      return { ...state, currentRecipe: action.payload };

    default:
      return state;
  }
}

export function RecipeProvider({ children }) {
  const [state, dispatch] = useReducer(recipeReducer, initialState);
  const { isAuthenticated, user: authUser } = useAuth();

  useEffect(() => {
    // Solo inicializar si el usuario está autenticado
    if (!isAuthenticated || !authUser) {
      console.log('🔒 RECIPE CONTEXT - Usuario no autenticado, esperando...');
      dispatch({ type: 'LOAD_RECIPES', payload: [] }); // Recetas vacías
      return;
    }

    // Inicializar Realm V2 y cargar datos
    const initializeDatabase = async () => {
      console.log('🔄 RECIPE CONTEXT - Usuario autenticado, inicializando Realm V2...');
      console.log('👤 RECIPE CONTEXT - Auth user:', authUser.email);

      const success = await realmDatabaseV2.init();

      if (success) {
        console.log('✅ RECIPE CONTEXT - Realm V2 listo, cargando recetas...');
        setTimeout(() => {
          loadRecipes();
        }, 500);
      } else {
        console.error('❌ RECIPE CONTEXT - Error inicializando Realm V2');
        dispatch({ type: 'SET_ERROR', payload: 'Error inicializando base de datos' });
      }
    };

    initializeDatabase();
  }, [isAuthenticated, authUser]);

  const loadRecipes = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      console.log('🔄 RECIPE CONTEXT - Cargando recetas desde Realm V2...');
      const realmRecipes = await realmDatabaseV2.getAllRecipes();
      console.log(`📊 RECIPE CONTEXT - ${realmRecipes.length} recetas desde Realm`);

      // También cargar desde Supabase para obtener recetas sincronizadas
      let supabaseRecipes = [];
      try {
        console.log('🔄 RECIPE CONTEXT - Cargando recetas desde Supabase...');
        const { data, error } = await supabase
          .from(TABLES.RECIPES)
          .select('*')
          .eq('app_name', 'recipetuner');

        if (error) {
          console.warn('⚠️ RECIPE CONTEXT - Error cargando desde Supabase (continuando offline):', error);
        } else {
          supabaseRecipes = data || [];
          console.log(`📊 RECIPE CONTEXT - ${supabaseRecipes.length} recetas desde Supabase`);
        }
      } catch (error) {
        console.warn('⚠️ RECIPE CONTEXT - Error conectando a Supabase (continuando offline):', error);
      }

      // Combinar recetas evitando duplicados (priorizar Supabase)
      const combinedRecipes = [...supabaseRecipes];
      realmRecipes.forEach(realmRecipe => {
        const existsInSupabase = supabaseRecipes.some(sbRecipe =>
          sbRecipe.title === realmRecipe.title &&
          sbRecipe.created_at && new Date(sbRecipe.created_at).getTime() === new Date(realmRecipe.createdAt).getTime()
        );
        if (!existsInSupabase) {
          combinedRecipes.push(realmRecipe);
        }
      });

      console.log(`📊 RECIPE CONTEXT - ${combinedRecipes.length} recetas combinadas cargadas`);
      dispatch({ type: 'LOAD_RECIPES', payload: combinedRecipes });
    } catch (error) {
      console.error('❌ RECIPE CONTEXT - Error cargando recetas:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const addRecipe = async (recipe) => {
    try {
      console.log('➕ RECIPE CONTEXT - Agregando receta a Realm V2...');

      const newRecipe = await realmDatabaseV2.createRecipe(recipe);

      dispatch({ type: 'ADD_RECIPE', payload: newRecipe });
      console.log('✅ RECIPE CONTEXT - Receta agregada correctamente');

      // Intentar sincronizar con Supabase automáticamente (incluyendo información nutricional)
      try {
        console.log('🔄 RECIPE CONTEXT - Auto-sincronizando receta con Supabase...');
        const migrationResult = await migrateNewItems(new Date(Date.now() - 60000)); // Últimas recetas del minuto pasado
        if (migrationResult.success && migrationResult.migratedCount > 0) {
          console.log(`✅ RECIPE CONTEXT - ${migrationResult.migratedCount} receta(s) auto-sincronizada(s) con Supabase (incluye nutrición)`);
        }
      } catch (error) {
        console.warn('⚠️ RECIPE CONTEXT - Error auto-sincronizando receta (continuando offline):', error.message);
      }

      return newRecipe;
    } catch (error) {
      console.error('❌ RECIPE CONTEXT - Error agregando receta:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const updateRecipe = async (recipeId, updates) => {
    try {
      console.log('✏️ RECIPE CONTEXT - Actualizando receta en Realm V2...');

      const success = await realmDatabaseV2.updateRecipe(recipeId, updates);
      if (!success) throw new Error('No se pudo actualizar la receta');

      const updatedRecipe = await realmDatabaseV2.getRecipeById(recipeId);

      dispatch({ type: 'UPDATE_RECIPE', payload: updatedRecipe });
      console.log('✅ RECIPE CONTEXT - Receta actualizada correctamente');
      return updatedRecipe;
    } catch (error) {
      console.error('❌ RECIPE CONTEXT - Error actualizando receta:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const deleteRecipe = async (recipeId) => {
    try {
      console.log('🗑️ RECIPE CONTEXT - Eliminando receta de Realm V2...');

      const success = await realmDatabaseV2.deleteRecipe(recipeId);

      if (success) {
        dispatch({ type: 'DELETE_RECIPE', payload: recipeId });
        console.log('✅ RECIPE CONTEXT - Receta eliminada correctamente');
      } else {
        throw new Error('No se pudo eliminar la receta');
      }
    } catch (error) {
      console.error('❌ RECIPE CONTEXT - Error eliminando receta:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const saveRecipeWithAdaptation = async (originalRecipeData, adaptedRecipeData) => {
    try {
      console.log('💫 RECIPE CONTEXT - Guardando receta original y adaptada...');

      // 1. Guardar la receta original (si no existe ya)
      let originalRecipe = null;
      if (!originalRecipeData.isAdapted) {
        originalRecipe = await realmDatabaseV2.createRecipe({
          ...originalRecipeData,
          isAdapted: false
        });
        console.log('✅ RECIPE CONTEXT - Receta original guardada:', originalRecipe.id);
      }

      // 2. Guardar la receta adaptada con referencia a la original
      const adaptedRecipe = await realmDatabaseV2.createRecipe({
        ...adaptedRecipeData,
        isAdapted: true,
        originalRecipeId: originalRecipe?.id || originalRecipeData.id,
        adaptedAt: new Date().toISOString()
      });
      console.log('✅ RECIPE CONTEXT - Receta adaptada guardada:', adaptedRecipe.id);

      // 3. Actualizar el estado local
      if (originalRecipe) {
        dispatch({ type: 'ADD_RECIPE', payload: originalRecipe });
      }
      dispatch({ type: 'ADD_RECIPE', payload: adaptedRecipe });

      // 4. Intentar sincronizar con Supabase automáticamente (incluyendo información nutricional)
      try {
        console.log('🔄 RECIPE CONTEXT - Auto-sincronizando recetas adaptadas con Supabase...');
        const migrationResult = await migrateNewItems(new Date(Date.now() - 60000)); // Últimas recetas del minuto pasado
        if (migrationResult.success && migrationResult.migratedCount > 0) {
          console.log(`✅ RECIPE CONTEXT - ${migrationResult.migratedCount} receta(s) adaptada(s) auto-sincronizada(s) con Supabase (incluye nutrición completa)`);
        }
      } catch (error) {
        console.warn('⚠️ RECIPE CONTEXT - Error auto-sincronizando recetas adaptadas (continuando offline):', error.message);
      }

      return {
        original: originalRecipe,
        adapted: adaptedRecipe
      };
    } catch (error) {
      console.error('❌ RECIPE CONTEXT - Error guardando recetas:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const adaptRecipe = async (originalRecipe, adaptationRequest) => {
    try {
      // Simular adaptación de receta
      const adaptedRecipe = {
        ...originalRecipe,
        id: Date.now().toString(),
        name: `${originalRecipe.name} (Adaptada)`,
        adaptationRequest,
        isAdapted: true,
        originalRecipeId: originalRecipe.id,
        createdAt: new Date()
      };
      dispatch({ type: 'ADD_RECIPE', payload: adaptedRecipe });
      return adaptedRecipe;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const setSearchTerm = (term) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: term });
  };

  const setActiveFilters = (filters) => {
    dispatch({ type: 'SET_ACTIVE_FILTERS', payload: filters });
  };

  const setCurrentRecipe = (recipe) => {
    dispatch({ type: 'SET_CURRENT_RECIPE', payload: recipe });
  };

  const adaptRecipeWithAI = async (recipe, userPreferences) => {
    try {
      console.log('🤖 RECIPE CONTEXT - Iniciando adaptación con IA...');
      dispatch({ type: 'SET_LOADING', payload: true });

      // Usar el servicio de IA para adaptar la receta
      const adaptedRecipeData = await aiService.adaptRecipeWithAI(recipe, userPreferences);

      // Crear la receta adaptada con toda la información nutricional
      const adaptedRecipe = {
        ...adaptedRecipeData,
        id: Date.now().toString(),
        isAdapted: true,
        originalRecipeId: recipe.id,
        adaptedAt: new Date().toISOString(),
        createdAt: new Date()
      };

      // Guardar en la base de datos
      const savedRecipe = await realmDatabaseV2.createRecipe(adaptedRecipe);

      // Actualizar el estado local
      dispatch({ type: 'ADD_RECIPE', payload: savedRecipe });
      dispatch({ type: 'SET_LOADING', payload: false });

      console.log('✅ RECIPE CONTEXT - Receta adaptada con IA guardada exitosamente');
      return savedRecipe;
    } catch (error) {
      console.error('❌ RECIPE CONTEXT - Error adaptando receta con IA:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  // Computed properties for easier access
  const adaptedRecipes = state.recipes.filter(recipe => {
    const isAdapted = recipe.isAdapted === true || recipe.adapted === true;
    if (isAdapted) {
      console.log('🔍 RECIPE CONTEXT - Receta adaptada encontrada:', recipe.title, 'isAdapted:', recipe.isAdapted, 'adapted:', recipe.adapted);
    }
    return isAdapted;
  });
  const originalRecipes = state.recipes.filter(recipe => recipe.isAdapted !== true && recipe.adapted !== true);

  console.log('📊 RECIPE CONTEXT - Total recetas:', state.recipes.length, 'Adaptadas:', adaptedRecipes.length, 'Originales:', originalRecipes.length);

  const value = {
    ...state,
    adaptedRecipes, // Computed property for backward compatibility
    originalRecipes, // Computed property for easier access
    loadRecipes,
    addRecipe,
    saveRecipe: addRecipe, // Alias para compatibilidad
    updateRecipe,
    deleteRecipe,
    adaptRecipe,
    adaptRecipeWithAI,
    saveRecipeWithAdaptation,
    setSearchTerm,
    setActiveFilters,
    setCurrentRecipe
  };

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
}

export const useRecipe = () => {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipe debe usarse dentro de RecipeProvider');
  }
  return context;
};

export default RecipeContext;