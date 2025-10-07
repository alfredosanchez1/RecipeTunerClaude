/**
 * Sistema de iconos para tipos de platillos y cocinas
 * Mapea palabras clave a iconos de Ionicons
 */

export const RECIPE_EMOJIS = {
  // Tipos de platillos principales
  APPETIZER: '🥗',
  MAIN_COURSE: '🍽️',
  DESSERT: '🍰',
  SOUP: '🍲',
  SALAD: '🥗',
  BREAD: '🍞',
  PASTA: '🍝',
  PIZZA: '🍕',
  SANDWICH: '🥪',
  DRINK: '🥤',
  BREAKFAST: '🍳',
  RICE: '🍚',
  FISH: '🐟',

  // Tipos de cocina
  MEXICAN: '🌮',
  ITALIAN: '🍝',
  CHINESE: '🥢',
  JAPANESE: '🍣',
  INDIAN: '🍛',
  FRENCH: '🥐',
  AMERICAN: '🍔',
  MEDITERRANEAN: '🫒',
  THAI: '🍜',
  KOREAN: '🍜',

  // Métodos de cocción
  GRILLED: '🔥',
  BAKED: '🔥',
  FRIED: '🍟',
  STEAMED: '♨️',
  RAW: '🥗',

  // Categorías especiales
  VEGETARIAN: '🥬',
  VEGAN: '🌱',
  GLUTEN_FREE: '🌾',
  HEALTHY: '💚',
  QUICK: '⚡',

  // Ingredientes específicos
  CHICKEN: '🍗',
  BEEF: '🥩',
  FISH: '🐟',
  PORK: '🥓',
  RICE: '🍚',
  NOODLES: '🍜',
  CHEESE: '🧀',
  TOMATO: '🍅',
  AVOCADO: '🥑',
  BANANA: '🍌',
  CHOCOLATE: '🍫',
  COFFEE: '☕',

  // Default fallback
  DEFAULT: '🍽️'
};

// Mantenemos los iconos como fallback
export const RECIPE_ICONS = {
  // Tipos de platillos principales
  APPETIZER: 'star-outline',
  MAIN_COURSE: 'restaurant',
  DESSERT: 'ice-cream-outline',
  SOUP: 'water-outline',
  SALAD: 'leaf-outline',
  BREAD: 'ellipse-outline',
  PASTA: 'reorder-three-outline',
  PIZZA: 'pizza-outline',
  SANDWICH: 'layers-outline',
  DRINK: 'wine-outline',
  BREAKFAST: 'sunny-outline',

  // Default fallback
  DEFAULT: 'restaurant-outline'
};

/**
 * Colores para los iconos basados en el tipo
 */
export const ICON_COLORS = {
  // Tipos de platillos
  APPETIZER: '#FF6B6B',
  MAIN_COURSE: '#4ECDC4',
  DESSERT: '#FFE66D',
  SOUP: '#A8E6CF',
  SALAD: '#88D8B0',
  BREAD: '#DEB887',
  PASTA: '#FFB347',
  PIZZA: '#FF6347',
  SANDWICH: '#F4A460',
  DRINK: '#9370DB',
  BREAKFAST: '#FFA500',
  RICE: '#F5DEB3',
  FISH: '#4682B4',

  // Tipos de cocina
  MEXICAN: '#FF4757',
  ITALIAN: '#2ED573',
  CHINESE: '#FF3838',
  JAPANESE: '#FF9FF3',
  INDIAN: '#FF6348',
  FRENCH: '#5F27CD',
  AMERICAN: '#00D2D3',
  MEDITERRANEAN: '#54A0FF',
  THAI: '#FF9F43',
  KOREAN: '#EE5A52',

  // Métodos
  GRILLED: '#FF6B35',
  BAKED: '#F79F1F',
  FRIED: '#EA2027',
  STEAMED: '#0ABDE3',
  RAW: '#00D2D3',

  // Especiales
  VEGETARIAN: '#26de81',
  VEGAN: '#20bf6b',
  GLUTEN_FREE: '#a55eea',
  HEALTHY: '#45B7D1',
  QUICK: '#FD79A8',

  // Default
  DEFAULT: '#6C757D'
};

/**
 * Palabras clave para detectar el tipo de receta con prioridades
 */
