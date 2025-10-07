/**
 * Script directo para crear el perfil de usuario manualmente
 * Reemplaza TU_EMAIL con tu email real y ejecuta: node create-profile.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ipuqtmdljfirpbaxvygd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdXF0bWRsamZpcnBiYXh2eWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODU3NjYsImV4cCI6MjA1NzQ2MTc2Nn0.3KeN7qCquVbW5FUWrgDFvgXCx8NvAlftwI7uKY9kaXE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createProfile() {
  // REEMPLAZA CON TU EMAIL Y CONTRASEÑA REALES
  const email = 'luiscazaress@gmail.COM';
  const password = '2f2ead687';

  console.log('🔐 Intentando autenticar para crear perfil...');

  try {
    // 1. Autenticarse como el usuario
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('❌ Error de autenticación:', authError.message);
      console.log('💡 Asegúrate de reemplazar TU_EMAIL y TU_CONTRASEÑA con tus datos reales');
      return;
    }

    console.log('✅ Autenticado como:', authData.user.email);
    const user = authData.user;

    // 2. Verificar si ya existe perfil
    const { data: existingProfile, error: selectError } = await supabase
      .from('recipetuner_users')
      .select('*')
      .eq('auth_user_id', user.id)
      .eq('app_name', 'recipetuner')
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ Error verificando perfil:', selectError);
      return;
    }

    if (existingProfile) {
      console.log('✅ Perfil ya existe:', existingProfile.id);
      console.log('📋 Email:', existingProfile.email);
    } else {
      // 3. Crear perfil
      console.log('🆕 Creando perfil...');
      const userProfile = {
        auth_user_id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || 'Usuario',
        last_name: user.user_metadata?.last_name || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.first_name || 'Usuario',
        app_name: 'recipetuner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newProfile, error: insertError } = await supabase
        .from('recipetuner_users')
        .insert([userProfile])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creando perfil:', insertError);
        return;
      }

      console.log('✅ Perfil creado:', newProfile.id);

      // 4. Crear preferencias por defecto
      console.log('⚙️ Creando preferencias...');
      const defaultPreferences = {
        user_id: newProfile.id,
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
        language: 'es'
      };

      const { data: preferences, error: prefError } = await supabase
        .from('recipetuner_user_preferences')
        .insert([defaultPreferences])
        .select()
        .single();

      if (prefError) {
        console.error('❌ Error creando preferencias:', prefError);
      } else {
        console.log('✅ Preferencias creadas:', preferences.id);
      }
    }

    // 5. Verificar resultado final
    console.log('\n🧪 Verificando resultado...');
    const { data: users } = await supabase
      .from('recipetuner_users')
      .select('*')
      .eq('app_name', 'recipetuner');

    console.log(`✅ Total usuarios en RecipeTuner: ${users.length}`);

    const { data: prefs } = await supabase
      .from('recipetuner_user_preferences')
      .select('*');

    console.log(`✅ Total preferencias: ${prefs.length}`);

    console.log('\n🎉 ¡Perfil creado! Ahora las condiciones médicas y recetas deberían sincronizarse.');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

createProfile();