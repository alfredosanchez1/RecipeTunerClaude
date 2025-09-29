import Realm from 'realm';

/**
 * Base de datos Realm robusta y simplificada
 * Configuración nueva desde cero para garantizar persistencia
 */

// ===== ESQUEMAS SIMPLIFICADOS =====

const RecipeSchema = {
  name: 'Recipe',
  primaryKey: '_id',
  properties: {
    _id: 'objectId',
    title: 'string',
    description: 'string?',
    ingredients: 'string[]', // Simplificado como array de strings
    instructions: 'string[]',
    prepTime: 'int?',
    cookTime: 'int?',
    servings: 'int?',
    difficulty: 'string?',
    cuisine: 'string?',
    tags: 'string[]',
    imageUrl: 'string?',
    isFavorite: { type: 'bool', default: false },
    createdAt: { type: 'date', default: new Date() },
    updatedAt: { type: 'date', default: new Date() },
    source: 'string?',

    // Campos para recetas adaptadas
    isAdapted: { type: 'bool', default: false },
    adapted: { type: 'bool', default: false },
    originalRecipeId: 'string?',
    adaptedAt: 'string?',

    // Información nutricional (como strings JSON para flexibilidad)
    nutrition: 'string?', // JSON string con calories, protein, carbs, fat, fiber, sodium
    adaptationSummary: 'string?', // JSON string con majorChanges, substitutions, nutritionImprovements, timeAdjustments
    tips: 'string[]', // Array de consejos
    warnings: 'string[]', // Array de advertencias
    alternatives: 'string?', // JSON string con ingredients alternatives y cookingMethods
    shoppingNotes: 'string[]', // Array de notas de compra

    // Metadatos de adaptación
    userComments: 'string?',
    userPreferences: 'string?', // JSON string de las preferencias del usuario
    portionAdjustment: 'string?',
    customPortions: 'string?',
    finalPortions: 'int?',
    dietaryRestrictions: 'string[]'
  }
};

const UserPreferencesSchema = {
  name: 'UserPreferences',
  primaryKey: '_id',
  properties: {
    _id: 'objectId',
    userId: { type: 'string', default: 'default' },
    dietaryRestrictions: 'string[]',
    allergies: 'string[]',
    intolerances: 'string[]',
    dietType: 'string?',
    medicalConditions: 'string[]',
    cookingTimePreference: 'string?',
    difficultyLevel: 'string?',
    servingSize: 'int?',
    measurementUnit: 'string?',
    notificationsEnabled: { type: 'bool', default: true },
    onboardingComplete: { type: 'bool', default: false },
    theme: 'string?',
    language: 'string?',
    createdAt: { type: 'date', default: new Date() },
    updatedAt: { type: 'date', default: new Date() }
  }
};

// ===== CONFIGURACIÓN DE REALM =====

const REALM_CONFIG = {
  schema: [RecipeSchema, UserPreferencesSchema],
  schemaVersion: 8, // Nueva versión para migrar cuisinePreferences -> dietType
  migration: (oldRealm, newRealm) => {
    console.log('🔄 REALM V2 - Ejecutando migración...');
    console.log(`📊 REALM V2 - Migrando desde versión ${oldRealm.schemaVersion} a ${newRealm.schemaVersion}`);

    // Migración v6: agregar medicalConditions
    if (oldRealm.schemaVersion < 6) {
      console.log('📈 REALM V2 - Migración v6: agregando medicalConditions');
    }

    // Migración v7: agregar campos de recetas adaptadas
    if (oldRealm.schemaVersion < 7) {
      console.log('📈 REALM V2 - Migración v7: agregando campos de recetas adaptadas');
    }

    // Migración v8: cuisinePreferences -> dietType
    if (oldRealm.schemaVersion < 8) {
      console.log('📈 REALM V2 - Migración v8: cuisinePreferences -> dietType');

      const oldPreferences = oldRealm.objects('UserPreferences');
      const newPreferences = newRealm.objects('UserPreferences');

      for (let i = 0; i < oldPreferences.length; i++) {
        const oldPref = oldPreferences[i];
        const newPref = newPreferences[i];

        // Si existía cuisinePreferences, migrar a dietType
        if (oldPref.cuisinePreferences && oldPref.cuisinePreferences.length > 0) {
          console.log(`🔄 REALM V2 - Migrando cuisinePreferences: ${oldPref.cuisinePreferences} -> dietType vacío (se configurará en Supabase)`);
          // Dejamos dietType vacío, Supabase tiene la verdadera fuente de datos
          newPref.dietType = '';
        } else {
          newPref.dietType = '';
        }

        console.log(`✅ REALM V2 - Preferencia migrada para usuario: ${newPref.userId}`);
      }

      console.log('✅ REALM V2 - Migración v8 completada');
    }
  },
  deleteRealmIfMigrationNeeded: false // Preservar datos existentes
};

