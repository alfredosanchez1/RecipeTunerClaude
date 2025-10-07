/**
 * Script simplificado para crear perfil de usuario con campos básicos
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ipuqtmdljfirpbaxvygd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdXF0bWRsamZpcnBiYXh2eWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODU3NjYsImV4cCI6MjA1NzQ2MTc2Nn0.3KeN7qCquVbW5FUWrgDFvgXCx8NvAlftwI7uKY9kaXE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createSimpleProfile() {
  // Credenciales del usuario
  const email = 'luiscazaress@gmail.com';
  const password = '2f2ead687';

  console.log('🔐 Autenticando usuario...');

  try {
    // 1. Autenticar usuario
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

    // 2. Intentar crear perfil con campos mínimos
    console.log('🔧 Creando perfil con campos básicos...');

    const basicProfile = {
      auth_user_id: authData.user.id,
      email: authData.user.email,
      name: authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || 'Usuario',
      app_name: 'recipetuner',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Verificar si ya existe
    const { data: existing, error: selectError } = await supabase
      .from('recipetuner_users')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .eq('app_name', 'recipetuner')
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ Error verificando usuario:', selectError);
      return;
    }

    if (existing) {
      console.log('✅ Perfil ya existe:', existing.id);
    } else {
      const { data: newProfile, error: insertError } = await supabase
        .from('recipetuner_users')
        .insert([basicProfile])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creando perfil básico:', insertError.message);
        console.log('💡 Intentando con campos alternativos...');

        // Intentar solo con los campos absolutamente necesarios
        const minimalProfile = {
          auth_user_id: authData.user.id,
          email: authData.user.email,
          name: 'Usuario',
          app_name: 'recipetuner'
        };

        const { data: minProfile, error: minError } = await supabase
          .from('recipetuner_users')
          .insert([minimalProfile])
          .select()
          .single();

        if (minError) {
          console.error('❌ Error con perfil mínimo:', minError.message);
          return;
        } else {
          console.log('✅ Perfil mínimo creado:', minProfile.id);
        }
      } else {
        console.log('✅ Perfil básico creado:', newProfile.id);
      }
    }

    // 3. Verificar resultado
    const { data: finalCheck } = await supabase
      .from('recipetuner_users')
      .select('*')
      .eq('app_name', 'recipetuner');

    console.log(`✅ Total usuarios en RecipeTuner: ${finalCheck.length}`);

    console.log('\n🎉 ¡Perfil creado exitosamente!');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

createSimpleProfile();