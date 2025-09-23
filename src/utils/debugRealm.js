// Utilidad para debuggear Realm Database
import realmDatabaseService from '../services/realmDatabase';

export const debugSecureStoreDatabase = async () => {
  try {
    console.log('🔍 DEBUGGING REALM DATABASE');
    console.log('================================');
    
    // 1. Verificar inicialización
    const initResult = await realmDatabaseService.init();
    console.log('1. Inicialización:', initResult ? '✅' : '❌');
    
    if (!initResult) {
      console.log('❌ Realm Database no se inicializó correctamente');
      return false;
    }
    
    // 2. Verificar si hay preferencias guardadas
    const existingPrefs = await realmDatabaseService.getUserPreferences('default');
    console.log('2. Preferencias existentes:', existingPrefs ? '✅' : '❌');
    console.log('   Datos:', JSON.stringify(existingPrefs, null, 2));
    
    // 3. Guardar preferencias de prueba
    const testPrefs = {
      dietaryRestrictions: ['Vegetariano', 'Sin gluten'],
      allergies: ['Nueces'],
      intolerances: ['Lactosa'],
      cuisinePreferences: ['Italiana', 'Mexicana'],
      cookingTimePreference: 'Rápido',
      notificationsEnabled: true
    };
    
    const saveResult = await realmDatabaseService.saveUserPreferences('default', testPrefs);
    console.log('3. Guardado de prueba:', saveResult ? '✅' : '❌');
    
    // 4. Verificar que se guardaron
    const retrievedPrefs = await realmDatabaseService.getUserPreferences('default');
    console.log('4. Recuperación:', retrievedPrefs ? '✅' : '❌');
    console.log('   Datos recuperados:', JSON.stringify(retrievedPrefs, null, 2));
    
    // 5. Comparar datos
    const match = JSON.stringify(testPrefs.dietaryRestrictions) === JSON.stringify(retrievedPrefs?.dietaryRestrictions);
    console.log('5. Coincidencia de datos:', match ? '✅' : '❌');
    
    console.log('================================');
    console.log('🔍 DEBUG COMPLETADO');
    
    return {
      initialized: initResult,
      hasExistingData: !!existingPrefs,
      saveWorked: saveResult,
      retrieveWorked: !!retrievedPrefs,
      dataMatches: match
    };
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
    return false;
  }
};

export default debugSecureStoreDatabase;