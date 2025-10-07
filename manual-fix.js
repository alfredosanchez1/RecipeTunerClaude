/**
 * Script para crear manualmente el perfil de usuario y ejecutar migración
 * Ejecutar con: node manual-fix.js
 */

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://ipuqtmdljfirpbaxvygd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdXF0bWRsamZpcnBiYXh2eWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODU3NjYsImV4cCI6MjA1NzQ2MTc2Nn0.3KeN7qCquVbW5FUWrgDFvgXCx8NvAlftwI7uKY9kaXE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function manualFix() {
  console.log('🔧 Reparación manual - Creando perfil de usuario...\n');

  try {
    // Solicitar email del usuario
    const email = 'luis.cazares@me.com'; // Reemplaza con tu email
    console.log(`👤 Buscando usuario con email: ${email}`);

    // 1. Buscar el usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Error obteniendo usuarios de Auth:', authError);
      return;
    }

    const authUser = authData.users.find(u => u.email === email);
    if (!authUser) {
      console.error('❌ Usuario no encontrado en Auth');
      return;
    }

    console.log(`✅ Usuario encontrado en Auth: ${authUser.email} (ID: ${authUser.id})`);

    // 2. Verificar si ya existe en recipetuner_users
    const { data: existingProfile, error: selectError } = await supabase
      .from('recipetuner_users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .eq('app_name', 'recipetuner')
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ Error verificando perfil existente:', selectError);
      return;
    }

    if (existingProfile) {
      console.log('✅ Perfil ya existe:', existingProfile.id);
      console.log('📋 Saltando a migración de datos...');
    } else {
      // 3. Crear perfil
      console.log('🆕 Creando perfil de usuario...');
      const userProfile = {
        auth_user_id: authUser.id,
        email: authUser.email,
        first_name: authUser.user_metadata?.first_name || 'Usuario',
        last_name: authUser.user_metadata?.last_name || '',
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.first_name || 'Usuario',
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
      console.log('⚙️ Creando preferencias por defecto...');
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
        return;
      }

      console.log('✅ Preferencias creadas:', preferences.id);
    }

    console.log('\n🎉 ¡Reparación completada! Ahora tus datos deberían sincronizarse correctamente.');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

manualFix();