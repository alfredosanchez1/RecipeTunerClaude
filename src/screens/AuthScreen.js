import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  useTheme,
  TextInput,
  Divider,
  ActivityIndicator,
  Portal,
  Dialog,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../services/supabase/client';
import { resetPassword } from '../services/supabase/auth';
import { useUser } from '../context/UserContext';
import BiometricService from '../services/BiometricService';
import BiometricSetupModal from '../components/BiometricSetupModal';

const AuthScreen = ({ navigation }) => {
  const theme = useTheme();
  const { saveUserData } = useUser();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showBiometricSetup, setShowBiometricSetup] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return false;
    }

    if (!isValidEmail(formData.email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (!isLogin) {
      if (!formData.firstName || !formData.lastName) {
        Alert.alert('Error', 'Por favor completa todos los campos');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Error', 'Las contraseñas no coinciden');
        return false;
      }
    }

    return true;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      console.log('🔐 Iniciando sesión con:', formData.email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error('❌ Error en login:', error);
        Alert.alert('Error de Autenticación', error.message);
        return;
      }

      console.log('✅ Login exitoso:', data.user?.email);

      // Obtener o crear perfil de usuario
      await createOrUpdateUserProfile(data.user);

      // IMPORTANTE: Siempre marcar la sesión como verificada después del login manual
      // Esto permite que la app navegue inmediatamente a MainNavigator
      console.log('🔐 Marcando sesión como verificada después de login manual');
      await AsyncStorage.setItem('biometric_verified_session', 'true');

      // Verificar si se puede mostrar el modal de biometría
      await checkAndShowBiometricSetup(data.user, data.session);

      console.log('✅ Login completado, la app debería navegar a MainNavigator');

    } catch (error) {
      console.error('❌ Error inesperado en login:', error);
      Alert.alert('Error', 'Ha ocurrido un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const checkAndShowBiometricSetup = async (user, session) => {
    try {
      // Verificar si biometría está disponible en el dispositivo
      const available = await BiometricService.isAvailable();
      if (!available) {
        console.log('⚠️ Biometría no disponible en este dispositivo');
        return;
      }

      // Verificar si ya está habilitada
      const alreadyEnabled = await BiometricService.isBiometricEnabled();
      if (alreadyEnabled) {
        console.log('⚠️ Biometría ya está habilitada');
        return;
      }

      // Verificar si el usuario ya rechazó esto antes (usando AsyncStorage)
      const biometricDismissed = await AsyncStorage.getItem(`biometric_dismissed_${user.email}`);
      if (biometricDismissed === 'true') {
        console.log('⚠️ Usuario ya rechazó la configuración de biometría');
        return;
      }

      // Guardar datos de sesión y mostrar modal
      setSessionData({
        email: user.email,
        sessionToken: session.access_token
      });
      setShowBiometricSetup(true);

    } catch (error) {
      console.error('❌ Error verificando biometría:', error);
    }
  };

  const handleBiometricSetupClose = async () => {
    setShowBiometricSetup(false);
    // Guardar que el usuario rechazó esto para no mostrarlo de nuevo
    if (sessionData?.email) {
      await AsyncStorage.setItem(`biometric_dismissed_${sessionData.email}`, 'true');
    }
    setSessionData(null);
  };

  const handleBiometricEnabled = () => {
    console.log('✅ Biometría habilitada exitosamente');
    setShowBiometricSetup(false);
    setSessionData(null);
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      console.log('👤 Registrando usuario:', formData.email);

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: `${formData.firstName} ${formData.lastName}`
          }
        }
      });

      if (error) {
        console.error('❌ Error en registro:', error);
        Alert.alert('Error de Registro', error.message);
        return;
      }

      if (data.user && !data.session) {
        Alert.alert(
          'Confirma tu Email',
          'Te hemos enviado un link de confirmación a tu email. Por favor verifica tu cuenta antes de continuar.',
          [{ text: 'OK', onPress: () => setIsLogin(true) }]
        );
        return;
      }

      console.log('✅ Registro exitoso:', data.user?.email);

      // Crear perfil de usuario
      await createOrUpdateUserProfile(data.user);

      Alert.alert('¡Cuenta Creada!', 'Tu cuenta ha sido creada exitosamente');

    } catch (error) {
      console.error('❌ Error inesperado en registro:', error);
      Alert.alert('Error', 'Ha ocurrido un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateUserProfile = async (user) => {
    try {
      console.log('🔧 [AUTH] Iniciando createOrUpdateUserProfile para:', user.email);
      console.log('🔧 [AUTH] User ID:', user.id);
      console.log('🔧 [AUTH] Email confirmado:', !!user.email_confirmed_at);
      const userProfile = {
        auth_user_id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || `${formData.firstName} ${formData.lastName}` || 'Usuario',
        app_name: 'recipetuner',
        updated_at: new Date().toISOString()
      };

      // Verificar si el usuario ya existe PARA ESTA APP específicamente
      console.log('🔧 [AUTH] Verificando si usuario existe en DB...');
      const { data: existingUser, error: selectError } = await supabase
        .from('recipetuner_users')
        .select('*')
        .eq('auth_user_id', user.id)
        .eq('app_name', 'recipetuner')
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('❌ [AUTH] Error verificando usuario existente:', selectError);
        throw selectError;
      }

      if (existingUser) {
        console.log('🔧 [AUTH] Usuario ya existe, actualizando...', existingUser.id);
        // Actualizar usuario existente para esta app específica
        const { error: updateError } = await supabase
          .from('recipetuner_users')
          .update(userProfile)
          .eq('auth_user_id', user.id)
          .eq('app_name', 'recipetuner');

        if (updateError) {
          console.error('❌ [AUTH] Error actualizando usuario:', updateError);
          throw updateError;
        }
        console.log('✅ [AUTH] Usuario actualizado exitosamente');
      } else {
        console.log('🔧 [AUTH] Usuario no existe, creando nuevo...');
        // Crear nuevo usuario
        userProfile.created_at = new Date().toISOString();

        const { data: newUser, error: insertError } = await supabase
          .from('recipetuner_users')
          .insert([userProfile])
          .select()
          .single();

        if (insertError) {
          console.error('❌ [AUTH] Error creando usuario:', insertError);
          throw insertError;
        }
        console.log('✅ [AUTH] Usuario creado exitosamente:', newUser.id);

        // Crear preferencias por defecto
        console.log('🔧 [AUTH] Creando preferencias por defecto...');
        const defaultPreferences = {
          user_id: newUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: prefError } = await supabase
          .from('recipetuner_user_preferences')
          .insert([defaultPreferences]);

        if (prefError) {
          console.error('❌ [AUTH] Error creando preferencias:', prefError);
          // No lanzar error aquí, las preferencias se pueden crear después
        } else {
          console.log('✅ [AUTH] Preferencias por defecto creadas');
        }
      }

      // Guardar datos en el contexto local
      saveUserData({
        name: userProfile.name,
        email: userProfile.email,
        id: user.id
      });

      console.log('✅ Perfil de usuario creado/actualizado');

    } catch (error) {
      console.error('❌ Error creando perfil:', error);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      Alert.alert('Email requerido', 'Por favor ingresa tu email para recuperar la contraseña');
      return;
    }

    if (!isValidEmail(formData.email)) {
      Alert.alert('Email inválido', 'Por favor ingresa un email válido');
      return;
    }

    try {
      setLoading(true);

      // Rate limiting: Verificar última solicitud
      const RATE_LIMIT_KEY = `password_reset_${formData.email}`;
      const RATE_LIMIT_MINUTES = 5; // Límite de 5 minutos entre solicitudes

      const lastRequestTime = await AsyncStorage.getItem(RATE_LIMIT_KEY);

      if (lastRequestTime) {
        const timeSinceLastRequest = Date.now() - parseInt(lastRequestTime);
        const minutesSinceLastRequest = Math.floor(timeSinceLastRequest / 60000);
        const minutesRemaining = RATE_LIMIT_MINUTES - minutesSinceLastRequest;

        if (minutesSinceLastRequest < RATE_LIMIT_MINUTES) {
          Alert.alert(
            'Solicitud demasiado frecuente',
            `Por favor espera ${minutesRemaining} minuto${minutesRemaining !== 1 ? 's' : ''} antes de solicitar otro enlace de recuperación.\n\nEsto es por tu seguridad.`,
            [{ text: 'Entendido' }]
          );
          setLoading(false);
          return;
        }
      }

      console.log('🔐 Enviando reset de contraseña para:', formData.email);

      // URL de redirección usando custom scheme directamente
      // Supabase aceptará esto si lo configuramos en el dashboard
      const redirectTo = 'recipetuner://reset-password';
      await resetPassword(formData.email, redirectTo);

      // Guardar timestamp de esta solicitud
      await AsyncStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());

      Alert.alert(
        'Email Enviado ✅',
        `Te hemos enviado un link para restablecer tu contraseña a ${formData.email}. Revisa tu bandeja de entrada y carpeta de spam.\n\n⏱️ Podrás solicitar un nuevo enlace en ${RATE_LIMIT_MINUTES} minutos.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowForgotPassword(false);
              setFormData(prev => ({ ...prev, password: '' }));
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Error enviando reset:', error);

      let errorMessage = 'Ha ocurrido un error inesperado';

      if (error.message?.includes('rate limit')) {
        errorMessage = 'Has enviado demasiadas solicitudes. Espera unos minutos antes de intentar de nuevo.';
      } else if (error.message?.includes('not found')) {
        errorMessage = 'No encontramos una cuenta asociada a este email.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error al enviar email', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: ''
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Icon name="chef-hat" size={60} color={theme.colors.primary} />
          <Title style={styles.headerTitle}>RecipeTuner</Title>
          <Paragraph style={styles.headerSubtitle}>
            {isLogin
              ? 'Inicia sesión para acceder a tus recetas'
              : 'Crea tu cuenta y comienza a cocinar'
            }
          </Paragraph>
        </View>

        {/* Form Card */}
        <Card style={styles.formCard}>
          <Card.Content>
            <Title style={styles.formTitle}>
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </Title>

            {/* Campos de registro */}
            {!isLogin && (
              <>
                <View style={styles.nameRow}>
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    label="Nombre"
                    value={formData.firstName}
                    onChangeText={(text) => handleInputChange('firstName', text)}
                    mode="outlined"
                    left={<TextInput.Icon icon="account" />}
                  />
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    label="Apellido"
                    value={formData.lastName}
                    onChangeText={(text) => handleInputChange('lastName', text)}
                    mode="outlined"
                  />
                </View>
              </>
            )}

            {/* Email */}
            <TextInput
              style={styles.input}
              label="Email"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              left={<TextInput.Icon icon="email" />}
            />

            {/* Password */}
            <TextInput
              style={styles.input}
              label="Contraseña"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              mode="outlined"
              secureTextEntry
              left={<TextInput.Icon icon="lock" />}
            />

            {/* Confirm Password (solo registro) */}
            {!isLogin && (
              <TextInput
                style={styles.input}
                label="Confirmar Contraseña"
                value={formData.confirmPassword}
                onChangeText={(text) => handleInputChange('confirmPassword', text)}
                mode="outlined"
                secureTextEntry
                left={<TextInput.Icon icon="lock-check" />}
              />
            )}

            {/* Forgot Password */}
            {isLogin && (
              <View style={styles.forgotPasswordContainer}>
                <Button
                  mode="text"
                  onPress={() => setShowForgotPassword(true)}
                  style={styles.forgotButton}
                  disabled={loading}
                  icon="lock-reset"
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </View>
            )}

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={isLogin ? handleLogin : handleRegister}
              style={styles.submitButton}
              disabled={loading}
              loading={loading}
            >
              {loading
                ? (isLogin ? 'Iniciando sesión...' : 'Creando cuenta...')
                : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')
              }
            </Button>

            <Divider style={styles.divider} />

            {/* Toggle Mode */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isLogin
                  ? '¿No tienes cuenta?'
                  : '¿Ya tienes cuenta?'
                }
              </Text>
              <Button
                mode="text"
                onPress={toggleMode}
                disabled={loading}
              >
                {isLogin ? 'Crear Cuenta' : 'Iniciar Sesión'}
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Benefits */}
        <Card style={styles.benefitsCard}>
          <Card.Content>
            <Title style={styles.benefitsTitle}>¿Por qué RecipeTuner?</Title>

            <View style={styles.benefitItem}>
              <Icon name="robot" size={24} color="#4CAF50" />
              <Text style={styles.benefitText}>
                Adaptaciones inteligentes con IA
              </Text>
            </View>

            <View style={styles.benefitItem}>
              <Icon name="cloud-sync" size={24} color="#2196F3" />
              <Text style={styles.benefitText}>
                Sincronización automática en la nube
              </Text>
            </View>

            <View style={styles.benefitItem}>
              <Icon name="shield-check" size={24} color="#FF9800" />
              <Text style={styles.benefitText}>
                Gestión segura de restricciones dietéticas
              </Text>
            </View>

            <View style={styles.benefitItem}>
              <Icon name="crown" size={24} color="#9C27B0" />
              <Text style={styles.benefitText}>
                Planes premium con funciones avanzadas
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Modal para Recuperación de Contraseña */}
        <Portal>
          <Dialog
            visible={showForgotPassword}
            onDismiss={() => setShowForgotPassword(false)}
          >
            <Dialog.Title style={styles.dialogTitle}>
              <Icon name="lock-reset" size={24} color={theme.colors.primary} />
              <Text style={styles.dialogTitleText}>Recuperar Contraseña</Text>
            </Dialog.Title>

            <Dialog.Content>
              <Paragraph style={styles.dialogDescription}>
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
              </Paragraph>

              <TextInput
                style={styles.dialogInput}
                label="Email"
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                left={<TextInput.Icon icon="email" />}
                disabled={loading}
              />
            </Dialog.Content>

            <Dialog.Actions style={styles.dialogActions}>
              <Button
                onPress={() => setShowForgotPassword(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleForgotPassword}
                disabled={loading || !formData.email}
                loading={loading}
                style={styles.sendButton}
              >
                Enviar Link
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Modal para Configuración de Biometría */}
        {sessionData && (
          <BiometricSetupModal
            visible={showBiometricSetup}
            onClose={handleBiometricSetupClose}
            onEnable={handleBiometricEnabled}
            userEmail={sessionData.email}
            sessionToken={sessionData.sessionToken}
          />
        )}
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
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    marginBottom: 15,
  },
  halfInput: {
    width: '48%',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotButton: {
    marginBottom: 0,
  },
  submitButton: {
    paddingVertical: 8,
    marginBottom: 20,
  },
  divider: {
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: '#4B5563',
  },
  benefitsCard: {
    margin: 20,
    marginTop: 0,
    elevation: 2,
  },
  benefitsTitle: {
    fontSize: 18,
    marginBottom: 20,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  benefitText: {
    marginLeft: 15,
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  // Estilos para el modal de recuperación
  dialogTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
  },
  dialogTitleText: {
    marginLeft: 10,
    fontSize: 18,
    fontWeight: '600',
  },
  dialogDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 20,
    lineHeight: 20,
  },
  dialogInput: {
    marginBottom: 10,
  },
  dialogActions: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sendButton: {
    marginLeft: 8,
  },
});

export default AuthScreen;