/**
 * Servicio de migración de Realm a Supabase para RecipeTuner
 * Maneja la transferencia de datos existentes y la transición gradual
 */

import realmDatabaseV2 from '../realmDatabaseV2';
import authService from '../supabase/auth';
import recipeService from '../supabase/recipes';
import subscriptionService from '../supabase/subscriptions';
import { supabase } from '../supabase/client';

/**
 * Estado de la migración
 */
export const MIGRATION_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PARTIAL: 'partial'
};

/**
 * Clase principal de migración
 */
class RealmToSupabaseMigration {
  constructor() {
    this.status = MIGRATION_STATUS.NOT_STARTED;
    this.progress = 0;
    this.errors = [];
    this.migratedItems = {
      users: 0,
      recipes: 0,
      preferences: 0
    };
  }

  /**
   * Iniciar migración completa
   */
  async startMigration(userId = 'default') {
    try {
      console.log('🚀 Iniciando migración de Realm a Supabase...');
      this.status = MIGRATION_STATUS.IN_PROGRESS;
      this.progress = 0;

      // 1. Verificar conexiones
      await this.verifyConnections();
      this.progress = 10;

      // 2. Migrar preferencias de usuario
      await this.migrateUserPreferences(userId);
      this.progress = 30;

      // 3. Migrar recetas
      await this.migrateRecipes();
      this.progress = 80;

      // 4. Verificar integridad
      await this.verifyMigration();
      this.progress = 100;

      this.status = MIGRATION_STATUS.COMPLETED;
      console.log('✅ Migración completada exitosamente');

      return {
        success: true,
        status: this.status,
        migratedItems: this.migratedItems,
        errors: this.errors
      };

    } catch (error) {
      console.error('❌ Error en migración:', error);
      this.status = MIGRATION_STATUS.FAILED;
      this.errors.push(error.message);

      return {
        success: false,
        status: this.status,
        migratedItems: this.migratedItems,
        errors: this.errors
      };
    }
  }

