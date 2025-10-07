/**
 * Script para limpiar completamente la sesión de Supabase
 * Útil cuando AsyncStorage mantiene sesiones antiguas
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const clearSupabaseSession = async () => {
  try {
    console.log('🧹 Limpiando sesión de Supabase...');

    // Obtener todas las keys
    const allKeys = await AsyncStorage.getAllKeys();
    console.log('📦 Keys encontradas:', allKeys);

    // Filtrar keys de Supabase
    const supabaseKeys = allKeys.filter(key =>
      key.includes('supabase') ||
      key.includes('auth') ||
      key.includes('sb-')
    );

    console.log('🔑 Keys de Supabase:', supabaseKeys);

    if (supabaseKeys.length > 0) {
      await AsyncStorage.multiRemove(supabaseKeys);
      console.log('✅ Sesión de Supabase limpiada');
    } else {
      console.log('ℹ️ No se encontraron keys de Supabase');
    }

    // Verificar que se limpiaron
    const remainingKeys = await AsyncStorage.getAllKeys();
    const remainingSupabaseKeys = remainingKeys.filter(key =>
      key.includes('supabase') || key.includes('auth')
    );

    if (remainingSupabaseKeys.length === 0) {
      console.log('✅ Verificación exitosa - todas las keys limpiadas');
    } else {
      console.log('⚠️ Aún quedan keys:', remainingSupabaseKeys);
    }

  } catch (error) {
    console.error('❌ Error limpiando sesión:', error);
  }
};

clearSupabaseSession();
