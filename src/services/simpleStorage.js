import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Almacenamiento persistente ultra-simple y confiable
 * Solo usa AsyncStorage que es el más estable en todos los entornos
 */
class SimpleStorageService {
  constructor() {
    this.isReady = false;
    this.storageKeys = {
      recipes: '@recipes_storage',
      userPreferences: '@user_preferences_storage',
      onboardingComplete: '@onboarding_complete'
    };
  }

  async init() {
    try {
      console.log('🔄 SIMPLE STORAGE - Inicializando...');

      // Test simple para verificar que AsyncStorage funciona
      const testKey = '@test_storage';
      await AsyncStorage.setItem(testKey, 'test');
      const testValue = await AsyncStorage.getItem(testKey);
      await AsyncStorage.removeItem(testKey);

      if (testValue === 'test') {
        this.isReady = true;
        console.log('✅ SIMPLE STORAGE - Inicializado correctamente');
        return true;
      } else {
        throw new Error('AsyncStorage test failed');
      }
    } catch (error) {
      console.error('❌ SIMPLE STORAGE - Error inicializando:', error);
      return false;
    }
  }

  // ===== RECETAS =====

  async saveRecipes(recipes) {
    try {
      console.log('💾 SIMPLE STORAGE - Guardando recetas:', recipes.length);

      const data = {
        recipes: recipes,
        timestamp: new Date().toISOString(),
        count: recipes.length
      };

      await AsyncStorage.setItem(this.storageKeys.recipes, JSON.stringify(data));
      console.log('✅ SIMPLE STORAGE - Recetas guardadas exitosamente');
      return true;
    } catch (error) {
      console.error('❌ SIMPLE STORAGE - Error guardando recetas:', error);
      return false;
    }
  }

  async loadRecipes() {
    try {
      console.log('📖 SIMPLE STORAGE - Cargando recetas...');

      const storedData = await AsyncStorage.getItem(this.storageKeys.recipes);

      if (storedData) {
        const data = JSON.parse(storedData);
        console.log(`✅ SIMPLE STORAGE - ${data.count} recetas cargadas (${data.timestamp})`);
        return data.recipes || [];
      } else {
        console.log('📭 SIMPLE STORAGE - No hay recetas guardadas');
        return [];
      }
    } catch (error) {
      console.error('❌ SIMPLE STORAGE - Error cargando recetas:', error);
      return [];
    }
  }

