import * as SecureStore from 'expo-secure-store';

console.log('🔄 SECURE STORE SERVICE - Archivo cargado');

class SecureStoreService {
  constructor() {
    this.isInitialized = false;
    this.storagePrefix = 'RecipeTuner_';
  }

  // Inicializar SecureStore
  async init() {
    try {
      console.log('🔄 SECURE STORE SERVICE - Inicializando...');
      
      // SecureStore no necesita inicialización especial, pero vamos a hacer un test
      await this.testConnection();
      
      this.isInitialized = true;
      console.log('✅ SECURE STORE SERVICE - SecureStore inicializado correctamente');
      return true;
    } catch (error) {
      console.error('❌ SECURE STORE SERVICE - Error inicializando:', error);
      this.isInitialized = false;
      return false;
    }
  }

  // Test de conectividad
  async testConnection() {
    const testKey = `${this.storagePrefix}test`;
    const testValue = JSON.stringify({ test: true, timestamp: Date.now() });
    
    await SecureStore.setItemAsync(testKey, testValue);
    const retrieved = await SecureStore.getItemAsync(testKey);
    await SecureStore.deleteItemAsync(testKey);
    
    if (!retrieved) {
      throw new Error('SecureStore test failed');
    }
  }

  // Generar clave con prefijo
  getKey(key) {
    return `${this.storagePrefix}${key}`;
  }

  // Guardar preferencias del usuario
  async saveUserPreferences(userId, preferences) {
    try {
      console.log('🔧 SECURE STORE SERVICE - saveUserPreferences iniciado');
      console.log('👤 userId:', userId);
      console.log('📋 preferences recibidas:', JSON.stringify(preferences, null, 2));
      
      if (!this.isInitialized) {
        throw new Error('SecureStore no está inicializado');
      }

      const key = this.getKey(`user_preferences_${userId}`);
      const dataToSave = {
        ...preferences,
        updatedAt: new Date().toISOString(),
        version: '1.0'
      };

      // SecureStore requiere string
      await SecureStore.setItemAsync(key, JSON.stringify(dataToSave));
      
      console.log('✅ SECURE STORE SERVICE - Preferencias guardadas correctamente');
      console.log('🔑 Clave utilizada:', key);
      return true;
    } catch (error) {
      console.error('❌ SECURE STORE SERVICE - Error guardando preferencias:', error);
      return false;
    }
  }

  // Obtener preferencias del usuario
  async getUserPreferences(userId) {
    try {
      console.log('🔧 SECURE STORE SERVICE - getUserPreferences iniciado');
      console.log('👤 userId:', userId);
      
      if (!this.isInitialized) {
        console.error('❌ SECURE STORE SERVICE - Servicio no inicializado');
        return null;
      }

      const key = this.getKey(`user_preferences_${userId}`);
      console.log('🔑 Buscando con clave:', key);
      
      const data = await SecureStore.getItemAsync(key);

      if (data) {
        const preferences = JSON.parse(data);
        console.log('✅ SECURE STORE SERVICE - Preferencias recuperadas:', JSON.stringify(preferences, null, 2));
        return preferences;
      } else {
        console.log('📭 SECURE STORE SERVICE - No se encontraron preferencias guardadas');
        return null;
      }
    } catch (error) {
      console.error('❌ SECURE STORE SERVICE - Error obteniendo preferencias:', error);
      return null;
    }
  }

  // Guardar receta
  async saveRecipe(recipe) {
    try {
      console.log('🔧 SECURE STORE SERVICE - saveRecipe iniciado');
      
      if (!this.isInitialized) {
        return false;
      }

      const key = this.getKey(`recipe_${recipe.id}`);
      const recipeData = {
        ...recipe,
        updatedAt: new Date().toISOString(),
        version: '1.0'
      };

      await SecureStore.setItemAsync(key, JSON.stringify(recipeData));
      
      // También mantener una lista de IDs de recetas
      await this.addToRecipeList(recipe.id);

      console.log('✅ SECURE STORE SERVICE - Receta guardada:', recipe.title);
      return true;
    } catch (error) {
      console.error('❌ SECURE STORE SERVICE - Error guardando receta:', error);
      return false;
    }
  }

  // Añadir ID a la lista de recetas
  async addToRecipeList(recipeId) {
    try {
      const key = this.getKey('recipe_ids');
      const existingIds = await this.getAllRecipeIds();
      
      if (!existingIds.includes(recipeId)) {
        existingIds.push(recipeId);
        await SecureStore.setItemAsync(key, JSON.stringify(existingIds));
      }
    } catch (error) {
      console.error('❌ SECURE STORE SERVICE - Error añadiendo a lista de recetas:', error);
    }
  }

  // Obtener todas las recetas
  async getAllRecipes() {
    try {
      console.log('🔧 SECURE STORE SERVICE - getAllRecipes iniciado');
      
      if (!this.isInitialized) {
        return [];
      }

      const recipeIds = await this.getAllRecipeIds();
      const recipes = [];

      for (const id of recipeIds) {
        const key = this.getKey(`recipe_${id}`);
        const recipeData = await SecureStore.getItemAsync(key);
        if (recipeData) {
          recipes.push(JSON.parse(recipeData));
        }
      }

      console.log(`📚 SECURE STORE SERVICE - Recuperadas ${recipes.length} recetas`);
      return recipes;
    } catch (error) {
      console.error('❌ SECURE STORE SERVICE - Error obteniendo recetas:', error);
      return [];
    }
  }

