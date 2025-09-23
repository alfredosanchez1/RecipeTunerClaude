import 'react-native-get-random-values';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

import DatabaseInitializer from './src/components/DatabaseInitializer';
import { UserProvider } from './src/context/UserContext';
import { RecipeProvider } from './src/context/RecipeContext';
import MainNavigator from './src/navigation/MainNavigator';

export default function App() {
  console.log('🚀 APP - Cargando sin tema personalizado');

  return (
    <PaperProvider>
      <DatabaseInitializer>
        <UserProvider>
          <RecipeProvider>
            <NavigationContainer>
              <StatusBar style="auto" />
              <MainNavigator />
            </NavigationContainer>
          </RecipeProvider>
        </UserProvider>
      </DatabaseInitializer>
    </PaperProvider>
  );
}