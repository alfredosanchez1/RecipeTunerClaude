import Realm from 'realm';
import { realmConfig } from './realmSchemas';

console.log('🔄 SERVICIO REALM - Archivo cargado');
console.log('📊 Realm import:', typeof Realm);

class RealmDatabaseService {
  constructor() {
    this.realm = null;
    this.isInitialized = false;
  }

  // Método para convertir strings a números enteros de manera segura
  parseToNumber(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    if (typeof value === 'number') {
      return isNaN(value) ? null : Math.round(value);
    }
    if (typeof value === 'string') {
      // Extraer número de strings como "30 min", "4 personas", etc.
      const match = value.match(/(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    return null;
  }

  // Método para convertir strings a números flotantes de manera segura
  parseToFloat(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    if (typeof value === 'number') {
      return isNaN(value) ? null : value;
    }
    if (typeof value === 'string') {
      // Extraer número de strings como "25.5g", "150.2 cal", etc.
      const match = value.match(/(\d+\.?\d*)/);
      if (match) {
        const parsed = parseFloat(match[1]);
        return isNaN(parsed) ? null : parsed;
      }
    }
    return null;
  }

  // ===== INICIALIZACIÓN =====

  async init() {
    try {
      console.log('🔄 REALM - Inicializando base de datos...');
      console.log('📁 REALM - Path de BD:', realmConfig.path);
      console.log('📊 REALM - Versión de esquema:', realmConfig.schemaVersion);

      // Usar configuración estándar directamente
      this.realm = await Realm.open(realmConfig);
      this.isInitialized = true;

      console.log('✅ REALM - Base de datos inicializada exitosamente');
      console.log(`📊 REALM - Esquemas cargados: ${this.realm.schema.length}`);
      console.log(`📊 REALM - Path final: ${this.realm.path}`);

      // Verificar datos existentes
      const recipes = this.realm.objects('Recipe');
      const userPrefs = this.realm.objects('UserPreferences');
      console.log(`📊 REALM - Recetas existentes: ${recipes.length}`);
      console.log(`📊 REALM - Preferencias existentes: ${userPrefs.length}`);

      return true;

    } catch (error) {
      console.error('❌ REALM - Error inicializando:', error);
      this.isInitialized = false;
      return false;
    }
  }

  close() {
    if (this.realm && !this.realm.isClosed) {
      this.realm.close();
      console.log('🔒 REALM - Base de datos cerrada');
    }
    this.isInitialized = false;
  }

  // ===== OPERACIONES DE RECETAS =====

  async createRecipe(recipeData) {
    if (!this.realm) throw new Error('Base de datos no inicializada');

    try {
      console.log('📝 REALM - Creando receta:', recipeData.title);

      let recipe;
      this.realm.write(() => {
        // Procesar información nutricional
        let nutritionInfo = null;
        if (recipeData.nutrition) {
          nutritionInfo = this.realm.create('NutritionInfo', {
            _id: new Realm.BSON.ObjectId(),
            calories: this.parseToFloat(recipeData.nutrition.calories),
            protein: this.parseToFloat(recipeData.nutrition.protein),
            carbs: this.parseToFloat(recipeData.nutrition.carbs),
            fat: this.parseToFloat(recipeData.nutrition.fat),
            fiber: this.parseToFloat(recipeData.nutrition.fiber),
            sodium: this.parseToFloat(recipeData.nutrition.sodium)
          });
        }

        // Procesar resumen de adaptación
        let adaptationSummary = null;
        if (recipeData.adaptationSummary) {
          const substitutions = recipeData.adaptationSummary.substitutions?.map(sub =>
            this.realm.create('Substitution', {
              _id: new Realm.BSON.ObjectId(),
              original: sub.original,
              replacement: sub.replacement,
              reason: sub.reason
            })
          ) || [];

          adaptationSummary = this.realm.create('AdaptationSummary', {
            _id: new Realm.BSON.ObjectId(),
            majorChanges: recipeData.adaptationSummary.majorChanges || [],
            substitutions: substitutions,
            nutritionImprovements: recipeData.adaptationSummary.nutritionImprovements || [],
            timeAdjustments: recipeData.adaptationSummary.timeAdjustments || null
          });
        }

        // Procesar ingredientes alternativos
        const alternativeIngredients = recipeData.alternatives?.ingredients?.map(alt =>
          this.realm.create('AlternativeIngredient', {
            _id: new Realm.BSON.ObjectId(),
            ingredient: alt.ingredient,
            alternatives: alt.alternatives || []
          })
        ) || [];

        recipe = this.realm.create('Recipe', {
          _id: new Realm.BSON.ObjectId(),
          title: recipeData.title || recipeData.name,
          description: recipeData.description,
          ingredients: recipeData.ingredients?.map(ing => ({
            _id: new Realm.BSON.ObjectId(),
            name: typeof ing === 'string' ? ing : ing.name,
            amount: typeof ing === 'string' ? null : (ing.amount || null),
            unit: ing.unit || null,
            notes: ing.notes || null,
            isOptional: ing.isOptional || false,
            originalIngredient: ing.originalIngredient || null,
            substitutionReason: ing.substitutionReason || null
          })) || [],
          instructions: Array.isArray(recipeData.instructions)
            ? recipeData.instructions
            : [recipeData.instructions || ''],
          prepTime: this.parseToNumber(recipeData.prepTime),
          cookTime: this.parseToNumber(recipeData.cookTime || recipeData.cookingTime),
          servings: this.parseToNumber(recipeData.servings),
          difficulty: recipeData.difficulty || null,
          cuisine: recipeData.cuisine || null,
          tags: recipeData.tags || [],
          imageUrl: recipeData.imageUrl || recipeData.image || null,
          isFavorite: recipeData.isFavorite || false,
          createdAt: new Date(),
          updatedAt: new Date(),
          source: recipeData.source || null,
          adaptations: [],

          // Nuevos campos del prompt mejorado
          nutritionInfo: nutritionInfo,
          tips: recipeData.tips || [],
          warnings: recipeData.warnings || [],
          shoppingNotes: recipeData.shoppingNotes || [],
          alternativeIngredients: alternativeIngredients,
          alternativeCookingMethods: recipeData.alternatives?.cookingMethods || null,

          // Campos para recetas adaptadas
          isAdapted: recipeData.adapted || recipeData.isAdapted || false,
          originalRecipeId: recipeData.originalRecipe ? new Realm.BSON.ObjectId(recipeData.originalRecipe.id || recipeData.originalRecipe._id) : null,
          userComments: recipeData.userComments || null,
          userPreferences: recipeData.userPreferences ? JSON.stringify(recipeData.userPreferences) : null,
          adaptationSummary: adaptationSummary,
          adaptedAt: recipeData.adaptedAt ? new Date(recipeData.adaptedAt) : null
        });
      });

      console.log('✅ REALM - Receta creada con ID:', recipe._id.toString());
      return this._recipeToPlainObject(recipe);
    } catch (error) {
      console.error('❌ REALM - Error creando receta:', error);
      throw error;
    }
  }

  async getAllRecipes() {
    if (!this.realm) throw new Error('Base de datos no inicializada');

    try {
      console.log('📋 REALM - Obteniendo todas las recetas');
      const recipes = this.realm.objects('Recipe').sorted('createdAt', true);
      const recipesArray = Array.from(recipes).map(recipe => this._recipeToPlainObject(recipe));
      console.log(`📊 REALM - Encontradas ${recipesArray.length} recetas`);
      return recipesArray;
    } catch (error) {
      console.error('❌ REALM - Error obteniendo recetas:', error);
      throw error;
    }
  }

  async getRecipeById(id) {
    if (!this.realm) throw new Error('Base de datos no inicializada');

    try {
      console.log('🔍 REALM - Buscando receta con ID:', id);
      const objectId = typeof id === 'string' ? new Realm.BSON.ObjectId(id) : id;
      const recipe = this.realm.objectForPrimaryKey('Recipe', objectId);

      if (recipe) {
        console.log('✅ REALM - Receta encontrada:', recipe.title);
        return this._recipeToPlainObject(recipe);
      } else {
        console.log('❌ REALM - Receta no encontrada');
        return null;
      }
    } catch (error) {
      console.error('❌ REALM - Error buscando receta:', error);
      throw error;
    }
  }

  async updateRecipe(id, updates) {
    if (!this.realm) throw new Error('Base de datos no inicializada');

    try {
      console.log('✏️ REALM - Actualizando receta:', id);
      const objectId = typeof id === 'string' ? new Realm.BSON.ObjectId(id) : id;
      const recipe = this.realm.objectForPrimaryKey('Recipe', objectId);

      if (!recipe) {
        console.log('❌ REALM - Receta no encontrada para actualizar');
        return false;
      }

      this.realm.write(() => {
        if (updates.title || updates.name) recipe.title = updates.title || updates.name;
        if (updates.description) recipe.description = updates.description;
        if (updates.difficulty) recipe.difficulty = updates.difficulty;
        if (updates.cuisine) recipe.cuisine = updates.cuisine;
        if (updates.prepTime) recipe.prepTime = this.parseToNumber(updates.prepTime);
        if (updates.cookTime || updates.cookingTime) recipe.cookTime = this.parseToNumber(updates.cookTime || updates.cookingTime);
        if (updates.servings) recipe.servings = this.parseToNumber(updates.servings);
        if (updates.imageUrl) recipe.imageUrl = updates.imageUrl;
        if (updates.isFavorite !== undefined) recipe.isFavorite = updates.isFavorite;
        if (updates.source) recipe.source = updates.source;

        recipe.updatedAt = new Date();
      });

      console.log('✅ REALM - Receta actualizada exitosamente');
      return true;
    } catch (error) {
      console.error('❌ REALM - Error actualizando receta:', error);
      throw error;
    }
  }

  async deleteRecipe(id) {
    if (!this.realm) throw new Error('Base de datos no inicializada');

    try {
      console.log('🗑️ REALM - Eliminando receta:', id);
      const objectId = typeof id === 'string' ? new Realm.BSON.ObjectId(id) : id;
      const recipe = this.realm.objectForPrimaryKey('Recipe', objectId);

      if (!recipe) {
        console.log('❌ REALM - Receta no encontrada para eliminar');
        return false;
      }

      this.realm.write(() => {
        this.realm.delete(recipe);
      });

      console.log('✅ REALM - Receta eliminada exitosamente');
      return true;
    } catch (error) {
      console.error('❌ REALM - Error eliminando receta:', error);
      throw error;
    }
  }

  // ===== OPERACIONES DE PREFERENCIAS DE USUARIO =====

  async saveUserPreferences(userId, preferences) {
    if (!this.realm) throw new Error('Base de datos no inicializada');

    try {
      console.log('💾 REALM - Guardando preferencias para usuario:', userId);
      console.log('📋 REALM - Preferencias a guardar:', preferences);

      let userPrefs;
      this.realm.write(() => {
        // Buscar preferencias existentes
        const existingPrefs = this.realm.objects('UserPreferences').filtered('userId == $0', userId);

        if (existingPrefs.length > 0) {
          // Actualizar preferencias existentes
          userPrefs = existingPrefs[0];
          console.log('📝 REALM - Actualizando preferencias existentes');
        } else {
          // Crear nuevas preferencias
          console.log('🆕 REALM - Creando nuevas preferencias');
          userPrefs = this.realm.create('UserPreferences', {
            _id: new Realm.BSON.ObjectId(),
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
            dietaryRestrictions: [],
            allergies: [],
            intolerances: [],
            cuisinePreferences: [],
            notificationsEnabled: true
          });
        }

        // Actualizar todos los campos
        if (preferences.dietaryRestrictions !== undefined) {
          userPrefs.dietaryRestrictions = [...preferences.dietaryRestrictions];
        }
        if (preferences.allergies !== undefined) {
          userPrefs.allergies = [...preferences.allergies];
        }
        if (preferences.intolerances !== undefined) {
          userPrefs.intolerances = [...preferences.intolerances];
        }
        if (preferences.cuisinePreferences !== undefined) {
          userPrefs.cuisinePreferences = [...preferences.cuisinePreferences];
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

      console.log('✅ REALM - Preferencias guardadas exitosamente');
      return true;
    } catch (error) {
      console.error('❌ REALM - Error guardando preferencias:', error);
      throw error;
    }
  }

  async getUserPreferences(userId) {
    if (!this.realm) throw new Error('Base de datos no inicializada');

    try {
      console.log('📖 REALM - Obteniendo preferencias para usuario:', userId);
      const userPrefs = this.realm.objects('UserPreferences').filtered('userId == $0', userId);

      if (userPrefs.length > 0) {
        const prefs = userPrefs[0];
        const result = {
          dietaryRestrictions: Array.from(prefs.dietaryRestrictions),
          allergies: Array.from(prefs.allergies),
          intolerances: Array.from(prefs.intolerances),
          cuisinePreferences: Array.from(prefs.cuisinePreferences),
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
        console.log('✅ REALM - Preferencias encontradas:', result);
        return result;
      } else {
        console.log('📭 REALM - No se encontraron preferencias para el usuario');
        return null;
      }
    } catch (error) {
      console.error('❌ REALM - Error obteniendo preferencias:', error);
      throw error;
    }
  }

  // ===== OPERACIONES DE LISTAS DE COMPRAS =====

  async createShoppingList(name) {
    if (!this.realm) throw new Error('Base de datos no inicializada');

    try {
      console.log('🛒 REALM - Creando lista de compras:', name);

      let shoppingList;
      this.realm.write(() => {
        shoppingList = this.realm.create('ShoppingList', {
          _id: new Realm.BSON.ObjectId(),
          name: name,
          items: [],
          isCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      console.log('✅ REALM - Lista de compras creada con ID:', shoppingList._id.toString());
      return true;
    } catch (error) {
      console.error('❌ REALM - Error creando lista de compras:', error);
      return false;
    }
  }

  async getAllShoppingLists() {
    if (!this.realm) throw new Error('Base de datos no inicializada');

    try {
      console.log('📋 REALM - Obteniendo todas las listas de compras');
      const lists = this.realm.objects('ShoppingList').sorted('createdAt', true);
      const listsArray = Array.from(lists).map(list => ({
        id: list._id.toString(),
        name: list.name,
        items: Array.from(list.items).map(item => ({
          id: item._id.toString(),
          name: item.name,
          amount: item.amount,
          unit: item.unit,
          isCompleted: item.isCompleted,
          notes: item.notes,
          category: item.category
        })),
        isCompleted: list.isCompleted,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt
      }));
      console.log(`📊 REALM - Encontradas ${listsArray.length} listas de compras`);
      return listsArray;
    } catch (error) {
      console.error('❌ REALM - Error obteniendo listas de compras:', error);
      throw error;
    }
  }

  // ===== OPERACIONES DE PRUEBA =====

  async testDatabase() {
    console.log('🧪 REALM - Iniciando prueba de base de datos');

    try {
      if (!this.realm || !this.isInitialized) {
        return {
          success: false,
          message: 'Base de datos no inicializada',
          timestamp: new Date().toISOString()
        };
      }

      // Crear objeto de prueba
      let testRecipe;
      this.realm.write(() => {
        testRecipe = this.realm.create('Recipe', {
          _id: new Realm.BSON.ObjectId(),
          title: 'Receta de Prueba',
          description: 'Esta es una receta de prueba para validar Realm',
          ingredients: [],
          instructions: ['Paso de prueba'],
          isFavorite: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: []
        });
      });

      // Leer objeto
      const foundRecipe = this.realm.objectForPrimaryKey('Recipe', testRecipe._id);

      // Eliminar objeto de prueba
      this.realm.write(() => {
        this.realm.delete(testRecipe);
      });

      console.log('✅ REALM - Prueba completada exitosamente');
      return {
        success: true,
        message: 'Realm Database funcionando correctamente',
        tests: [
          'Inicialización ✅',
          'Crear objeto ✅',
          'Leer objeto ✅',
          'Eliminar objeto ✅'
        ],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ REALM - Error en prueba:', error);
      return {
        success: false,
        message: `Error en prueba: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ===== UTILIDADES PRIVADAS =====

  _recipeToPlainObject(recipe) {
    // Procesar información nutricional
    let nutrition = null;
    if (recipe.nutritionInfo) {
      nutrition = {
        calories: recipe.nutritionInfo.calories?.toString() || null,
        protein: recipe.nutritionInfo.protein?.toString() || null,
        carbs: recipe.nutritionInfo.carbs?.toString() || null,
        fat: recipe.nutritionInfo.fat?.toString() || null,
        fiber: recipe.nutritionInfo.fiber?.toString() || null,
        sodium: recipe.nutritionInfo.sodium?.toString() || null
      };
    }

    // Procesar resumen de adaptación
    let adaptationSummary = null;
    if (recipe.adaptationSummary) {
      adaptationSummary = {
        majorChanges: Array.from(recipe.adaptationSummary.majorChanges),
        substitutions: Array.from(recipe.adaptationSummary.substitutions).map(sub => ({
          original: sub.original,
          replacement: sub.replacement,
          reason: sub.reason
        })),
        nutritionImprovements: Array.from(recipe.adaptationSummary.nutritionImprovements),
        timeAdjustments: recipe.adaptationSummary.timeAdjustments
      };
    }

    // Procesar ingredientes alternativos
    const alternatives = {
      ingredients: Array.from(recipe.alternativeIngredients).map(alt => ({
        ingredient: alt.ingredient,
        alternatives: Array.from(alt.alternatives)
      })),
      cookingMethods: recipe.alternativeCookingMethods
    };

    return {
      id: recipe._id.toString(),
      title: recipe.title,
      name: recipe.title, // Alias para compatibilidad
      description: recipe.description,
      ingredients: Array.from(recipe.ingredients).map(ing => ({
        id: ing._id.toString(),
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        notes: ing.notes,
        isOptional: ing.isOptional,
        originalIngredient: ing.originalIngredient,
        substitutionReason: ing.substitutionReason
      })),
      instructions: Array.from(recipe.instructions),
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      cookingTime: recipe.cookTime, // Alias para compatibilidad
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      cuisine: recipe.cuisine,
      tags: Array.from(recipe.tags),
      imageUrl: recipe.imageUrl,
      image: recipe.imageUrl, // Alias para compatibilidad
      isFavorite: recipe.isFavorite,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      source: recipe.source,

      // Nuevos campos del prompt mejorado
      nutrition: nutrition,
      tips: Array.from(recipe.tips),
      warnings: Array.from(recipe.warnings),
      shoppingNotes: Array.from(recipe.shoppingNotes),
      alternatives: alternatives,
      adaptationSummary: adaptationSummary,

      // Campos para recetas adaptadas
      isAdapted: recipe.isAdapted,
      adapted: recipe.isAdapted, // Alias para compatibilidad
      originalRecipeId: recipe.originalRecipeId?.toString() || null,
      userComments: recipe.userComments,
      userPreferences: recipe.userPreferences ? JSON.parse(recipe.userPreferences) : null,
      adaptedAt: recipe.adaptedAt
    };
  }

  // ===== LIMPIAR BASE DE DATOS =====
  async clearAllRecipes() {
    await this.ensureInitialized();
    console.log('🗑️ REALM DB - Limpiando todas las recetas...');

    try {
      this.realm.write(() => {
        // Eliminar todas las recetas
        const allRecipes = this.realm.objects('Recipe');
        this.realm.delete(allRecipes);

        // Eliminar todos los ingredientes
        const allIngredients = this.realm.objects('Ingredient');
        this.realm.delete(allIngredients);

        console.log('✅ REALM DB - Todas las recetas han sido eliminadas');
      });

      return true;
    } catch (error) {
      console.error('❌ REALM DB - Error limpiando recetas:', error);
      throw error;
    }
  }
}

// Crear instancia única
const realmDatabaseService = new RealmDatabaseService();

export default realmDatabaseService;