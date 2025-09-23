import { supabase, TABLES, withErrorHandling } from './client';

/**
 * Servicio de autenticación para RecipeTuner con Supabase
 * Maneja registro, login, logout y gestión de perfiles de usuario
 */

// ===== AUTENTICACIÓN =====

/**
 * Registrar nuevo usuario
 */
export const signUp = async (email, password, userData = {}) => {
  try {
    console.log('🔐 Registrando usuario:', email);

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          app_name: 'recipetuner',
          name: userData.name || 'Usuario',
          ...userData
        }
      }
    });

    if (authError) {
      console.error('❌ Error en registro de auth:', authError);
      throw authError;
    }

    console.log('✅ Usuario registrado en Auth:', authData.user?.id);

    // 2. Si el usuario se creó exitosamente, crear perfil en recipetuner_users
    if (authData.user) {
      await createUserProfile(authData.user, userData);
    }

    return {
      user: authData.user,
      session: authData.session,
      needsEmailConfirmation: !authData.session
    };
  } catch (error) {
    console.error('❌ Error en registro:', error);
    throw error;
  }
};

/**
 * Iniciar sesión
 */
export const signIn = async (email, password) => {
  try {
    console.log('🔐 Iniciando sesión:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('❌ Error en login:', error);
      throw error;
    }

    console.log('✅ Usuario logueado:', data.user?.id);

    // Verificar/crear perfil si no existe
    if (data.user) {
      await ensureUserProfile(data.user);
    }

    return {
      user: data.user,
      session: data.session
    };
  } catch (error) {
    console.error('❌ Error en login:', error);
    throw error;
  }
};

/**
 * Cerrar sesión
 */
export const signOut = async () => {
  try {
    console.log('🔐 Cerrando sesión...');

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('❌ Error cerrando sesión:', error);
      throw error;
    }

    console.log('✅ Sesión cerrada exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error cerrando sesión:', error);
    throw error;
  }
};

/**
 * Obtener usuario actual
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('❌ Error obteniendo usuario:', error);
      throw error;
    }

    return user;
  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    throw error;
  }
};

/**
 * Obtener sesión actual
 */
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Error obteniendo sesión:', error);
      throw error;
    }

    return session;
  } catch (error) {
    console.error('❌ Error obteniendo sesión:', error);
    throw error;
  }
};

/**
 * Refrescar token de sesión
 */
export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('❌ Error refrescando sesión:', error);
      throw error;
    }

    return data.session;
  } catch (error) {
    console.error('❌ Error refrescando sesión:', error);
    throw error;
  }
};

// ===== GESTIÓN DE PERFILES =====

/**
 * Crear perfil de usuario en recipetuner_users
 */
export const createUserProfile = async (authUser, userData = {}) => {
  try {
    console.log('👤 Creando perfil de usuario:', authUser.id);

    const profileData = {
      auth_user_id: authUser.id,
      name: userData.name || authUser.user_metadata?.name || 'Usuario',
      email: authUser.email,
      avatar: userData.avatar || authUser.user_metadata?.avatar_url || null,
      app_name: 'recipetuner'
    };

    const { data, error } = await supabase
      .from(TABLES.USERS)
      .insert([profileData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando perfil:', error);
      throw error;
    }

    console.log('✅ Perfil creado:', data.id);

    // Crear preferencias por defecto
    await createDefaultUserPreferences(data.id);

    return data;
  } catch (error) {
    console.error('❌ Error creando perfil:', error);
    throw error;
  }
};

/**
 * Verificar/crear perfil si no existe
 */
export const ensureUserProfile = async (authUser) => {
  try {
    console.log('🔍 Verificando perfil de usuario:', authUser.id);

    // Buscar perfil existente
    const { data: existingProfile, error: selectError } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ Error buscando perfil:', selectError);
      throw selectError;
    }

    // Si existe, devolverlo
    if (existingProfile) {
      console.log('✅ Perfil encontrado:', existingProfile.id);
      return existingProfile;
    }

    // Si no existe, crearlo
    console.log('📝 Perfil no encontrado, creando...');
    return await createUserProfile(authUser);
  } catch (error) {
    console.error('❌ Error verificando perfil:', error);
    throw error;
  }
};

/**
 * Obtener perfil de usuario
 */
