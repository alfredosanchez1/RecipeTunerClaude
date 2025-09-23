import realmDatabaseService from '../services/realmDatabase';

/**
 * Limpia la base de datos de todos los datos de prueba
 */
const cleanupTestData = async () => {
  try {
    console.log('🧹 Limpiando datos de prueba...');

    if (!realmDatabaseService.realm) {
      console.log('⚠️ Base de datos no inicializada para limpieza');
      return false;
    }

    // Eliminar todas las recetas de prueba
    const testRecipes = realmDatabaseService.realm.objects('Recipe').filtered(
      'title CONTAINS[c] "prueba" OR title CONTAINS[c] "test" OR description CONTAINS[c] "prueba" OR description CONTAINS[c] "test"'
    );

    // Eliminar preferencias de usuarios de prueba
    const testPrefs = realmDatabaseService.realm.objects('UserPreferences').filtered(
      'userId CONTAINS[c] "test"'
    );

    if (testRecipes.length > 0 || testPrefs.length > 0) {
      realmDatabaseService.realm.write(() => {
        realmDatabaseService.realm.delete(testRecipes);
        realmDatabaseService.realm.delete(testPrefs);
      });
      console.log(`🗑️ Eliminadas ${testRecipes.length} recetas y ${testPrefs.length} preferencias de prueba`);
    } else {
      console.log('✨ No hay datos de prueba para limpiar');
    }

    return true;
  } catch (error) {
    console.error('❌ Error limpiando datos de prueba:', error);
    return false;
  }
};

/**
 * Garantiza que la base de datos esté en un estado limpio para las pruebas
 */
const ensureCleanTestEnvironment = async () => {
  try {
    console.log('🧼 Preparando entorno limpio para tests...');

    // Inicializar si no está inicializada
    if (!realmDatabaseService.isInitialized) {
      const initResult = await realmDatabaseService.init();
      if (!initResult) {
        throw new Error('No se pudo inicializar la base de datos');
      }
    }

    // Limpiar datos de pruebas anteriores
    await cleanupTestData();

    console.log('✅ Entorno de pruebas preparado');
    return true;
  } catch (error) {
    console.error('❌ Error preparando entorno de pruebas:', error);
    return false;
  }
};

/**
 * Utilidad para probar la persistencia de la base de datos
 * Ejecuta tests completos de CRUD operations
 */