// ===== SERVICIO DE BASE DE DATOS =====

class RealmDatabaseV2 {
  constructor() {
    this.realm = null;
    this.isInitialized = false;
  }

  async init() {
    try {
      console.log('🚀 REALM V2 - Inicializando base de datos robusta...');

      // Abrir Realm con nueva configuración
      this.realm = await Realm.open(REALM_CONFIG);
      this.isInitialized = true;

      console.log('✅ REALM V2 - Base de datos inicializada exitosamente');
      console.log(`📊 REALM V2 - Path: ${this.realm.path}`);
      console.log(`📊 REALM V2 - Schema version: ${this.realm.schemaVersion}`);

      // Mostrar estadísticas
      const recipes = this.realm.objects('Recipe');
      const userPrefs = this.realm.objects('UserPreferences');
      console.log(`📊 REALM V2 - Recetas existentes: ${recipes.length}`);
      console.log(`📊 REALM V2 - Preferencias existentes: ${userPrefs.length}`);

      return true;
    } catch (error) {
      console.error('❌ REALM V2 - Error inicializando:', error);
      this.isInitialized = false;
      return false;
    }
  }

  close() {
    if (this.realm && !this.realm.isClosed) {
      this.realm.close();
      console.log('🔒 REALM V2 - Base de datos cerrada');
    }
    this.isInitialized = false;
  }

  // ===== OPERACIONES DE RECETAS =====

  async createRecipe(recipeData) {
    if (!this.realm) throw new Error('Base de datos no inicializada');

    try {
      console.log('📝 REALM V2 - Creando receta:', recipeData.title);

      let recipe;
      this.realm.write(() => {
        recipe = this.realm.create('Recipe', {
          _id: new Realm.BSON.ObjectId(),
          title: recipeData.title || 'Receta sin título',
          description: recipeData.description || '',
          ingredients: recipeData.ingredients || [],
          instructions: recipeData.instructions || [],
          prepTime: recipeData.prepTime || null,
          cookTime: recipeData.cookTime || null,
          servings: recipeData.servings || null,
          difficulty: recipeData.difficulty || null,
          cuisine: recipeData.cuisine || null,
          tags: recipeData.tags || [],
          imageUrl: recipeData.imageUrl || null,
          isFavorite: recipeData.isFavorite || false,
          source: recipeData.source || null,
          createdAt: new Date(),
          updatedAt: new Date(),

          // Campos de recetas adaptadas
          isAdapted: recipeData.isAdapted || false,
          adapted: recipeData.adapted || false,
          originalRecipeId: recipeData.originalRecipeId || null,
          adaptedAt: recipeData.adaptedAt || null,

          // Información nutricional (almacenar como JSON string)
          nutrition: recipeData.nutrition ? JSON.stringify(recipeData.nutrition) : null,
          adaptationSummary: recipeData.adaptationSummary ? JSON.stringify(recipeData.adaptationSummary) : null,
          tips: recipeData.tips || [],
          warnings: recipeData.warnings || [],
          alternatives: recipeData.alternatives ? JSON.stringify(recipeData.alternatives) : null,
          shoppingNotes: recipeData.shoppingNotes || [],

          // Metadatos de adaptación
          userComments: recipeData.userComments || null,
          userPreferences: recipeData.userPreferences ? JSON.stringify(recipeData.userPreferences) : null,
          portionAdjustment: recipeData.portionAdjustment || null,
          customPortions: recipeData.customPortions || null,
          finalPortions: recipeData.finalPortions || null,
          dietaryRestrictions: recipeData.dietaryRestrictions || []
        });
      });

      const result = this._recipeToObject(recipe);
      console.log('✅ REALM V2 - Receta creada con ID:', result.id);
      return result;
    } catch (error) {
      console.error('❌ REALM V2 - Error creando receta:', error);
      throw error;
    }
  }

