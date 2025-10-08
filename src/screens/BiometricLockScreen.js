import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Image,
} from 'react-native';
import {
  Title,
  Paragraph,
  Button,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BiometricService from '../services/BiometricService';
import { supabase } from '../services/supabase/client';

/**
 * Pantalla de bloqueo biométrico
 * Se muestra al abrir la app cuando el usuario tiene biometría habilitada
 */
const BiometricLockScreen = ({ navigation }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [biometricType, setBiometricType] = useState('Biometría');
  const [attemptCount, setAttemptCount] = useState(0);
  const [error, setError] = useState(null);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animación de entrada
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Animación de pulso
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      // Obtener tipo de biometría
      const type = await BiometricService.getBiometricTypeName();
      setBiometricType(type);

      // Pequeña espera para mostrar la pantalla antes de pedir biometría
      setTimeout(() => {
        setLoading(false);
        attemptBiometricAuth();
      }, 500);
    } catch (error) {
      console.error('❌ Error inicializando BiometricLockScreen:', error);
      setLoading(false);
      setError('Error al inicializar');
    }
  };

  const attemptBiometricAuth = async () => {
    try {
      console.log('🔐 Intentando autenticación biométrica...');

      const authResult = await BiometricService.authenticate(
        `Desbloquear RecipeTuner con ${biometricType}`
      );

      if (authResult.success) {
        await handleSuccessfulAuth();
      } else {
        handleFailedAuth(authResult.error);
      }
    } catch (error) {
      console.error('❌ Error en autenticación biométrica:', error);
      handleFailedAuth('Error inesperado');
    }
  };

  const handleSuccessfulAuth = async () => {
    try {
      console.log('✅ Autenticación biométrica exitosa');
      setError(null);

      // Obtener credenciales guardadas
      const credentials = await BiometricService.getStoredCredentials();

      if (!credentials) {
        console.error('❌ No se encontraron credenciales guardadas');
        // Si no hay credenciales, deshabilitar biometría y mostrar login
        await BiometricService.disableBiometric();
        // No necesitamos navigate, simplemente desactivamos showBiometricLock
        // y la app mostrará AuthScreen
        return;
      }

      // Verificar sesión con Supabase
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        console.error('❌ Sesión inválida o expirada:', error);
        // Sesión expirada, forzar login completo
        await BiometricService.disableBiometric();
        await supabase.auth.signOut(); // Forzar sign out
        // La app detectará el sign out y mostrará AuthScreen
        return;
      }

      // Sesión válida, marcar que biometría fue verificada en esta sesión
      console.log('✅ Sesión válida, desbloqueando app...');

      // Marcar temporalmente que la biometría fue verificada
      await AsyncStorage.setItem('biometric_verified_session', 'true');

      // Forzar un refresh de la sesión para que la app se re-renderice
      // Esto hará que el useEffect en App.js se ejecute de nuevo
      await supabase.auth.refreshSession();

      console.log('✅ Sesión refrescada, app debería mostrar MainNavigator ahora');

    } catch (error) {
      console.error('❌ Error verificando sesión:', error);
      // En caso de error, deshabilitar biometría y forzar logout
      await BiometricService.disableBiometric();
      await supabase.auth.signOut();
    }
  };

  const handleFailedAuth = (errorMessage) => {
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    console.log(`❌ Intento ${newAttemptCount} de autenticación fallido:`, errorMessage);

    if (newAttemptCount >= 3) {
      setError(`${biometricType} falló. Usa tu contraseña para continuar.`);
    } else {
      setError(`${biometricType} falló. Intenta de nuevo.`);
    }
  };

  const handleUsePassword = async () => {
    console.log('🔐 Usuario eligió usar contraseña');
    // No deshabilitar biometría, solo ir a login
    navigation.replace('Auth');
  };

  const handleRetry = () => {
    setError(null);
    attemptBiometricAuth();
  };

  // Determinar ícono según tipo de biometría
  const getIconName = () => {
    if (biometricType === 'Face ID') return 'face-recognition';
    if (biometricType === 'Touch ID') return 'fingerprint';
    return 'shield-lock';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Logo de RecipeTuner */}
      <View style={styles.logoContainer}>
        <Icon name="chef-hat" size={80} color={theme.colors.primary} />
        <Title style={styles.appName}>RecipeTuner</Title>
      </View>

      {/* Ícono de biometría animado */}
      <Animated.View
        style={[
          styles.biometricIconContainer,
          { transform: [{ scale: pulseAnim }] }
        ]}
      >
        <Icon
          name={getIconName()}
          size={100}
          color={error ? '#EF4444' : theme.colors.primary}
        />
      </Animated.View>

      {/* Mensaje */}
      <View style={styles.messageContainer}>
        {error ? (
          <>
            <Paragraph style={styles.errorText}>
              {error}
            </Paragraph>
            {attemptCount < 3 ? (
              <Button
                mode="contained"
                onPress={handleRetry}
                style={styles.retryButton}
                icon={getIconName()}
              >
                Intentar de nuevo
              </Button>
            ) : null}
          </>
        ) : (
          <Paragraph style={styles.instructionText}>
            Toca para desbloquear con {biometricType}
          </Paragraph>
        )}
      </View>

      {/* Botón para usar contraseña */}
      <View style={styles.alternativeContainer}>
        <Button
          mode="text"
          onPress={handleUsePassword}
          icon="login"
        >
          Usar contraseña
        </Button>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 15,
    color: '#1F2937',
  },
  biometricIconContainer: {
    marginBottom: 40,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#4B5563',
    lineHeight: 24,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#EF4444',
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    paddingHorizontal: 30,
  },
  alternativeContainer: {
    position: 'absolute',
    bottom: 40,
  },
});

export default BiometricLockScreen;
