/**
 * Script completo para configurar el usuario con perfil y preferencias
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ipuqtmdljfirpbaxvygd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdXF0bWRsamZpcnBiYXh2eWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODU3NjYsImV4cCI6MjA1NzQ2MTc2Nn0.3KeN7qCquVbW5FUWrgDFvgXCx8NvAlftwI7uKY9kaXE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupComplete() {
  const email = 'luiscazaress@gmail.com';
  const password = '2f2ead687';

  console.log('🔧 Configuración completa del usuario...\n');

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
    console.log('🆔 User ID:', authData.user.id);

    // 2. Crear/verificar perfil
    console.log('\n🔧 Verificando perfil de usuario...');

    const userProfile = {
      auth_user_id: authData.user.id,
      email: authData.user.email,
      name: authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || 'Usuario',
      app_name: 'recipetuner',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: existingUser, error: selectError } = await supabase
      .from('recipetuner_users')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .eq('app_name', 'recipetuner')
      .single();

    let userId;

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ Error verificando usuario:', selectError);
      return;
    }

    if (existingUser) {
      console.log('✅ Perfil ya existe:', existingUser.id);
      userId = existingUser.id;
    } else {
      console.log('🆕 Creando nuevo perfil...');
      const { data: newUser, error: insertError } = await supabase
        .from('recipetuner_users')
        .insert([userProfile])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creando perfil:', insertError.message);
        return;
      }

      console.log('✅ Perfil creado:', newUser.id);
      userId = newUser.id;
    }

    // 3. Crear/verificar preferencias
    console.log('\n⚙️ Verificando preferencias...');

    const { data: existingPrefs, error: prefsSelectError } = await supabase
      .from('recipetuner_user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefsSelectError && prefsSelectError.code !== 'PGRST116') {
      console.error('❌ Error verificando preferencias:', prefsSelectError);
      return;
    }

    if (existingPrefs) {
      console.log('✅ Preferencias ya existen:', existingPrefs.id);
      console.log('📋 Condiciones médicas:', existingPrefs.medical_conditions);
    } else {
      console.log('🆕 Creando preferencias por defecto...');

      const defaultPreferences = {
        user_id: userId,
        dietary_restrictions: [],
        allergies: [],
        intolerances: [],
        cuisine_preferences: [],
        medical_conditions: [],
        cooking_time_preference: null,
        difficulty_level: 'beginner',
        serving_size: 4,
        measurement_unit: 'metric',
        notifications_enabled: true,
        onboarding_complete: false,
        theme: 'light',
        language: 'es',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newPrefs, error: prefsInsertError } = await supabase
        .from('recipetuner_user_preferences')
        .insert([defaultPreferences])
        .select()
        .single();

      if (prefsInsertError) {
        console.error('❌ Error creando preferencias:', prefsInsertError.message);
        return;
      }

      console.log('✅ Preferencias creadas:', newPrefs.id);
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

    const { data: finalRecipes } = await supabase
      .from('recipetuner_recipes')
      .select('*');

    console.log(`✅ Usuarios: ${finalUsers.length}`);
    console.log(`✅ Preferencias: ${finalPrefs.length}`);
    console.log(`✅ Recetas: ${finalRecipes.length}`);

    console.log('\n🎉 ¡Configuración completada! Ahora los datos locales deberían sincronizarse automáticamente con Supabase.');

    // 5. Cerrar sesión para que la app pueda autenticarse normalmente
    console.log('\n👋 Cerrando sesión del script...');
    await supabase.auth.signOut();
    console.log('✅ Sesión cerrada. La app puede autenticarse normalmente.');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

setupComplete();