export const testDatabasePersistence = async () => {
  console.log('🧪 INICIANDO TESTS DE PERSISTENCIA...');

  let createdRecipeId = null;
  let testUserId = null;

  try {
    // 0. Preparar entorno limpio
    console.log('📊 Paso 0: Preparando entorno de pruebas...');
    const cleanEnvResult = await ensureCleanTestEnvironment();
    if (!cleanEnvResult) {
      throw new Error('No se pudo preparar el entorno de pruebas');
    }

    // 1. Inicializar la base de datos
    console.log('📊 Paso 1: Verificando inicialización de Realm Database...');
    if (!realmDatabaseService.isInitialized) {
      const initResult = await realmDatabaseService.init();
      if (!initResult) {
        throw new Error('No se pudo inicializar Realm Database');
      }
    }
    console.log('✅ Realm Database verificada correctamente');

    // 2. Test de creación de receta
    console.log('📊 Paso 2: Creando receta de prueba...');
    const testRecipe = {
      title: 'Pasta Carbonara de Prueba - Test',
      description: 'Una deliciosa pasta carbonara para probar la persistencia - Test Data',
      ingredients: [
        { name: 'Pasta', amount: 200, unit: 'g' },
        { name: 'Huevos', amount: 2, unit: 'unidades' },
        { name: 'Panceta', amount: 100, unit: 'g' },
        { name: 'Parmesano', amount: 50, unit: 'g' }
      ],
      instructions: [
        'Cocer la pasta según las instrucciones del paquete',
        'Freír la panceta hasta que esté crujiente',
        'Batir los huevos con el parmesano',
        'Mezclar todo y servir inmediatamente'
      ],
      prepTime: 10,
      cookTime: 15,
      servings: 2,
      difficulty: 'Fácil',
      cuisine: 'Italiana',
      tags: ['pasta', 'italiana', 'prueba', 'test'],
      isFavorite: false
    };

    const createResult = await realmDatabaseService.createRecipe(testRecipe);
    if (!createResult) {
      throw new Error('Error creando receta de prueba');
    }
    createdRecipeId = createResult.id; // Guardar ID para limpieza posterior
    console.log('✅ Receta creada correctamente con ID:', createdRecipeId);

    // 3. Test de lectura de recetas
    console.log('📊 Paso 3: Obteniendo todas las recetas...');
    const allRecipes = await realmDatabaseService.getAllRecipes();
    if (allRecipes.length === 0) {
      throw new Error('No se encontraron recetas después de crear una');
    }
    console.log(`✅ Se encontraron ${allRecipes.length} receta(s)`);

    // 4. Test de lectura por ID
    console.log('📊 Paso 4: Obteniendo receta por ID...');
    const recipeById = await realmDatabaseService.getRecipeById(createdRecipeId);
    if (!recipeById) {
      throw new Error('No se pudo obtener la receta por ID');
    }
    console.log('✅ Receta obtenida por ID correctamente');

    // 5. Test de actualización
    console.log('📊 Paso 5: Actualizando receta...');
    const updateData = {
      title: 'Pasta Carbonara Actualizada - Test',
      isFavorite: true
    };
    const updateResult = await realmDatabaseService.updateRecipe(createdRecipeId, updateData);
    if (!updateResult) {
      throw new Error('Error actualizando receta');
    }
    console.log('✅ Receta actualizada correctamente');

    // 6. Verificar actualización
    console.log('📊 Paso 6: Verificando actualización...');
    const updatedRecipe = await realmDatabaseService.getRecipeById(createdRecipeId);
    if (updatedRecipe.title !== 'Pasta Carbonara Actualizada - Test' || !updatedRecipe.isFavorite) {
      throw new Error('La actualización no se reflejó correctamente');
    }
    console.log('✅ Actualización verificada correctamente');

    // 7. Test de preferencias de usuario
    console.log('📊 Paso 7: Probando preferencias de usuario...');
    testUserId = `test-user-${Date.now()}`; // ID único para evitar conflictos
    const testPreferences = {
      dietaryRestrictions: ['vegetariano'],
      allergies: ['nueces'],
      intolerances: ['lactosa'],
      cuisinePreferences: ['italiana', 'mexicana'],
      cookingTimePreference: 'Rápido',
      difficultyLevel: 'Fácil',
      servingSize: 2,
      measurementUnit: 'métrico',
      notificationsEnabled: true,
      onboardingComplete: true,
      theme: 'claro',
      language: 'es'
    };

    const savePrefsResult = await realmDatabaseService.saveUserPreferences(testUserId, testPreferences);
    if (!savePrefsResult) {
      throw new Error('Error guardando preferencias de usuario');
    }
    console.log('✅ Preferencias de usuario guardadas correctamente');

    // 8. Verificar preferencias
    console.log('📊 Paso 8: Verificando preferencias de usuario...');
    const retrievedPrefs = await realmDatabaseService.getUserPreferences(testUserId);
    if (!retrievedPrefs) {
      throw new Error('No se pudieron recuperar las preferencias');
    }
    console.log('✅ Preferencias de usuario recuperadas correctamente');

    // 9. Test de persistencia (simular reinicio de app)
    console.log('📊 Paso 9: Simulando reinicio de aplicación...');
    
    // Cerrar y reabrir la base de datos
    realmDatabaseService.close();
    await new Promise(resolve => setTimeout(resolve, 100)); // Pequeña pausa
    
    const reinitResult = await realmDatabaseService.init();
    if (!reinitResult) {
      throw new Error('Error reinicializando la base de datos');
    }

    // Verificar que los datos persisten
    const persistedRecipes = await realmDatabaseService.getAllRecipes();
    const persistedPrefs = await realmDatabaseService.getUserPreferences(testUserId);

    const testRecipeExists = persistedRecipes.some(r => r.id === createdRecipeId);

    if (!testRecipeExists) {
      throw new Error('La receta de prueba no persiste después del reinicio');
    }
    if (!persistedPrefs) {
      throw new Error('Las preferencias no persisten después del reinicio');
    }
    console.log('✅ Datos persisten correctamente después del reinicio');

    // 10. Limpiar datos de prueba
    console.log('📊 Paso 10: Limpiando datos de prueba...');

    let cleanupErrors = [];

    // Eliminar receta de prueba
    try {
      const deleteRecipeResult = await realmDatabaseService.deleteRecipe(createdRecipeId);
      if (!deleteRecipeResult) {
        cleanupErrors.push('No se pudo eliminar la receta de prueba');
      } else {
        console.log('✅ Receta de prueba eliminada');
      }
    } catch (error) {
      cleanupErrors.push(`Error eliminando receta: ${error.message}`);
    }

    // Limpiar todas las preferencias de prueba
    try {
      await cleanupTestData();
      console.log('✅ Limpieza adicional completada');
    } catch (error) {
      cleanupErrors.push(`Error en limpieza adicional: ${error.message}`);
    }

    if (cleanupErrors.length > 0) {
      console.warn('⚠️ Advertencias durante la limpieza:', cleanupErrors);
    }

    // Resultado final
    const testResults = {
      success: true,
      message: '🎉 TODOS LOS TESTS DE PERSISTENCIA PASARON CORRECTAMENTE',
      tests: [
        'Inicialización de Realm Database',
        'Creación de receta',
        'Lectura de todas las recetas',
        'Lectura por ID',
        'Actualización de receta',
        'Verificación de actualización',
        'Guardado de preferencias',
        'Recuperación de preferencias',
        'Persistencia después de reinicio',
        'Limpieza de datos'
      ],
      database: 'Realm Database',
      persistence: '✅ CONFIRMADA',
      timestamp: new Date().toISOString(),
      stats: {
        recipesCreated: 1,
        recipesRetrieved: persistedRecipes.length,
        preferencesSaved: 1,
        dataPersistsAfterRestart: true
      }
    };

    console.log('🎉 RESULTADO FINAL:', JSON.stringify(testResults, null, 2));
    return testResults;

  } catch (error) {
    console.error('❌ ERROR EN TESTS DE PERSISTENCIA:', error);

    // Intentar limpiar datos de prueba incluso si falló el test
    try {
      console.log('🧹 Intentando limpieza de emergencia...');
      if (createdRecipeId) {
        await realmDatabaseService.deleteRecipe(createdRecipeId);
        console.log('✅ Limpieza de emergencia: receta eliminada');
      }
      if (testUserId) {
        await cleanupTestData();
        console.log('✅ Limpieza de emergencia: datos adicionales eliminados');
      }
    } catch (cleanupError) {
      console.error('❌ Error en limpieza de emergencia:', cleanupError.message);
    }

    const errorResult = {
      success: false,
      message: `❌ Error en tests de persistencia: ${error.message}`,
      error: error.message,
      timestamp: new Date().toISOString(),
      database: 'Realm Database',
      persistence: '❌ FALLA',
      cleanupAttempted: true
    };

    console.error('❌ RESULTADO FINAL:', JSON.stringify(errorResult, null, 2));
    return errorResult;
  }
};

