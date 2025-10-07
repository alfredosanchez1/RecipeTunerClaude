import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Alert,
  BackHandler,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useUser } from '../context/UserContext';
import { useRecipe } from '../context/RecipeContext';
import { useAuth } from '../context/AuthContext';
import QuickStats from '../components/QuickStats';
import DatabaseTestComponent from '../components/DatabaseTestComponent';
import debugSecureStoreDatabase from '../utils/debugRealm';
import { debugRealmPersistence, testRealPersistence } from '../utils/debugRealmPersistence';


const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const theme = useTheme();
  const { user, preferences, isOnboardingComplete } = useUser();
  const { recipes, adaptedRecipes, isLoading, deleteRecipe } = useRecipe();
  const { signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  // Debug SecureStore Database al cargar
  // DESHABILITADO: Causaba error "unordered_map::at: key not found" en Realm
  // useEffect(() => {
  //   debugSecureStoreDatabase();
  // }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Ejecutar debug al refrescar también
    // DESHABILITADO: Causaba error en Realm
    // const debugResult = await debugSecureStoreDatabase();
    // setDebugInfo(debugResult);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAddRecipe = () => {
    navigation.navigate('AddRecipe');
  };

  const handleViewRecipes = () => {
    console.log('🏠 HOME SCREEN - handleViewRecipes called, navigating with filter: original');
    navigation.navigate('Recipes', { filter: 'original', hideAdaptButton: true });
  };

  const handleViewAdaptedRecipes = () => {
    console.log('🏠 HOME SCREEN - handleViewAdaptedRecipes called, navigating to AdaptedRecipeScreen');
    navigation.navigate('AdaptedRecipeScreen');
  };

  const handleViewProfile = () => {
    navigation.navigate('Profile');
  };



  const handleTestDatabase = () => {
    navigation.navigate('DatabaseTest');
  };

  const handleDebugRecipes = async () => {
    console.log('🔍 DEBUG - Checking all recipes...');
    console.log('📊 Total recipes:', recipes.length);

    recipes.forEach((recipe, index) => {
      console.log(`Recipe ${index + 1}:`);
      console.log(`  Title: ${recipe.title}`);
      console.log(`  isAdapted: ${recipe.isAdapted}`);
      console.log(`  adapted: ${recipe.adapted}`);
      console.log(`  ID: ${recipe.id}`);
      console.log('---');
    });

    Alert.alert(
      'Debug Recipes',
      `Total: ${recipes.length}\nAdaptadas: ${recipes.filter(r => r.isAdapted).length}\nOriginales: ${recipes.filter(r => !r.isAdapted).length}\n\nRev logs para detalles`
    );
  };

  const handleClearDatabase = async () => {
    Alert.alert(
      'Limpiar Base de Datos',
      '¿Estás seguro? Esto eliminará TODAS las recetas y empezará de cero.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, limpiar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Iniciando limpieza de base de datos...');

              // Método más simple: eliminar una por una usando el contexto
              if (recipes && recipes.length > 0) {
                console.log(`🗑️ Eliminando ${recipes.length} recetas via contexto...`);

                const recipeIds = recipes.map(r => r.id);
                let deletedCount = 0;

                for (const recipeId of recipeIds) {
                  try {
                    await deleteRecipe(recipeId);
                    deletedCount++;
                    console.log(`✅ Eliminada receta ${deletedCount}/${recipeIds.length}`);
                  } catch (err) {
                    console.error(`❌ Error eliminando receta ${recipeId}:`, err);
                  }
                }

                console.log(`✅ Eliminadas ${deletedCount} de ${recipeIds.length} recetas`);
                Alert.alert('Éxito', `Se eliminaron ${deletedCount} recetas. Pull to refresh para actualizar.`);
              } else {
                Alert.alert('Info', 'No hay recetas para eliminar.');
              }

            } catch (error) {
              console.error('❌ Error limpiando base de datos:', error);
              Alert.alert(
                'Error al limpiar',
                `Error: ${error.message || error}\n\nDetalles en consola.`
              );
            }
          }
        }
      ]
    );
  };

  if (!isOnboardingComplete) {
    return (
      <SafeAreaView style={styles.onboardingContainer}>
        <Icon name="chef-hat" size={80} color={theme.colors.primary} />
        <Title style={styles.onboardingTitle}>¡Bienvenido a RecipeTuner!</Title>
        <Paragraph style={styles.onboardingText}>
          Personaliza tus recetas con inteligencia artificial según tus necesidades dietéticas
        </Paragraph>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Profile', { screen: 'Preferences' })}
          style={styles.onboardingButton}
        >
          Comenzar Configuración
        </Button>
        
        <Button
          mode="outlined"
          onPress={async () => {
            console.log('🧪 INICIANDO TEST DE PERSISTENCIA REAL...');
            const result = await testRealPersistence();
            Alert.alert('Test Persistencia Real',
              `Éxito: ${result.success ? '✅' : '❌'}\n` +
              `Receta: ${result.recipePersisted ? '✅' : '❌'}\n` +
              `Preferencias: ${result.prefsPersisted ? '✅' : '❌'}\n` +
              `Path: ${result.realmPath || 'N/A'}`
            );
          }}
          style={[styles.onboardingButton, { marginTop: 10 }]}
        >
          🧪 Test Persistencia Real
        </Button>

        <Button
          mode="outlined"
          onPress={async () => {
            console.log('🔍 DEBUG REALM PERSISTENCE...');
            const result = await debugRealmPersistence();
            Alert.alert('Debug Realm', JSON.stringify(result, null, 2));
          }}
          style={[styles.onboardingButton, { marginTop: 5 }]}
        >
          🔍 Debug Realm Files
        </Button>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Cargando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Title style={styles.welcomeTitle}>
            ¡Hola {user?.name || 'Chef'}! 👨‍🍳
          </Title>
          <Paragraph style={styles.welcomeSubtitle}>
            ¿Qué vamos a cocinar hoy?
          </Paragraph>
        </View>
        <Icon name="chef-hat" size={50} color={theme.colors.primary} />
      </View>

      {/* Main Action Buttons - 2 botones principales en la parte superior */}
      <View style={styles.topActions}>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionCard} onPress={handleAddRecipe}>
            <View style={styles.actionContent}>
              <Icon name="plus-circle" size={40} color="#FF9800" />
              <Title style={styles.actionTitle}>Nueva Receta</Title>
              <Paragraph style={styles.actionSubtitle}>Crear receta personal</Paragraph>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Profile', { screen: 'Preferences' })}>
            <View style={styles.actionContent}>
              <Icon name="cog" size={40} color="#9C27B0" />
              <Title style={styles.actionTitle}>Mis Preferencias</Title>
              <Paragraph style={styles.actionSubtitle}>Configurar necesidades</Paragraph>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats */}
      <QuickStats
        totalRecipes={recipes.length}
        adaptedRecipes={adaptedRecipes.length}
        preferences={preferences}
        onViewRecipes={handleViewRecipes}
        onViewAdaptedRecipes={handleViewAdaptedRecipes}
      />

      {/* Debug Info Panel */}
      {debugInfo && (
        <Card style={styles.debugCard}>
          <Card.Content>
            <Title style={styles.debugTitle}>🔍 Debug Info (Pull to refresh)</Title>
            <Text style={styles.debugText}>
              Initialized: {debugInfo.initialized ? '✅' : '❌'}{'\n'}
              Has existing data: {debugInfo.hasExistingData ? '✅' : '❌'}{'\n'}
              Save worked: {debugInfo.saveWorked ? '✅' : '❌'}{'\n'}
              Retrieve worked: {debugInfo.retrieveWorked ? '✅' : '❌'}{'\n'}
              Data matches: {debugInfo.dataMatches ? '✅' : '❌'}{'\n'}
              {'\n'}
              Current preferences:{'\n'}
              • Dietary: {preferences.dietaryRestrictions?.length || 0} items{'\n'}
              • Allergies: {preferences.allergies?.length || 0} items{'\n'}
              • Onboarding: {isOnboardingComplete ? '✅ Complete' : '❌ Pending'}
            </Text>
          </Card.Content>
        </Card>
      )}



      

      {/* Empty State */}
      {recipes.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="food-off" size={80} color="#ccc" />
          <Title style={styles.emptyTitle}>No hay recetas aún</Title>
          <Paragraph style={styles.emptyText}>
            Comienza agregando tu primera receta y descubre cómo la IA puede adaptarla
          </Paragraph>
          <Button
            mode="contained"
            onPress={handleAddRecipe}
            style={styles.emptyButton}
          >
            Agregar Receta
          </Button>
        </View>
      )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onboardingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  onboardingTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  onboardingText: {
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  onboardingButton: {
    paddingHorizontal: 30,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 24,
    marginBottom: 5,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 22,
  },
  topActions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mainActions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  testActions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 15,
  },
  actionCard: {
    flex: 1,
    elevation: 2,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  actionContent: {
    alignItems: 'center',
    padding: 20,
    minHeight: 100,
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 6,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 20,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
    color: '#1F2937',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 30,
    color: '#4B5563',
    lineHeight: 22,
  },
  emptyButton: {
    paddingHorizontal: 30,
  },
  exitSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginTop: 20,
    alignItems: 'center',
  },
  exitButton: {
    borderColor: '#DC2626',
    borderWidth: 1,
    minWidth: 200,
    paddingVertical: 8,
  },
  debugCard: {
    margin: 20,
    backgroundColor: '#FFF8E1',
    borderColor: '#FF9800',
    borderWidth: 1,
  },
  debugTitle: {
    fontSize: 16,
    color: '#E65100',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#BF360C',
    fontFamily: 'monospace',
  },
});

export default HomeScreen;
