/**
 * BiometricLockScreen.tsx
 * Pantalla de bloqueo biométrico con animaciones mejoradas
 * Se muestra al abrir la app cuando el usuario tiene biometría habilitada
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import {
  Title,
  Paragraph,
  Button,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import BiometricService from '../services/BiometricService';
import { supabase } from '../services/supabase/client';

interface BiometricLockScreenProps {
  navigation: any;
}

const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [biometricType, setBiometricType] = useState('Biometría');
  const [attemptCount, setAttemptCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Animaciones
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de entrada
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Animación de pulso continua
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
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
      console.error('[BiometricLockScreen] Error inicializando:', error);
      setLoading(false);
      setError('Error al inicializar');
    }
  };

  const attemptBiometricAuth = async () => {
    try {
      console.log('[BiometricLockScreen] Solicitando autenticación...');

      const authResult = await BiometricService.authenticate(
        `Desbloquear RecipeTuner con ${biometricType}`
      );

      if (authResult.success) {
        await handleSuccessfulAuth();
      } else {
        handleFailedAuth(authResult.error);
      }
    } catch (error) {
      console.error('[BiometricLockScreen] Error en autenticación:', error);
      handleFailedAuth('Error inesperado');
    }
  };

  const handleSuccessfulAuth = async () => {
    try {
      console.log('[BiometricLockScreen] Autenticación exitosa');
      setError(null);

      // Animación de éxito
      Animated.sequence([
        Animated.spring(iconScaleAnim, {
          toValue: 1.3,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();

      // Verificar sesión con Supabase
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        console.error('[BiometricLockScreen] Sesión inválida o expirada:', error);
        await BiometricService.disableBiometric();
        await supabase.auth.signOut();
        return;
      }

      // Marcar sesión como verificada
      console.log('[BiometricLockScreen] Sesión válida, desbloqueando...');
      await BiometricService.markSessionAsVerified();

      // Refrescar sesión para re-render
      await supabase.auth.refreshSession();

      console.log('[BiometricLockScreen] App desbloqueada exitosamente');
    } catch (error) {
      console.error('[BiometricLockScreen] Error verificando sesión:', error);
      await BiometricService.disableBiometric();
      await supabase.auth.signOut();
    }
  };

  const handleFailedAuth = (errorMessage?: string) => {
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    console.log(`[BiometricLockScreen] Intento ${newAttemptCount} fallido:`, errorMessage);

    // Animación de shake (sacudida) al fallar
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();

    // Mensajes personalizados según el tipo de error
    let userFriendlyMessage = '';

    if (errorMessage && errorMessage.toLowerCase().includes('cancel')) {
      userFriendlyMessage = 'Autenticación cancelada. Intenta de nuevo o usa tu contraseña.';
    } else if (newAttemptCount >= 3) {
      userFriendlyMessage = `Has intentado ${newAttemptCount} veces sin éxito.\n\n` +
        `Por seguridad, usa tu contraseña para continuar. Puedes volver a habilitar ${biometricType} desde Configuración.`;
    } else {
      const remainingAttempts = 3 - newAttemptCount;
      userFriendlyMessage = `${biometricType} no reconocido. Tienes ${remainingAttempts} intento${remainingAttempts > 1 ? 's' : ''} más.\n\n` +
        'Asegúrate de estar en buena iluminación y que tu rostro esté completamente visible.';
    }

    setError(userFriendlyMessage);
  };

  const handleUsePassword = async () => {
    console.log('[BiometricLockScreen] Usuario eligió usar contraseña');
    // Limpiar verificación de sesión para volver a login
    await BiometricService.clearSessionVerification();
    navigation.replace('Auth');
  };

  const handleRetry = () => {
    setError(null);
    attemptBiometricAuth();
  };

  // Determinar ícono según tipo de biometría
  const getIconName = (): string => {
    if (biometricType === 'Face ID') return 'face-recognition';
    if (biometricType === 'Touch ID') return 'fingerprint';
    return 'shield-lock';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Paragraph style={styles.loadingText}>Verificando {biometricType}...</Paragraph>
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
          {
            transform: [
              { scale: error ? iconScaleAnim : pulseAnim },
              { translateX: shakeAnim }
            ]
          }
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
          <>
            <Paragraph style={styles.instructionText}>
              Usa {biometricType} para desbloquear
            </Paragraph>
            <Paragraph style={styles.subInstructionText}>
              Tus datos están protegidos y seguros
            </Paragraph>
          </>
        )}
      </View>

      {/* Botón para usar contraseña */}
      <View style={styles.alternativeContainer}>
        <Button
          mode="text"
          onPress={handleUsePassword}
          icon="login"
          labelStyle={styles.alternativeButtonLabel}
        >
          Usar contraseña
        </Button>
      </View>

      {/* Indicador de intentos */}
      {attemptCount > 0 && attemptCount < 3 && (
        <View style={styles.attemptsContainer}>
          <Paragraph style={styles.attemptsText}>
            Intento {attemptCount} de 3
          </Paragraph>
        </View>
      )}
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
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
    minHeight: 120,
  },
  instructionText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#1F2937',
    lineHeight: 26,
    fontWeight: '600',
    marginBottom: 8,
  },
  subInstructionText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#64748b',
    lineHeight: 20,
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
    marginTop: 8,
  },
  alternativeContainer: {
    position: 'absolute',
    bottom: 60,
  },
  alternativeButtonLabel: {
    fontSize: 15,
  },
  attemptsContainer: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  attemptsText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
});

export default BiometricLockScreen;
