import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  useTheme,
  TextInput,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { updatePassword } from '../services/supabase/auth';
import { supabase } from '../services/supabase/client';
import { logError, logInfo, LOG_CATEGORIES } from '../services/logger';

// Constantes de Supabase para hacer llamadas directas
const SUPABASE_URL = 'https://ipuqtmdljfirpbaxvygd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwdXF0bWRsamZpcnBiYXh2eWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODU3NjYsImV4cCI6MjA1NzQ2MTc2Nn0.3KeN7qCquVbW5FUWrgDFvgXCx8NvAlftwI7uKY9kaXE';

const ResetPasswordScreen = ({ navigation, route, recoveryUrl }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [savedUrl, setSavedUrl] = useState(recoveryUrl);

  // Procesar el URL de recuperación y guardar el token
  const handleDeepLink = async (url) => {
      if (!url) return;

      // Verificar si el URL tiene un access_token válido
      const hashMatch = url.match(/#(.+)$/);
      if (hashMatch) {
        const fragment = hashMatch[1];
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');

        if (!accessToken) {
          // No hay access_token, el link probablemente expiró o fue usado
          await logError(
            LOG_CATEGORIES.PASSWORD_RESET,
            'Link de recuperación inválido o expirado',
            { url: url?.substring(0, 100) }
          );

          Alert.alert(
            'Enlace Inválido',
            'Este enlace de recuperación ha expirado o ya fue utilizado. Por favor solicita uno nuevo desde la pantalla de login.',
            [
              {
                text: 'Volver al Login',
                onPress: () => navigation.navigate('Auth')
              }
            ],
            { cancelable: false }
          );
          return;
        }

        await logInfo(
          LOG_CATEGORIES.PASSWORD_RESET,
          'Link de recuperación válido procesado',
          { hasToken: true }
        );
      }

      setSavedUrl(url);
    };

  // Procesar recoveryUrl que viene desde App.js
  useEffect(() => {
    if (recoveryUrl) {
      handleDeepLink(recoveryUrl);
    }
  }, [recoveryUrl]);

  // Listener para capturar URLs en tiempo real
  useEffect(() => {
    // Procesar URL inicial
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listener para nuevos URLs
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  const checkResetSession = async () => {
    try {
      setVerifying(true);

      // Esperar un poco para que Supabase procese el deep link
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verificar si hay una sesión activa (Supabase la crea automáticamente con PKCE)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (!session) {
        // Si no hay sesión, esperar un poco más por si está procesando
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Intentar de nuevo
        const { data: { session: retrySession } } = await supabase.auth.getSession();

        if (!retrySession) {
          setVerifying(false);
          Alert.alert(
            'Enlace Inválido o Expirado',
            'El enlace de restablecimiento de contraseña ha expirado o ya fue utilizado. Por favor solicita uno nuevo.',
            [
              {
                text: 'Volver al Login',
                onPress: () => navigation.replace('Auth')
              }
            ]
          );
          return;
        }
      }

      setVerifying(false);

    } catch (error) {
      setVerifying(false);
      Alert.alert(
        'Error',
        'No se pudo verificar el enlace de restablecimiento. Por favor intenta de nuevo.',
        [
          {
            text: 'Volver al Login',
            onPress: () => navigation.replace('Auth')
          }
        ]
      );
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Calcular fortaleza de contraseña
  const getPasswordStrength = (password) => {
    if (!password || password.length === 0) {
      return { level: 0, text: '', color: '#9E9E9E' };
    }

    let strength = 0;

    // Longitud
    if (password.length >= 6) strength += 1;
    if (password.length >= 10) strength += 1;

    // Tiene números
    if (/\d/.test(password)) strength += 1;

    // Tiene mayúsculas
    if (/[A-Z]/.test(password)) strength += 1;

    // Tiene minúsculas
    if (/[a-z]/.test(password)) strength += 1;

    // Tiene caracteres especiales
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    // Mapear puntuación a nivel
    if (strength <= 2) {
      return { level: 1, text: 'Débil', color: '#F44336' };
    } else if (strength <= 4) {
      return { level: 2, text: 'Media', color: '#FF9800' };
    } else {
      return { level: 3, text: 'Fuerte', color: '#4CAF50' };
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const validateForm = () => {
    if (!formData.password || !formData.confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  const handleUpdatePassword = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Extraer el access_token del savedUrl
      if (!savedUrl) {
        throw new Error('No se encontró el URL de recuperación');
      }

      // Buscar access_token en el fragment (#)
      const hashMatch = savedUrl.match(/#(.+)$/);
      let accessToken = null;

      if (hashMatch) {
        const fragment = hashMatch[1];
        const params = new URLSearchParams(fragment);
        accessToken = params.get('access_token');
      }

      if (!accessToken) {
        const error = new Error('No se pudo extraer el token del URL. El enlace puede haber expirado.');
        await logError(
          LOG_CATEGORIES.PASSWORD_RESET,
          'Token no encontrado en URL',
          { error }
        );
        throw error;
      }

      await logInfo(
        LOG_CATEGORIES.PASSWORD_RESET,
        'Iniciando actualización de contraseña',
        { hasToken: true }
      );

      // Llamar directamente al endpoint de Supabase con el access_token
      const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          password: formData.password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        const error = new Error(result.msg || result.message || 'Error actualizando contraseña');
        await logError(
          LOG_CATEGORIES.PASSWORD_RESET,
          'Error al actualizar contraseña',
          { error, statusCode: response.status, result }
        );
        throw error;
      }

      await logInfo(
        LOG_CATEGORIES.PASSWORD_RESET,
        'Contraseña actualizada exitosamente',
        { statusCode: response.status }
      );

      setLoading(false);

      // Mostrar alert de éxito
      Alert.alert(
        'Contraseña Actualizada ✅',
        'Tu contraseña ha sido actualizada exitosamente. Serás redirigido al login en 3 segundos...',
        [
          {
            text: 'Ir al Login Ahora',
            onPress: () => {
              // Navegar hacia atrás en el stack de Auth para llegar a AuthScreen
              navigation.navigate('Auth');
            }
          }
        ],
        {
          cancelable: false // No permitir cerrar el alert sin presionar el botón
        }
      );

      // Redirigir automáticamente después de 3 segundos
      setTimeout(() => {
        navigation.navigate('Auth');
      }, 3000);

    } catch (error) {
      await logError(
        LOG_CATEGORIES.PASSWORD_RESET,
        'Error general en actualización de contraseña',
        { error }
      );

      let errorMessage = 'Ha ocurrido un error inesperado';

      if (error.message?.includes('weak')) {
        errorMessage = 'La contraseña es demasiado débil. Usa al menos 6 caracteres con mayúsculas, minúsculas y números.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
      setLoading(false);
    }
  };

  // Mostrar loading mientras verifica la sesión
  if (verifying) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#4B5563' }}>
          Verificando enlace de recuperación...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Icon name="lock-reset" size={60} color={theme.colors.primary} />
          <Title style={styles.headerTitle}>Nueva Contraseña</Title>
          <Paragraph style={styles.headerSubtitle}>
            Establece tu nueva contraseña para acceder a tu cuenta
          </Paragraph>
        </View>

        {/* Form Card */}
        <Card style={styles.formCard}>
          <Card.Content>
            <Title style={styles.formTitle}>Restablecer Contraseña</Title>

            {/* Nueva Contraseña */}
            <TextInput
              style={styles.input}
              label="Nueva Contraseña"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              mode="outlined"
              secureTextEntry={!passwordVisible}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={passwordVisible ? "eye-off" : "eye"}
                  onPress={() => setPasswordVisible(!passwordVisible)}
                />
              }
              disabled={loading}
            />

            {/* Confirmar Contraseña */}
            <TextInput
              style={styles.input}
              label="Confirmar Nueva Contraseña"
              value={formData.confirmPassword}
              onChangeText={(text) => handleInputChange('confirmPassword', text)}
              mode="outlined"
              secureTextEntry={!confirmPasswordVisible}
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon
                  icon={confirmPasswordVisible ? "eye-off" : "eye"}
                  onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                />
              }
              disabled={loading}
            />

            {/* Password Strength Indicator */}
            {formData.password.length > 0 && (
              <View style={styles.strengthContainer}>
                <Text style={styles.strengthLabel}>Fortaleza:</Text>
                <View style={styles.strengthBarContainer}>
                  <View style={[
                    styles.strengthBar,
                    {
                      width: `${(passwordStrength.level / 3) * 100}%`,
                      backgroundColor: passwordStrength.color
                    }
                  ]} />
                </View>
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.text}
                </Text>
              </View>
            )}

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>La contraseña debe tener:</Text>
              <View style={styles.requirement}>
                <Icon
                  name={formData.password.length >= 6 ? "check-circle" : "circle-outline"}
                  size={16}
                  color={formData.password.length >= 6 ? "#4CAF50" : "#9E9E9E"}
                />
                <Text style={[
                  styles.requirementText,
                  { color: formData.password.length >= 6 ? "#4CAF50" : "#9E9E9E" }
                ]}>
                  Al menos 6 caracteres
                </Text>
              </View>
              <View style={styles.requirement}>
                <Icon
                  name={formData.password === formData.confirmPassword && formData.password ? "check-circle" : "circle-outline"}
                  size={16}
                  color={formData.password === formData.confirmPassword && formData.password ? "#4CAF50" : "#9E9E9E"}
                />
                <Text style={[
                  styles.requirementText,
                  { color: formData.password === formData.confirmPassword && formData.password ? "#4CAF50" : "#9E9E9E" }
                ]}>
                  Las contraseñas coinciden
                </Text>
              </View>
            </View>

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleUpdatePassword}
              style={styles.submitButton}
              disabled={loading || !formData.password || !formData.confirmPassword}
              loading={loading}
            >
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </Button>

            {/* Back to Login */}
            <Button
              mode="text"
              onPress={() => navigation.replace('Auth')}
              style={styles.backButton}
              disabled={loading}
            >
              Volver al Login
            </Button>
          </Card.Content>
        </Card>

        {/* Security Info */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoItem}>
              <Icon name="shield-check" size={24} color="#4CAF50" />
              <Text style={styles.infoText}>
                Tu contraseña se encripta de forma segura
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="clock" size={24} color="#2196F3" />
              <Text style={styles.infoText}>
                Los enlaces de restablecimiento expiran en 24 horas
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 40,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#4B5563',
    lineHeight: 24,
  },
  formCard: {
    margin: 20,
    marginBottom: 15,
    elevation: 3,
  },
  formTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 25,
    color: '#1F2937',
    fontWeight: '600',
  },
  input: {
    marginBottom: 15,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  strengthLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    marginRight: 10,
    minWidth: 70,
  },
  strengthBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  strengthBar: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  strengthText: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'right',
  },
  requirementsContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  requirementText: {
    marginLeft: 8,
    fontSize: 13,
  },
  submitButton: {
    paddingVertical: 8,
    marginBottom: 15,
  },
  backButton: {
    marginBottom: 10,
  },
  infoCard: {
    margin: 20,
    marginTop: 0,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoText: {
    marginLeft: 15,
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
});

export default ResetPasswordScreen;