/**
 * Test rápido de persistencia con limpieza mejorada
 */
export const quickPersistenceTest = async () => {
  console.log('⚡ TEST RÁPIDO DE PERSISTENCIA...');

  let createdRecipeId = null;

  try {
    // Limpiar datos de prueba antes de comenzar
    await ensureCleanTestEnvironment();

    // Inicializar
    if (!realmDatabaseService.isInitialized) {
      await realmDatabaseService.init();
    }

    // Crear receta simple
    const simpleRecipe = {
      title: 'Test Rápido - Quick Test',
      description: 'Receta de prueba rápida - Quick Test Data',
      ingredients: [{ name: 'Ingrediente Test', amount: 1, unit: 'unidad' }],
      instructions: ['Instrucción de prueba'],
      prepTime: 5,
      cookTime: 10,
      servings: 1,
      difficulty: 'Fácil',
      cuisine: 'Test',
      tags: ['test', 'quick', 'prueba'],
      isFavorite: false
    };

    const createResult = await realmDatabaseService.createRecipe(simpleRecipe);
    if (createResult) {
      createdRecipeId = createResult.id;
      console.log('✅ Receta de test rápido creada con ID:', createdRecipeId);
    }

    // Verificar
    const recipes = await realmDatabaseService.getAllRecipes();
    const testRecipeExists = recipes.some(r => r.id === createdRecipeId);
    const success = recipes.length > 0 && testRecipeExists;

    // Limpiar datos de prueba
    if (createdRecipeId) {
      try {
        await realmDatabaseService.deleteRecipe(createdRecipeId);
        console.log('✅ Receta de test rápido eliminada');
      } catch (cleanupError) {
        console.warn('⚠️ Error limpiando receta de test rápido:', cleanupError.message);
      }
    }

    // Limpieza adicional de datos de test
    try {
      await cleanupTestData();
    } catch (cleanupError) {
      console.warn('⚠️ Error en limpieza adicional:', cleanupError.message);
    }

    console.log(success ? '✅ Test rápido: ÉXITO' : '❌ Test rápido: FALLA');
    return success;

  } catch (error) {
    console.error('❌ Test rápido falló:', error.message);

    // Intentar limpiar en caso de error
    if (createdRecipeId) {
      try {
        await realmDatabaseService.deleteRecipe(createdRecipeId);
        console.log('✅ Limpieza de emergencia en test rápido completada');
      } catch (cleanupError) {
        console.error('❌ Error en limpieza de emergencia:', cleanupError.message);
      }
    }

    return false;
  }
};

/**
 * Función de utilidad para limpiar manualmente datos de prueba
 * Exportada para uso externo si es necesario
 */
export const cleanupAllTestData = cleanupTestData;

/**
 * Función para preparar un entorno limpio de pruebas
 * Exportada para uso externo si es necesario
 */
export const prepareTestEnvironment = ensureCleanTestEnvironment;

export default {
  testDatabasePersistence,
  quickPersistenceTest,
  cleanupAllTestData,
  prepareTestEnvironment
};
