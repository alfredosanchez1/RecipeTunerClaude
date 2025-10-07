import React, { createContext, useContext, useReducer } from 'react';

const RecipeContext = createContext();

const initialState = {
  recipes: [],
  adaptedRecipes: [],
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

    case 'ADD_ADAPTED_RECIPE':
      return { ...state, adaptedRecipes: [...state.adaptedRecipes, action.payload] };

    default:
      return state;
  }
}

export function RecipeProvider({ children }) {
  const [state, dispatch] = useReducer(recipeReducer, initialState);

  // Mock functions - sin Realm por ahora
  const loadRecipes = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Simular recetas de ejemplo
      const mockRecipes = [
        {
          id: '1',
          name: 'Pasta Bolognesa',
          description: 'Deliciosa pasta con salsa bolognesa casera',
          ingredients: ['Pasta', 'Carne molida', 'Tomate', 'Cebolla'],
          instructions: 'Cocinar la pasta y preparar la salsa...',
          cookingTime: 30,
          servings: 4,
          difficulty: 'Medio',
          imageUrl: null,
          createdAt: new Date()
        }
      ];
      dispatch({ type: 'LOAD_RECIPES', payload: mockRecipes });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const addRecipe = async (recipe) => {
    try {
      const newRecipe = {
        ...recipe,
        id: Date.now().toString(),
        createdAt: new Date()
      };
      dispatch({ type: 'ADD_RECIPE', payload: newRecipe });
      return newRecipe;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const updateRecipe = async (recipeId, updates) => {
    try {
      const updatedRecipe = { ...updates, id: recipeId };
      dispatch({ type: 'UPDATE_RECIPE', payload: updatedRecipe });
      return updatedRecipe;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const deleteRecipe = async (recipeId) => {
    try {
      dispatch({ type: 'DELETE_RECIPE', payload: recipeId });
    } catch (error) {
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
      dispatch({ type: 'ADD_ADAPTED_RECIPE', payload: adaptedRecipe });
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

  const value = {
    ...state,
    loadRecipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    adaptRecipe,
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