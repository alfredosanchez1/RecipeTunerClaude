// src/navigation/AppNavigator.js
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="MyRecipes" component={MyRecipesScreen} />
    <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
    <Stack.Screen name="Adaptation" component={AdaptationScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName = getTabBarIcon(route.name, focused);
        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#10B981',
      tabBarInactiveTintColor: 'gray',
    })}
  >
    <Tab.Screen name="Home" component={HomeStack} options={{ title: 'Recetas' }} />
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