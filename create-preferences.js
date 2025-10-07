/**
 * Script para crear preferencias por defecto para el usuario
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ipuqtmdljfirpbaxvygd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdXF0bWRsamZpcnBiYXh2eWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODU3NjYsImV4cCI6MjA1NzQ2MTc2Nn0.3KeN7qCquVbW5FUWrgDFvgXCx8NvAlftwI7uKY9kaXE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createPreferences() {
  console.log('⚙️ Creando preferencias para el usuario...\n');

  try {
    // 1. Obtener todos los usuarios de RecipeTuner
    const { data: users, error: userError } = await supabase
      .from('recipetuner_users')
      .select('*')
      .eq('app_name', 'recipetuner');

    if (userError) {
      console.error('❌ Error obteniendo usuarios:', userError.message);
      return;
    }

    console.log(`👥 Usuarios encontrados: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id})`);
    });

    if (users.length === 0) {
      console.error('❌ No se encontraron usuarios');
      return;
    }

    // Usar el primer usuario (o el que coincida con el email específico)
    const user = users.find(u => u.email === 'luiscazaress@gmail.com') || users[0];
    console.log('👤 Trabajando con usuario:', user.email, '(ID:', user.id + ')');

    // 2. Verificar si ya existen preferencias
    const { data: existing, error: selectError } = await supabase
      .from('recipetuner_user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ Error verificando preferencias:', selectError);
      return;
    }

    if (existing) {
      console.log('✅ Preferencias ya existen:', existing.id);
      console.log('📋 Condiciones médicas actuales:', existing.medical_conditions);
    } else {
      // 3. Crear preferencias por defecto
      console.log('🆕 Creando preferencias por defecto...');

      const defaultPreferences = {
        user_id: user.id,
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

      const { data: newPrefs, error: insertError } = await supabase
        .from('recipetuner_user_preferences')
        .insert([defaultPreferences])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creando preferencias:', insertError.message);
        return;
      }

      console.log('✅ Preferencias creadas:', newPrefs.id);
    }

    // 4. Verificar resultado final
    const { data: allPrefs } = await supabase
      .from('recipetuner_user_preferences')
      .select('*');

    console.log(`✅ Total preferencias: ${allPrefs.length}`);

    console.log('\n🎉 ¡Configuración completada! Ahora deberían sincronizarse los datos automáticamente.');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

createPreferences();