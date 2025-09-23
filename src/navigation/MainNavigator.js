import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';
import { Avatar } from 'react-native-paper';

import HomeScreen from '../screens/HomeScreen';
import DatabaseTestScreen from '../screens/DatabaseTestScreen';
import RecipesScreen from '../screens/RecipesScreen';
import AddRecipeScreen from '../screens/AddRecipeScreen';
import CameraRecipeScreen from '../screens/CameraRecipeScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import AdaptedRecipeScreen from '../screens/AdaptedRecipeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import ImportRecipeScreen from '../screens/recipe/ImportRecipeScreen';
import ConvertToPDFScreen from '../screens/recipe/ConvertToPDFScreen';
import ImportFileScreen from '../screens/ImportFileScreen';
import PasteRecipeScreen from '../screens/PasteRecipeScreen';
import AdaptationRequestScreen from '../screens/AdaptationRequestScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#4CAF50',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen
      name="HomeMain"
      component={HomeScreen}
      options={{ title: 'Inicio', headerShown: false }}
    />
    <Stack.Screen
      name="DatabaseTest"
      component={DatabaseTestScreen}
      options={{ title: 'Test de Base de Datos' }}
    />
    <Stack.Screen
      name="AdaptedRecipeScreen"
      component={AdaptedRecipeScreen}
      options={{ title: 'Recetas Adaptadas' }}
    />
    <Stack.Screen
      name="RecipeDetail"
      component={RecipeDetailScreen}
      options={{ title: 'Detalle de Receta' }}
    />
    <Stack.Screen
      name="Recipes"
      component={RecipesScreen}
      options={{ title: 'Mis Recetas' }}
    />
  </Stack.Navigator>
);

const RecipesStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#4CAF50',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="RecipesList" 
      component={RecipesScreen}
      options={{ title: 'Mis Recetas' }}
    />
    <Stack.Screen 
      name="RecipeDetail" 
      component={RecipeDetailScreen}
      options={{ title: 'Detalle de Receta' }}
    />
    <Stack.Screen 
      name="AdaptedRecipe" 
      component={AdaptedRecipeScreen}
      options={{ title: 'Receta Adaptada' }}
    />
  </Stack.Navigator>
);

const AddRecipeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#FF9800',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="AddRecipeForm" 
      component={AddRecipeScreen}
      options={{ title: 'Agregar Receta' }}
    />
    <Stack.Screen 
      name="CameraRecipe" 
      component={CameraRecipeScreen}
      options={{ title: 'Capturar con Cámara' }}
    />
    <Stack.Screen
      name="ImportRecipe"
      component={ImportRecipeScreen}
      options={{ title: 'Importar Receta' }}
    />
    <Stack.Screen
      name="ConvertToPDF"
      component={ConvertToPDFScreen}
      options={{ title: 'Convertir a PDF' }}
    />
    <Stack.Screen
      name="ImportFile"
      component={ImportFileScreen}
      options={{ title: 'Importar Archivo' }}
    />
    <Stack.Screen
      name="PasteRecipe"
      component={PasteRecipeScreen}
      options={{ title: 'Enviar desde Memoria' }}
    />
    <Stack.Screen
      name="AdaptationRequest"
      component={AdaptationRequestScreen}
      options={{ title: 'Adaptar Receta' }}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#2196F3',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="ProfileMain" 
      component={ProfileScreen}
      options={{ title: 'Mi Perfil' }}
    />
    <Stack.Screen 
      name="Preferences" 
      component={PreferencesScreen}
      options={{ title: 'Preferencias' }}
    />
  </Stack.Navigator>
);

const MainNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Recipes') {
            iconName = focused ? 'food-fork-drink' : 'food-fork-drink';
          } else if (route.name === 'AddRecipe') {
            iconName = focused ? 'plus-circle' : 'plus-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'cog' : 'cog-outline';
          }

          return <Avatar.Icon size={size} icon={iconName} style={{ backgroundColor: 'transparent' }} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen 
        name="Recipes" 
        component={RecipesStack}
        options={{ title: 'Recetas' }}
      />
      <Tab.Screen 
        name="AddRecipe" 
        component={AddRecipeStack}
        options={{ title: 'Agregar' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ title: 'Perfil' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Ajustes' }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
