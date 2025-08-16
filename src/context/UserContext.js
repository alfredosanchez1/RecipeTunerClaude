import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserContext = createContext();

const initialState = {
  user: null,
  preferences: {
    dietaryRestrictions: [],
    allergies: [],
    intolerances: [],
    medicalConditions: [],
    cuisinePreferences: [],
    spiceLevel: 'medium',
    cookingTime: 'medium',
    servings: 2,
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
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const userData = await AsyncStorage.getItem('userData');
      const preferencesData = await AsyncStorage.getItem('userPreferences');
      const onboardingData = await AsyncStorage.getItem('onboardingComplete');

      if (userData) {
        dispatch({ type: 'SET_USER', payload: JSON.parse(userData) });
      }
      if (preferencesData) {
        dispatch({ type: 'SET_PREFERENCES', payload: JSON.parse(preferencesData) });
      }
      if (onboardingData) {
        dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: JSON.parse(onboardingData) });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const saveUserData = async (userData) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      dispatch({ type: 'SET_USER', payload: userData });
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const savePreferences = async (preferences) => {
    try {
      await AsyncStorage.setItem('userPreferences', JSON.stringify(preferences));
      dispatch({ type: 'SET_PREFERENCES', payload: preferences });
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboardingComplete', JSON.stringify(true));
      dispatch({ type: 'SET_ONBOARDING_COMPLETE', payload: true });
    } catch (error) {
      console.error('Error completing onboarding:', error);
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
      await AsyncStorage.multiRemove(['userData', 'userPreferences', 'onboardingComplete']);
      dispatch({ type: 'RESET_STATE' });
    } catch (error) {
      console.error('Error resetting user data:', error);
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
