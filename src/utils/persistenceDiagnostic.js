import * as FileSystem from 'expo-file-system/legacy';
import realmDatabaseService from '../services/realmDatabase';

/**
 * Diagnóstico completo de persistencia de datos
 */
export const runPersistenceDiagnostic = async () => {
  console.log('🔍 DIAGNÓSTICO DE PERSISTENCIA');
  console.log('=================================');

  const results = {
    timestamp: new Date().toISOString(),
    diagnostics: [],
    issues: [],
    recommendations: []
  };

  try {
    // 1. Verificar directorios de sistema
    console.log('1️⃣ Verificando directorios del sistema...');

    const documentDir = FileSystem.documentDirectory;
    const cacheDir = FileSystem.cacheDirectory;

    results.diagnostics.push({
      test: 'Directorios del sistema',
      status: 'success',
      data: {
        documentDirectory: documentDir,
        cacheDirectory: cacheDir,
        documentDirExists: !!documentDir,
        cacheDirExists: !!cacheDir
      }
    });

    console.log('   Document Directory:', documentDir);
    console.log('   Cache Directory:', cacheDir);

    // 2. Verificar archivos Realm existentes
    console.log('2️⃣ Buscando archivos Realm existentes...');

    let realmFiles = [];
    try {
      if (documentDir) {
        const files = await FileSystem.readDirectoryAsync(documentDir);
        realmFiles = files.filter(file =>
          file.includes('.realm') ||
          file.includes('.lock') ||
          file.includes('.note') ||
          file.includes('.management')
        );
      }

      results.diagnostics.push({
        test: 'Archivos Realm existentes',
        status: 'success',
        data: {
          totalFiles: realmFiles.length,
          files: realmFiles
        }
      });

      console.log(`   Archivos Realm encontrados: ${realmFiles.length}`);
      realmFiles.forEach(file => console.log(`   - ${file}`));

    } catch (error) {
      results.diagnostics.push({
        test: 'Archivos Realm existentes',
        status: 'error',
        error: error.message
      });
      results.issues.push('No se pueden leer archivos del directorio de documentos');
    }

    // 3. Verificar estado actual de Realm
    console.log('3️⃣ Verificando estado de Realm Database...');

    const realmStatus = {
      isInitialized: realmDatabaseService.isInitialized,
      hasRealmInstance: !!realmDatabaseService.realm,
      realmPath: realmDatabaseService.realm?.path,
      realmIsClosed: realmDatabaseService.realm?.isClosed,
      schemaVersion: realmDatabaseService.realm?.schemaVersion
    };

    results.diagnostics.push({
      test: 'Estado de Realm Database',
      status: 'success',
      data: realmStatus
    });

    console.log('   Realm inicializado:', realmStatus.isInitialized);
    console.log('   Instancia de Realm:', realmStatus.hasRealmInstance);
    console.log('   Path de Realm:', realmStatus.realmPath);
    console.log('   Realm cerrado:', realmStatus.realmIsClosed);
    console.log('   Versión de esquema:', realmStatus.schemaVersion);

    // 4. Verificar datos existentes
    console.log('4️⃣ Verificando datos existentes...');

    if (realmDatabaseService.realm && !realmDatabaseService.realm.isClosed) {
      const recipes = realmDatabaseService.realm.objects('Recipe');
      const userPrefs = realmDatabaseService.realm.objects('UserPreferences');

      results.diagnostics.push({
        test: 'Datos existentes',
        status: 'success',
        data: {
          recipesCount: recipes.length,
          userPrefsCount: userPrefs.length,
          recipes: Array.from(recipes).map(r => ({
            id: r._id.toString(),
            title: r.title,
            createdAt: r.createdAt
          })),
          userPrefs: Array.from(userPrefs).map(up => ({
            id: up._id.toString(),
            userId: up.userId,
            createdAt: up.createdAt
          }))
        }
      });

      console.log(`   Recetas en BD: ${recipes.length}`);
      console.log(`   Preferencias en BD: ${userPrefs.length}`);

      if (recipes.length === 0 && userPrefs.length === 0) {
        results.issues.push('No hay datos en la base de datos');
      }
    } else {
      results.diagnostics.push({
        test: 'Datos existentes',
        status: 'error',
        error: 'Realm no está disponible'
      });
      results.issues.push('No se puede acceder a Realm para verificar datos');
    }

    // 5. Test de escritura
    console.log('5️⃣ Test de escritura en Realm...');

    try {
      if (!realmDatabaseService.isInitialized) {
        await realmDatabaseService.init();
      }

      const testData = {
        title: `Test Diagnóstico ${Date.now()}`,
        description: 'Test de diagnóstico de persistencia',
        ingredients: [{ name: 'Test ingredient', amount: 1, unit: 'test' }],
        instructions: ['Test instruction'],
        prepTime: 5,
        cookTime: 10,
        servings: 1,
        difficulty: 'Fácil',
        cuisine: 'Test',
        tags: ['diagnostic'],
        isFavorite: false
      };

      const created = await realmDatabaseService.createRecipe(testData);

      if (created) {
        // Verificar que se escribió
        const found = await realmDatabaseService.getRecipeById(created.id);

        if (found) {
          results.diagnostics.push({
            test: 'Test de escritura',
            status: 'success',
            data: {
              created: true,
              verified: true,
              recipeId: created.id
            }
          });

          // Limpiar test data
          await realmDatabaseService.deleteRecipe(created.id);

          console.log('   ✅ Test de escritura exitoso');
        } else {
          results.diagnostics.push({
            test: 'Test de escritura',
            status: 'error',
            error: 'Datos escritos pero no encontrados en lectura'
          });
          results.issues.push('Problema de consistencia en lectura/escritura');
        }
      } else {
        results.diagnostics.push({
          test: 'Test de escritura',
          status: 'error',
          error: 'No se pudo crear el registro de prueba'
        });
        results.issues.push('Falla en operación de escritura');
      }

    } catch (error) {
      results.diagnostics.push({
        test: 'Test de escritura',
        status: 'error',
        error: error.message
      });
      results.issues.push(`Error en test de escritura: ${error.message}`);
    }

    // 6. Test de persistencia entre sesiones
    console.log('6️⃣ Test de persistencia entre sesiones...');

    try {
      // Crear un dato específico para persistencia
      const persistenceTestData = {
        title: `Persistencia Test ${Date.now()}`,
        description: 'Test específico de persistencia entre sesiones',
        ingredients: [{ name: 'Persistence ingredient', amount: 1, unit: 'test' }],
        instructions: ['Persistence test instruction'],
        prepTime: 5,
        cookTime: 10,
        servings: 1,
        difficulty: 'Fácil',
        cuisine: 'Persistence',
        tags: ['persistence-test'],
        isFavorite: false
      };

      const persistenceRecipe = await realmDatabaseService.createRecipe(persistenceTestData);

      if (persistenceRecipe) {
        // Cerrar y reabrir Realm
        realmDatabaseService.close();
        await new Promise(resolve => setTimeout(resolve, 500));

        const reinitResult = await realmDatabaseService.init();

        if (reinitResult) {
          const persistedRecipe = await realmDatabaseService.getRecipeById(persistenceRecipe.id);

          if (persistedRecipe) {
            results.diagnostics.push({
              test: 'Persistencia entre sesiones',
              status: 'success',
              data: {
                persisted: true,
                recipeFound: true,
                originalId: persistenceRecipe.id,
                persistedId: persistedRecipe.id
              }
            });

            // Limpiar
            await realmDatabaseService.deleteRecipe(persistenceRecipe.id);
            console.log('   ✅ Persistencia entre sesiones exitosa');
          } else {
            results.diagnostics.push({
              test: 'Persistencia entre sesiones',
              status: 'error',
              error: 'Datos no persisten entre sesiones'
            });
            results.issues.push('❌ PROBLEMA PRINCIPAL: Los datos no persisten entre sesiones');
          }
        } else {
          results.diagnostics.push({
            test: 'Persistencia entre sesiones',
            status: 'error',
            error: 'No se pudo reinicializar Realm'
          });
          results.issues.push('Error reinicializando Realm después de cierre');
        }
      }

    } catch (error) {
      results.diagnostics.push({
        test: 'Persistencia entre sesiones',
        status: 'error',
        error: error.message
      });
      results.issues.push(`Error en test de persistencia: ${error.message}`);
    }

    // 7. Generar recomendaciones
    console.log('7️⃣ Generando recomendaciones...');

    if (results.issues.length === 0) {
      results.recommendations.push('✅ La persistencia parece estar funcionando correctamente');
    } else {
      if (results.issues.some(issue => issue.includes('no persisten entre sesiones'))) {
        results.recommendations.push('🔧 Verificar configuración del path de Realm');
        results.recommendations.push('🔧 Asegurar que el directorio de documentos sea consistente');
        results.recommendations.push('🔧 Verificar permisos de escritura en el directorio');
      }

      if (results.issues.some(issue => issue.includes('escritura'))) {
        results.recommendations.push('🔧 Verificar configuración de esquemas de Realm');
        results.recommendations.push('🔧 Revisar inicialización de Realm Database');
      }

      if (results.issues.some(issue => issue.includes('directorio'))) {
        results.recommendations.push('🔧 Verificar permisos de FileSystem');
        results.recommendations.push('🔧 Usar path absoluto para Realm');
      }
    }

    console.log('=================================');
    console.log('🎯 RESUMEN DEL DIAGNÓSTICO:');
    console.log(`   Tests ejecutados: ${results.diagnostics.length}`);
    console.log(`   Problemas encontrados: ${results.issues.length}`);
    console.log(`   Recomendaciones: ${results.recommendations.length}`);

    if (results.issues.length > 0) {
      console.log('\n❌ PROBLEMAS ENCONTRADOS:');
      results.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    if (results.recommendations.length > 0) {
      console.log('\n🔧 RECOMENDACIONES:');
      results.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    console.log('=================================');

    return results;

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);

    results.diagnostics.push({
      test: 'Diagnóstico general',
      status: 'error',
      error: error.message
    });

    return results;
  }
};

export default runPersistenceDiagnostic;