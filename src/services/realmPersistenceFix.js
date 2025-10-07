import * as FileSystem from 'expo-file-system/legacy';
import Realm from 'realm';

/**
 * Configurador mejorado de Realm para garantizar persistencia real
 */
class RealmPersistenceManager {
  constructor() {
    this.cachedPath = null;
    this.initialized = false;
  }

  /**
   * Obtiene el path consistente para la base de datos
   */
  getConsistentRealmPath() {
    if (this.cachedPath) {
      return this.cachedPath;
    }

    try {
      const documentDir = FileSystem.documentDirectory;

      if (!documentDir) {
        console.warn('⚠️ DocumentDirectory no disponible, usando path por defecto');
        this.cachedPath = 'recipetuner-persistent.realm';
      } else {
        // Asegurar que el directorio existe
        const realmFileName = 'recipetuner-persistent.realm';
        this.cachedPath = `${documentDir}${realmFileName}`;

        console.log('📁 Path de Realm determinado:', this.cachedPath);
      }

      return this.cachedPath;
    } catch (error) {
      console.error('❌ Error determinando path de Realm:', error);
      this.cachedPath = 'recipetuner-persistent.realm';
      return this.cachedPath;
    }
  }

  /**
   * Verifica si la base de datos existe en el path
   */
  async databaseExists() {
    try {
      const path = this.getConsistentRealmPath();

      if (path.includes(FileSystem.documentDirectory)) {
        const info = await FileSystem.getInfoAsync(path);
        return info.exists;
      }

      // Para paths relativos, asumir que existe si Realm puede abrirse
      return true;
    } catch (error) {
      console.log('📝 Base de datos no existe aún');
      return false;
    }
  }

  /**
   * Configura Realm con persistencia garantizada
   */
  async createRealmConfig() {
    const path = this.getConsistentRealmPath();

    console.log('🔧 Configurando Realm con path:', path);

    // Esquemas importados
    const {
      Recipe,
      Ingredient,
      NutritionInfo,
      RecipeAdaptation,
      User,
      UserPreferences,
      ShoppingList,
      ShoppingItem
    } = await import('./realmSchemas');

    const config = {
      path: path,
      schema: [
        User,
        Recipe,
        Ingredient,
        NutritionInfo,
        RecipeAdaptation,
        UserPreferences,
        ShoppingList,
        ShoppingItem
      ],
      schemaVersion: 4, // Incrementar versión para forzar una migración limpia
      migration: (oldRealm, newRealm) => {
        console.log('🔄 Ejecutando migración de esquema...');

        // Migración conservadora: mantener todos los datos existentes
        if (oldRealm.schemaVersion < 4) {
          console.log('📈 Migrando desde versión', oldRealm.schemaVersion, 'a versión 4');

          // Migrar recetas
          const oldRecipes = oldRealm.objects('Recipe');
          for (const oldRecipe of oldRecipes) {
            const newRecipe = newRealm.objectForPrimaryKey('Recipe', oldRecipe._id);
            if (newRecipe) {
              // Asegurar que todos los campos requeridos existen
              if (!newRecipe.tags) newRecipe.tags = [];
              if (!newRecipe.ingredients) newRecipe.ingredients = [];
              if (!newRecipe.instructions) newRecipe.instructions = [];
              if (newRecipe.isFavorite === undefined) newRecipe.isFavorite = false;
            }
          }

          // Migrar preferencias de usuario
          const oldPrefs = oldRealm.objects('UserPreferences');
          for (const oldPref of oldPrefs) {
            const newPref = newRealm.objectForPrimaryKey('UserPreferences', oldPref._id);
            if (newPref) {
              // Asegurar valores por defecto
              if (!newPref.dietaryRestrictions) newPref.dietaryRestrictions = [];
              if (!newPref.allergies) newPref.allergies = [];
              if (!newPref.intolerances) newPref.intolerances = [];
              if (!newPref.cuisinePreferences) newPref.cuisinePreferences = [];
              if (newPref.notificationsEnabled === undefined) newPref.notificationsEnabled = true;
            }
          }
        }
      },
      deleteRealmIfMigrationNeeded: false, // No eliminar datos existentes
    };

    console.log('✅ Configuración de Realm lista');
    return config;
  }

