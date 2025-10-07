/**
 * Script de prueba para verificar sincronización con Supabase
 * Ejecutar con: node test-sync.js
 */

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://ipuqtmdljfirpbaxvygd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdXF0bWRsamZpcnBiYXh2eWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODU3NjYsImV4cCI6MjA1NzQ2MTc2Nn0.3KeN7qCquVbW5FUWrgDFvgXCx8NvAlftwI7uKY9kaXE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSync() {
  console.log('🧪 Probando conexión y estructura de Supabase...\n');

  try {
    console.log('🔗 Probando conexión directa a tablas...');

    // 1. Verificar usuarios
    console.log('\n1. 👥 Verificando usuarios...');
    const { data: users, error: usersError } = await supabase
      .from('recipetuner_users')
      .select('*')
      .eq('app_name', 'recipetuner');

    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError.message);
    } else {
      console.log(`✅ Encontrados ${users.length} usuarios`);
      users.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id})`);
      });
    }

    // 2. Verificar preferencias
    console.log('\n2. ⚙️ Verificando preferencias...');
    const { data: preferences, error: prefError } = await supabase
      .from('recipetuner_user_preferences')
      .select('*');

    if (prefError) {
      console.error('❌ Error obteniendo preferencias:', prefError.message);
    } else {
      console.log(`✅ Encontradas ${preferences.length} preferencias`);
      preferences.forEach(pref => {
        console.log(`  - Usuario ID: ${pref.user_id}, Medical conditions: ${pref.medical_conditions?.length || 0}`);
      });
    }

    // 3. Verificar recetas
    console.log('\n3. 📝 Verificando recetas...');
    const { data: recipes, error: recipesError } = await supabase
      .from('recipetuner_recipes')
      .select('*');

    if (recipesError) {
      console.error('❌ Error obteniendo recetas:', recipesError.message);
    } else {
      console.log(`✅ Encontradas ${recipes.length} recetas`);
      recipes.forEach(recipe => {
        console.log(`  - ${recipe.title} (Usuario: ${recipe.user_id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

testSync();