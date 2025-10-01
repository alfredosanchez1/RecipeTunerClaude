import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';

import DatabaseInitializer from './src/components/DatabaseInitializer';
import { UserProvider } from './src/context/UserContext';
import { RecipeProvider } from './src/context/RecipeContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { StripeProvider } from '@stripe/stripe-react-native';
import MainNavigator from './src/navigation/MainNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';

// Stripe publishable key desde .env
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Configuración de deep linking
const linking = {
  prefixes: ['https://recipetunerclaude.onrender.com', 'recipetuner://'],
  config: {
    screens: {
      AuthNavigator: {
        screens: {
          Auth: 'auth',
          ResetPassword: {
            path: '',
            parse: {
              // Parsear access_token y type de query params
              access_token: (token) => token,
              type: (type) => type,
            },
          },
        },
      },
      MainNavigator: 'main',
    },
  },
  // Función para detectar si el deep link es de password recovery
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    if (url && (url.includes('type=recovery') || url.includes('access_token'))) {
      // Redirigir a ResetPassword automáticamente
      return url.replace('recipetuner://', 'recipetuner://ResetPassword');
    }
    return url;
  },
  subscribe(listener) {
    const onReceiveURL = ({ url }) => {
      if (url && (url.includes('type=recovery') || url.includes('access_token'))) {
        // Redirigir a ResetPassword automáticamente
        listener(url.replace('recipetuner://', 'recipetuner://ResetPassword'));
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
  console.log('🔥 APPCONTENT - Iniciando AppContent...');
  console.log('🔥🔥🔥 APPCONTENT - ESTE LOG DEBE APARECER SIEMPRE 🔥🔥🔥');
  const { isAuthenticated, loading, user, session } = useAuth();
  console.log('🔥 APPCONTENT - useAuth completado');

  // Manejar deep links de Supabase (password recovery)
  useEffect(() => {
    const handleDeepLink = async (event) => {
      const url = event.url;
      console.log('🔗 Deep link recibido:', url);

      // Extraer parámetros del URL
      // Supabase enviará recipetuner://?access_token=...&type=recovery
      if (url && (url.includes('type=recovery') || url.includes('access_token'))) {
        console.log('🔐 Link de recuperación de contraseña detectado');
        // El NavigationContainer manejará la navegación automáticamente
      }
    };

    // Escuchar deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Verificar si la app se abrió con un deep link
    Linking.getInitialURL().then(url => {
      if (url) {
        console.log('🔗 App abierta con URL:', url);
        handleDeepLink({ url });
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
  console.log('💡 APP DEBUG - SESION PERSISTENTE DETECTADA, AGREGAR LOGOUT MANUAL');

  if (loading) {
    console.log('⏳ APP - Showing loading screen');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  console.log('🚀 APP - Rendering:', isAuthenticated ? 'MainNavigator' : 'AuthScreen');

  return (
    <NavigationContainer linking={linking}>
      <StatusBar style="auto" />
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default function App() {
  console.log('🚀🚀🚀 APP MAIN - INICIANDO APP.JS');

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