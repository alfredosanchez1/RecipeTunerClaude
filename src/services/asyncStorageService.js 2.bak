import AsyncStorage from '@react-native-async-storage/async-storage';

console.log('🔄 ASYNC STORAGE SERVICE - Archivo cargado');

class AsyncStorageService {
  constructor() {
    this.isInitialized = false;
  }

  // Inicializar el servicio
  async init() {
    try {
      console.log('🔄 ASYNC STORAGE SERVICE - Inicializando AsyncStorage...');
      this.isInitialized = true;
      console.log('✅ ASYNC STORAGE SERVICE - AsyncStorage inicializado correctamente');
      return true;
    } catch (error) {
      console.error('❌ ASYNC STORAGE SERVICE - Error inicializando:', error);
      this.isInitialized = false;
      return false;
    }
  }

  // Guardar preferencias del usuario
  async saveUserPreferences(userId, preferences) {
    try {
      console.log('🔧 ASYNC STORAGE SERVICE - saveUserPreferences iniciado');
      console.log('👤 userId:', userId);
      console.log('📋 preferences recibidas:', JSON.stringify(preferences, null, 2));
      
      if (!this.isInitialized) {
        throw new Error('AsyncStorage no está inicializado');
      }

      const key = `user_preferences_${userId}`;
      const dataToSave = {
        ...preferences,
        updatedAt: new Date().toISOString()
      };

      await AsyncStorage.setItem(key, JSON.stringify(dataToSave));
      console.log('✅ ASYNC STORAGE SERVICE - Preferencias guardadas correctamente');
      return true;
    } catch (error) {
      console.error('❌ ASYNC STORAGE SERVICE - Error guardando preferencias:', error);
      return false;
    }
  }

  // Obtener preferencias del usuario
  async getUserPreferences(userId) {
    try {
      console.log('🔧 ASYNC STORAGE SERVICE - getUserPreferences iniciado');
      console.log('👤 userId:', userId);
      
      if (!this.isInitialized) {
        console.error('❌ ASYNC STORAGE SERVICE - Servicio no inicializado');
        return null;
      }

      const key = `user_preferences_${userId}`;
      const data = await AsyncStorage.getItem(key);

      if (data) {
        const preferences = JSON.parse(data);
        console.log('✅ ASYNC STORAGE SERVICE - Preferencias recuperadas:', JSON.stringify(preferences, null, 2));
        return preferences;
      } else {
        console.log('📭 ASYNC STORAGE SERVICE - No se encontraron preferencias guardadas');
        return null;
      }
    } catch (error) {
      console.error('❌ ASYNC STORAGE SERVICE - Error obteniendo preferencias:', error);
      return null;
    }
  }

  // Test de funcionalidad
  async testDatabase() {
    try {
      console.log('🧪 ASYNC STORAGE SERVICE - Probando funcionalidad...');
      
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
      
      console.log('✅ ASYNC STORAGE SERVICE - Todos los tests pasaron correctamente');
      return {
        success: true,
        message: 'AsyncStorage funciona perfectamente',
        tests: ['Inicializar', 'Guardar', 'Recuperar', 'Verificar coincidencia'],
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ ASYNC STORAGE SERVICE - Error en test:', error);
      return {
        success: false,
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Métodos dummy para mantener compatibilidad
  async createRecipe() { return false; }
  async getAllRecipes() { return []; }
  async getRecipeById() { return null; }
  async updateRecipe() { return false; }
  async deleteRecipe() { return false; }
  async createShoppingList() { return false; }
  async getAllShoppingLists() { return []; }
  
  close() {
    console.log('🔒 ASYNC STORAGE SERVICE - Servicio cerrado');
    this.isInitialized = false;
  }
}

// Instancia singleton
const asyncStorageService = new AsyncStorageService();

export default asyncStorageService;