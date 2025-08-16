import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const RecipeContext = createContext();

const initialState = {
  recipes: [],
  adaptedRecipes: [],
  currentRecipe: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  filters: {
    cuisine: '',
    difficulty: '',
    cookingTime: '',
    dietaryRestrictions: [],
  },
};

const recipeReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_RECIPES':
      return { ...state, recipes: action.payload };
    case 'ADD_RECIPE':
      return { ...state, recipes: [action.payload, ...state.recipes] };
    case 'UPDATE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.map(recipe =>
          recipe.id === action.payload.id ? action.payload : recipe
        ),
      };
    case 'DELETE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.filter(recipe => recipe.id !== action.payload),
      };
    case 'SET_CURRENT_RECIPE':
      return { ...state, currentRecipe: action.payload };
    case 'SET_ADAPTED_RECIPES':
      return { ...state, adaptedRecipes: action.payload };
    case 'ADD_ADAPTED_RECIPE':
      return { ...state, adaptedRecipes: [action.payload, ...state.adaptedRecipes] };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'CLEAR_FILTERS':
      return { ...state, filters: initialState.filters };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
};

export const RecipeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(recipeReducer, initialState);

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const recipesData = await AsyncStorage.getItem('recipes');
      const adaptedRecipesData = await AsyncStorage.getItem('adaptedRecipes');

      if (recipesData) {
        dispatch({ type: 'SET_RECIPES', payload: JSON.parse(recipesData) });
      }
      if (adaptedRecipesData) {
        dispatch({ type: 'SET_ADAPTED_RECIPES', payload: JSON.parse(adaptedRecipesData) });
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error loading recipes' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const saveRecipe = async (recipe) => {
    try {
      const newRecipe = {
        ...recipe,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedRecipes = [newRecipe, ...state.recipes];
      await AsyncStorage.setItem('recipes', JSON.stringify(updatedRecipes));
      dispatch({ type: 'ADD_RECIPE', payload: newRecipe });

      return newRecipe;
    } catch (error) {
      console.error('Error saving recipe:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error saving recipe' });
      throw error;
    }
  };

  const updateRecipe = async (recipeId, updates) => {
    try {
      const updatedRecipe = {
        ...state.recipes.find(recipe => recipe.id === recipeId),
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const updatedRecipes = state.recipes.map(recipe =>
        recipe.id === recipeId ? updatedRecipe : recipe
      );

      await AsyncStorage.setItem('recipes', JSON.stringify(updatedRecipes));
      dispatch({ type: 'UPDATE_RECIPE', payload: updatedRecipe });

      return updatedRecipe;
    } catch (error) {
      console.error('Error updating recipe:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error updating recipe' });
      throw error;
    }
  };

  const deleteRecipe = async (recipeId) => {
    try {
      const updatedRecipes = state.recipes.filter(recipe => recipe.id !== recipeId);
      await AsyncStorage.setItem('recipes', JSON.stringify(updatedRecipes));
      dispatch({ type: 'DELETE_RECIPE', payload: recipeId });
    } catch (error) {
      console.error('Error deleting recipe:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error deleting recipe' });
      throw error;
    }
  };

  const adaptRecipeWithAI = async (recipe, userPreferences) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Simulación de llamada a IA - en producción esto sería una API real
      const adaptedRecipe = await simulateAIAdaptation(recipe, userPreferences);

      const newAdaptedRecipe = {
        ...adaptedRecipe,
        id: Date.now().toString(),
        originalRecipeId: recipe.id,
        createdAt: new Date().toISOString(),
      };

      const updatedAdaptedRecipes = [newAdaptedRecipe, ...state.adaptedRecipes];
      await AsyncStorage.setItem('adaptedRecipes', JSON.stringify(updatedAdaptedRecipes));
      dispatch({ type: 'ADD_ADAPTED_RECIPE', payload: newAdaptedRecipe });

      return newAdaptedRecipe;
    } catch (error) {
      console.error('Error adapting recipe with AI:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Error adapting recipe with AI' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const simulateAIAdaptation = async (recipe, userPreferences) => {
    // Simulación de procesamiento de IA
    await new Promise(resolve => setTimeout(resolve, 2000));

    const adaptedIngredients = recipe.ingredients.map(ingredient => {
      // Simular adaptaciones basadas en preferencias
      if (userPreferences.dietaryRestrictions.includes('vegetarian') && 
          ingredient.name.toLowerCase().includes('meat')) {
        return {
          ...ingredient,
          name: ingredient.name.replace(/meat/i, 'tofu'),
          notes: 'Adaptado para vegetarianos',
        };
      }
      return ingredient;
    });

    const adaptedInstructions = recipe.instructions.map(instruction => {
      // Simular adaptaciones de instrucciones
      if (userPreferences.cookingTime === 'quick') {
        return instruction.replace(/cook for \d+ minutes/i, 'cook for 10 minutes');
      }
      return instruction;
    });

    return {
      ...recipe,
      title: `${recipe.title} (Adaptado)`,
      ingredients: adaptedIngredients,
      instructions: adaptedInstructions,
      adaptations: {
        dietaryRestrictions: userPreferences.dietaryRestrictions,
        allergies: userPreferences.allergies,
        cookingTime: userPreferences.cookingTime,
        spiceLevel: userPreferences.spiceLevel,
      },
    };
  };

  const searchRecipes = (query) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  };

  const setFilters = (filters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const clearFilters = () => {
    dispatch({ type: 'CLEAR_FILTERS' });
  };

  const getFilteredRecipes = () => {
    let filtered = state.recipes;

    if (state.searchQuery) {
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        recipe.ingredients.some(ingredient =>
          ingredient.name.toLowerCase().includes(state.searchQuery.toLowerCase())
        )
      );
    }

    if (state.filters.cuisine) {
      filtered = filtered.filter(recipe => recipe.cuisine === state.filters.cuisine);
    }

    if (state.filters.difficulty) {
      filtered = filtered.filter(recipe => recipe.difficulty === state.filters.difficulty);
    }

    if (state.filters.cookingTime) {
      filtered = filtered.filter(recipe => recipe.cookingTime === state.filters.cookingTime);
    }

    if (state.filters.dietaryRestrictions.length > 0) {
      filtered = filtered.filter(recipe =>
        state.filters.dietaryRestrictions.every(restriction =>
          recipe.dietaryRestrictions.includes(restriction)
        )
      );
    }

    return filtered;
  };

  const value = {
    ...state,
    saveRecipe,
    updateRecipe,
    deleteRecipe,
    adaptRecipeWithAI,
    searchRecipes,
    setFilters,
    clearFilters,
    getFilteredRecipes,
  };

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
};

export const useRecipe = () => {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipe must be used within a RecipeProvider');
  }
  return context;
};
