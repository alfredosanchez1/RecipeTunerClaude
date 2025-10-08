import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
// Polyfill para WebCrypto API (necesario para PKCE en Supabase)
import * as Crypto from 'expo-crypto';
if (!global.crypto) {
  global.crypto = Crypto;
}
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text } from 'react-native';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

import DatabaseInitializer from './src/components/DatabaseInitializer';
import { UserProvider } from './src/context/UserContext';
import { RecipeProvider } from './src/context/RecipeContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { StripeProvider } from '@stripe/stripe-react-native';
import MainNavigator from './src/navigation/MainNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import BiometricService from './src/services/BiometricService';
import { logInfo, LOG_CATEGORIES } from './src/services/logger';

// Stripe publishable key desde .env
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Configuración de deep linking y Universal Links
const linking = {
  prefixes: [
    'https://recipetunerclaude.onrender.com',
    'https://ipuqtmdljfirpbaxvygd.supabase.co',
    'recipetuner://'
  ],
  config: {
    screens: {
      Auth: {
        path: 'auth',
        screens: {
          Auth: 'login',
          ResetPassword: 'reset-password',
        },
      },
      Main: 'main',
    },
  },
  // Dejar que React Navigation maneje los URLs directamente
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    console.log('🔗 LINKING - getInitialURL:', url);

    // Si es link de Supabase, convertir
    if (url && url.includes('type=recovery')) {
      return 'recipetuner://auth/reset-password';
    }

    return url;
  },
  subscribe(listener) {
    const onReceiveURL = ({ url }) => {
      console.log('🔗 LINKING - URL recibida:', url);

      // Si es link de Supabase, convertir
      if (url && url.includes('type=recovery')) {
        listener('recipetuner://auth/reset-password');
      } else {
        listener(url);
      }
    };

    const subscription = Linking.addEventListener('url', onReceiveURL);
    return () => subscription.remove();
  },
};

// Componente interno que usa el contexto de autenticación
const AppContent = () => {
  console.log('===============================================');
  console.log('🔥 APPCONTENT - Iniciando AppContent...');
  console.log('🔥🔥🔥 APPCONTENT - ESTE LOG DEBE APARECER SIEMPRE 🔥🔥🔥');
  console.log('===============================================');
  const { isAuthenticated, loading, user, session } = useAuth();
  console.log('🔥 APPCONTENT - useAuth completado');

  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [debugUrl, setDebugUrl] = useState('Esperando deep link...');
  const [recoveryUrl, setRecoveryUrl] = useState(null);
  const [showBiometricLock, setShowBiometricLock] = useState(false);
  const [biometricCheckComplete, setBiometricCheckComplete] = useState(false);
  const [biometricVerified, setBiometricVerified] = useState(false);

  // Verificar si debe mostrar biometric lock al iniciar
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        // Si el usuario no está autenticado, limpiar flag
        if (!isAuthenticated) {
          await AsyncStorage.removeItem('biometric_verified_session');
          setBiometricVerified(false);
          setShowBiometricLock(false);
          setBiometricCheckComplete(true);
          return;
        }

        const biometricEnabled = await BiometricService.isBiometricEnabled();
        const verifiedSession = await AsyncStorage.getItem('biometric_verified_session');

        console.log('🔐 APP - Biometría habilitada:', biometricEnabled);
        console.log('🔐 APP - isAuthenticated:', isAuthenticated);
        console.log('🔐 APP - Sesión biométrica verificada:', verifiedSession === 'true');

        // Actualizar estado de biometricVerified basado en AsyncStorage
        if (verifiedSession === 'true') {
          setBiometricVerified(true);
        } else {
          setBiometricVerified(false);
        }

        // Solo mostrar biometric lock si:
        // 1. Biometría está habilitada
        // 2. El usuario está autenticado
        // 3. NO es un flujo de password recovery
        // 4. NO ha sido verificada en esta sesión
        if (biometricEnabled && isAuthenticated && !isPasswordRecovery && verifiedSession !== 'true') {
          console.log('🔐 APP - Mostrando BiometricLockScreen');
          setShowBiometricLock(true);
        } else {
          console.log('🔐 APP - NO mostrando BiometricLockScreen');
          setShowBiometricLock(false);
        }
      } catch (error) {
        console.error('❌ APP - Error verificando biometría:', error);
      } finally {
        setBiometricCheckComplete(true);
      }
    };

    if (!loading) {
      checkBiometric();
    }
  }, [loading, isAuthenticated, isPasswordRecovery, session]);

  // Detectar si es un flujo de password recovery
  useEffect(() => {
    const checkPasswordRecovery = async () => {
      const url = await Linking.getInitialURL();
      console.log('🔍 APPCONTENT - Verificando URL inicial:', url);
      setDebugUrl(`Initial URL: ${url || 'null'}`);

      if (url && url.includes('type=recovery')) {
        console.log('🔐 APPCONTENT - Flujo de password recovery detectado');
        console.log('💾 APPCONTENT - Guardando URL de recovery:', url);
        setRecoveryUrl(url); // Guardar el URL
        setIsPasswordRecovery(true);

        // Auto-limpiar el estado después de 10 segundos
        setTimeout(() => {
          console.log('⏰ APPCONTENT - Limpiando estado de password recovery después de timeout (inicial)');
          setIsPasswordRecovery(false);
          setRecoveryUrl(null);
        }, 10000);
      }
    };

    checkPasswordRecovery();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('🔍 APPCONTENT - URL recibida:', url);
      setDebugUrl(`Deep link recibido: ${url}`);

      // Detectar si es reset-password O type=recovery
      if (url && (url.includes('reset-password') || url.includes('type=recovery'))) {
        console.log('🔐 APPCONTENT - Flujo de password recovery detectado');
        console.log('💾 APPCONTENT - Guardando URL de recovery:', url);
        setDebugUrl(`Deep link recibido: ${url} - RECOVERY DETECTED!`);
        setRecoveryUrl(url); // Guardar el URL
        setIsPasswordRecovery(true);

        // Auto-limpiar el estado después de 10 segundos (el usuario debería haber completado el reset)
        setTimeout(() => {
          console.log('⏰ APPCONTENT - Limpiando estado de password recovery después de timeout');
          setIsPasswordRecovery(false);
          setRecoveryUrl(null);
        }, 10000);
      }
    });

    return () => subscription.remove();
  }, []);

  // Debug logging
  console.log('🔍 APP DEBUG - isAuthenticated:', isAuthenticated);
  console.log('🔍 APP DEBUG - loading:', loading);
  console.log('🔍 APP DEBUG - user exists:', !!user);
  console.log('🔍 APP DEBUG - user email:', user?.email);
  console.log('🔍 APP DEBUG - user email_confirmed_at:', user?.email_confirmed_at);
  console.log('🔍 APP DEBUG - session exists:', !!session);
  console.log('🔍 APP DEBUG - isPasswordRecovery:', isPasswordRecovery);
  console.log('🔍 APP DEBUG - debugUrl:', debugUrl);
  console.log('💡 APP DEBUG - SESION PERSISTENTE DETECTADA, AGREGAR LOGOUT MANUAL');

  if (loading || !biometricCheckComplete) {
    console.log('⏳ APP - Showing loading screen');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  // Si debe mostrar biometric lock, mostrarlo
  if (showBiometricLock && isAuthenticated && !isPasswordRecovery) {
    console.log('🔐 APP - Mostrando BiometricLockScreen');
    return (
      <NavigationContainer linking={linking}>
        <StatusBar style="auto" />
        <AuthNavigator
          isPasswordRecovery={false}
          recoveryUrl={null}
          initialRouteName="BiometricLock"
        />
      </NavigationContainer>
    );
  }

  // Si es password recovery, siempre mostrar AuthNavigator (incluso si está autenticado)
  const shouldShowAuth = !isAuthenticated || isPasswordRecovery;

  console.log('🚀 APP - Rendering:', shouldShowAuth ? 'AuthNavigator' : 'MainNavigator');

  return (
    <NavigationContainer linking={linking}>
      <StatusBar style="auto" />
      {/* Banner de debug para ver deep links - COMENTADO TEMPORALMENTE */}
      {/* <View style={{
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 0, 0, 0.9)',
        padding: 15,
        zIndex: 9999
      }}>
        <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
          🔗 DEBUG: {debugUrl}
        </Text>
      </View> */}
      {shouldShowAuth ? <AuthNavigator isPasswordRecovery={isPasswordRecovery} recoveryUrl={recoveryUrl} /> : <MainNavigator />}
    </NavigationContainer>
  );
};