  async getAllRecipes() {
    if (!this.realm) throw new Error('Base de datos no inicializada');

    try {
      console.log('📋 REALM V2 - Obteniendo todas las recetas');
      const recipes = this.realm.objects('Recipe').sorted('createdAt', true);
      const result = Array.from(recipes).map(recipe => this._recipeToObject(recipe));
      console.log(`📊 REALM V2 - Encontradas ${result.length} recetas`);
      return result;
    } catch (error) {
      console.error('❌ REALM V2 - Error obteniendo recetas:', error);
      throw error;
    }
  }

  async getRecipeById(id) {
    if (!this.realm) throw new Error('Base de datos no inicializada');

    try {
      console.log('🔍 REALM V2 - Buscando receta con ID:', id);
      const objectId = typeof id === 'string' ? new Realm.BSON.ObjectId(id) : id;
      const recipe = this.realm.objectForPrimaryKey('Recipe', objectId);

      if (recipe) {
        const result = this._recipeToObject(recipe);
        console.log('✅ REALM V2 - Receta encontrada:', result.title);
        return result;
      } else {
        console.log('❌ REALM V2 - Receta no encontrada');
        return null;
      }
    } catch (error) {
      console.error('❌ REALM V2 - Error buscando receta:', error);
      throw error;
    }
  }

  async updateRecipe(id, updates) {
    if (!this.realm) throw new Error('Base de datos no inicializada');

    try {
      console.log('✏️ REALM V2 - Actualizando receta:', id);
      const objectId = typeof id === 'string' ? new Realm.BSON.ObjectId(id) : id;
      const recipe = this.realm.objectForPrimaryKey('Recipe', objectId);

      if (!recipe) {
        throw new Error('Receta no encontrada');
      }

      this.realm.write(() => {
        if (updates.title !== undefined) recipe.title = updates.title;
        if (updates.description !== undefined) recipe.description = updates.description;
        if (updates.ingredients !== undefined) recipe.ingredients = updates.ingredients;
        if (updates.instructions !== undefined) recipe.instructions = updates.instructions;
        if (updates.prepTime !== undefined) recipe.prepTime = updates.prepTime;
        if (updates.cookTime !== undefined) recipe.cookTime = updates.cookTime;
        if (updates.servings !== undefined) recipe.servings = updates.servings;
        if (updates.difficulty !== undefined) recipe.difficulty = updates.difficulty;
        if (updates.cuisine !== undefined) recipe.cuisine = updates.cuisine;
        if (updates.tags !== undefined) recipe.tags = updates.tags;
        if (updates.imageUrl !== undefined) recipe.imageUrl = updates.imageUrl;
        if (updates.isFavorite !== undefined) recipe.isFavorite = updates.isFavorite;
        if (updates.source !== undefined) recipe.source = updates.source;

        recipe.updatedAt = new Date();
      });

      console.log('✅ REALM V2 - Receta actualizada exitosamente');
      return this._recipeToObject(recipe);
    } catch (error) {
      console.error('❌ REALM V2 - Error actualizando receta:', error);
      throw error;
    }
  }

  async deleteRecipe(id) {
    if (!this.realm) throw new Error('Base de datos no inicializada');

    try {
      console.log('🗑️ REALM V2 - Eliminando receta:', id);
      const objectId = typeof id === 'string' ? new Realm.BSON.ObjectId(id) : id;
      const recipe = this.realm.objectForPrimaryKey('Recipe', objectId);

      if (!recipe) {
        throw new Error('Receta no encontrada');
      }

      this.realm.write(() => {
        this.realm.delete(recipe);
      });

      console.log('✅ REALM V2 - Receta eliminada exitosamente');
      return true;
    } catch (error) {
      console.error('❌ REALM V2 - Error eliminando receta:', error);
      throw error;
    }
  }

