import realmDatabaseService from '../services/realmDatabase';

export const quickRealmTest = async () => {
  try {
    console.log('🧪 Iniciando prueba rápida de Realm...');
    
    // Verificar si está inicializado
    if (!realmDatabaseService.isInitialized) {
      console.log('🔄 Inicializando Realm...');
      await realmDatabaseService.init();
    }
    
    // Obtener instancia de Realm
    const realm = realmDatabaseService.getRealm();
    console.log('✅ Realm obtenido:', realm ? 'SÍ' : 'NO');
    
    // Crear un objeto de prueba
    const testUser = {
      _id: new Realm.BSON.ObjectId(),
      name: 'Test User',
      email: 'test@example.com',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Guardar en Realm
    realm.write(() => {
      realm.create('User', testUser);
    });
    console.log('✅ Usuario de prueba guardado en Realm');
    
    // Leer de Realm
    const savedUser = realm.objectForPrimaryKey('User', testUser._id);
    console.log('✅ Usuario leído de Realm:', savedUser ? savedUser.name : 'NO ENCONTRADO');
    
    // Limpiar
    realm.write(() => {
      realm.delete(savedUser);
    });
    console.log('✅ Usuario de prueba eliminado');
    
    return {
      success: true,
      message: 'Realm Database funciona correctamente',
      tests: [
        'Inicialización de Realm',
        'Creación de objeto',
        'Lectura de objeto',
        'Eliminación de objeto'
      ],
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error en prueba rápida de Realm:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
};
