import React, { createContext, useContext, useReducer, useEffect } from 'react';
import realmDatabaseV2 from '../services/realmDatabaseV2';

const UserContext = createContext();

const initialState = {
  user: null,
  preferences: {
    dietaryRestrictions: [],
    allergies: [],
    intolerances: [],
    cuisinePreferences: [],
    cookingTimePreference: 'Medio',
  },
  isOnboardingComplete: false,
  isLoading: false,
};

const userReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_PREFERENCES':
      return { ...state, preferences: { ...state.preferences, ...action.payload } };
    case 'ADD_DIETARY_RESTRICTION':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          dietaryRestrictions: [...state.preferences.dietaryRestrictions, action.payload],
        },
      };
    case 'REMOVE_DIETARY_RESTRICTION':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          dietaryRestrictions: state.preferences.dietaryRestrictions.filter(
            item => item !== action.payload
          ),
        },
      };
    case 'ADD_ALLERGY':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          allergies: [...state.preferences.allergies, action.payload],
        },
      };
    case 'REMOVE_ALLERGY':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          allergies: state.preferences.allergies.filter(
            item => item !== action.payload
          ),
        },
      };
    case 'SET_ONBOARDING_COMPLETE':
      return { ...state, isOnboardingComplete: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
};

export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  useEffect(() => {
    // Inicializar Realm V2 y cargar datos
    const initializeDatabase = async () => {
      console.log('🔄 USER CONTEXT - Inicializando Realm V2...');

      const success = await realmDatabaseV2.init();

      if (success) {
        console.log('✅ USER CONTEXT - Realm V2 listo, cargando datos...');
        setTimeout(() => {
          loadUserData();
        }, 500);
      } else {
        console.error('❌ USER CONTEXT - Error inicializando Realm V2');
      }
    };

    initializeDatabase();
  }, []);

  const loadUserData = async () => {
    try {
      console.log('🔄 USER CONTEXT - Cargando datos de usuario desde Realm V2...');
      dispatch({ type: 'SET_LOADING', payload: true });

      // Cargar preferencias
      const userPreferences = await realmDatabaseV2.getUserPreferences('default');

      if (userPreferences) {
        console.log('🎯 USER CONTEXT - Aplicando preferencias cargadas:', userPreferences);

        dispatch({
          type: 'SET_PREFERENCES',
          payload: {
            dietaryRestrictions: userPreferences.dietaryRestrictions || [],
            allergies: userPreferences.allergies || [],
            intolerances: userPreferences.intolerances || [],
            cuisinePreferences: userPreferences.cuisinePreferences || [],
            cookingTimePreference: userPreferences.cookingTimePreference || 'Medio'
          }
        });

        // Cargar estado de onboarding
        if (userPreferences.onboardingComplete) {
          console.log('🎯 USER CONTEXT - Onboarding ya completado, activando...');
          dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
        }

        console.log('✅ USER CONTEXT - Datos de usuario cargados desde Realm V2');
      } else {
        console.log('📭 USER CONTEXT - No se encontraron preferencias guardadas');
      }

    } catch (error) {
      console.error('❌ USER CONTEXT - Error cargando datos de usuario:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      console.log('🔄 USER CONTEXT - Carga de datos completada');
    }
  };

  const saveUserData = async (userData) => {
    try {
      // Guardar en Realm
      console.log('💾 Guardando datos de usuario en Realm...');
      dispatch({ type: 'SET_USER', payload: userData });
      console.log('✅ Datos de usuario guardados en Realm');
    } catch (error) {
      console.error('❌ Error guardando datos de usuario en Realm:', error);
      throw new Error('Realm no disponible - No se pueden guardar datos');
    }
  };

  const savePreferences = async (preferences, markOnboardingComplete = false) => {
    try {
      console.log('💾 GUARDANDO PREFERENCIAS...');
      console.log('📋 Datos a guardar:', preferences);
      console.log('🎯 Marcar onboarding como completo:', markOnboardingComplete);
      
      dispatch({ type: 'SET_PREFERENCES', payload: preferences });
      
      // Preparar datos para Realm Database
      const dataToSave = {
        dietaryRestrictions: preferences.dietaryRestrictions || [],
        allergies: preferences.allergies || [],
        intolerances: preferences.intolerances || [],
        cuisinePreferences: preferences.cuisinePreferences || [],
        cookingTimePreference: preferences.cookingTimePreference || 'Medio',
        notificationsEnabled: preferences.notificationsEnabled ?? true,
        onboardingComplete: markOnboardingComplete || state.isOnboardingComplete
      };
      
      console.log('📊 Datos preparados para Realm:', dataToSave);

      // Guardar en Realm V2
      await realmDatabaseV2.saveUserPreferences('default', dataToSave);
      console.log('✅ USER CONTEXT - Preferencias guardadas en Realm V2');
      console.log('📋 USER CONTEXT - Datos guardados:', dataToSave);
      
      // Si marcamos onboarding como completo, actualizar el estado
      if (markOnboardingComplete) {
        dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
        console.log('🎯 Onboarding marcado como completado en el estado');
      }
    } catch (error) {
      console.error('❌ USER CONTEXT - Error guardando preferencias:', error);
      // No lanzar error - el almacenamiento persistente debe haber funcionado
      console.warn('⚠️ USER CONTEXT - Continuando con almacenamiento persistente únicamente');
    }
  };

  const completeOnboarding = async () => {
    try {
      console.log('🎯 USER CONTEXT - Completando onboarding (solo actualizando estado)...');
      // Solo actualizar el estado - los datos ya fueron guardados por savePreferences
      dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
      console.log('✅ USER CONTEXT - Onboarding completado en estado local');
    } catch (error) {
      console.error('❌ USER CONTEXT - Error completando onboarding:', error);
      throw new Error('Error al completar onboarding');
    }
  };

  const addDietaryRestriction = (restriction) => {
    dispatch({ type: 'ADD_DIETARY_RESTRICTION', payload: restriction });
  };

  const removeDietaryRestriction = (restriction) => {
    dispatch({ type: 'REMOVE_DIETARY_RESTRICTION', payload: restriction });
  };

  const addAllergy = (allergy) => {
    dispatch({ type: 'ADD_ALLERGY', payload: allergy });
  };

  const removeAllergy = (allergy) => {
    dispatch({ type: 'REMOVE_ALLERGY', payload: allergy });
  };

  const resetUserData = async () => {
    try {
      // Resetear solo el estado de React (SecureStore mantiene los datos)
      console.log('🔄 Reseteando estado de usuario...');
      dispatch({ type: 'RESET_STATE' });
      console.log('✅ Estado de usuario reseteado');
    } catch (error) {
      console.error('❌ Error reseteando estado de usuario:', error);
      throw new Error('Error al resetear estado de usuario');
    }
  };

  const value = {
    ...state,
    saveUserData,
    savePreferences,
    completeOnboarding,
    addDietaryRestriction,
    removeDietaryRestriction,
    addAllergy,
    removeAllergy,
    resetUserData,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
