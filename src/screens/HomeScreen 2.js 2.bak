import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useUser } from '../context/UserContext';
import { useRecipe } from '../context/RecipeContext';
import QuickStats from '../components/QuickStats';


const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const theme = useTheme();
  const { user, preferences, isOnboardingComplete } = useUser();
  const { recipes, adaptedRecipes, isLoading } = useRecipe();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simular recarga de datos
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAddRecipe = () => {
    navigation.navigate('AddRecipe');
  };

  const handleViewRecipes = () => {
    navigation.navigate('Recipes');
  };

  const handleViewProfile = () => {
    navigation.navigate('Profile');
  };

  const handleShoppingList = () => {
    navigation.navigate('ShoppingList');
  };

  if (!isOnboardingComplete) {
    return (
      <View style={styles.onboardingContainer}>
        <Icon name="chef-hat" size={80} color={theme.colors.primary} />
        <Title style={styles.onboardingTitle}>¡Bienvenido a RecipeTunnel Claude!</Title>
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
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
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
          <Card style={styles.actionCard} onPress={handleAddRecipe}>
            <Card.Content style={styles.actionContent}>
              <Icon name="plus-circle" size={40} color="#FF9800" />
              <Title style={styles.actionTitle}>Nueva Receta</Title>
              <Paragraph style={styles.actionSubtitle}>Crear receta personal</Paragraph>
            </Card.Content>
          </Card>

          <Card style={styles.actionCard} onPress={() => navigation.navigate('Profile', { screen: 'Preferences' })}>
            <Card.Content style={styles.actionContent}>
              <Icon name="cog" size={40} color="#9C27B0" />
              <Title style={styles.actionTitle}>Mis Preferencias</Title>
              <Paragraph style={styles.actionSubtitle}>Configurar necesidades</Paragraph>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Quick Stats */}
      <QuickStats
        totalRecipes={recipes.length}
        adaptedRecipes={adaptedRecipes.length}
        preferences={preferences}
      />

      {/* Single Action Button - Solo Lista de Compras */}
      <View style={styles.mainActions}>
        <View style={styles.actionRow}>
          <Card style={styles.actionCard} onPress={handleShoppingList}>
            <Card.Content style={styles.actionContent}>
              <Icon name="cart" size={40} color="#FF5722" />
              <Title style={styles.actionTitle}>Lista de Compras</Title>
              <Paragraph style={styles.actionSubtitle}>Gestionar ingredientes</Paragraph>
            </Card.Content>
          </Card>
        </View>
      </View>

      

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
            Agregar Primera Receta
          </Button>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
    minHeight: 120,
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
    minHeight: 120,
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
});

export default HomeScreen;
