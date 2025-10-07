import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';

import DatabaseInitializer from './src/components/DatabaseInitializer';
import { UserProvider } from './src/context/UserContext';
import { RecipeProvider } from './src/context/RecipeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import MainNavigator from './src/navigation/MainNavigator';
import AuthScreen from './src/screens/AuthScreen';

// Componente interno que usa el contexto de autenticación
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {isAuthenticated ? <MainNavigator /> : <AuthScreen />}
    </NavigationContainer>
  );
};

export default function App() {
  console.log('🚀 APP - Cargando con autenticación Supabase');

  return (
    <PaperProvider>
      <DatabaseInitializer>
        <AuthProvider>
          <UserProvider>
            <RecipeProvider>
              <AppContent />
            </RecipeProvider>
          </UserProvider>
        </AuthProvider>
      </DatabaseInitializer>
    </PaperProvider>
  );
}