  // Obtener IDs de todas las recetas
  async getAllRecipeIds() {
    try {
      const key = this.getKey('recipe_ids');
      const idsData = await SecureStore.getItemAsync(key);
      return idsData ? JSON.parse(idsData) : [];
    } catch (error) {
      console.error('❌ SECURE STORE SERVICE - Error obteniendo IDs de recetas:', error);
      return [];
    }
  }

  // Obtener receta por ID
  async getRecipeById(id) {
    try {
      if (!this.isInitialized) {
        return null;
      }

      const key = this.getKey(`recipe_${id}`);
      const recipeData = await SecureStore.getItemAsync(key);
      return recipeData ? JSON.parse(recipeData) : null;
    } catch (error) {
      console.error('❌ SECURE STORE SERVICE - Error obteniendo receta:', error);
      return null;
    }
  }

  // Eliminar receta
  async deleteRecipe(id) {
    try {
      if (!this.isInitialized) {
        return false;
      }

      // Eliminar la receta
      const recipeKey = this.getKey(`recipe_${id}`);
      await SecureStore.deleteItemAsync(recipeKey);
      
      // Actualizar la lista de IDs
      const recipeIds = await this.getAllRecipeIds();
      const updatedIds = recipeIds.filter(recipeId => recipeId !== id);
      
      const listKey = this.getKey('recipe_ids');
      await SecureStore.setItemAsync(listKey, JSON.stringify(updatedIds));

      console.log('🗑️ SECURE STORE SERVICE - Receta eliminada:', id);
      return true;
    } catch (error) {
      console.error('❌ SECURE STORE SERVICE - Error eliminando receta:', error);
      return false;
    }
  }

  // Test de funcionalidad completo
  async testDatabase() {
    try {
      console.log('🧪 SECURE STORE SERVICE - Probando funcionalidad...');
      
      if (!this.isInitialized) {
        return {
          success: false,
          message: 'Servicio no inicializado'
        };
      }

      const testData = {
        dietaryRestrictions: ['Test1', 'Test2'],
        allergies: ['TestAllergy'],
        intolerances: ['TestIntolerance'],
        cuisinePreferences: ['TestCuisine'],
        cookingTimePreference: 'Rápido',
        notificationsEnabled: true,
        onboardingComplete: true
      };
      
      // Test de guardado
      const saveResult = await this.saveUserPreferences('test-user', testData);
      if (!saveResult) {
        throw new Error('Error en guardado de prueba');
      }
      
      // Test de recuperación
      const retrievedData = await this.getUserPreferences('test-user');
      if (!retrievedData) {
        throw new Error('Error en recuperación de prueba');
      }
      
      // Test de coincidencia de datos
      const dataMatches = (
        JSON.stringify(testData.dietaryRestrictions) === 
        JSON.stringify(retrievedData.dietaryRestrictions)
      ) && (
        testData.onboardingComplete === retrievedData.onboardingComplete
      );
      
      if (!dataMatches) {
        throw new Error('Los datos no coinciden después de guardar/recuperar');
      }
      
      // Limpiar test data
      const testKey = this.getKey('user_preferences_test-user');
      await SecureStore.deleteItemAsync(testKey);
      
      console.log('✅ SECURE STORE SERVICE - Todos los tests pasaron correctamente');
      return {
        success: true,
        message: 'SecureStore funciona perfectamente',
        tests: ['Inicializar', 'Guardar', 'Recuperar', 'Verificar coincidencia', 'Limpiar'],
        storage: 'Expo SecureStore (Keychain/Keystore nativo)',
        security: 'Cifrado nativo del sistema operativo',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ SECURE STORE SERVICE - Error en test:', error);
      return {
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Limpiar todos los datos (desarrollo)
  async clearAllData() {
    try {
      console.log('🧹 SECURE STORE SERVICE - Limpiando todos los datos...');
      
      // Obtener todas las recetas y eliminarlas
      const recipeIds = await this.getAllRecipeIds();
      for (const id of recipeIds) {
        await this.deleteRecipe(id);
      }
      
      // Eliminar lista de recetas
      const listKey = this.getKey('recipe_ids');
      await SecureStore.deleteItemAsync(listKey);
      
      console.log('✅ SECURE STORE SERVICE - Todos los datos limpiados');
      return true;
    } catch (error) {
      console.error('❌ SECURE STORE SERVICE - Error limpiando datos:', error);
      return false;
    }
  }

  // Métodos dummy para compatibilidad
  async createRecipe(recipeData) { 
    return await this.saveRecipe(recipeData);
  }
  
  async updateRecipe(id, recipeData) { 
    const updatedRecipe = { ...recipeData, id };
    return await this.saveRecipe(updatedRecipe);
  }
  
  async createShoppingList() { 
    return false; // TODO: Implementar listas de compras
  }
  
  async getAllShoppingLists() { 
    return []; // TODO: Implementar listas de compras
  }
  
  // Cerrar servicio
  close() {
    console.log('🔒 SECURE STORE SERVICE - Servicio cerrado');
    this.isInitialized = false;
    // SecureStore no necesita cierre explícito
  }
}

// Instancia singleton
const secureStoreService = new SecureStoreService();

export default secureStoreService;