  async addRecipe(recipe) {
    try {
      const currentRecipes = await this.loadRecipes();

      // Asegurar ID único
      const newRecipe = {
        ...recipe,
        id: recipe.id || `recipe_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedRecipes = [...currentRecipes, newRecipe];

      const success = await this.saveRecipes(updatedRecipes);
      if (success) {
        console.log('✅ SIMPLE STORAGE - Receta agregada:', newRecipe.id);
        return newRecipe;
      } else {
        throw new Error('Error guardando receta');
      }
    } catch (error) {
      console.error('❌ SIMPLE STORAGE - Error agregando receta:', error);
      throw error;
    }
  }

  async updateRecipe(recipeId, updates) {
    try {
      const currentRecipes = await this.loadRecipes();
      const recipeIndex = currentRecipes.findIndex(r => r.id === recipeId);

      if (recipeIndex === -1) {
        throw new Error('Receta no encontrada');
      }

      currentRecipes[recipeIndex] = {
        ...currentRecipes[recipeIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const success = await this.saveRecipes(currentRecipes);
      if (success) {
        console.log('✅ SIMPLE STORAGE - Receta actualizada:', recipeId);
        return currentRecipes[recipeIndex];
      } else {
        throw new Error('Error guardando actualización');
      }
    } catch (error) {
      console.error('❌ SIMPLE STORAGE - Error actualizando receta:', error);
      throw error;
    }
  }

  async deleteRecipe(recipeId) {
    try {
      const currentRecipes = await this.loadRecipes();
      const filteredRecipes = currentRecipes.filter(r => r.id !== recipeId);

      const success = await this.saveRecipes(filteredRecipes);
      if (success) {
        console.log('✅ SIMPLE STORAGE - Receta eliminada:', recipeId);
        return true;
      } else {
        throw new Error('Error guardando después de eliminar');
      }
    } catch (error) {
      console.error('❌ SIMPLE STORAGE - Error eliminando receta:', error);
      throw error;
    }
  }

  // ===== PREFERENCIAS DE USUARIO =====

  async saveUserPreferences(preferences) {
    try {
      console.log('💾 SIMPLE STORAGE - Guardando preferencias de usuario...');

      const data = {
        preferences: preferences,
        timestamp: new Date().toISOString()
      };

      await AsyncStorage.setItem(this.storageKeys.userPreferences, JSON.stringify(data));
      console.log('✅ SIMPLE STORAGE - Preferencias guardadas exitosamente');
      return true;
    } catch (error) {
      console.error('❌ SIMPLE STORAGE - Error guardando preferencias:', error);
      return false;
    }
  }

  async loadUserPreferences() {
    try {
      console.log('📖 SIMPLE STORAGE - Cargando preferencias de usuario...');

      const storedData = await AsyncStorage.getItem(this.storageKeys.userPreferences);

      if (storedData) {
        const data = JSON.parse(storedData);
        console.log(`✅ SIMPLE STORAGE - Preferencias cargadas (${data.timestamp})`);
        return data.preferences || null;
      } else {
        console.log('📭 SIMPLE STORAGE - No hay preferencias guardadas');
        return null;
      }
    } catch (error) {
      console.error('❌ SIMPLE STORAGE - Error cargando preferencias:', error);
      return null;
    }
  }

  // ===== ONBOARDING =====

  async setOnboardingComplete(isComplete) {
    try {
      console.log('🎯 SIMPLE STORAGE - Estableciendo onboarding:', isComplete);

      await AsyncStorage.setItem(this.storageKeys.onboardingComplete, isComplete.toString());
      console.log('✅ SIMPLE STORAGE - Estado de onboarding guardado');
      return true;
    } catch (error) {
      console.error('❌ SIMPLE STORAGE - Error guardando estado de onboarding:', error);
      return false;
    }
  }

  async isOnboardingComplete() {
    try {
      const stored = await AsyncStorage.getItem(this.storageKeys.onboardingComplete);
      const isComplete = stored === 'true';
      console.log('📖 SIMPLE STORAGE - Onboarding completo:', isComplete);
      return isComplete;
    } catch (error) {
      console.error('❌ SIMPLE STORAGE - Error verificando onboarding:', error);
      return false;
    }
  }

  // ===== DIAGNÓSTICO Y LIMPIEZA =====

  async diagnose() {
    console.log('🔍 SIMPLE STORAGE - Ejecutando diagnóstico...');

    try {
      const diagnosis = {
        isReady: this.isReady,
        timestamp: new Date().toISOString()
      };

      // Verificar datos existentes
      const recipes = await this.loadRecipes();
      const preferences = await this.loadUserPreferences();
      const onboardingComplete = await this.isOnboardingComplete();

      diagnosis.data = {
        recipesCount: recipes.length,
        hasPreferences: !!preferences,
        onboardingComplete: onboardingComplete
      };

      // Verificar AsyncStorage directamente
      const allKeys = await AsyncStorage.getAllKeys();
      const ourKeys = allKeys.filter(key => Object.values(this.storageKeys).includes(key));

      diagnosis.storage = {
        totalKeys: allKeys.length,
        ourKeys: ourKeys.length,
        keysList: ourKeys
      };

      console.log('📊 SIMPLE STORAGE - Diagnóstico:', diagnosis);
      return diagnosis;
    } catch (error) {
      console.error('❌ SIMPLE STORAGE - Error en diagnóstico:', error);
      return { error: error.message };
    }
  }

  async clearAll() {
    try {
      console.log('🧹 SIMPLE STORAGE - Limpiando todos los datos...');

      for (const key of Object.values(this.storageKeys)) {
        await AsyncStorage.removeItem(key);
      }

      console.log('✅ SIMPLE STORAGE - Todos los datos limpiados');
      return true;
    } catch (error) {
      console.error('❌ SIMPLE STORAGE - Error limpiando datos:', error);
      return false;
    }
  }

  // ===== BACKUP COMPLETO =====

  async createFullBackup() {
    try {
      console.log('📦 SIMPLE STORAGE - Creando backup completo...');

      const recipes = await this.loadRecipes();
      const preferences = await this.loadUserPreferences();
      const onboardingComplete = await this.isOnboardingComplete();

      const backup = {
        recipes,
        preferences,
        onboardingComplete,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      const backupKey = `@full_backup_${Date.now()}`;
      await AsyncStorage.setItem(backupKey, JSON.stringify(backup));

      console.log('✅ SIMPLE STORAGE - Backup creado:', backupKey);
      return backupKey;
    } catch (error) {
      console.error('❌ SIMPLE STORAGE - Error creando backup:', error);
      throw error;
    }
  }

  async restoreFromBackup(backupKey) {
    try {
      console.log('🔄 SIMPLE STORAGE - Restaurando desde backup:', backupKey);

      const backupData = await AsyncStorage.getItem(backupKey);
      if (!backupData) {
        throw new Error('Backup no encontrado');
      }

      const backup = JSON.parse(backupData);

      if (backup.recipes) {
        await this.saveRecipes(backup.recipes);
      }

      if (backup.preferences) {
        await this.saveUserPreferences(backup.preferences);
      }

      if (backup.onboardingComplete !== undefined) {
        await this.setOnboardingComplete(backup.onboardingComplete);
      }

      console.log('✅ SIMPLE STORAGE - Restauración completada');
      return true;
    } catch (error) {
      console.error('❌ SIMPLE STORAGE - Error restaurando backup:', error);
      throw error;
    }
  }
}

// Instancia singleton
const simpleStorage = new SimpleStorageService();

export default simpleStorage;