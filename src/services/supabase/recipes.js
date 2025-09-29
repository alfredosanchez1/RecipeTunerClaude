import { supabase, TABLES, withErrorHandling } from './client';

/**
 * Servicio de gestión de recetas para RecipeTuner con Supabase
 * Maneja CRUD de recetas con verificación de límites de suscripción
 */

// ===== OPERACIONES CRUD DE RECETAS =====

/**
 * Crear nueva receta
 */
export const createRecipe = async (recipeData) => {
  try {
    console.log('📝 Creando receta:', recipeData.title);

    // Verificar límite de recetas antes de crear
    const canCreate = await checkRecipeLimit();
    if (!canCreate.allowed) {
      throw new Error(`Límite de recetas alcanzado. ${canCreate.message}`);
    }

    // Obtener user_id del perfil
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data: profile } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile) throw new Error('Perfil de usuario no encontrado');

    // Preparar datos de la receta
    const recipe = {
      user_id: profile.id,
      title: recipeData.title,
      description: recipeData.description || null,
      ingredients: recipeData.ingredients || [],
      instructions: recipeData.instructions || [],
      prep_time: recipeData.prepTime || null,
      cook_time: recipeData.cookTime || null,
      servings: recipeData.servings || null,
      difficulty: recipeData.difficulty || null,
      cuisine: recipeData.cuisine || null,
      tags: recipeData.tags || [],
      image_url: recipeData.imageUrl || null,
      is_favorite: recipeData.isFavorite || false,
      source: recipeData.source || null,
      tips: recipeData.tips || [],
      warnings: recipeData.warnings || [],
      shopping_notes: recipeData.shoppingNotes || [],
      alternative_cooking_methods: recipeData.alternativeCookingMethods || null,
      is_adapted: recipeData.isAdapted || false,
      // No pasar original_recipe_id si es un ObjectId de Realm (no es UUID válido)
      // original_recipe_id: null, // Supabase generará su propio UUID
      user_comments: recipeData.userComments || null,
      user_preferences: recipeData.userPreferences || null,
      adaptation_summary: recipeData.adaptationSummary || null,
      adapted_at: recipeData.adaptedAt || null
    };

    const { data, error } = await supabase
      .from(TABLES.RECIPES)
      .insert([recipe])
      .select(`
        *,
        nutrition_info:${TABLES.NUTRITION_INFO}(*)
      `)
      .single();

    if (error) {
      console.error('❌ Error creando receta:', error);
      throw error;
    }

    console.log('✅ Receta creada:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Error creando receta:', error);
    throw error;
  }
};

/**
 * Obtener todas las recetas del usuario
 */
export const getAllRecipes = async (options = {}) => {
  try {
    console.log('📋 Obteniendo recetas del usuario');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Obtener user_id del perfil
    const { data: profile } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile) throw new Error('Perfil de usuario no encontrado');

    let query = supabase
      .from(TABLES.RECIPES)
      .select(`
        *,
        nutrition_info:${TABLES.NUTRITION_INFO}(*)
      `)
      .eq('user_id', profile.id) // 🔥 FILTRAR POR USER_ID (importante para RLS y performance)
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (options.favorites) {
      query = query.eq('is_favorite', true);
    }

    if (options.cuisine) {
      query = query.eq('cuisine', options.cuisine);
    }

    if (options.difficulty) {
      query = query.eq('difficulty', options.difficulty);
    }

    if (options.tags && options.tags.length > 0) {
      query = query.overlaps('tags', options.tags);
    }

    if (options.search) {
      query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo recetas:', error);
      throw error;
    }

    console.log(`✅ Encontradas ${data.length} recetas`);
    return data;
  } catch (error) {
    console.error('❌ Error obteniendo recetas:', error);
    throw error;
  }
};

/**
 * Obtener receta por ID
 */
export const getRecipeById = async (recipeId) => {
  try {
    console.log('🔍 Obteniendo receta:', recipeId);

    const { data, error } = await supabase
      .from(TABLES.RECIPES)
      .select(`
        *,
        nutrition_info:${TABLES.NUTRITION_INFO}(*)
      `)
      .eq('id', recipeId)
      .single();

    if (error) {
      console.error('❌ Error obteniendo receta:', error);
      throw error;
    }

    console.log('✅ Receta encontrada:', data.title);
    return data;
  } catch (error) {
    console.error('❌ Error obteniendo receta:', error);
    throw error;
  }
};

/**
 * Actualizar receta
 */
