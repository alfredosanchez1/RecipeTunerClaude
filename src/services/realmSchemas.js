/**
 * ⚠️ DEPRECATED - Este archivo está obsoleto
 *
 * USO: realmDatabaseV2.js en su lugar
 *
 * Este archivo contiene esquemas viejos de Realm v1-v6
 * que ya no se usan. Se mantiene solo por referencia histórica.
 *
 * Fecha de deprecación: 2025-09-29
 */

import Realm from 'realm';
import * as FileSystem from 'expo-file-system/legacy';

// Esquema para Recetas
export class Recipe extends Realm.Object {
  static schema = {
    name: 'Recipe',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      title: 'string',
      description: 'string?',
      ingredients: 'Ingredient[]',
      instructions: 'string[]',
      prepTime: 'int?',
      cookTime: 'int?',
      servings: 'int?',
      difficulty: 'string?',
      cuisine: 'string?',
      tags: 'string[]',
      imageUrl: 'string?',
      isFavorite: 'bool',
      createdAt: 'date',
      updatedAt: 'date',
      source: 'string?',
      nutritionInfo: 'NutritionInfo?',
      adaptations: 'RecipeAdaptation[]',

      // Nuevos campos del prompt mejorado
      tips: 'string[]',
      warnings: 'string[]',
      shoppingNotes: 'string[]',
      alternativeIngredients: 'AlternativeIngredient[]',
      alternativeCookingMethods: 'string?',

      // Campos para recetas adaptadas
      isAdapted: 'bool',
      originalRecipeId: 'objectId?',
      userComments: 'string?',
      userPreferences: 'string?', // JSON string
      adaptationSummary: 'AdaptationSummary?',
      adaptedAt: 'date?'
    }
  };
}

// Esquema para Ingredientes
export class Ingredient extends Realm.Object {
  static schema = {
    name: 'Ingredient',
    properties: {
      _id: 'objectId',
      name: 'string',
      amount: 'string?', // Cambiado a string para mantener formato "cantidad unidad"
      unit: 'string?',
      notes: 'string?',
      isOptional: 'bool',
      // Nuevos campos para sustituciones
      originalIngredient: 'string?',
      substitutionReason: 'string?'
    }
  };
}

// Esquema para Información Nutricional
export class NutritionInfo extends Realm.Object {
  static schema = {
    name: 'NutritionInfo',
    properties: {
      _id: 'objectId',
      calories: 'double?',
      protein: 'double?',
      carbs: 'double?',
      fat: 'double?',
      fiber: 'double?',
      sugar: 'double?',
      sodium: 'double?'
    }
  };
}

// Esquema para Adaptaciones de Recetas
export class RecipeAdaptation extends Realm.Object {
  static schema = {
    name: 'RecipeAdaptation',
    properties: {
      _id: 'objectId',
      originalRecipeId: 'objectId',
      adaptedTitle: 'string',
      adaptedIngredients: 'Ingredient[]',
      adaptedInstructions: 'string[]',
      adaptationReason: 'string?',
      createdAt: 'date',
      isFavorite: 'bool'
    }
  };
}

// Esquema para Resumen de Adaptación
export class AdaptationSummary extends Realm.Object {
  static schema = {
    name: 'AdaptationSummary',
    properties: {
      _id: 'objectId',
      majorChanges: 'string[]',
      substitutions: 'Substitution[]',
      nutritionImprovements: 'string[]',
      timeAdjustments: 'string?'
    }
  };
}

// Esquema para Sustituciones
export class Substitution extends Realm.Object {
  static schema = {
    name: 'Substitution',
    properties: {
      _id: 'objectId',
      original: 'string',
      replacement: 'string',
      reason: 'string'
    }
  };
}

// Esquema para Ingredientes Alternativos
export class AlternativeIngredient extends Realm.Object {
  static schema = {
    name: 'AlternativeIngredient',
    properties: {
      _id: 'objectId',
      ingredient: 'string',
      alternatives: 'string[]'
    }
  };
}

// Esquema para Usuario
export class User extends Realm.Object {
  static schema = {
    name: 'User',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      name: 'string',
      email: 'string',
      avatar: 'string?',
      preferences: 'UserPreferences?',
      createdAt: 'date',
      updatedAt: 'date'
    }
  };
}