const RECIPE_KEYWORDS = {
  // Postres (alta prioridad)
  dessert: ['postre', 'dulce', 'pastel', 'torta', 'cake', 'flan', 'helado', 'ice cream', 'chocolate', 'galleta', 'cookie', 'brownie', 'muffin', 'cupcake', 'cheesecake', 'tarta', 'pay', 'pie', 'donut', 'dona', 'pudín', 'mousse', 'trufas', 'bombones'],

  // Sopas (alta prioridad)
  soup: ['sopa', 'caldo', 'consomé', 'crema', 'bisque', 'gazpacho', 'minestrone', 'chowder', 'broth', 'pozole', 'menudo'],

  // Pizza (alta prioridad)
  pizza: ['pizza', 'pizzas', 'focaccia'],

  // Pastas (alta prioridad)
  pasta: ['pasta', 'espagueti', 'spaghetti', 'macarrones', 'macaroni', 'lasaña', 'lasagna', 'ravioli', 'fettuccine', 'penne', 'linguine', 'carbonara', 'alfredo', 'boloñesa', 'bolognese'],

  // Ensaladas (alta prioridad)
  salad: ['ensalada', 'salad', 'verde', 'mixta', 'césar', 'caesar', 'griega', 'greek', 'caprese', 'coleslaw'],

  // Sándwiches (alta prioridad)
  sandwich: ['sándwich', 'sandwich', 'hamburguesa', 'burger', 'torta', 'bocadillo', 'wrap', 'panini', 'club', 'sub', 'hoagie'],

  // Bebidas (alta prioridad)
  drink: ['bebida', 'drink', 'jugo', 'juice', 'smoothie', 'batido', 'shake', 'cocktail', 'mocktail', 'té', 'tea', 'café', 'coffee', 'frappé', 'latte', 'cappuccino', 'agua fresca', 'limonada'],

  // Desayuno (alta prioridad)
  breakfast: ['desayuno', 'breakfast', 'huevo', 'egg', 'pancake', 'hotcake', 'waffle', 'cereal', 'avena', 'oatmeal', 'tostada', 'toast', 'bagel', 'croissant', 'french toast'],

  // Arroz (alta prioridad)
  rice: ['arroz', 'rice', 'paella', 'risotto', 'biryani', 'pilaf', 'congee', 'arroz con', 'rice with'],

  // Mariscos y pescados (alta prioridad)
  fish: ['pescado', 'fish', 'mariscos', 'seafood', 'camarón', 'shrimp', 'langosta', 'lobster', 'cangrejo', 'crab', 'pulpo', 'octopus', 'calamar', 'squid', 'salmón', 'salmon', 'atún', 'tuna', 'bacalao', 'cod', 'trucha', 'trout'],

  // Cocinas específicas (prioridad media)
  mexican: ['mexicana', 'mexican', 'tacos', 'taco', 'quesadilla', 'enchilada', 'mole', 'pozole', 'chile', 'chili', 'guacamole', 'salsa', 'fajitas', 'burrito', 'tamales', 'elote', 'chiles rellenos'],
  italian: ['italiana', 'italian', 'pizza', 'pasta', 'risotto', 'gelato', 'tiramisu', 'gnocchi', 'pesto', 'marinara', 'parmesana', 'margherita'],
  chinese: ['china', 'chinese', 'chow mein', 'dim sum', 'wonton', 'fried rice', 'arroz frito', 'general tso', 'kung pao', 'sweet and sour'],
  japanese: ['japonesa', 'japanese', 'sushi', 'ramen', 'tempura', 'teriyaki', 'miso', 'udon', 'soba', 'yakitori', 'katsu'],
  indian: ['india', 'indian', 'curry', 'tandoori', 'naan', 'biryani', 'masala', 'dal', 'samosa', 'vindaloo'],
  french: ['francesa', 'french', 'croissant', 'quiche', 'ratatouille', 'coq au vin', 'bouillabaisse', 'escargot'],
  american: ['americana', 'american', 'bbq', 'barbecue', 'hot dog', 'mac and cheese', 'fried chicken', 'apple pie'],
  thai: ['tailandesa', 'thai', 'pad thai', 'curry verde', 'green curry', 'tom yum', 'som tam'],

  // Entradas y aperitivos (prioridad media)
  appetizer: ['aperitivo', 'appetizer', 'entrada', 'starter', 'botana', 'snack', 'tapa', 'tapas', 'canapé', 'dip', 'nachos', 'wings', 'alitas'],

  // Panes y masas (prioridad media)
  bread: ['pan', 'bread', 'masa', 'dough', 'tortilla', 'empanada', 'arepa', 'bagel', 'baguette', 'sourdough', 'focaccia', 'pretzel'],

  // Platos principales (prioridad baja - catch-all)
  main_course: ['principal', 'main', 'carne', 'meat', 'pollo', 'chicken', 'pescado', 'fish', 'cerdo', 'pork', 'res', 'beef', 'cordero', 'lamb', 'guisado', 'stew', 'estofado', 'asado', 'roast', 'filete', 'steak'],

  // Especiales (prioridad baja)
  vegetarian: ['vegetariano', 'vegetarian', 'veggie', 'sin carne', 'meatless'],
  vegan: ['vegano', 'vegan', 'plant based', 'sin lácteos', 'dairy free'],
  gluten_free: ['sin gluten', 'gluten free', 'celíaco', 'celiac'],
  healthy: ['saludable', 'healthy', 'light', 'bajo en grasa', 'low fat', 'fitness', 'diet'],
  quick: ['rápido', 'quick', 'fácil', 'easy', '15 minutos', '10 minutos', 'express', 'fast', '30 minutes']
};