export const updateRecipe = async (recipeId, updates) => {
  try {
    console.log('✏️ Actualizando receta:', recipeId);

    // Preparar actualizaciones
    const recipeUpdates = {
      title: updates.title,
      description: updates.description,
      ingredients: updates.ingredients,
      instructions: updates.instructions,
      prep_time: updates.prepTime,
      cook_time: updates.cookTime,
      servings: updates.servings,
      difficulty: updates.difficulty,
      cuisine: updates.cuisine,
      tags: updates.tags,
      image_url: updates.imageUrl,
      is_favorite: updates.isFavorite,
      source: updates.source,
      tips: updates.tips,
      warnings: updates.warnings,
      shopping_notes: updates.shoppingNotes,
      alternative_cooking_methods: updates.alternativeCookingMethods,
      user_comments: updates.userComments,
      user_preferences: updates.userPreferences,
      updated_at: new Date().toISOString()
    };

    // Remover valores undefined
    Object.keys(recipeUpdates).forEach(key => {
      if (recipeUpdates[key] === undefined) {
        delete recipeUpdates[key];
      }
    });

    const { data, error } = await supabase
      .from(TABLES.RECIPES)
      .update(recipeUpdates)
      .eq('id', recipeId)
      .select(`
        *,
        nutrition_info:${TABLES.NUTRITION_INFO}(*)
      `)
      .single();

    if (error) {
      console.error('❌ Error actualizando receta:', error);
      throw error;
    }

    console.log('✅ Receta actualizada');
    return data;
  } catch (error) {
    console.error('❌ Error actualizando receta:', error);
    throw error;
  }
};

/**
 * Eliminar receta
 */
export const deleteRecipe = async (recipeId) => {
  try {
    console.log('🗑️ Eliminando receta:', recipeId);

    const { error } = await supabase
      .from(TABLES.RECIPES)
      .delete()
      .eq('id', recipeId);

    if (error) {
      console.error('❌ Error eliminando receta:', error);
      throw error;
    }

    console.log('✅ Receta eliminada');
    return true;
  } catch (error) {
    console.error('❌ Error eliminando receta:', error);
    throw error;
  }
};

/**
 * Marcar/desmarcar receta como favorita
 */
export const toggleRecipeFavorite = async (recipeId, isFavorite) => {
  try {
    console.log('⭐ Cambiando favorito:', recipeId, isFavorite);

    const { data, error } = await supabase
      .from(TABLES.RECIPES)
      .update({
        is_favorite: isFavorite,
        updated_at: new Date().toISOString()
      })
      .eq('id', recipeId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error cambiando favorito:', error);
      throw error;
    }

    console.log('✅ Favorito actualizado');
    return data;
  } catch (error) {
    console.error('❌ Error cambiando favorito:', error);
    throw error;
  }
};

// ===== GESTIÓN DE INFORMACIÓN NUTRICIONAL =====

/**
 * Crear o actualizar información nutricional
 */
export const upsertNutritionInfo = async (recipeId, nutritionData) => {
  try {
    console.log('🥗 Guardando información nutricional:', recipeId);

    const nutrition = {
      recipe_id: recipeId,
      calories: nutritionData.calories || null,
      protein: nutritionData.protein || null,
      carbs: nutritionData.carbs || null,
      fat: nutritionData.fat || null,
      fiber: nutritionData.fiber || null,
      sugar: nutritionData.sugar || null,
      sodium: nutritionData.sodium || null
    };

    const { data, error } = await supabase
      .from(TABLES.NUTRITION_INFO)
      .upsert([nutrition], {
        onConflict: 'recipe_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error guardando nutrición:', error);
      throw error;
    }

    console.log('✅ Información nutricional guardada');
    return data;
  } catch (error) {
    console.error('❌ Error guardando nutrición:', error);
    throw error;
  }
};

// ===== VERIFICACIÓN DE LÍMITES =====

/**
 * Verificar límite de recetas del usuario
 */
export const checkRecipeLimit = async () => {
  try {
    console.log('📊 Verificando límite de recetas');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Llamar función SQL para verificar límites
    const { data, error } = await supabase
      .rpc('recipetuner_get_user_subscription_info', {
        user_uuid: user.id
      });

    if (error) {
      console.error('❌ Error verificando límites:', error);
      throw error;
    }

    const info = data[0];

    return {
      allowed: info.can_create_recipe,
      current: info.recipe_count,
      limit: info.recipe_limit,
      hasSubscription: info.has_active_subscription,
      planName: info.plan_name,
      message: info.can_create_recipe
        ? `${info.recipe_count}/${info.recipe_limit} recetas usadas`
        : `Límite alcanzado (${info.recipe_count}/${info.recipe_limit}). ${info.has_active_subscription ? 'Contacta soporte' : 'Actualiza tu plan'}`
    };
  } catch (error) {
    console.error('❌ Error verificando límites:', error);
    // En caso de error, permitir crear (failsafe)
    return {
      allowed: true,
      current: 0,
      limit: 5,
      hasSubscription: false,
      planName: 'Free',
      message: 'No se pudo verificar límite'
    };
  }
};

