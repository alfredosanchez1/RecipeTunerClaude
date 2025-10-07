import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Servicio de almacenamiento persistente robusto
 * Combina AsyncStorage + FileSystem para máxima compatibilidad
 */
class PersistentStorageService {
  constructor() {
    this.isInitialized = false;
    this.storageMethod = null; // 'async-storage' | 'file-system' | 'hybrid'
  }

  async init() {
    try {
      console.log('🔄 STORAGE - Inicializando almacenamiento persistente...');

      // Probar AsyncStorage primero (más confiable)
      const asyncStorageTest = await this.testAsyncStorage();
      const fileSystemTest = await this.testFileSystem();

      if (asyncStorageTest && fileSystemTest) {
        this.storageMethod = 'hybrid';
        console.log('✅ STORAGE - Usando modo híbrido (AsyncStorage + FileSystem)');
      } else if (asyncStorageTest) {
        this.storageMethod = 'async-storage';
        console.log('✅ STORAGE - Usando AsyncStorage únicamente');
      } else if (fileSystemTest) {
        this.storageMethod = 'file-system';
        console.log('✅ STORAGE - Usando FileSystem únicamente');
      } else {
        throw new Error('No se pudo inicializar ningún método de almacenamiento');
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ STORAGE - Error inicializando:', error);
      return false;
    }
  }

  async testAsyncStorage() {
    try {
      const testKey = 'storage_test_' + Date.now();
      const testValue = 'test_value';

      await AsyncStorage.setItem(testKey, testValue);
      const retrieved = await AsyncStorage.getItem(testKey);
      await AsyncStorage.removeItem(testKey);

      return retrieved === testValue;
    } catch (error) {
      console.warn('⚠️ STORAGE - AsyncStorage no disponible:', error.message);
      return false;
    }
  }

  async testFileSystem() {
    try {
      if (!FileSystem.documentDirectory) {
        return false;
      }

      const testFile = `${FileSystem.documentDirectory}storage_test.json`;
      const testData = { test: true, timestamp: Date.now() };

      await FileSystem.writeAsStringAsync(testFile, JSON.stringify(testData));
      const retrieved = await FileSystem.readAsStringAsync(testFile);
      await FileSystem.deleteAsync(testFile);

      const parsedData = JSON.parse(retrieved);
      return parsedData.test === true;
    } catch (error) {
      console.warn('⚠️ STORAGE - FileSystem no disponible:', error.message);
      return false;
    }
  }

  // ===== OPERACIONES DE RECETAS =====

  async saveRecipes(recipes) {
    if (!this.isInitialized) {
      throw new Error('Storage no inicializado');
    }

    try {
      console.log('💾 STORAGE - Guardando recetas:', recipes.length);
      const data = {
        recipes: recipes,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      if (this.storageMethod === 'hybrid' || this.storageMethod === 'async-storage') {
        await AsyncStorage.setItem('app_recipes', JSON.stringify(data));
        console.log('✅ STORAGE - Recetas guardadas en AsyncStorage');
      }

      if (this.storageMethod === 'hybrid' || this.storageMethod === 'file-system') {
        if (FileSystem.documentDirectory) {
          const filePath = `${FileSystem.documentDirectory}recipes_backup.json`;
          await FileSystem.writeAsStringAsync(filePath, JSON.stringify(data));
          console.log('✅ STORAGE - Recetas guardadas en FileSystem');
        }
      }

      return true;
    } catch (error) {
      console.error('❌ STORAGE - Error guardando recetas:', error);
      return false;
    }
  }

  async loadRecipes() {
    if (!this.isInitialized) {
      throw new Error('Storage no inicializado');
    }

    try {
      console.log('📖 STORAGE - Cargando recetas...');
      let data = null;

      // Intentar cargar desde AsyncStorage primero
      if (this.storageMethod === 'hybrid' || this.storageMethod === 'async-storage') {
        try {
          const asyncData = await AsyncStorage.getItem('app_recipes');
          if (asyncData) {
            data = JSON.parse(asyncData);
            console.log('✅ STORAGE - Recetas cargadas desde AsyncStorage');
          }
        } catch (error) {
          console.warn('⚠️ STORAGE - Error cargando desde AsyncStorage:', error.message);
        }
      }

      // Si no hay datos, intentar FileSystem
      if (!data && (this.storageMethod === 'hybrid' || this.storageMethod === 'file-system')) {
        try {
          if (FileSystem.documentDirectory) {
            const filePath = `${FileSystem.documentDirectory}recipes_backup.json`;
            const fileInfo = await FileSystem.getInfoAsync(filePath);

            if (fileInfo.exists) {
              const fileData = await FileSystem.readAsStringAsync(filePath);
              data = JSON.parse(fileData);
              console.log('✅ STORAGE - Recetas cargadas desde FileSystem');
            }
          }
        } catch (error) {
          console.warn('⚠️ STORAGE - Error cargando desde FileSystem:', error.message);
        }
      }

      if (data && data.recipes) {
        console.log(`📊 STORAGE - ${data.recipes.length} recetas cargadas (${data.timestamp})`);
        return data.recipes;
      } else {
        console.log('📭 STORAGE - No hay recetas guardadas');
        return [];
      }
    } catch (error) {
      console.error('❌ STORAGE - Error cargando recetas:', error);
      return [];
    }
  }

  // ===== OPERACIONES DE PREFERENCIAS =====

  async saveUserPreferences(userId, preferences) {
    if (!this.isInitialized) {
      throw new Error('Storage no inicializado');
    }

    try {
      console.log('💾 STORAGE - Guardando preferencias para usuario:', userId);
      const data = {
        userId: userId,
        preferences: preferences,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      if (this.storageMethod === 'hybrid' || this.storageMethod === 'async-storage') {
        await AsyncStorage.setItem('app_user_preferences', JSON.stringify(data));
        console.log('✅ STORAGE - Preferencias guardadas en AsyncStorage');
      }

      if (this.storageMethod === 'hybrid' || this.storageMethod === 'file-system') {
        if (FileSystem.documentDirectory) {
          const filePath = `${FileSystem.documentDirectory}user_preferences_backup.json`;
          await FileSystem.writeAsStringAsync(filePath, JSON.stringify(data));
          console.log('✅ STORAGE - Preferencias guardadas en FileSystem');
        }
      }

      return true;
    } catch (error) {
      console.error('❌ STORAGE - Error guardando preferencias:', error);
      return false;
    }
  }

  async loadUserPreferences(userId) {
    if (!this.isInitialized) {
      throw new Error('Storage no inicializado');
    }

    try {
      console.log('📖 STORAGE - Cargando preferencias para usuario:', userId);
      let data = null;

      // Intentar cargar desde AsyncStorage primero
      if (this.storageMethod === 'hybrid' || this.storageMethod === 'async-storage') {
        try {
          const asyncData = await AsyncStorage.getItem('app_user_preferences');
          if (asyncData) {
            data = JSON.parse(asyncData);
            console.log('✅ STORAGE - Preferencias cargadas desde AsyncStorage');
          }
        } catch (error) {
          console.warn('⚠️ STORAGE - Error cargando preferencias desde AsyncStorage:', error.message);
        }
      }

      // Si no hay datos, intentar FileSystem
      if (!data && (this.storageMethod === 'hybrid' || this.storageMethod === 'file-system')) {
        try {
          if (FileSystem.documentDirectory) {
            const filePath = `${FileSystem.documentDirectory}user_preferences_backup.json`;
            const fileInfo = await FileSystem.getInfoAsync(filePath);

            if (fileInfo.exists) {
              const fileData = await FileSystem.readAsStringAsync(filePath);
              data = JSON.parse(fileData);
              console.log('✅ STORAGE - Preferencias cargadas desde FileSystem');
            }
          }
        } catch (error) {
          console.warn('⚠️ STORAGE - Error cargando preferencias desde FileSystem:', error.message);
        }
      }

      if (data && data.preferences && data.userId === userId) {
        console.log(`📊 STORAGE - Preferencias cargadas para ${userId} (${data.timestamp})`);
        return data.preferences;
      } else {
        console.log('📭 STORAGE - No hay preferencias guardadas para el usuario');
        return null;
      }
    } catch (error) {
      console.error('❌ STORAGE - Error cargando preferencias:', error);
      return null;
    }
  }

  // ===== DIAGNÓSTICO =====

  async diagnose() {
    console.log('🔍 STORAGE - Ejecutando diagnóstico...');

    const diagnosis = {
      isInitialized: this.isInitialized,
      storageMethod: this.storageMethod,
      asyncStorageAvailable: await this.testAsyncStorage(),
      fileSystemAvailable: await this.testFileSystem(),
      documentDirectory: FileSystem.documentDirectory,
      timestamp: new Date().toISOString()
    };

    // Verificar datos existentes
    try {
      const recipes = await this.loadRecipes();
      const preferences = await this.loadUserPreferences('default');

      diagnosis.existingData = {
        recipesCount: recipes.length,
        hasPreferences: !!preferences
      };
    } catch (error) {
      diagnosis.dataError = error.message;
    }

    console.log('📊 STORAGE - Diagnóstico:', diagnosis);
    return diagnosis;
  }

  // ===== LIMPIEZA =====

  async clearAllData() {
    try {
      console.log('🧹 STORAGE - Limpiando todos los datos...');

      if (this.storageMethod === 'hybrid' || this.storageMethod === 'async-storage') {
        await AsyncStorage.removeItem('app_recipes');
        await AsyncStorage.removeItem('app_user_preferences');
        console.log('✅ STORAGE - AsyncStorage limpiado');
      }

      if (this.storageMethod === 'hybrid' || this.storageMethod === 'file-system') {
        if (FileSystem.documentDirectory) {
          try {
            await FileSystem.deleteAsync(`${FileSystem.documentDirectory}recipes_backup.json`);
            await FileSystem.deleteAsync(`${FileSystem.documentDirectory}user_preferences_backup.json`);
            console.log('✅ STORAGE - FileSystem limpiado');
          } catch (error) {
            console.warn('⚠️ STORAGE - Algunos archivos no se pudieron eliminar:', error.message);
          }
        }
      }

      return true;
    } catch (error) {
      console.error('❌ STORAGE - Error limpiando datos:', error);
      return false;
    }
  }
}

// Instancia singleton
const persistentStorage = new PersistentStorageService();

export default persistentStorage;