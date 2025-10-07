import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RecipeListOrganized = ({ recipes, onRecipePress, title = 'Recetas Encontradas' }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const getCategoryIcon = (category) => {
    const iconMap = {
      'principal': 'restaurant-outline',
      'entrada': 'cafe-outline',
      'postre': 'ice-cream-outline',
      'bebida': 'wine-outline',
      'ensalada': 'leaf-outline',
      'sopa': 'water-outline',
      'pasta': 'nutrition-outline',
      'carne': 'flame-outline',
      'pollo': 'egg-outline',
      'pescado': 'fish-outline',
      'vegetariano': 'flower-outline',
      'pan': 'pizza-outline',
      'arroz': 'ellipse-outline',
      'otros': 'restaurant-outline'
    };
    return iconMap[category] || 'restaurant-outline';
  };

  const getRecipeIcon = (recipeTitle) => {
    const title = recipeTitle.toLowerCase();

    // Íconos específicos por ingrediente principal
    if (title.includes('pollo') || title.includes('chicken') || title.includes('gallina')) return 'egg-outline';
    if (title.includes('carne') || title.includes('beef') || title.includes('res') || title.includes('bistec') || title.includes('churrasco')) return 'flame-outline';
    if (title.includes('cerdo') || title.includes('pork') || title.includes('jamón') || title.includes('tocino') || title.includes('bacon')) return 'flame-outline';
    if (title.includes('pescado') || title.includes('fish') || title.includes('salmón') || title.includes('atún') || title.includes('bacalao') || title.includes('merluza')) return 'fish-outline';
    if (title.includes('camarón') || title.includes('langosta') || title.includes('mariscos') || title.includes('mejillones') || title.includes('almejas')) return 'fish-outline';

    // Íconos por tipo de preparación
    if (title.includes('pasta') || title.includes('espagueti') || title.includes('macarrones') || title.includes('lasaña') || title.includes('ravioli') || title.includes('fettuccine')) return 'nutrition-outline';
    if (title.includes('ensalada') || title.includes('salad') || title.includes('lechuga') || title.includes('verduras')) return 'leaf-outline';
    if (title.includes('sopa') || title.includes('soup') || title.includes('caldo') || title.includes('crema') || title.includes('consomé') || title.includes('gazpacho')) return 'water-outline';
    if (title.includes('arroz') || title.includes('rice') || title.includes('paella') || title.includes('risotto') || title.includes('pilaf')) return 'ellipse-outline';

    // Íconos por categoría de comida
    if (title.includes('pizza') || title.includes('calzone')) return 'pizza-outline';
    if (title.includes('pan') || title.includes('bread') || title.includes('sandwich') || title.includes('bocadillo') || title.includes('tostada') || title.includes('bagel')) return 'cafe-outline';
    if (title.includes('hamburguesa') || title.includes('burger') || title.includes('hot dog')) return 'cafe-outline';

    // Postres y dulces
    if (title.includes('postre') || title.includes('dessert') || title.includes('torta') || title.includes('pastel') || title.includes('cake')) return 'ice-cream-outline';
    if (title.includes('helado') || title.includes('ice cream') || title.includes('gelato') || title.includes('sorbete')) return 'ice-cream-outline';
    if (title.includes('chocolate') || title.includes('brownie') || title.includes('cookie') || title.includes('galleta')) return 'ice-cream-outline';
    if (title.includes('flan') || title.includes('pudín') || title.includes('mousse') || title.includes('tiramisu')) return 'ice-cream-outline';

    // Bebidas
    if (title.includes('bebida') || title.includes('drink') || title.includes('jugo') || title.includes('smoothie') || title.includes('batido')) return 'wine-outline';
    if (title.includes('café') || title.includes('coffee') || title.includes('té') || title.includes('tea') || title.includes('chai')) return 'cafe-outline';
    if (title.includes('cocktail') || title.includes('cóctel') || title.includes('mojito') || title.includes('margarita')) return 'wine-outline';

    // Comidas internacionales
    if (title.includes('taco') || title.includes('burrito') || title.includes('quesadilla') || title.includes('enchilada') || title.includes('nachos')) return 'restaurant-outline';
    if (title.includes('sushi') || title.includes('ramen') || title.includes('tempura') || title.includes('miso') || title.includes('udon')) return 'restaurant-outline';
    if (title.includes('curry') || title.includes('tikka') || title.includes('tandoori') || title.includes('biryani') || title.includes('naan')) return 'restaurant-outline';
    if (title.includes('pad thai') || title.includes('pho') || title.includes('spring roll') || title.includes('tom yum')) return 'restaurant-outline';

    // Vegetariano/Vegano
    if (title.includes('vegetariano') || title.includes('vegano') || title.includes('vegan') || title.includes('quinoa') || title.includes('tofu') || title.includes('tempeh')) return 'flower-outline';

    // Desayunos
    if (title.includes('pancake') || title.includes('waffle') || title.includes('french toast') || title.includes('eggs benedict') || title.includes('omelette')) return 'sunny-outline';
    if (title.includes('cereal') || title.includes('avena') || title.includes('granola') || title.includes('yogurt') || title.includes('parfait')) return 'sunny-outline';

    // Aperitivos y entradas
    if (title.includes('entrada') || title.includes('aperitivo') || title.includes('tapas') || title.includes('bruschetta') || title.includes('crostini')) return 'ellipse-outline';
    if (title.includes('dip') || title.includes('salsa') || title.includes('guacamole') || title.includes('hummus')) return 'ellipse-outline';

    // Barbacoa y parrilla
    if (title.includes('barbacoa') || title.includes('bbq') || title.includes('parrilla') || title.includes('asado') || title.includes('grilled')) return 'flame-outline';

    // Por defecto
    return 'restaurant-outline';
  };

  const categorizeRecipe = (recipeTitle) => {
    const title = recipeTitle.toLowerCase();

    if (title.includes('postre') || title.includes('dessert') || title.includes('torta') || title.includes('pastel') || title.includes('helado')) return 'postre';
    if (title.includes('bebida') || title.includes('drink') || title.includes('jugo') || title.includes('smoothie') || title.includes('café')) return 'bebida';
    if (title.includes('ensalada') || title.includes('salad')) return 'ensalada';
    if (title.includes('sopa') || title.includes('soup') || title.includes('caldo') || title.includes('crema')) return 'sopa';
    if (title.includes('pasta') || title.includes('espagueti') || title.includes('macarrones') || title.includes('lasaña')) return 'pasta';
    if (title.includes('pollo') || title.includes('chicken')) return 'pollo';
    if (title.includes('carne') || title.includes('beef') || title.includes('res') || title.includes('cerdo')) return 'carne';
    if (title.includes('pescado') || title.includes('fish') || title.includes('salmón') || title.includes('atún') || title.includes('mariscos')) return 'pescado';
    if (title.includes('pan') || title.includes('bread') || title.includes('pizza') || title.includes('sandwich')) return 'pan';
    if (title.includes('arroz') || title.includes('rice') || title.includes('paella')) return 'arroz';
    if (title.includes('vegetariano') || title.includes('vegano') || title.includes('vegan') || title.includes('quinoa')) return 'vegetariano';
    if (title.includes('entrada') || title.includes('aperitivo') || title.includes('tapas')) return 'entrada';

    return 'principal';
  };

  const categorizedRecipes = useMemo(() => {
    const categories = {};

    recipes.forEach(recipe => {
      const category = categorizeRecipe(recipe.title);
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(recipe);
    });

    return categories;
  }, [recipes]);

  const categoryNames = {
    'principal': 'Platos Principales',
    'entrada': 'Entradas',
    'postre': 'Postres',
    'bebida': 'Bebidas',
    'ensalada': 'Ensaladas',
    'sopa': 'Sopas',
    'pasta': 'Pastas',
    'carne': 'Carnes',
    'pollo': 'Pollo',
    'pescado': 'Pescados y Mariscos',
    'vegetariano': 'Vegetariano',
    'pan': 'Panes y Pizzas',
    'arroz': 'Arroces',
    'otros': 'Otros'
  };

  const categories = Object.keys(categorizedRecipes).sort();
  const totalRecipes = recipes.length;

  const filteredRecipes = selectedCategory === 'all'
    ? recipes
    : categorizedRecipes[selectedCategory] || [];

  const countIngredients = (recipe) => {
    // Si ya viene con el conteo desde el servicio de extracción, lo usamos
    if (recipe.ingredientsCount) {
      return recipe.ingredientsCount;
    }

    if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
      return recipe.ingredients.length;
    }

    const title = recipe.title.toLowerCase();
    if (title.includes('simple') || title.includes('fácil') || title.includes('rápida')) return 5;
    if (title.includes('completa') || title.includes('gourmet') || title.includes('especial')) return 12;
    if (title.includes('tradicional') || title.includes('casera')) return 8;

    return 6;
  };

  const formatTime = (recipe) => {
    if (recipe.cookingTime) {
      return `${recipe.cookingTime} min`;
    }

    const title = recipe.title.toLowerCase();
    if (title.includes('rápida') || title.includes('express') || title.includes('5 min')) return '15 min';
    if (title.includes('lenta') || title.includes('horno') || title.includes('guisado')) return '60 min';
    if (title.includes('simple') || title.includes('fácil')) return '25 min';

    return '30 min';
  };

  const renderRecipeItem = ({ item: recipe }) => (
    <TouchableOpacity
      style={styles.recipeItem}
      onPress={() => onRecipePress(recipe)}
      activeOpacity={0.7}
    >
      <View style={styles.recipeIconContainer}>
        <Ionicons
          name={getRecipeIcon(recipe.title)}
          size={24}
          color="#007AFF"
        />
      </View>

      <View style={styles.recipeDetails}>
        <Text style={styles.recipeTitle} numberOfLines={2}>
          {recipe.title}
        </Text>

        <View style={styles.recipeMetadata}>
          <View style={styles.metadataItem}>
            <Ionicons name="list-outline" size={14} color="#666" />
            <Text style={styles.metadataText}>
              {countIngredients(recipe)} ingredientes
            </Text>
          </View>

          <View style={styles.metadataItem}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.metadataText}>
              {formatTime(recipe)}
            </Text>
          </View>

          <View style={styles.metadataItem}>
            <Ionicons name="trending-up-outline" size={14} color="#666" />
            <Text style={styles.metadataText}>
              {recipe.difficulty || 'Medio'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <Ionicons name="chevron-forward" size={20} color="#007AFF" />
      </View>
    </TouchableOpacity>
  );

  if (!recipes || recipes.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {totalRecipes} receta{totalRecipes !== 1 ? 's' : ''} encontrada{totalRecipes !== 1 ? 's' : ''}
        </Text>
      </View>

      {categories.length > 1 && (
        <View style={styles.categoryFilters}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === 'all' && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory('all')}
            >
              <Ionicons
                name="grid-outline"
                size={16}
                color={selectedCategory === 'all' ? 'white' : '#007AFF'}
              />
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === 'all' && styles.categoryButtonTextActive
              ]}>
                Todas ({totalRecipes})
              </Text>
            </TouchableOpacity>

            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Ionicons
                  name={getCategoryIcon(category)}
                  size={16}
                  color={selectedCategory === category ? 'white' : '#007AFF'}
                />
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.categoryButtonTextActive
                ]}>
                  {categoryNames[category]} ({categorizedRecipes[category].length})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={filteredRecipes}
        renderItem={renderRecipeItem}
        keyExtractor={(item, index) => item.id || index.toString()}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContainer}
        style={styles.recipesContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#4B5563',
  },
  categoryFilters: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  recipesContainer: {
    flex: 1,
  },
  listContainer: {
    paddingVertical: 8,
  },
  recipeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  recipeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  recipeDetails: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  recipeMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metadataText: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 4,
  },
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  separator: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginLeft: 84,
  },
});

export default RecipeListOrganized;