// src/navigation/AppNavigator.js
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Importar las pantallas
import WelcomeScreen from '../screens/OnboardingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MyRecipesScreen from '../screens/recipe/MyRecipesScreen';
import RecipeDetailScreen from '../screens/recipe/RecipeDetailScreen';
import AdaptationScreen from '../screens/adaptation/AdaptationScreen';
import UploadRecipeScreen from '../screens/recipe/UploadRecipeScreen';
import ImportRecipeScreen from '../screens/recipe/ImportRecipeScreen';
import NutritionDashboardScreen from '../screens/nutrition/NutritionDashboardScreen';
import ShoppingListScreen from '../screens/shopping/ShoppingListScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Función para obtener iconos de las tabs
const getTabBarIcon = (routeName, focused) => {
  let iconName;
  
  switch (routeName) {
    case 'Home':
      iconName = focused ? 'home' : 'home-outline';
      break;
    case 'Import':
      iconName = focused ? 'download' : 'download-outline';
      break;
    case 'Upload':
      iconName = focused ? 'add-circle' : 'add-circle-outline';
      break;
    case 'Nutrition':
      iconName = focused ? 'nutrition' : 'nutrition-outline';
      break;
    case 'Shopping':
      iconName = focused ? 'cart' : 'cart-outline';
      break;
    case 'Settings':
      iconName = focused ? 'settings' : 'settings-outline';
      break;
    default:
      iconName = 'help-outline';
  }
  
  return iconName;
};

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="MyRecipes" component={MyRecipesScreen} />
    <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
    <Stack.Screen name="Adaptation" component={AdaptationScreen} />
    <Stack.Screen name="ImportRecipe" component={ImportRecipeScreen} options={{ title: 'Importar Receta' }} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName = getTabBarIcon(route.name, focused);
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#10B981',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="Home" component={HomeStack} options={{ title: 'Recetas' }} />
    <Tab.Screen name="Import" component={ImportRecipeScreen} options={{ title: 'Importar' }} />
    <Tab.Screen name="Upload" component={UploadRecipeScreen} options={{ title: 'Subir' }} />
    <Tab.Screen name="Nutrition" component={NutritionDashboardScreen} options={{ title: 'Nutrición' }} />
    <Tab.Screen name="Shopping" component={ShoppingListScreen} options={{ title: 'Compras' }} />
    <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ajustes' }} />
  </Tab.Navigator>
);

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome">
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ title: 'Configurar Perfil' }} 
        />
        <Stack.Screen 
          name="Main" 
          component={MainTabs} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}