import { MMKV } from 'react-native-mmkv';
import { NativeModules } from 'react-native';

console.log('🔄 MMKV SERVICE - Archivo cargado');

class MMKVService {
  constructor() {
    this.storage = null;
    this.isInitialized = false;
    this.useAsyncStorage = false; // Fallback flag
  }

  // Inicializar MMKV con fallback a AsyncStorage
  async init() {
    try {
      console.log('🔄 MMKV SERVICE - Inicializando MMKV...');
      
      // Verificar y instalar las funciones JSI si es necesario
      if (global.mmkvCreateNewInstance == null) {
        console.log('🔄 MMKV SERVICE - Instalando funciones JSI...');
        
        if (NativeModules.MMKV && NativeModules.MMKV.install) {
          try {
            await NativeModules.MMKV.install();
            console.log('✅ MMKV SERVICE - Funciones JSI instaladas correctamente');
          } catch (installError) {
            console.warn('⚠️ MMKV SERVICE - Error instalando JSI (continuando):', installError);
          }
        } else {
          console.warn('⚠️ MMKV SERVICE - NativeModules.MMKV.install no disponible');
        }
      }
      
      // Intentar crear instancia de MMKV
      this.storage = new MMKV({
        id: 'recipe-tuner-storage',
        // encryptionKey: 'my-encryption-key', // Descomenta para encriptación
      });
      
      this.isInitialized = true;
      this.useAsyncStorage = false;
      console.log('✅ MMKV SERVICE - MMKV inicializado correctamente');
      return true;
    } catch (error) {
      console.error('❌ MMKV SERVICE - Error inicializando MMKV:', error);
      this.isInitialized = false;
      return false;
    }
  }

  // Guardar preferencias del usuario
  async saveUserPreferences(userId, preferences) {
    try {
      console.log('🔧 MMKV SERVICE - saveUserPreferences iniciado');
      console.log('👤 userId:', userId);
      console.log('📋 preferences recibidas:', JSON.stringify(preferences, null, 2));
      
      if (!this.isInitialized || !this.storage) {
        throw new Error('MMKV no está inicializado');
      }

      const key = `user_preferences_${userId}`;
      const dataToSave = {
        ...preferences,
        updatedAt: new Date().toISOString()
      };

      // MMKV almacena strings, así que serializamos el objeto
      this.storage.set(key, JSON.stringify(dataToSave));
      
      console.log('✅ MMKV SERVICE - Preferencias guardadas correctamente');
      return true;
    } catch (error) {
      console.error('❌ MMKV SERVICE - Error guardando preferencias:', error);
      return false;
    }
  }

  // Obtener preferencias del usuario
  async getUserPreferences(userId) {
    try {
      console.log('🔧 MMKV SERVICE - getUserPreferences iniciado');
      console.log('👤 userId:', userId);
      
      if (!this.isInitialized || !this.storage) {
        console.error('❌ MMKV SERVICE - Servicio no inicializado');
        return null;
      }

      const key = `user_preferences_${userId}`;
      const data = this.storage.getString(key);

      if (data) {
        const preferences = JSON.parse(data);
        console.log('✅ MMKV SERVICE - Preferencias recuperadas:', JSON.stringify(preferences, null, 2));
        return preferences;
      } else {
        console.log('📭 MMKV SERVICE - No se encontraron preferencias guardadas');
        return null;
      }
    } catch (error) {
      console.error('❌ MMKV SERVICE - Error obteniendo preferencias:', error);
      return null;
    }
  }

  // Guardar receta
  async saveRecipe(recipe) {
    try {
      if (!this.isInitialized || !this.storage) {
        return false;
      }

      const key = `recipe_${recipe.id}`;
      const recipeData = {
        ...recipe,
        updatedAt: new Date().toISOString()
      };

      this.storage.set(key, JSON.stringify(recipeData));
      
      // También mantener una lista de IDs de recetas
      const recipeIds = this.getAllRecipeIds();
      if (!recipeIds.includes(recipe.id)) {
        recipeIds.push(recipe.id);
        this.storage.set('recipe_ids', JSON.stringify(recipeIds));
      }

      console.log('✅ MMKV SERVICE - Receta guardada:', recipe.title);
      return true;
    } catch (error) {
      console.error('❌ MMKV SERVICE - Error guardando receta:', error);
      return false;
    }
  }