  // ===== OPERACIONES DE PREFERENCIAS =====

  async saveUserPreferences(userId, preferences) {
    if (!this.realm) throw new Error('Base de datos no inicializada');

    try {
      console.log('💾 REALM V2 - Guardando preferencias para usuario:', userId);

      let userPrefs;
      this.realm.write(() => {
        // Buscar preferencias existentes
        const existing = this.realm.objects('UserPreferences').filtered('userId == $0', userId);

        if (existing.length > 0) {
          // Actualizar existentes
          userPrefs = existing[0];
          console.log('📝 REALM V2 - Actualizando preferencias existentes');
        } else {
          // Crear nuevas
          console.log('🆕 REALM V2 - Creando nuevas preferencias');
          userPrefs = this.realm.create('UserPreferences', {
            _id: new Realm.BSON.ObjectId(),
            userId: userId,
            dietaryRestrictions: [],
            allergies: [],
            intolerances: [],
            dietType: '',
            medicalConditions: [],
            notificationsEnabled: true,
            onboardingComplete: false,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }

        // Actualizar campos
        if (preferences.dietaryRestrictions !== undefined) {
          userPrefs.dietaryRestrictions = [...preferences.dietaryRestrictions];
        }
        if (preferences.allergies !== undefined) {
          userPrefs.allergies = [...preferences.allergies];
        }
        if (preferences.intolerances !== undefined) {
          userPrefs.intolerances = [...preferences.intolerances];
        }
        if (preferences.dietType !== undefined) {
          userPrefs.dietType = preferences.dietType;
        }
        if (preferences.medicalConditions !== undefined) {
          userPrefs.medicalConditions = [...preferences.medicalConditions];
        }
        if (preferences.cookingTimePreference !== undefined) {
          userPrefs.cookingTimePreference = preferences.cookingTimePreference;
        }
        if (preferences.difficultyLevel !== undefined) {
          userPrefs.difficultyLevel = preferences.difficultyLevel;
        }
        if (preferences.servingSize !== undefined) {
          userPrefs.servingSize = preferences.servingSize;
        }
        if (preferences.measurementUnit !== undefined) {
          userPrefs.measurementUnit = preferences.measurementUnit;
        }
        if (preferences.notificationsEnabled !== undefined) {
          userPrefs.notificationsEnabled = preferences.notificationsEnabled;
        }
        if (preferences.onboardingComplete !== undefined) {
          userPrefs.onboardingComplete = preferences.onboardingComplete;
        }
        if (preferences.theme !== undefined) {
          userPrefs.theme = preferences.theme;
        }
        if (preferences.language !== undefined) {
          userPrefs.language = preferences.language;
        }

        userPrefs.updatedAt = new Date();
      });

      console.log('✅ REALM V2 - Preferencias guardadas exitosamente');
      return true;
    } catch (error) {
      console.error('❌ REALM V2 - Error guardando preferencias:', error);
      throw error;
    }
  }

  async getUserPreferences(userId) {
    if (!this.realm) throw new Error('Base de datos no inicializada');

    try {
      console.log('📖 REALM V2 - Obteniendo preferencias para usuario:', userId);
      const userPrefs = this.realm.objects('UserPreferences').filtered('userId == $0', userId);

      if (userPrefs.length > 0) {
        const prefs = userPrefs[0];
        const result = {
          dietaryRestrictions: Array.from(prefs.dietaryRestrictions),
          allergies: Array.from(prefs.allergies),
          intolerances: Array.from(prefs.intolerances),
          dietType: prefs.dietType,
          medicalConditions: Array.from(prefs.medicalConditions || []),
          cookingTimePreference: prefs.cookingTimePreference,
          difficultyLevel: prefs.difficultyLevel,
          servingSize: prefs.servingSize,
          measurementUnit: prefs.measurementUnit,
          notificationsEnabled: prefs.notificationsEnabled,
          onboardingComplete: prefs.onboardingComplete,
          theme: prefs.theme,
          language: prefs.language,
          createdAt: prefs.createdAt,
          updatedAt: prefs.updatedAt
        };
        console.log('✅ REALM V2 - Preferencias encontradas');
        return result;
      } else {
        console.log('📭 REALM V2 - No se encontraron preferencias para el usuario');
        return null;
      }
    } catch (error) {
      console.error('❌ REALM V2 - Error obteniendo preferencias:', error);
      throw error;
    }
  }

  // ===== DIAGNÓSTICO =====

  async testDatabase() {
    console.log('🧪 REALM V2 - Iniciando prueba de base de datos');

    try {
      if (!this.realm || !this.isInitialized) {
        return {
          success: false,
          message: 'Base de datos no inicializada',
          timestamp: new Date().toISOString()
        };
      }

      // Test de escritura/lectura
      let testRecipe;
      this.realm.write(() => {
        testRecipe = this.realm.create('Recipe', {
          _id: new Realm.BSON.ObjectId(),
          title: 'Test Recipe',
          description: 'Test de persistencia',
          ingredients: ['Test ingredient'],
          instructions: ['Test instruction'],
          isFavorite: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['test']
        });
      });

      // Verificar lectura
      const foundRecipe = this.realm.objectForPrimaryKey('Recipe', testRecipe._id);
      const canRead = !!foundRecipe;

      // Limpiar
      this.realm.write(() => {
        this.realm.delete(testRecipe);
      });

      console.log('✅ REALM V2 - Prueba completada exitosamente');
      return {
        success: true,
        message: 'Base de datos funcionando correctamente',
        tests: [
          'Inicialización ✅',
          'Escritura ✅',
          'Lectura ✅',
          'Eliminación ✅'
        ],
        timestamp: new Date().toISOString(),
        path: this.realm.path,
        schemaVersion: this.realm.schemaVersion
      };
    } catch (error) {
      console.error('❌ REALM V2 - Error en prueba:', error);
      return {
        success: false,
        message: `Error en prueba: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ===== UTILIDADES PRIVADAS =====

  _recipeToObject(recipe) {
    const parseJsonField = (field) => {
      if (!field) return null;
      try {
        return JSON.parse(field);
      } catch (error) {
        console.warn('⚠️ REALM V2 - Error parsing JSON field:', error);
        return null;
      }
    };

    return {
      id: recipe._id.toString(),
      title: recipe.title,
      description: recipe.description,
      ingredients: Array.from(recipe.ingredients),
      instructions: Array.from(recipe.instructions),
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      cuisine: recipe.cuisine,
      tags: Array.from(recipe.tags),
      imageUrl: recipe.imageUrl,
      isFavorite: recipe.isFavorite,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      source: recipe.source,

      // Campos de recetas adaptadas
      isAdapted: recipe.isAdapted,
      adapted: recipe.adapted,
      originalRecipeId: recipe.originalRecipeId,
      adaptedAt: recipe.adaptedAt,

      // Información nutricional (parsear JSON strings de vuelta a objetos)
      nutrition: parseJsonField(recipe.nutrition),
      adaptationSummary: parseJsonField(recipe.adaptationSummary),
      tips: recipe.tips ? Array.from(recipe.tips) : [],
      warnings: recipe.warnings ? Array.from(recipe.warnings) : [],
      alternatives: parseJsonField(recipe.alternatives),
      shoppingNotes: recipe.shoppingNotes ? Array.from(recipe.shoppingNotes) : [],

      // Metadatos de adaptación
      userComments: recipe.userComments,
      userPreferences: parseJsonField(recipe.userPreferences),
      portionAdjustment: recipe.portionAdjustment,
      customPortions: recipe.customPortions,
      finalPortions: recipe.finalPortions,
      dietaryRestrictions: recipe.dietaryRestrictions ? Array.from(recipe.dietaryRestrictions) : []
    };
  }
}

// Instancia singleton
const realmDatabaseV2 = new RealmDatabaseV2();

export default realmDatabaseV2;