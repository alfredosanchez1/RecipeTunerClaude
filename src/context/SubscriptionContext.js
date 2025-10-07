import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../services/supabase/client';

const SubscriptionContext = createContext();

const initialState = {
  subscription: null,
  isLoading: false,
  error: null,
  subscriptionStatus: 'trial', // unknown, trial, active, expired, canceled
  remainingTrialDays: 7,
  canUseAI: true,
  canCreateRecipes: true,
  maxRecipes: 10
};

function subscriptionReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'SET_SUBSCRIPTION':
      return {
        ...state,
        subscription: action.payload,
        subscriptionStatus: action.payload?.status || 'unknown',
        isLoading: false,
        error: null
      };

    case 'SET_TRIAL_INFO':
      return {
        ...state,
        remainingTrialDays: action.payload.remainingDays,
        subscriptionStatus: action.payload.status
      };

    case 'SET_PERMISSIONS':
      return {
        ...state,
        canUseAI: action.payload.canUseAI,
        canCreateRecipes: action.payload.canCreateRecipes,
        maxRecipes: action.payload.maxRecipes
      };

    default:
      return state;
  }
}

export const SubscriptionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(subscriptionReducer, initialState);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.log('🔒 SUBSCRIPTION CONTEXT - Usuario no autenticado');
      dispatch({ type: 'SET_SUBSCRIPTION', payload: null });
      return;
    }

    console.log('🔄 SUBSCRIPTION CONTEXT - Inicializando suscripción para usuario:', user.email);

    // Aplicar permisos de trial por defecto primero
    dispatch({
      type: 'SET_TRIAL_INFO',
      payload: { remainingDays: 7, status: 'trial' }
    });
    calculateTrialPermissions(true);

    // Luego intentar cargar datos reales
    loadSubscriptionData();
  }, [isAuthenticated, user]);

  const loadSubscriptionData = async () => {
    try {
      console.log('💳 SUBSCRIPTION - Aplicando permisos de trial por defecto (modo demo)');

      // Por ahora, solo aplicar permisos de trial sin consultar base de datos
      dispatch({
        type: 'SET_TRIAL_INFO',
        payload: { remainingDays: 7, status: 'trial' }
      });
      calculateTrialPermissions(true);
      dispatch({ type: 'SET_LOADING', payload: false });

    } catch (error) {
      console.error('❌ SUBSCRIPTION - Error:', error);
      // Siempre aplicar permisos de trial
      dispatch({
        type: 'SET_TRIAL_INFO',
        payload: { remainingDays: 7, status: 'trial' }
      });
      calculateTrialPermissions(true);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const checkTrialStatus = async () => {
    try {
      // Verificar cuándo se registró el usuario
      const { data: userProfile } = await supabase
        .from('recipetuner_users')
        .select('created_at')
        .eq('auth_user_id', user.id)
        .eq('app_name', 'recipetuner')
        .single();

      if (userProfile) {
        const registrationDate = new Date(userProfile.created_at);
        const now = new Date();
        const daysSinceRegistration = Math.floor((now - registrationDate) / (1000 * 60 * 60 * 24));
        const trialDays = 7; // 7 días de prueba
        const remainingDays = Math.max(0, trialDays - daysSinceRegistration);

        console.log('🆓 TRIAL - Días desde registro:', daysSinceRegistration);
        console.log('🆓 TRIAL - Días restantes:', remainingDays);

        const status = remainingDays > 0 ? 'trial' : 'expired';

        dispatch({
          type: 'SET_TRIAL_INFO',
          payload: { remainingDays, status }
        });

        calculateTrialPermissions(remainingDays > 0);
      } else {
        console.log('❌ TRIAL - No se encontró perfil de usuario');
        dispatch({ type: 'SET_TRIAL_INFO', payload: { remainingDays: 0, status: 'expired' } });
        calculateTrialPermissions(false);
      }
    } catch (error) {
      console.error('❌ TRIAL - Error verificando período de prueba:', error);
      dispatch({ type: 'SET_TRIAL_INFO', payload: { remainingDays: 0, status: 'expired' } });
      calculateTrialPermissions(false);
    }
  };

  const calculatePermissions = (subscription) => {
    const isActive = subscription?.status === 'active';
    const plan = subscription?.plan;
    const aiFeatures = plan?.features?.ai_features || false;

    dispatch({
      type: 'SET_PERMISSIONS',
      payload: {
        canUseAI: isActive && aiFeatures,
        canCreateRecipes: isActive,
        maxRecipes: plan?.max_recipes || 0
      }
    });
  };

  const calculateTrialPermissions = (isInTrial) => {
    dispatch({
      type: 'SET_PERMISSIONS',
      payload: {
        canUseAI: isInTrial,
        canCreateRecipes: true, // Siempre puede crear recetas básicas
        maxRecipes: isInTrial ? 10 : 3 // 10 en trial, 3 sin suscripción
      }
    });
  };

  const refreshSubscription = () => {
    loadSubscriptionData();
  };

  const value = {
    ...state,
    refreshSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export default SubscriptionContext;