/**
 * Obtener estadísticas de recetas del usuario
 */
export const getRecipeStats = async () => {
  try {
    console.log('📈 Obteniendo estadísticas de recetas');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Obtener información de suscripción
    const { data: subscriptionInfo } = await supabase
      .rpc('recipetuner_get_user_subscription_info', {
        user_uuid: user.id
      });

    // Obtener estadísticas adicionales
    const { data: recipes } = await supabase
      .from(TABLES.RECIPES)
      .select('cuisine, difficulty, is_favorite, created_at');

    if (!recipes) return null;

    // Calcular estadísticas
    const stats = {
      total: recipes.length,
      favorites: recipes.filter(r => r.is_favorite).length,
      cuisines: [...new Set(recipes.map(r => r.cuisine).filter(Boolean))].length,
      difficulties: recipes.reduce((acc, r) => {
        if (r.difficulty) {
          acc[r.difficulty] = (acc[r.difficulty] || 0) + 1;
        }
        return acc;
      }, {}),
      recentCount: recipes.filter(r => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(r.created_at) > weekAgo;
      }).length,
      subscription: subscriptionInfo?.[0] || {
        has_active_subscription: false,
        plan_name: 'Free',
        recipe_count: recipes.length,
        recipe_limit: 5,
        can_create_recipe: recipes.length < 5
      }
    };

    console.log('✅ Estadísticas calculadas');
    return stats;
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    throw error;
  }
};

// ===== BÚSQUEDA Y FILTROS =====

/**
 * Buscar recetas con filtros avanzados
 */
export const searchRecipes = async (searchParams) => {
  try {
    console.log('🔍 Buscando recetas con filtros:', searchParams);

    const {
      query,
      cuisine,
      difficulty,
      tags,
      maxPrepTime,
      maxCookTime,
      minServings,
      maxServings,
      favorites,
      ingredients,
      sortBy = 'created_at',
      sortOrder = 'desc',
      limit = 50
    } = searchParams;

    let supabaseQuery = supabase
      .from(TABLES.RECIPES)
      .select(`
        *,
        nutrition_info:${TABLES.NUTRITION_INFO}(*)
      `);

    // Filtro de texto
    if (query) {
      supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    }

    // Filtros específicos
    if (cuisine) {
      supabaseQuery = supabaseQuery.eq('cuisine', cuisine);
    }

    if (difficulty) {
      supabaseQuery = supabaseQuery.eq('difficulty', difficulty);
    }

    if (favorites) {
      supabaseQuery = supabaseQuery.eq('is_favorite', true);
    }

    if (tags && tags.length > 0) {
      supabaseQuery = supabaseQuery.overlaps('tags', tags);
    }

    if (maxPrepTime) {
      supabaseQuery = supabaseQuery.lte('prep_time', maxPrepTime);
    }

    if (maxCookTime) {
      supabaseQuery = supabaseQuery.lte('cook_time', maxCookTime);
    }

    if (minServings) {
      supabaseQuery = supabaseQuery.gte('servings', minServings);
    }

    if (maxServings) {
      supabaseQuery = supabaseQuery.lte('servings', maxServings);
    }

    if (ingredients && ingredients.length > 0) {
      // Buscar en el array de ingredientes
      const ingredientFilters = ingredients.map(ing => `ingredients.cs.{"${ing}"}`);
      supabaseQuery = supabaseQuery.or(ingredientFilters.join(','));
    }

    // Ordenamiento
    const ascending = sortOrder === 'asc';
    supabaseQuery = supabaseQuery.order(sortBy, { ascending });

    // Límite
    supabaseQuery = supabaseQuery.limit(limit);

    const { data, error } = await supabaseQuery;

    if (error) {
      console.error('❌ Error en búsqueda:', error);
      throw error;
    }

    console.log(`✅ Búsqueda completada: ${data.length} resultados`);
    return data;
  } catch (error) {
    console.error('❌ Error en búsqueda:', error);
    throw error;
  }
};

export default {
  createRecipe,
  getAllRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  toggleRecipeFavorite,
  upsertNutritionInfo,
  checkRecipeLimit,
  getRecipeStats,
  searchRecipes
};