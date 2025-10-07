/**
 * Script para configurar usuario con campos mínimos que existen en las tablas
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ipuqtmdljfirpbaxvygd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdXF0bWRsamZpcnBiYXh2eWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODU3NjYsImV4cCI6MjA1NzQ2MTc2Nn0.3KeN7qCquVbW5FUWrgDFvgXCx8NvAlftwI7uKY9kaXE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupMinimal() {
  const email = 'luiscazaress@gmail.com';
  const password = '2f2ead687';

  console.log('🔧 Configuración mínima del usuario...\n');

  try {
    // 1. Autenticar usuario
    console.log('🔐 Autenticando...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('❌ Error de autenticación:', authError.message);
      return;
    }

    console.log('✅ Autenticado como:', authData.user.email);

    // 2. Usuario ya existe, obtener su ID
    const { data: existingUser } = await supabase
      .from('recipetuner_users')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .eq('app_name', 'recipetuner')
      .single();

    if (!existingUser) {
      console.error('❌ No se encontró el perfil del usuario');
      return;
    }

    console.log('✅ Perfil encontrado:', existingUser.id);
    const userId = existingUser.id;

    // 3. Intentar crear preferencias con campos básicos únicamente
    console.log('\n⚙️ Creando preferencias básicas...');

    // Probar con solo campos esenciales
    const minimalPreferences = {
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newPrefs, error: prefsError } = await supabase
      .from('recipetuner_user_preferences')
      .insert([minimalPreferences])
      .select()
      .single();

    if (prefsError) {
      console.error('❌ Error con preferencias mínimas:', prefsError.message);

      // Si falla, intentar solo con user_id
      console.log('💡 Intentando con solo user_id...');
      const ultraMinimal = { user_id: userId };

      const { data: ultraPrefs, error: ultraError } = await supabase
        .from('recipetuner_user_preferences')
        .insert([ultraMinimal])
        .select()
        .single();

      if (ultraError) {
        console.error('❌ Error con preferencias ultra-mínimas:', ultraError.message);
        return;
      } else {
        console.log('✅ Preferencias ultra-mínimas creadas:', ultraPrefs.id);
      }
    } else {
      console.log('✅ Preferencias mínimas creadas:', newPrefs.id);
    }

    // 4. Verificación final
    console.log('\n📊 Estado final:');

    const { data: finalUsers } = await supabase
      .from('recipetuner_users')
      .select('*')
      .eq('app_name', 'recipetuner');

    const { data: finalPrefs } = await supabase
      .from('recipetuner_user_preferences')
      .select('*');

    console.log(`✅ Usuarios: ${finalUsers.length}`);
    console.log(`✅ Preferencias: ${finalPrefs.length}`);

    console.log('\n🎉 ¡Configuración básica completada!');
    console.log('ℹ️ Ahora las funciones de migración automática deberían poder sincronizar los datos locales.');

    // 5. Cerrar sesión
    console.log('\n👋 Cerrando sesión del script...');
    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

setupMinimal();