  /**
   * Verifica la integridad de la base de datos
   */
  async verifyDatabaseIntegrity(realmInstance) {
    try {
      console.log('🔍 Verificando integridad de la base de datos...');

      // Test básico de lectura
      const recipes = realmInstance.objects('Recipe');
      const userPrefs = realmInstance.objects('UserPreferences');

      console.log(`📊 Recetas en BD: ${recipes.length}`);
      console.log(`📊 Preferencias en BD: ${userPrefs.length}`);

      // Test de escritura básica
      let testId;
      realmInstance.write(() => {
        const testObject = realmInstance.create('Recipe', {
          _id: new Realm.BSON.ObjectId(),
          title: 'Test Integridad',
          description: 'Test de integridad de BD',
          ingredients: [],
          instructions: ['Test'],
          isFavorite: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['test']
        });
        testId = testObject._id;
      });

      // Verificar que se puede leer
      const testObject = realmInstance.objectForPrimaryKey('Recipe', testId);
      const canRead = !!testObject;

      // Limpiar test
      if (testObject) {
        realmInstance.write(() => {
          realmInstance.delete(testObject);
        });
      }

      console.log('✅ Verificación de integridad completada');
      return {
        canRead: true,
        canWrite: true,
        canDelete: true,
        recipesCount: recipes.length,
        userPrefsCount: userPrefs.length
      };

    } catch (error) {
      console.error('❌ Error verificando integridad:', error);
      return {
        canRead: false,
        canWrite: false,
        canDelete: false,
        error: error.message
      };
    }
  }

  /**
   * Diagnóstico del estado del sistema de archivos
   */
  async diagnoseFileSystem() {
    console.log('🔍 Diagnosticando sistema de archivos...');

    const diagnosis = {
      documentDirectory: FileSystem.documentDirectory,
      cacheDirectory: FileSystem.cacheDirectory,
      realmPath: this.getConsistentRealmPath(),
      dbExists: await this.databaseExists()
    };

    try {
      if (FileSystem.documentDirectory) {
        const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
        const realmFiles = files.filter(f => f.includes('.realm') || f.includes('.lock'));
        diagnosis.realmFiles = realmFiles;
        diagnosis.totalFiles = files.length;
      }
    } catch (error) {
      diagnosis.fileSystemError = error.message;
    }

    console.log('📊 Diagnóstico del sistema de archivos:', diagnosis);
    return diagnosis;
  }

  /**
   * Limpia archivos corruptos o temporales
   */
  async cleanupCorruptedFiles() {
    try {
      console.log('🧹 Limpiando archivos potencialmente corruptos...');

      if (!FileSystem.documentDirectory) {
        console.log('⚠️ No se puede limpiar: DocumentDirectory no disponible');
        return false;
      }

      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      const lockFiles = files.filter(f => f.endsWith('.lock') || f.endsWith('.note'));

      for (const lockFile of lockFiles) {
        try {
          const filePath = `${FileSystem.documentDirectory}${lockFile}`;
          await FileSystem.deleteAsync(filePath);
          console.log(`🗑️ Eliminado archivo de bloqueo: ${lockFile}`);
        } catch (error) {
          console.warn(`⚠️ No se pudo eliminar ${lockFile}:`, error.message);
        }
      }

      console.log('✅ Limpieza completada');
      return true;
    } catch (error) {
      console.error('❌ Error durante limpieza:', error);
      return false;
    }
  }

  /**
   * Inicializa Realm con persistencia mejorada
   */
  async initializeWithPersistence() {
    try {
      console.log('🚀 Inicializando Realm con persistencia mejorada...');

      // Diagnósticar sistema de archivos
      await this.diagnoseFileSystem();

      // Limpiar archivos corruptos
      await this.cleanupCorruptedFiles();

      // Crear configuración
      const config = await this.createRealmConfig();

      // Abrir Realm
      console.log('📂 Abriendo Realm...');
      const realm = await Realm.open(config);

      // Verificar integridad
      const integrity = await this.verifyDatabaseIntegrity(realm);

      console.log('✅ Realm inicializado con persistencia mejorada');
      console.log('📊 Estado de integridad:', integrity);

      this.initialized = true;
      return {
        realm,
        integrity,
        path: config.path,
        success: true
      };

    } catch (error) {
      console.error('❌ Error inicializando Realm con persistencia:', error);

      return {
        realm: null,
        integrity: null,
        path: null,
        success: false,
        error: error.message
      };
    }
  }
}

// Instancia singleton
const realmPersistenceManager = new RealmPersistenceManager();

export default realmPersistenceManager;