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
import RecipeCard from '../components/RecipeCard';
import QuickStats from '../components/QuickStats';
import AIAdaptationCard from '../components/AIAdaptationCard';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const theme = useTheme();
  const { user, preferences, isOnboardingComplete } = useUser();
  const { recipes, adaptedRecipes, isLoading, getFilteredRecipes } = useRecipe();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simular recarga de datos
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleQuickAdapt = () => {
    if (recipes.length > 0) {
      const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
      navigation.navigate('Recipes', {
        screen: 'RecipeDetail',
        params: { recipe: randomRecipe },
      });
    }
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

  const recentRecipes = recipes.slice(0, 3);
  const recentAdapted = adaptedRecipes.slice(0, 2);

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

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Card style={styles.actionCard} onPress={handleAddRecipe}>
          <Card.Content style={styles.actionContent}>
            <Icon name="plus-circle" size={40} color="#FF9800" />
            <Title style={styles.actionTitle}>Nueva Receta</Title>
            <Paragraph>Agregar receta personal</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.actionCard} onPress={handleQuickAdapt}>
          <Card.Content style={styles.actionContent}>
            <Icon name="robot" size={40} color="#4CAF50" />
            <Title style={styles.actionTitle}>Adaptar con IA</Title>
            <Paragraph>Adaptar receta existente</Paragraph>
          </Card.Content>
        </Card>
      </View>

      {/* Quick Stats */}
      <QuickStats
        totalRecipes={recipes.length}
        adaptedRecipes={adaptedRecipes.length}
        preferences={preferences}
      />

      {/* AI Adaptation Card */}
      <AIAdaptationCard
        onPress={() => navigation.navigate('Recipes')}
        preferences={preferences}
      />

      {/* Recent Recipes */}
      {recentRecipes.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Recetas Recientes</Title>
            <Button
              mode="text"
              onPress={handleViewRecipes}
              textColor={theme.colors.primary}
            >
              Ver todas
            </Button>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onPress={() =>
                  navigation.navigate('Recipes', {
                    screen: 'RecipeDetail',
                    params: { recipe },
                  })
                }
                style={styles.recipeCard}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recent Adaptations */}
      {recentAdapted.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Adaptaciones Recientes</Title>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Recipes')}
              textColor={theme.colors.primary}
            >
              Ver todas
            </Button>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentAdapted.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isAdapted={true}
                onPress={() =>
                  navigation.navigate('Recipes', {
                    screen: 'AdaptedRecipe',
                    params: { recipe },
                  })
                }
                style={styles.recipeCard}
              />
            ))}
          </ScrollView>
        </View>
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
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 15,
  },
  actionCard: {
    flex: 1,
    elevation: 2,
  },
  actionContent: {
    alignItems: 'center',
    padding: 15,
  },
  actionTitle: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
    color: '#1F2937',
    fontWeight: '600',
  },
  section: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '600',
  },
  recipeCard: {
    width: width * 0.7,
    marginRight: 15,
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
