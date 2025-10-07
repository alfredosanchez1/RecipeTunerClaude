/**
 * Script para probar el flujo de reset de password
 * Simula el proceso que hace Supabase cuando el usuario hace click en el link
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ipuqtmdljfirpbaxvygd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdXF0bWRsamZpcnBiYXh2eWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODU3NjYsImV4cCI6MjA1NzQ2MTc2Nn0.3KeN7qCquVbW5FUWrgDFvgXCx8NvAlftwI7uKY9kaXE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testResetPassword = async () => {
  try {
    const email = 'luiscazares@losmolinoscafe.com';

    console.log('📧 Enviando email de reset para:', email);

    // Enviar email de reset con redirect_to a la app
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'recipetuner://reset-password',
    });

    if (error) {
      console.error('❌ Error enviando reset email:', error);
      return;
    }

    console.log('✅ Email de reset enviado exitosamente');
    console.log('📬 Revisa tu email:', email);
    console.log('');
    console.log('⚠️ IMPORTANTE:');
    console.log('1. Supabase enviará un email a', email);
    console.log('2. El link en el email será único y de un solo uso');
    console.log('3. NO copies el link del email - Supabase lo mostrará en los logs si estás en modo dev');
    console.log('4. Usa: xcrun simctl openurl booted "LINK_AQUI"');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
};

testResetPassword();
