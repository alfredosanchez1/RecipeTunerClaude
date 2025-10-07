import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import AuthScreen from '../screens/AuthScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import BiometricLockScreen from '../screens/BiometricLockScreen';

const Stack = createStackNavigator();

// Componente interno que puede usar useNavigation
const NavigationHandler = ({ isPasswordRecovery }) => {
  const navigation = useNavigation();

  useEffect(() => {
    const checkUrl = async () => {
      const url = await Linking.getInitialURL();
      console.log('🧭 AUTH NAVIGATOR - URL inicial:', url);

      if (url && url.includes('reset-password')) {
        console.log('🧭 AUTH NAVIGATOR - Navegando a ResetPassword...');
        setTimeout(() => {
          navigation.navigate('ResetPassword');
        }, 100);
      }
    };

    checkUrl();

    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('🧭 AUTH NAVIGATOR - URL recibida:', url);

      if (url && url.includes('reset-password')) {
        console.log('🧭 AUTH NAVIGATOR - Navegando a ResetPassword...');
        navigation.navigate('ResetPassword');
      }
    });

    return () => subscription.remove();
  }, [navigation]);

  useEffect(() => {
    if (isPasswordRecovery) {
      console.log('🧭 AUTH NAVIGATOR - isPasswordRecovery=true, navegando...');
      setTimeout(() => {
        navigation.navigate('ResetPassword');
      }, 100);
    }
  }, [isPasswordRecovery, navigation]);

  return null;
};

const AuthNavigator = ({ isPasswordRecovery, recoveryUrl }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Auth">
        {(props) => (
          <>
            <NavigationHandler isPasswordRecovery={isPasswordRecovery} />
            <AuthScreen {...props} />
          </>
        )}
      </Stack.Screen>
      <Stack.Screen name="ResetPassword">
        {(props) => <ResetPasswordScreen {...props} recoveryUrl={recoveryUrl} />}
      </Stack.Screen>
      <Stack.Screen name="BiometricLock" component={BiometricLockScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;