  /**
   * Verificar conexiones a ambas bases de datos
   */
  async verifyConnections() {
    try {
      console.log('🔍 Verificando conexiones...');

      // Verificar Realm
      if (!realmDatabaseV2.isInitialized) {
        await realmDatabaseV2.init();
      }

      const realmTest = await realmDatabaseV2.testDatabase();
      if (!realmTest.success) {
        throw new Error(`Realm no disponible: ${realmTest.message}`);
      }

      // Verificar Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado en Supabase');
      }

      console.log('✅ Conexiones verificadas');
    } catch (error) {
      console.error('❌ Error verificando conexiones:', error);
      throw error;
    }
  }

  /**
   * Migrar preferencias de usuario
   */
  async migrateUserPreferences(userId) {
    try {
      console.log('👤 Migrando preferencias de usuario...');

      // Obtener preferencias de Realm
      const realmPreferences = await realmDatabaseV2.getUserPreferences(userId);

      if (realmPreferences) {
        // Convertir formato de Realm a Supabase
        const supabasePreferences = {
          dietary_restrictions: realmPreferences.dietaryRestrictions || [],
          allergies: realmPreferences.allergies || [],
          intolerances: realmPreferences.intolerances || [],
          cuisine_preferences: realmPreferences.cuisinePreferences || [],
          cooking_time_preference: realmPreferences.cookingTimePreference,
          difficulty_level: realmPreferences.difficultyLevel,
          serving_size: realmPreferences.servingSize,
          measurement_unit: realmPreferences.measurementUnit,
          notifications_enabled: realmPreferences.notificationsEnabled,
          onboarding_complete: realmPreferences.onboardingComplete,
          theme: realmPreferences.theme,
          language: realmPreferences.language
        };

        // Guardar en Supabase
        const { data: { user } } = await supabase.auth.getUser();
        await authService.updateUserPreferences(user.id, supabasePreferences);

        this.migratedItems.preferences = 1;
        console.log('✅ Preferencias migradas');
      } else {
        console.log('📭 No se encontraron preferencias para migrar');
      }
    } catch (error) {
      console.error('❌ Error migrando preferencias:', error);
      this.errors.push(`Preferencias: ${error.message}`);
    }
  }

  /**
   * Migrar recetas
   */
  async migrateRecipes() {
    try {
      console.log('📝 Migrando recetas...');

      // Obtener todas las recetas de Realm
      const realmRecipes = await realmDatabaseV2.getAllRecipes();

      if (!realmRecipes || realmRecipes.length === 0) {
        console.log('📭 No se encontraron recetas para migrar');
        return;
      }

      console.log(`📊 Encontradas ${realmRecipes.length} recetas para migrar`);

      let migratedCount = 0;
      const totalRecipes = realmRecipes.length;

      for (const realmRecipe of realmRecipes) {
        try {
          // Convertir formato de Realm a Supabase
          const supabaseRecipe = this.convertRealmRecipeToSupabase(realmRecipe);

          // Verificar límite antes de crear
          const canCreate = await recipeService.checkRecipeLimit();
          if (!canCreate.allowed) {
            console.warn('⚠️ Límite de recetas alcanzado, deteniendo migración');
            this.errors.push(`Límite alcanzado después de ${migratedCount} recetas`);
            break;
          }

          // Crear receta en Supabase
          const createdRecipe = await recipeService.createRecipe(supabaseRecipe);

          migratedCount++;
          this.migratedItems.recipes = migratedCount;

          // Actualizar progreso
          const recipeProgress = (migratedCount / totalRecipes) * 50; // 50% del progreso total
          this.progress = 30 + recipeProgress;

          console.log(`✅ Receta migrada: ${createdRecipe.title} (${migratedCount}/${totalRecipes})`);

          // Pequeña pausa para evitar rate limiting
          await this.sleep(100);

        } catch (error) {
          console.error(`❌ Error migrando receta ${realmRecipe.title}:`, error);
          this.errors.push(`Receta "${realmRecipe.title}": ${error.message}`);
        }
      }

      console.log(`✅ Migración de recetas completada: ${migratedCount}/${totalRecipes}`);

    } catch (error) {
      console.error('❌ Error migrando recetas:', error);
      this.errors.push(`Recetas generales: ${error.message}`);
    }
  }

  /**
   * Convertir receta de formato Realm a formato Supabase
   */
  convertRealmRecipeToSupabase(realmRecipe) {
    return {
      title: realmRecipe.title,
      description: realmRecipe.description,
      ingredients: realmRecipe.ingredients || [],
      instructions: realmRecipe.instructions || [],
      prepTime: realmRecipe.prepTime,
      cookTime: realmRecipe.cookTime,
      servings: realmRecipe.servings,
      difficulty: realmRecipe.difficulty,
      cuisine: realmRecipe.cuisine,
      tags: realmRecipe.tags || [],
      imageUrl: realmRecipe.imageUrl,
      isFavorite: realmRecipe.isFavorite || false,
      source: realmRecipe.source,
      // Campos adicionales si existen
      tips: realmRecipe.tips || [],
      warnings: realmRecipe.warnings || [],
      shoppingNotes: realmRecipe.shoppingNotes || [],
      alternativeCookingMethods: realmRecipe.alternativeCookingMethods,
      isAdapted: realmRecipe.isAdapted || false,
      originalRecipeId: realmRecipe.originalRecipeId,
      userComments: realmRecipe.userComments,
      userPreferences: realmRecipe.userPreferences,
      adaptationSummary: realmRecipe.adaptationSummary,
      adaptedAt: realmRecipe.adaptedAt
    };
  }

  /**
   * Verificar integridad de la migración
   */
  async verifyMigration() {
    try {
      console.log('🔍 Verificando integridad de la migración...');

      // Contar items en ambas bases de datos
      const realmRecipes = await realmDatabaseV2.getAllRecipes();
      const supabaseRecipes = await recipeService.getAllRecipes();

      const realmCount = realmRecipes?.length || 0;
      const supabaseCount = supabaseRecipes?.length || 0;

      console.log(`📊 Comparación: Realm=${realmCount}, Supabase=${supabaseCount}`);

      // Verificar que se migraron correctamente
      if (supabaseCount < realmCount && this.errors.length === 0) {
        this.status = MIGRATION_STATUS.PARTIAL;
        this.errors.push(`Migración parcial: ${supabaseCount}/${realmCount} recetas`);
      }

      console.log('✅ Verificación completada');
    } catch (error) {
      console.error('❌ Error verificando migración:', error);
      this.errors.push(`Verificación: ${error.message}`);
    }
  }

  /**
   * Obtener estado actual de la migración
   */
  getStatus() {
    return {
      status: this.status,
      progress: this.progress,
      migratedItems: this.migratedItems,
      errors: this.errors
    };
  }

  /**
   * Reiniciar migración
   */
  reset() {
    this.status = MIGRATION_STATUS.NOT_STARTED;
    this.progress = 0;
    this.errors = [];
    this.migratedItems = {
      users: 0,
      recipes: 0,
      preferences: 0
    };
  }

  /**
   * Pausa para rate limiting
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Migración incremental (solo nuevas recetas)
   */
  async migrateNewRecipes(lastMigrationDate) {
    try {
      console.log('🔄 Migrando recetas nuevas desde:', lastMigrationDate);

      const realmRecipes = await realmDatabaseV2.getAllRecipes();
      const newRecipes = realmRecipes.filter(recipe =>
        new Date(recipe.createdAt) > new Date(lastMigrationDate)
      );

      if (newRecipes.length === 0) {
        console.log('📭 No hay recetas nuevas para migrar');
        return { success: true, migratedCount: 0 };
      }

      let migratedCount = 0;
      for (const recipe of newRecipes) {
        try {
          const supabaseRecipe = this.convertRealmRecipeToSupabase(recipe);
          await recipeService.createRecipe(supabaseRecipe);
          migratedCount++;
        } catch (error) {
          console.error(`❌ Error migrando receta nueva ${recipe.title}:`, error);
        }
      }

      console.log(`✅ Migradas ${migratedCount}/${newRecipes.length} recetas nuevas`);
      return { success: true, migratedCount };

    } catch (error) {
      console.error('❌ Error en migración incremental:', error);
      return { success: false, error: error.message };
    }
  }
}

