/**
 * Script para verificar la estructura de la tabla en Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ipuqtmdljfirpbaxvygd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdXF0bWRsamZpcnBiYXh2eWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODU3NjYsImV4cCI6MjA1NzQ2MTc2Nn0.3KeN7qCquVbW5FUWrgDFvgXCx8NvAlftwI7uKY9kaXE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log('🔍 Verificando estructura de tabla recipetuner_users...\n');

  try {
    // Intentar hacer una consulta con todos los campos posibles para ver cuales existen
    const { data, error } = await supabase
      .from('recipetuner_users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error consultando tabla:', error.message);
      console.log('\n💡 Intentando consultar solo los campos básicos...');

      // Probar con campos básicos
      const { data: basicData, error: basicError } = await supabase
        .from('recipetuner_users')
        .select('id, auth_user_id, email, app_name')
        .limit(1);

      if (basicError) {
        console.error('❌ Error con campos básicos:', basicError.message);
      } else {
        console.log('✅ Campos básicos disponibles:', Object.keys(basicData[0] || {}));
      }
    } else {
      console.log('✅ Estructura de tabla encontrada:');
      if (data && data.length > 0) {
        console.log('Campos disponibles:', Object.keys(data[0]));
      } else {
        console.log('Tabla vacía, intentando insertar registro de prueba para ver estructura...');

        // Crear registro mínimo para ver qué campos acepta
        const testRecord = {
          auth_user_id: 'test-id',
          email: 'test@example.com',
          app_name: 'recipetuner'
        };

        const { error: insertError } = await supabase
          .from('recipetuner_users')
          .insert([testRecord]);

        if (insertError) {
          console.log('Error al insertar (esto nos ayuda a ver la estructura):');
          console.log(insertError.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkSchema();