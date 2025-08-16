import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import { RecipeProvider } from './src/context/RecipeContext';
import { UserProvider } from './src/context/UserContext';

import MainNavigator from './src/navigation/MainNavigator';
import CustomDrawerContent from './src/components/CustomDrawerContent';

const Drawer = createDrawerNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider>
        <UserProvider>
          <RecipeProvider>
            <NavigationContainer>
              <StatusBar style="auto" />
              <Drawer.Navigator
                drawerContent={(props) => <CustomDrawerContent {...props} />}
                screenOptions={{
                  headerShown: false,
                  drawerStyle: {
                    backgroundColor: '#f8f9fa',
                    width: 280,
                  },
                }}
              >
                <Drawer.Screen 
                  name="Main" 
                  component={MainNavigator}
                  options={{
                    title: 'RecipeTunnel Claude',
                  }}
                />
              </Drawer.Navigator>
            </NavigationContainer>
          </RecipeProvider>
        </UserProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