export default function App() {
  console.log('🚀🚀🚀 APP MAIN - INICIANDO APP.JS');

  // VERIFICAR API KEY AL INICIAR LA APP
  const Constants = require('expo-constants').default;
  const apiKeyFromConfig = Constants.expoConfig?.extra?.openaiApiKey;
  const apiKeyFromEnv = process.env.OPENAI_API_KEY;

  console.log('═══════════════════════════════════════════════════════');
  console.log('🔑🔑🔑 API KEY DEBUG - INICIO DE APP 🔑🔑🔑');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📦 Constants.expoConfig?.extra?.openaiApiKey:', apiKeyFromConfig ? `PRESENTE (${apiKeyFromConfig.substring(0, 15)}...)` : '❌ NO DISPONIBLE');
  console.log('🌍 process.env.OPENAI_API_KEY:', apiKeyFromEnv ? `PRESENTE (${apiKeyFromEnv.substring(0, 15)}...)` : '❌ NO DISPONIBLE');
  console.log('═══════════════════════════════════════════════════════');

  // Guardar en logs de debug
  logInfo(LOG_CATEGORIES.API, 'App iniciada - Verificación de API Keys', {
    configKeyPresent: !!apiKeyFromConfig,
    envKeyPresent: !!apiKeyFromEnv,
    configKeyPrefix: apiKeyFromConfig ? apiKeyFromConfig.substring(0, 10) : 'N/A',
    envKeyPrefix: apiKeyFromEnv ? apiKeyFromEnv.substring(0, 10) : 'N/A',
  });

  return (
    <PaperProvider>
      <StripeProvider
        publishableKey={STRIPE_PUBLISHABLE_KEY}
        merchantIdentifier="merchant.com.recipetuner"
      >
        <DatabaseInitializer>
          <AuthProvider>
            <SubscriptionProvider>
              <UserProvider>
                <RecipeProvider>
                  <AppContent />
                </RecipeProvider>
              </UserProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </DatabaseInitializer>
      </StripeProvider>
    </PaperProvider>
  );
}