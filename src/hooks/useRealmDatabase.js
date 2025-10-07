import { useState, useEffect, useCallback } from 'react';
import realmDatabaseService from '../services/realmDatabase';

export const useRealmDatabase = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inicializar la base de datos
  const initializeDatabase = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const success = await realmDatabaseService.init();
      setIsInitialized(success);

      if (!success) {
        setError('No se pudo inicializar la base de datos');
      }
    } catch (err) {
      setError(err.message);
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Inicializar al montar el componente
  useEffect(() => {
    initializeDatabase();
  }, [initializeDatabase]);

  // ===== OPERACIONES DE RECETAS =====
  
  const createRecipe = useCallback(async (recipeData) => {
    if (!isInitialized) {
      throw new Error('Base de datos no inicializada');
    }
    return await realmDatabaseService.createRecipe(recipeData);
  }, [isInitialized]);

  const getAllRecipes = useCallback(async () => {
    if (!isInitialized) {
      return [];
    }
    return await realmDatabaseService.getAllRecipes();
  }, [isInitialized]);

  const getRecipeById = useCallback(async (id) => {
    if (!isInitialized) {
      return null;
    }
    return await realmDatabaseService.getRecipeById(id);
  }, [isInitialized]);

  const updateRecipe = useCallback(async (id, recipeData) => {
    if (!isInitialized) {
      return false;
    }
    return await realmDatabaseService.updateRecipe(id, recipeData);
  }, [isInitialized]);

  const deleteRecipe = useCallback(async (id) => {
    if (!isInitialized) {
      return false;
    }
    return await realmDatabaseService.deleteRecipe(id);
  }, [isInitialized]);

  // ===== OPERACIONES DE PREFERENCIAS =====
  
  const saveUserPreferences = useCallback(async (userId, preferences) => {
    console.log('🔧 HOOK - saveUserPreferences llamado');
    console.log('📊 isInitialized:', isInitialized);
    console.log('👤 userId:', userId);
    console.log('📋 preferences:', JSON.stringify(preferences, null, 2));

    if (!isInitialized) {
      console.error('❌ HOOK - Base de datos no inicializada');
      return false;
    }

    try {
      const result = await realmDatabaseService.saveUserPreferences(userId, preferences);
      console.log('✅ HOOK - Resultado del servicio:', result);
      return result;
    } catch (error) {
      console.error('❌ HOOK - Error en saveUserPreferences:', error);
      return false;
    }
  }, [isInitialized]);

  const getUserPreferences = useCallback(async (userId) => {
    if (!isInitialized) {
      return null;
    }
    return await realmDatabaseService.getUserPreferences(userId);
  }, [isInitialized]);

  // ===== OPERACIONES DE LISTA DE COMPRAS =====
  
  const createShoppingList = useCallback(async (name) => {
    if (!isInitialized) {
      return false;
    }
    return await realmDatabaseService.createShoppingList(name);
  }, [isInitialized]);

  const getAllShoppingLists = useCallback(async () => {
    if (!isInitialized) {
      return [];
    }
    return await realmDatabaseService.getAllShoppingLists();
  }, [isInitialized]);

  // ===== OPERACIONES DE TEST =====
  
  const testDatabase = useCallback(async () => {
    if (!isInitialized) {
      return {
        success: false,
        message: 'Base de datos no inicializada',
        timestamp: new Date().toISOString()
      };
    }
    return await realmDatabaseService.testDatabase();
  }, [isInitialized]);

  // Cerrar la base de datos
  const closeDatabase = useCallback(() => {
    realmDatabaseService.close();
    setIsInitialized(false);
  }, []);

  return {
    // Estado
    isInitialized,
    isLoading,
    error,
    
    // Inicialización
    initializeDatabase,
    
    // Operaciones de recetas
    createRecipe,
    getAllRecipes,
    getRecipeById,
    updateRecipe,
    deleteRecipe,
    
    // Operaciones de preferencias
    saveUserPreferences,
    getUserPreferences,
    
    // Operaciones de lista de compras
    createShoppingList,
    getAllShoppingLists,
    
    // Test
    testDatabase,
    
    // Utilidades
    closeDatabase
  };
};