// Esquema para Preferencias del Usuario
export class UserPreferences extends Realm.Object {
  static schema = {
    name: 'UserPreferences',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      userId: 'string',
      dietaryRestrictions: 'string[]',
      allergies: 'string[]',
      intolerances: 'string[]',
      cuisinePreferences: 'string[]',
      cookingTimePreference: 'string?',
      difficultyLevel: 'string?',
      servingSize: 'int?',
      measurementUnit: 'string?',
      notificationsEnabled: 'bool',
      onboardingComplete: 'bool?',
      theme: 'string?',
      language: 'string?',
      createdAt: 'date',
      updatedAt: 'date'
    }
  };
}

// Esquema para Lista de Compras
export class ShoppingList extends Realm.Object {
  static schema = {
    name: 'ShoppingList',
    primaryKey: '_id',
    properties: {
      _id: 'objectId',
      name: 'string',
      items: 'ShoppingItem[]',
      isCompleted: 'bool',
      createdAt: 'date',
      updatedAt: 'date'
    }
  };
}

// Esquema para Items de Lista de Compras
export class ShoppingItem extends Realm.Object {
  static schema = {
    name: 'ShoppingItem',
    properties: {
      _id: 'objectId',
      name: 'string',
      amount: 'double?',
      unit: 'string?',
      isCompleted: 'bool',
      notes: 'string?',
      category: 'string?'
    }
  };
}

// Función para obtener el path absoluto de la base de datos
const getRealmPath = () => {
  if (FileSystem.documentDirectory) {
    return `${FileSystem.documentDirectory}recipetuner-persistent.realm`;
  }
  // Fallback para desarrollo
  return 'recipetuner-persistent.realm';
};

// Configuración de la base de datos
export const realmConfig = {
  path: getRealmPath(), // Path absoluto para persistencia real
  schema: [
    User,
    Recipe,
    Ingredient,
    NutritionInfo,
    RecipeAdaptation,
    AdaptationSummary,
    Substitution,
    AlternativeIngredient,
    UserPreferences,
    ShoppingList,
    ShoppingItem
  ],
  schemaVersion: 5,
  migration: (oldRealm, newRealm) => {
    console.log('🔄 Ejecutando migración de esquema...');

    // Migración conservadora: mantener todos los datos existentes
    if (oldRealm.schemaVersion < 5) {
      console.log('📈 Migrando desde versión', oldRealm.schemaVersion, 'a versión 5');

      // Migrar recetas
      const oldRecipes = oldRealm.objects('Recipe');
      for (const oldRecipe of oldRecipes) {
        const newRecipe = newRealm.objectForPrimaryKey('Recipe', oldRecipe._id);
        if (newRecipe) {
          // Asegurar que todos los campos requeridos existen
          if (!newRecipe.tags) newRecipe.tags = [];
          if (!newRecipe.ingredients) newRecipe.ingredients = [];
          if (!newRecipe.instructions) newRecipe.instructions = [];
          if (newRecipe.isFavorite === undefined) newRecipe.isFavorite = false;

          // Nuevos campos de la versión 5
          if (!newRecipe.tips) newRecipe.tips = [];
          if (!newRecipe.warnings) newRecipe.warnings = [];
          if (!newRecipe.shoppingNotes) newRecipe.shoppingNotes = [];
          if (!newRecipe.alternativeIngredients) newRecipe.alternativeIngredients = [];
          if (newRecipe.isAdapted === undefined) newRecipe.isAdapted = false;
        }
      }

      // Migrar preferencias de usuario
      const oldPrefs = oldRealm.objects('UserPreferences');
      for (const oldPref of oldPrefs) {
        const newPref = newRealm.objectForPrimaryKey('UserPreferences', oldPref._id);
        if (newPref) {
          // Asegurar valores por defecto
          if (!newPref.dietaryRestrictions) newPref.dietaryRestrictions = [];
          if (!newPref.allergies) newPref.allergies = [];
          if (!newPref.intolerances) newPref.intolerances = [];
          if (!newPref.cuisinePreferences) newPref.cuisinePreferences = [];
          if (newPref.notificationsEnabled === undefined) newPref.notificationsEnabled = true;
          if (newPref.onboardingComplete === undefined) newPref.onboardingComplete = false;
        }
      }
    }
  },
  deleteRealmIfMigrationNeeded: false // No eliminar datos existentes
};