export const getUserProfile = async (authUserId) => {
  try {
    console.log('👤 Obteniendo perfil:', authUserId);

    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();

    if (error) {
      console.error('❌ Error obteniendo perfil:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    throw error;
  }
};

/**
 * Actualizar perfil de usuario
 */
export const updateUserProfile = async (authUserId, updates) => {
  try {
    console.log('✏️ Actualizando perfil:', authUserId);

    const { data, error } = await supabase
      .from(TABLES.USERS)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('auth_user_id', authUserId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando perfil:', error);
      throw error;
    }

    console.log('✅ Perfil actualizado');
    return data;
  } catch (error) {
    console.error('❌ Error actualizando perfil:', error);
    throw error;
  }
};

// ===== PREFERENCIAS DE USUARIO =====

/**
 * Crear preferencias por defecto
 */
export const createDefaultUserPreferences = async (userId) => {
  try {
    console.log('⚙️ Creando preferencias por defecto:', userId);

    const defaultPreferences = {
      user_id: userId,
      dietary_restrictions: [],
      allergies: [],
      intolerances: [],
      cuisine_preferences: [],
      cooking_time_preference: null,
      difficulty_level: 'beginner',
      serving_size: 4,
      measurement_unit: 'metric',
      notifications_enabled: true,
      onboarding_complete: false,
      theme: 'light',
      language: 'es'
    };

    const { data, error } = await supabase
      .from(TABLES.USER_PREFERENCES)
      .insert([defaultPreferences])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando preferencias:', error);
      throw error;
    }

    console.log('✅ Preferencias creadas');
    return data;
  } catch (error) {
    console.error('❌ Error creando preferencias:', error);
    throw error;
  }
};

/**
 * Obtener preferencias de usuario
 */
export const getUserPreferences = async (authUserId) => {
  try {
    console.log('⚙️ Obteniendo preferencias:', authUserId);

    const { data, error } = await supabase
      .from(TABLES.USER_PREFERENCES)
      .select(`
        *,
        user:${TABLES.USERS}!inner(auth_user_id)
      `)
      .eq('user.auth_user_id', authUserId)
      .single();

    if (error) {
      console.error('❌ Error obteniendo preferencias:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('❌ Error obteniendo preferencias:', error);
    throw error;
  }
};

/**
 * Actualizar preferencias de usuario
 */
export const updateUserPreferences = async (authUserId, preferences) => {
  try {
    console.log('⚙️ Actualizando preferencias:', authUserId);

    // Primero obtener el user_id
    const profile = await getUserProfile(authUserId);

    const { data, error } = await supabase
      .from(TABLES.USER_PREFERENCES)
      .update({
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', profile.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error actualizando preferencias:', error);
      throw error;
    }

    console.log('✅ Preferencias actualizadas');
    return data;
  } catch (error) {
    console.error('❌ Error actualizando preferencias:', error);
    throw error;
  }
};

// ===== LISTENERS DE AUTENTICACIÓN =====

/**
 * Listener para cambios de autenticación
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔄 Auth state changed:', event, session?.user?.id);
    callback(event, session);
  });
};

// ===== UTILIDADES =====

/**
 * Verificar si el usuario está autenticado
 */
export const isAuthenticated = async () => {
  try {
    const session = await getCurrentSession();
    return !!session?.user;
  } catch {
    return false;
  }
};

/**
 * Verificar si el email está confirmado
 */
export const isEmailConfirmed = async () => {
  try {
    const user = await getCurrentUser();
    return !!user?.email_confirmed_at;
  } catch {
    return false;
  }
};

/**
 * Reenviar email de confirmación
 */
export const resendConfirmation = async (email) => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    });

    if (error) {
      console.error('❌ Error reenviando confirmación:', error);
      throw error;
    }

    console.log('✅ Email de confirmación reenviado');
    return true;
  } catch (error) {
    console.error('❌ Error reenviando confirmación:', error);
    throw error;
  }
};

/**
 * Recuperar contraseña
 */
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      console.error('❌ Error enviando reset de password:', error);
      throw error;
    }

    console.log('✅ Email de reset enviado');
    return true;
  } catch (error) {
    console.error('❌ Error enviando reset de password:', error);
    throw error;
  }
};

export default {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  getCurrentSession,
  refreshSession,
  getUserProfile,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  onAuthStateChange,
  isAuthenticated,
  isEmailConfirmed,
  resendConfirmation,
  resetPassword
};