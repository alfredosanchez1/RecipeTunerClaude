/**
 * Script de prueba para verificar la conexión con RecipeTuner API
 */

const BACKEND_URL = 'https://recipetuner-api.onrender.com';

// Función para probar el health check
async function testHealthCheck() {
  try {
    console.log('🔍 Probando health check...');
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();
    console.log('✅ Health Check:', data);
    return true;
  } catch (error) {
    console.error('❌ Error en health check:', error);
    return false;
  }
}

// Función para probar endpoints Stripe (requieren autenticación)
async function testStripeEndpoints() {
  console.log('🔍 Probando endpoints de Stripe...');

  const endpoints = [
    '/create-payment-intent',
    '/create-subscription',
    '/cancel-subscription',
    '/update-payment-method'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true })
      });

      console.log(`${endpoint}: Status ${response.status}`);

      if (response.status === 401) {
        console.log('✅ Endpoint disponible (requiere autenticación)');
      } else if (response.status === 400) {
        console.log('✅ Endpoint disponible (parámetros incorrectos)');
      } else {
        const text = await response.text();
        console.log('Response:', text);
      }
    } catch (error) {
      console.error(`❌ Error en ${endpoint}:`, error.message);
    }
  }
}

// Ejecutar pruebas
async function runTests() {
  console.log('🚀 Iniciando pruebas de conexión con CaloriasAPI...');
  console.log('📍 URL:', BACKEND_URL);
  console.log('');

  const healthOk = await testHealthCheck();
  console.log('');

  if (healthOk) {
    await testStripeEndpoints();
  } else {
    console.log('❌ No se puede continuar con las pruebas, servidor no responde');
  }

  console.log('');
  console.log('🏁 Pruebas completadas');
}

// Ejecutar si es llamado directamente
if (typeof window === 'undefined') {
  runTests();
}

export { testHealthCheck, testStripeEndpoints, runTests };