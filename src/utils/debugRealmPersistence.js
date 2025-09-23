import * as FileSystem from 'expo-file-system/legacy';
import realmDatabaseService from '../services/realmDatabase';

/**
 * Utilidad para debuggear problemas de persistencia de Realm
 */
export const debugRealmPersistence = async () => {
  console.log('🔍 DEBUGGING REALM PERSISTENCE');
  console.log('================================');

  try {
    // 1. Verificar directorios de la app
    console.log('📁 Directorios de la app:');
    console.log('   Document Directory:', FileSystem.documentDirectory);
    console.log('   Cache Directory:', FileSystem.cacheDirectory);
    console.log('   Bundle Directory:', FileSystem.bundleDirectory);

    // 2. Listar archivos en el directorio de documentos
    console.log('📄 Archivos en documentos:');
    try {
      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      console.log('   Files:', files);

      // Buscar archivos .realm
      const realmFiles = files.filter(file => file.includes('.realm'));
      console.log('   Realm files found:', realmFiles);

      // Información detallada de archivos realm
      for (const file of realmFiles) {
        const filePath = `${FileSystem.documentDirectory}${file}`;
        const info = await FileSystem.getInfoAsync(filePath);
        console.log(`   ${file}:`, {
          exists: info.exists,
          size: info.size,
          modificationTime: new Date(info.modificationTime * 1000)
        });
      }
    } catch (error) {
      console.log('   Error reading directory:', error.message);
    }

    // 3. Verificar estado de Realm
    console.log('🗃️ Estado de Realm Database:');
    console.log('   Initialized:', realmDatabaseService.isInitialized);
    console.log('   Realm instance:', !!realmDatabaseService.realm);

    if (realmDatabaseService.realm) {
      console.log('   Schema version:', realmDatabaseService.realm.schemaVersion);
      console.log('   Path:', realmDatabaseService.realm.path);
      console.log('   Read only:', realmDatabaseService.realm.readOnly);
      console.log('   Is closed:', realmDatabaseService.realm.isClosed);

      // Verificar objetos en la base de datos
      const recipes = realmDatabaseService.realm.objects('Recipe');
      const userPrefs = realmDatabaseService.realm.objects('UserPreferences');
      console.log('   Recipes count:', recipes.length);
      console.log('   UserPreferences count:', userPrefs.length);
    }

    console.log('================================');

    return {
      documentDirectory: FileSystem.documentDirectory,
      realmInitialized: realmDatabaseService.isInitialized,
      realmPath: realmDatabaseService.realm?.path,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error en debug de persistencia:', error);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Test de persistencia real - crear datos, cerrar Realm, reabrir y verificar
 */
export const testRealPersistence = async () => {
  console.log('🧪 TEST DE PERSISTENCIA REAL');
  console.log('=============================');

  let createdRecipeId = null;
  let testUserId = null;

  try {
    // 0. Limpiar entorno de prueba
    console.log('0️⃣ Limpiando entorno de prueba...');
    try {
      if (!realmDatabaseService.isInitialized) {
        await realmDatabaseService.init();
      }

      // Limpiar datos de pruebas anteriores
      const testRecipes = realmDatabaseService.realm.objects('Recipe').filtered(
        'title CONTAINS[c] "persistencia real" OR title CONTAINS[c] "test persistencia"'
      );
      const testPrefs = realmDatabaseService.realm.objects('UserPreferences').filtered(
        'userId CONTAINS[c] "test-persistence"'
      );

      if (testRecipes.length > 0 || testPrefs.length > 0) {
        realmDatabaseService.realm.write(() => {
          realmDatabaseService.realm.delete(testRecipes);
          realmDatabaseService.realm.delete(testPrefs);
        });
        console.log(`🗑️ Limpieza previa: eliminadas ${testRecipes.length} recetas y ${testPrefs.length} preferencias`);
      }
    } catch (cleanupError) {
      console.warn('⚠️ Error en limpieza previa:', cleanupError.message);
    }

    // 1. Inicializar Realm
    console.log('1️⃣ Verificando inicialización de Realm...');
    if (!realmDatabaseService.isInitialized) {
      const initResult = await realmDatabaseService.init();
      if (!initResult) {
        throw new Error('No se pudo inicializar Realm');
      }
    }

    // 2. Crear datos de prueba únicos
    console.log('2️⃣ Creando datos de prueba...');
    const timestamp = Date.now();
    const testRecipe = {
      title: `Test Persistencia Real - ${timestamp}`,
      description: `Receta para probar persistencia real - ${timestamp}`,
      ingredients: [{ name: 'Ingrediente Test Real', amount: 1, unit: 'unidad' }],
      instructions: ['Paso de prueba de persistencia real'],
      prepTime: 5,
      cookTime: 10,
      servings: 1,
      difficulty: 'Fácil',
      cuisine: 'Test',
      tags: ['test', 'persistencia', 'real'],
      isFavorite: false
    };

    const createdRecipe = await realmDatabaseService.createRecipe(testRecipe);
    if (!createdRecipe) {
      throw new Error('No se pudo crear la receta');
    }
    createdRecipeId = createdRecipe.id;
    console.log('✅ Receta creada con ID:', createdRecipeId);

    // 3. Guardar preferencias de prueba únicas
    console.log('3️⃣ Guardando preferencias...');
    testUserId = `test-persistence-user-${timestamp}`;
    const testPrefs = {
      dietaryRestrictions: ['test-diet-real'],
      allergies: ['test-allergy-real'],
      intolerances: ['test-intolerance-real'],
      cuisinePreferences: ['test-cuisine-real'],
      cookingTimePreference: 'Rápido',
      difficultyLevel: 'Fácil',
      servingSize: 2,
      measurementUnit: 'métrico',
      notificationsEnabled: true,
      onboardingComplete: true,
      theme: 'claro',
      language: 'es'
    };

    const savePrefsResult = await realmDatabaseService.saveUserPreferences(testUserId, testPrefs);
    if (!savePrefsResult) {
      throw new Error('No se pudieron guardar las preferencias');
    }
    console.log('✅ Preferencias guardadas para usuario:', testUserId);

    // 4. Verificar que los datos existen
    console.log('4️⃣ Verificando datos antes de cerrar...');
    const recipesBefore = await realmDatabaseService.getAllRecipes();
    const prefsBefore = await realmDatabaseService.getUserPreferences(testUserId);

    const testRecipeExistsBefore = recipesBefore.some(r => r.id === createdRecipeId);

    console.log('   Recetas totales antes de cerrar:', recipesBefore.length);
    console.log('   Test receta existe antes de cerrar:', testRecipeExistsBefore);
    console.log('   Preferencias antes de cerrar:', !!prefsBefore);

    if (!testRecipeExistsBefore || !prefsBefore) {
      throw new Error('Los datos de prueba no se crearon correctamente');
    }

    // 5. Cerrar Realm completamente
    console.log('5️⃣ Cerrando Realm...');
    realmDatabaseService.close();

    // Esperar un momento para asegurar que se cerró completamente
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 6. Reabrir Realm
    console.log('6️⃣ Reabriendo Realm...');
    const reinitResult = await realmDatabaseService.init();
    if (!reinitResult) {
      throw new Error('No se pudo reinicializar Realm');
    }

    // 7. Verificar persistencia
    console.log('7️⃣ Verificando persistencia...');
    const recipesAfter = await realmDatabaseService.getAllRecipes();
    const prefsAfter = await realmDatabaseService.getUserPreferences(testUserId);

    console.log('   Recetas totales después de reabrir:', recipesAfter.length);
    console.log('   Preferencias después de reabrir:', !!prefsAfter);

    // 8. Comparar resultados específicos
    const testRecipeExistsAfter = recipesAfter.some(r => r.id === createdRecipeId);
    const prefsContainTestData = !!prefsAfter && prefsAfter.dietaryRestrictions?.includes('test-diet-real');

    console.log('   ✅ Test receta persistió:', testRecipeExistsAfter);
    console.log('   ✅ Preferencias persistieron:', prefsContainTestData);

    // 9. Limpiar datos de prueba
    console.log('9️⃣ Limpiando datos de prueba...');
    let cleanupErrors = [];

    // Eliminar receta de prueba
    if (createdRecipeId) {
      try {
        const deleteResult = await realmDatabaseService.deleteRecipe(createdRecipeId);
        if (deleteResult) {
          console.log('✅ Receta de prueba eliminada');
        } else {
          cleanupErrors.push('No se pudo eliminar la receta de prueba');
        }
      } catch (deleteError) {
        cleanupErrors.push(`Error eliminando receta: ${deleteError.message}`);
      }
    }

    // Limpiar preferencias de prueba
    if (testUserId) {
      try {
        const testPrefs = realmDatabaseService.realm.objects('UserPreferences').filtered('userId == $0', testUserId);
        if (testPrefs.length > 0) {
          realmDatabaseService.realm.write(() => {
            realmDatabaseService.realm.delete(testPrefs);
          });
          console.log('✅ Preferencias de prueba eliminadas');
        }
      } catch (deleteError) {
        cleanupErrors.push(`Error eliminando preferencias: ${deleteError.message}`);
      }
    }

    if (cleanupErrors.length > 0) {
      console.warn('⚠️ Errores durante la limpieza:', cleanupErrors);
    }

    // Resultado final
    const testResult = {
      success: testRecipeExistsAfter && prefsContainTestData,
      recipePersisted: testRecipeExistsAfter,
      prefsPersisted: prefsContainTestData,
      recipeCountBefore: recipesBefore.length,
      recipeCountAfter: recipesAfter.length,
      realmPath: realmDatabaseService.realm?.path,
      cleanupErrors: cleanupErrors.length > 0 ? cleanupErrors : null,
      timestamp: new Date().toISOString()
    };

    console.log('🎯 RESULTADO FINAL:', testResult);
    console.log('=============================');

    return testResult;

  } catch (error) {
    console.error('❌ Error en test de persistencia real:', error);

    // Intentar limpiar en caso de error
    try {
      if (createdRecipeId) {
        await realmDatabaseService.deleteRecipe(createdRecipeId);
        console.log('✅ Limpieza de emergencia: receta eliminada');
      }
      if (testUserId && realmDatabaseService.realm) {
        const testPrefs = realmDatabaseService.realm.objects('UserPreferences').filtered('userId == $0', testUserId);
        if (testPrefs.length > 0) {
          realmDatabaseService.realm.write(() => {
            realmDatabaseService.realm.delete(testPrefs);
          });
          console.log('✅ Limpieza de emergencia: preferencias eliminadas');
        }
      }
    } catch (cleanupError) {
      console.error('❌ Error en limpieza de emergencia:', cleanupError.message);
    }

    return {
      success: false,
      error: error.message,
      cleanupAttempted: true,
      timestamp: new Date().toISOString()
    };
  }
};

export default {
  debugRealmPersistence,
  testRealPersistence
};