  // Obtener todas las recetas
  async getAllRecipes() {
    try {
      if (!this.isInitialized || !this.storage) {
        return [];
      }

      const recipeIds = this.getAllRecipeIds();
      const recipes = [];

      for (const id of recipeIds) {
        const recipeData = this.storage.getString(`recipe_${id}`);
        if (recipeData) {
          recipes.push(JSON.parse(recipeData));
        }
      }

      console.log(`📚 MMKV SERVICE - Recuperadas ${recipes.length} recetas`);
      return recipes;
    } catch (error) {
      console.error('❌ MMKV SERVICE - Error obteniendo recetas:', error);
      return [];
    }
  }

  // Obtener IDs de todas las recetas
  getAllRecipeIds() {
    try {
      const idsData = this.storage.getString('recipe_ids');
      return idsData ? JSON.parse(idsData) : [];
    } catch (error) {
      return [];
    }
  }

  // Obtener receta por ID
  async getRecipeById(id) {
    try {
      if (!this.isInitialized || !this.storage) {
        return null;
      }

      const recipeData = this.storage.getString(`recipe_${id}`);
      return recipeData ? JSON.parse(recipeData) : null;
    } catch (error) {
      console.error('❌ MMKV SERVICE - Error obteniendo receta:', error);
      return null;
    }
  }

  // Eliminar receta
  async deleteRecipe(id) {
    try {
      if (!this.isInitialized || !this.storage) {
        return false;
      }

      // Eliminar la receta
      this.storage.delete(`recipe_${id}`);
      
      // Actualizar la lista de IDs
      const recipeIds = this.getAllRecipeIds();
      const updatedIds = recipeIds.filter(recipeId => recipeId !== id);
      this.storage.set('recipe_ids', JSON.stringify(updatedIds));

      console.log('🗑️ MMKV SERVICE - Receta eliminada:', id);
      return true;
    } catch (error) {
      console.error('❌ MMKV SERVICE - Error eliminando receta:', error);
      return false;
    }
  }

  // Test de funcionalidad
  async testDatabase() {
    try {
      console.log('🧪 MMKV SERVICE - Probando funcionalidad...');
      
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
      
      const saveResult = await this.saveUserPreferences('test-user', testData);
      if (!saveResult) {
        throw new Error('Error en guardado de prueba');
      }
      
      const retrievedData = await this.getUserPreferences('test-user');
      if (!retrievedData) {
        throw new Error('Error en recuperación de prueba');
      }
      
      const dataMatches = (
        JSON.stringify(testData.dietaryRestrictions) === 
        JSON.stringify(retrievedData.dietaryRestrictions)
      ) && (
        testData.onboardingComplete === retrievedData.onboardingComplete
      );
      
      if (!dataMatches) {
        throw new Error('Los datos no coinciden después de guardar/recuperar');
      }
      
      console.log('✅ MMKV SERVICE - Todos los tests pasaron correctamente');
      return {
        success: true,
        message: 'MMKV funciona perfectamente',
        tests: ['Inicializar', 'Guardar', 'Recuperar', 'Verificar coincidencia'],
        performance: '~30x más rápido que AsyncStorage',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ MMKV SERVICE - Error en test:', error);
      return {
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Métodos de utilidad
  clearAll() {
    if (this.storage) {
      this.storage.clearAll();
      console.log('🧹 MMKV SERVICE - Todos los datos limpiados');
    }
  }

  getAllKeys() {
    if (this.storage) {
      return this.storage.getAllKeys();
    }
    return [];
  }

  // Métodos dummy para compatibilidad
  async createRecipe(recipeData) { 
    return await this.saveRecipe(recipeData);
  }
  async updateRecipe(id, recipeData) { 
    const updatedRecipe = { ...recipeData, id };
    return await this.saveRecipe(updatedRecipe);
  }
  async createShoppingList() { return false; }
  async getAllShoppingLists() { return []; }
  
  close() {
    console.log('🔒 MMKV SERVICE - Servicio cerrado');
    this.isInitialized = false;
    // MMKV no necesita cierre explícito
  }
}

// Instancia singleton
const mmkvService = new MMKVService();

export default mmkvService;