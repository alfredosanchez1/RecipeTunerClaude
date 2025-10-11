import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, Text, View, Modal, StyleSheet, Share } from 'react-native';
import { TextInput, Button, Switch, Card, Title, Paragraph } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { SettingsSection, AppInfoSection } from '../../components';
import { globalStyles } from '../../styles/globalStyles';
import { useRealmDatabase } from '../../hooks/useRealmDatabase';
import { supabase } from '../../services/supabase/client';
import realmDatabaseV2 from '../../services/realmDatabaseV2';
import { exportLogsAsText } from '../../services/logger';
import BiometricService from '../../services/BiometricService';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { user: userProfile, setUser, resetUserData } = useUser();
  const { user: authUser, signOut } = useAuth();
  const { testDatabase, isInitialized } = useRealmDatabase();

  // Estados para modales
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [exportDataModal, setExportDataModal] = useState(false);

  // Estados para formularios
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState({
    safetyAlerts: true
  });

  // Estados de biometría
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometría');

  // Estados de carga
  const [loading, setLoading] = useState(false);

  // Verificar disponibilidad de biometría al cargar
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        const available = await BiometricService.isAvailable();
        setBiometricAvailable(available);

        if (available) {
          const enabled = await BiometricService.isBiometricEnabled();
          setBiometricEnabled(enabled);

          const type = await BiometricService.getBiometricTypeName();
          setBiometricType(type);

          console.log('🔐 Settings - Biometría:', { available, enabled, type });
        }
      } catch (error) {
        console.error('❌ Error verificando biometría:', error);
      }
    };

    checkBiometric();
  }, []);



  // Función para abrir modal de cambio de contraseña
  const handleChangePassword = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setChangePasswordModal(true);
  };

  // Función para cambiar contraseña con sincronización completa en Supabase
  const handleSavePassword = async () => {
    // Validaciones de entrada
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Validación de fortaleza de contraseña
    const hasNumber = /\d/.test(passwordForm.newPassword);
    const hasUpper = /[A-Z]/.test(passwordForm.newPassword);
    const hasLower = /[a-z]/.test(passwordForm.newPassword);

    if (!hasNumber || !hasUpper || !hasLower) {
      Alert.alert(
        'Contraseña débil',
        'La contraseña debe contener al menos:\n• Una letra mayúscula\n• Una letra minúscula\n• Un número',
        [
          { text: 'Continuar de todas formas', onPress: () => proceedWithPasswordChange() },
          { text: 'Cambiar contraseña', style: 'cancel' }
        ]
      );
      return;
    }

    await proceedWithPasswordChange();
  };

  const proceedWithPasswordChange = async () => {
    setLoading(true);
    try {
      console.log('🔐 SETTINGS - Iniciando cambio de contraseña en Supabase...');

      // Verificar que el usuario está autenticado
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        throw new Error('No se pudo verificar la sesión actual');
      }

      console.log('✅ SETTINGS - Usuario verificado, actualizando contraseña...');

      // Actualizar contraseña en Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) {
        console.error('❌ SETTINGS - Error de Supabase:', error);
        throw error;
      }

      console.log('✅ SETTINGS - Contraseña actualizada exitosamente en Supabase');

      // Verificar que la sesión sigue activa después del cambio
      const { data: { user: updatedUser }, error: verifyError } = await supabase.auth.getUser();

      if (verifyError || !updatedUser) {
        console.warn('⚠️ SETTINGS - Sesión afectada por cambio de contraseña, pero cambio exitoso');
      } else {
        console.log('✅ SETTINGS - Sesión verificada post-cambio de contraseña');
      }

      // Limpiar formulario y cerrar modal
      setChangePasswordModal(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Mostrar confirmación al usuario
      Alert.alert(
        '🔐 Contraseña Actualizada',
        'Tu contraseña ha sido cambiada exitosamente. La nueva contraseña está sincronizada con el servidor.',
        [
          {
            text: 'Entendido',
            onPress: () => {
              console.log('✅ SETTINGS - Cambio de contraseña completado exitosamente');
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ SETTINGS - Error cambiando contraseña:', error);

      let errorMessage = 'No se pudo cambiar la contraseña.';

      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'La contraseña actual es incorrecta.';
      } else if (error.message.includes('Password should be at least 6 characters')) {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Error de conexión. Verifica tu internet y vuelve a intentar.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error al Cambiar Contraseña', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función para exportar datos del usuario
  const handleExportData = () => {
    setExportDataModal(true);
  };

  // Función para realizar exportación de datos
  const handleConfirmExport = async () => {
    setLoading(true);
    try {
      console.log('🔄 Iniciando exportación de datos...');

      // Obtener datos de Supabase
      let supabaseRecipes = [];
      let supabasePreferences = null;

      try {
        // Obtener recetas de Supabase
        const { data: recipes, error: recipesError } = await supabase
          .from('recipetuner_recipes')
          .select(`
            *,
            nutrition_info:recipetuner_nutrition_info(*)
          `)
          .eq('app_name', 'recipetuner');

        if (!recipesError) {
          supabaseRecipes = recipes || [];
          console.log(`✅ Obtenidas ${supabaseRecipes.length} recetas de Supabase`);
        }

        // Obtener preferencias de Supabase
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: preferences, error: prefsError } = await supabase
            .from('recipetuner_user_preferences')
            .select('*')
            .eq('user_id', authUser.id)
            .single();

          if (!prefsError && preferences) {
            supabasePreferences = preferences;
            console.log('✅ Obtenidas preferencias de Supabase');
          }
        }
      } catch (supabaseError) {
        console.warn('⚠️ Error obteniendo datos de Supabase:', supabaseError.message);
      }

      // Obtener datos locales de Realm como respaldo
      let realmRecipes = [];
      let realmPreferences = null;

      try {
        if (realmDatabaseV2.isInitialized || await realmDatabaseV2.init()) {
          realmRecipes = await realmDatabaseV2.getAllRecipes() || [];
          realmPreferences = await realmDatabaseV2.getUserPreferences('default');
          console.log(`✅ Obtenidas ${realmRecipes.length} recetas locales de Realm`);
        }
      } catch (realmError) {
        console.warn('⚠️ Error obteniendo datos de Realm:', realmError.message);
      }

      // Combinar datos (priorizar Supabase, complementar con Realm)
      const allRecipes = supabaseRecipes.length > 0 ? supabaseRecipes : realmRecipes;
      const finalPreferences = supabasePreferences || realmPreferences;

      const exportData = {
        exportDate: new Date().toISOString(),
        exportVersion: '1.0',
        app: 'RecipeTuner',
        user: {
          name: user?.name,
          email: user?.email
        },
        preferences: finalPreferences,
        recipes: allRecipes,
        statistics: {
          totalRecipes: allRecipes.length,
          adaptedRecipes: allRecipes.filter(r => r.is_adapted || r.isAdapted).length,
          supabaseRecipes: supabaseRecipes.length,
          realmRecipes: realmRecipes.length
        },
        sources: {
          supabaseAvailable: supabaseRecipes.length > 0,
          realmAvailable: realmRecipes.length > 0,
          primarySource: supabaseRecipes.length > 0 ? 'supabase' : 'realm'
        }
      };

      // Crear JSON formateado
      const jsonString = JSON.stringify(exportData, null, 2);

      setExportDataModal(false);

      // Usar Share API para compartir o copiar
      Alert.alert(
        '📤 Exportar Datos',
        `Se encontraron ${allRecipes.length} recetas y tus preferencias.\n\n¿Cómo quieres exportar los datos?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: '📋 Compartir/Copiar',
            onPress: async () => {
              try {
                await Share.share({
                  message: jsonString,
                  title: `RecipeTuner - Mis Datos (${new Date().toLocaleDateString()})`
                });
              } catch (error) {
                console.error('Error compartiendo datos:', error);
                Alert.alert('Error', 'No se pudieron compartir los datos');
              }
            }
          },
          {
            text: '📧 Enviar por correo',
            onPress: async () => {
              try {
                await Share.share({
                  message: `Mis datos de RecipeTuner exportados el ${new Date().toLocaleString()}:\n\n${jsonString}`,
                  title: `Datos RecipeTuner - ${new Date().toLocaleDateString()}`
                });
              } catch (error) {
                console.error('Error enviando por correo:', error);
                Alert.alert('Error', 'No se pudieron enviar los datos');
              }
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Error exportando datos:', error);
      Alert.alert('Error', 'No se pudieron exportar los datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función de logout
  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: async () => {
          try {
            console.log('🔓 SETTINGS - Iniciando logout...');
            await signOut();
            await resetUserData();
            Alert.alert('Sesión Cerrada', 'Has cerrado sesión exitosamente');
          } catch (error) {
            console.error('❌ SETTINGS - Error en logout:', error);
            Alert.alert('Error', 'No se pudo cerrar sesión: ' + error.message);
          }
        }},
      ]
    );
  };

  // Función de debug para limpiar completamente AsyncStorage
  const handleClearAsyncStorage = async () => {
    Alert.alert(
      '🧹 Limpiar Sesión Persistente',
      '⚠️ Esto eliminará TODA la sesión guardada de Supabase y forzará un logout completo.\n\nÚsalo solo si tienes problemas de sesión persistente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar Todo',
          style: 'destructive',
          onPress: async () => {
            try {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;

              console.log('🧹 DEBUG - Limpiando AsyncStorage...');

              // Obtener todas las keys
              const allKeys = await AsyncStorage.getAllKeys();
              console.log('📦 DEBUG - Keys encontradas:', allKeys);

              // Filtrar keys de Supabase
              const supabaseKeys = allKeys.filter(key =>
                key.includes('supabase') ||
                key.includes('sb-') ||
                key.includes('auth')
              );

              console.log('🔑 DEBUG - Keys de Supabase a eliminar:', supabaseKeys);

              if (supabaseKeys.length > 0) {
                await AsyncStorage.multiRemove(supabaseKeys);
                console.log('✅ DEBUG - Keys de Supabase eliminadas');
              }

              // Forzar logout en Supabase
              await supabase.auth.signOut();

              // Resetear datos de usuario
              await resetUserData();

              Alert.alert(
                '✅ Sesión Limpiada',
                'Se eliminaron todas las sesiones persistentes. La app debería redirigir al login.',
                [{ text: 'OK' }]
              );

            } catch (error) {
              console.error('❌ DEBUG - Error limpiando:', error);
              Alert.alert('Error', 'No se pudo limpiar: ' + error.message);
            }
          }
        },
      ]
    );
  };

  // Función para manejar el toggle de biometría
  const handleBiometricToggle = async (value) => {
    try {
      if (value) {
        // Habilitar biometría - Pedir contraseña al usuario
        Alert.prompt(
          'Confirma tu contraseña',
          'Para habilitar Face ID, por favor ingresa tu contraseña',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Confirmar',
              onPress: async (password) => {
                if (!password) {
                  Alert.alert('Error', 'Debes ingresar tu contraseña');
                  return;
                }

                const result = await BiometricService.enableBiometric(authUser.email, password);

                if (result.success) {
                  setBiometricEnabled(true);
                  Alert.alert(
                    '✅ Biometría Habilitada',
                    `Ahora puedes usar ${biometricType} para acceder rápidamente a RecipeTuner.`
                  );
                } else {
                  Alert.alert('Error', result.error || 'No se pudo habilitar la biometría');
                }
              }
            }
          ],
          'secure-text'
        );
      } else {
        // Deshabilitar biometría
        Alert.alert(
          '¿Deshabilitar biometría?',
          `Dejarás de poder usar ${biometricType} para acceder a RecipeTuner. Deberás usar tu contraseña.`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Deshabilitar',
              style: 'destructive',
              onPress: async () => {
                const result = await BiometricService.disableBiometric();

                if (result.success) {
                  setBiometricEnabled(false);
                  Alert.alert('✅ Biometría Deshabilitada', 'Ahora necesitarás tu contraseña para acceder.');
                } else {
                  Alert.alert('Error', result.error || 'No se pudo deshabilitar la biometría');
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error cambiando configuración de biometría:', error);
      Alert.alert('Error', 'Ocurrió un error inesperado');
    }
  };

  const settingSections = [
    {
      title: 'Seguridad',
      items: biometricAvailable ? [
        {
          label: `Usar ${biometricType}`,
          type: 'switch',
          value: biometricEnabled,
          onValueChange: handleBiometricToggle,
          icon: biometricType === 'Face ID' ? 'face-recognition' : 'fingerprint',
          description: `Acceso rápido y seguro con ${biometricType}`
        }
      ] : []
    },
    {
      title: 'Cuenta',
      items: [
        {
          label: 'Cambiar Contraseña',
          onPress: handleChangePassword,
          icon: 'lock'
        },
        {
          label: '💎 Planes y Suscripciones',
          onPress: () => {
            console.log('🚀 SETTINGS - Botón Planes y Suscripciones presionado');
            console.log('🚀 SETTINGS - Navegando a Profile > Subscription...');
            navigation.navigate('Profile', { screen: 'Subscription' });
          },
          icon: 'crown'
        }
      ]
    },
    {
      title: 'Notificaciones',
      items: [
        {
          label: 'Alertas de Seguridad Aliment.',
          type: 'switch',
          value: notifications.safetyAlerts,
          onValueChange: (value) => setNotifications(prev => ({...prev, safetyAlerts: value})),
          icon: 'shield-check',
          description: 'Avisos cuando una receta adaptada pueda tener ingredientes problemáticos para ti'
        }
      ]
    },
    {
      title: 'Datos',
      items: [
        {
          label: 'Exportar Mis Datos',
          onPress: handleExportData,
          icon: 'download'
        }
      ]
    },
    {
      title: 'Sesión',
      items: [
        {
          label: 'Cerrar Sesión',
          onPress: handleLogout,
          icon: 'logout'
        }
      ]
    }
  ];

  // Debug: Mostrar las secciones en consola
  useEffect(() => {
    console.log('🔍 SettingsScreen - Secciones disponibles:', settingSections.map(s => s.title));
    console.log('🔍 SettingsScreen - Sección Desarrollo:', settingSections.find(s => s.title === 'Desarrollo'));
  }, []);

  return (
    <>
      <ScrollView style={globalStyles.container}>
        {/* Banner de Face ID Habilitada */}
        {biometricAvailable && biometricEnabled && (
          <Card style={styles.biometricBanner}>
            <Card.Content style={styles.biometricBannerContent}>
              <View style={styles.biometricIcon}>
                <Text style={styles.biometricIconText}>
                  {biometricType === 'Face ID' ? '🔐' : '👆'}
                </Text>
              </View>
              <View style={styles.biometricInfo}>
                <Text style={styles.biometricTitle}>
                  {biometricType} Activado
                </Text>
                <Text style={styles.biometricDescription}>
                  Acceso rápido y seguro habilitado
                </Text>
              </View>
              <View style={styles.biometricCheck}>
                <Text style={styles.biometricCheckIcon}>✓</Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {settingSections.map((section, index) => (
          <SettingsSection key={index} title={section.title} items={section.items} />
        ))}

        <AppInfoSection />
      </ScrollView>


      {/* Modal de Cambiar Contraseña */}
      <Modal
        visible={changePasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <Card style={styles.modalCard}>
            <Card.Content>
              <Title style={styles.modalTitle}>🔐 Cambiar Contraseña</Title>

              <Paragraph style={styles.modalText}>
                Tu nueva contraseña se sincronizará automáticamente con el servidor de forma segura.
              </Paragraph>

              <TextInput
                label="Nueva Contraseña"
                value={passwordForm.newPassword}
                onChangeText={(text) => setPasswordForm(prev => ({...prev, newPassword: text}))}
                style={styles.input}
                mode="outlined"
                secureTextEntry
                right={<TextInput.Icon icon="eye" />}
                helper="Mínimo 6 caracteres. Recomendado: mayúsculas, minúsculas y números"
              />

              <TextInput
                label="Confirmar Nueva Contraseña"
                value={passwordForm.confirmPassword}
                onChangeText={(text) => setPasswordForm(prev => ({...prev, confirmPassword: text}))}
                style={styles.input}
                mode="outlined"
                secureTextEntry
                right={<TextInput.Icon icon="eye" />}
                error={passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword}
                helper={passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword ? "Las contraseñas no coinciden" : ""}
              />

              <View style={styles.passwordInfo}>
                <Text style={styles.infoTitle}>📋 Información importante:</Text>
                <Text style={styles.infoText}>• La contraseña se actualizará en Supabase inmediatamente</Text>
                <Text style={styles.infoText}>• Tu sesión permanecerá activa después del cambio</Text>
                <Text style={styles.infoText}>• Usa la nueva contraseña para futuros inicios de sesión</Text>
              </View>

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setChangePasswordModal(false);
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  style={styles.modalButton}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSavePassword}
                  style={styles.modalButton}
                  loading={loading}
                  disabled={loading || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  icon="shield-check"
                >
                  {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      </Modal>

      {/* Modal de Exportar Datos */}
      <Modal
        visible={exportDataModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <Card style={styles.modalCard}>
            <Card.Content>
              <Title style={styles.modalTitle}>Exportar Mis Datos</Title>

              <Paragraph style={styles.modalText}>
                Se exportarán todos tus datos incluyendo:
              </Paragraph>

              <View style={styles.exportList}>
                <Text style={styles.exportItem}>• Todas tus recetas</Text>
                <Text style={styles.exportItem}>• Recetas adaptadas con IA</Text>
                <Text style={styles.exportItem}>• Información nutricional</Text>
                <Text style={styles.exportItem}>• Preferencias dietéticas</Text>
                <Text style={styles.exportItem}>• Configuraciones de usuario</Text>
              </View>

              <Paragraph style={styles.modalWarning}>
                Los datos se exportarán en formato JSON. Puedes guardar este archivo como respaldo o para importar en otra cuenta.
              </Paragraph>

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setExportDataModal(false)}
                  style={styles.modalButton}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={handleConfirmExport}
                  style={styles.modalButton}
                  loading={loading}
                  disabled={loading}
                  icon="download"
                >
                  Exportar
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Estilos del banner de Face ID
  biometricBanner: {
    margin: 15,
    marginBottom: 10,
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    elevation: 2,
  },
  biometricBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  biometricIcon: {
    marginRight: 15,
  },
  biometricIconText: {
    fontSize: 32,
  },
  biometricInfo: {
    flex: 1,
  },
  biometricTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 2,
  },
  biometricDescription: {
    fontSize: 13,
    color: '#558B2F',
  },
  biometricCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricCheckIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Estilos de modales
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  modalButton: {
    flex: 1,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 15,
    color: '#555',
  },
  exportList: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  exportItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    paddingLeft: 10,
  },
  modalWarning: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 15,
  },
  passwordInfo: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1976d2',
    marginBottom: 4,
    paddingLeft: 10,
  },
});

export default SettingsScreen;