/**
 * Determina el tipo de receta basado en título, descripción e ingredientes
 * @param {Object} recipe - Objeto de receta
 * @returns {string} - Tipo de receta detectado
 */
export function determineRecipeType(recipe) {
  const title = (recipe.title || '').toLowerCase();
  const description = (recipe.description || '').toLowerCase();
  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.join(' ').toLowerCase()
    : '';
  const cuisine = (recipe.cuisine || '').toLowerCase();

  // Crear texto de búsqueda con pesos
  const titleText = title; // Peso más alto para el título
  const descriptionText = description; // Peso medio para descripción
  const ingredientsText = ingredients; // Peso bajo para ingredientes
  const cuisineText = cuisine; // Peso medio para cocina

  let bestMatch = null;
  let bestScore = 0;

  // Definir orden de prioridad (de mayor a menor importancia)
  const priorityOrder = [
    'dessert', 'soup', 'pizza', 'pasta', 'salad', 'sandwich', 'drink', 'breakfast', 'rice', 'fish',
    'mexican', 'italian', 'chinese', 'japanese', 'indian', 'french', 'american', 'thai',
    'appetizer', 'bread',
    'vegetarian', 'vegan', 'gluten_free', 'healthy', 'quick',
    'main_course'
  ];

  // Buscar coincidencias con sistema de puntuación
  for (const type of priorityOrder) {
    const keywords = RECIPE_KEYWORDS[type] || [];
    let score = 0;

    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();

      // Puntuación por ubicación de la palabra clave
      if (titleText.includes(keywordLower)) {
        score += 10; // Peso más alto para título
      }
      if (cuisineText.includes(keywordLower)) {
        score += 8; // Peso alto para cocina
      }
      if (descriptionText.includes(keywordLower)) {
        score += 5; // Peso medio para descripción
      }
      if (ingredientsText.includes(keywordLower)) {
        score += 3; // Peso bajo para ingredientes
      }

      // Bonus por coincidencia exacta de palabra
      const exactTitleMatch = titleText.split(' ').includes(keywordLower);
      if (exactTitleMatch) {
        score += 15;
      }
    }

    // Si encontramos una puntuación mejor, actualizamos
    if (score > bestScore) {
      bestScore = score;
      bestMatch = type;
    }

    // Si encontramos una coincidencia fuerte en categorías de alta prioridad, la tomamos
    if (score >= 10 && ['dessert', 'soup', 'pizza', 'pasta', 'salad', 'sandwich', 'drink', 'breakfast', 'rice', 'fish'].includes(type)) {
      return type.toUpperCase();
    }
  }

  // Si encontramos alguna coincidencia, la retornamos
  if (bestMatch && bestScore >= 3) {
    console.log(`🎯 DETECCIÓN DE TIPO: "${recipe.title}" -> ${bestMatch.toUpperCase()} (score: ${bestScore})`);
    return bestMatch.toUpperCase();
  }

  // Si no encuentra coincidencias específicas, usar el tiempo para categorizar
  const cookingTime = parseInt(recipe.cookingTime) || 0;
  if (cookingTime > 0 && cookingTime <= 30) {
    console.log(`⏱️ DETECCIÓN POR TIEMPO: "${recipe.title}" -> QUICK (${cookingTime}min)`);
    return 'QUICK';
  }

  console.log(`🔧 DETECCIÓN DEFAULT: "${recipe.title}" -> DEFAULT (sin coincidencias)`);
  return 'DEFAULT';
}

/**
 * Obtiene el emoji para un tipo de receta
 * @param {string} recipeType - Tipo de receta
 * @returns {string} - Emoji representativo
 */
export function getRecipeEmoji(recipeType) {
  return RECIPE_EMOJIS[recipeType] || RECIPE_EMOJIS.DEFAULT;
}

/**
 * Obtiene el icono para un tipo de receta (fallback)
 * @param {string} recipeType - Tipo de receta
 * @returns {string} - Nombre del icono de Ionicons
 */
export function getRecipeIcon(recipeType) {
  return RECIPE_ICONS[recipeType] || RECIPE_ICONS.DEFAULT;
}

/**
 * Obtiene el color para un tipo de receta
 * @param {string} recipeType - Tipo de receta
 * @returns {string} - Código de color hexadecimal
 */
export function getRecipeIconColor(recipeType) {
  return ICON_COLORS[recipeType] || ICON_COLORS.DEFAULT;
}

/**
 * Obtiene tanto el icono como el color para una receta
 * @param {Object} recipe - Objeto de receta
 * @returns {Object} - {icon, color, type}
 */
export function getRecipeIconInfo(recipe) {
  const type = determineRecipeType(recipe);
  return {
    icon: getRecipeIcon(type),
    color: getRecipeIconColor(type),
    type: type
  };
}