// Instancia singleton
const migration = new RealmToSupabaseMigration();

// ===== FUNCIONES EXPORTADAS =====

/**
 * Iniciar migración completa
 */
export const startFullMigration = async (userId = 'default') => {
  return await migration.startMigration(userId);
};

/**
 * Obtener estado de migración
 */
export const getMigrationStatus = () => {
  return migration.getStatus();
};

/**
 * Migración incremental
 */
export const migrateNewItems = async (lastMigrationDate) => {
  return await migration.migrateNewRecipes(lastMigrationDate);
};

/**
 * Reiniciar migración
 */
export const resetMigration = () => {
  migration.reset();
};

/**
 * Verificar si es necesaria una migración
 */
export const isMigrationNeeded = async () => {
  try {
    // Verificar si hay datos en Realm
    if (!realmDatabaseV2.isInitialized) {
      await realmDatabaseV2.init();
    }

    const realmRecipes = await realmDatabaseV2.getAllRecipes();
    const hasRealmData = realmRecipes && realmRecipes.length > 0;

    // Verificar si hay datos en Supabase
    const supabaseRecipes = await recipeService.getAllRecipes();
    const hasSupabaseData = supabaseRecipes && supabaseRecipes.length > 0;

    return {
      needed: hasRealmData && !hasSupabaseData,
      realmCount: realmRecipes?.length || 0,
      supabaseCount: supabaseRecipes?.length || 0,
      reason: hasRealmData && !hasSupabaseData ? 'realm_data_exists' : 'not_needed'
    };

  } catch (error) {
    console.error('❌ Error verificando necesidad de migración:', error);
    return {
      needed: false,
      error: error.message
    };
  }
};

/**
 * Migración de solo preferencias
 */
export const migrateUserPreferencesOnly = async (userId = 'default') => {
  try {
    const migrationInstance = new RealmToSupabaseMigration();
    await migrationInstance.verifyConnections();
    await migrationInstance.migrateUserPreferences(userId);

    return {
      success: true,
      migratedItems: migrationInstance.migratedItems,
      errors: migrationInstance.errors
    };
  } catch (error) {
    console.error('❌ Error migrando solo preferencias:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  startFullMigration,
  getMigrationStatus,
  migrateNewItems,
  resetMigration,
  isMigrationNeeded,
  migrateUserPreferencesOnly,
  MIGRATION_STATUS
};