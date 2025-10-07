import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// Keys para SecureStore
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_EMAIL_KEY = 'biometric_email';
const BIOMETRIC_SESSION_KEY = 'biometric_session';

/**
 * Servicio singleton para manejar autenticación biométrica
 * Gestiona Face ID / Touch ID en iOS y Android
 */
class BiometricService {
  constructor() {
    this.isInitialized = false;
    this.supportedTypes = [];
  }

  /**
   * Inicializa el servicio y verifica capacidades del dispositivo
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (compatible) {
        this.supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      }
      this.isInitialized = true;
      console.log('✅ BiometricService inicializado:', {
        compatible,
        types: this.supportedTypes
      });
    } catch (error) {
      console.error('❌ Error inicializando BiometricService:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Verifica si el dispositivo tiene hardware biométrico disponible
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      await this.initialize();

      // Verificar hardware
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        console.log('⚠️ Dispositivo sin hardware biométrico');
        return false;
      }

      // Verificar si hay biometría enrollada
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        console.log('⚠️ Usuario no tiene biometría configurada');
        return false;
      }

      console.log('✅ Biometría disponible y configurada');
      return true;
    } catch (error) {
      console.error('❌ Error verificando disponibilidad de biometría:', error);
      return false;
    }
  }

  /**
   * Obtiene el nombre amigable del tipo de biometría (Face ID / Touch ID / Fingerprint)
   * @returns {Promise<string>}
   */
  async getBiometricTypeName() {
    try {
      await this.initialize();

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face ID';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Touch ID';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'Iris Scanner';
      }

      return 'Biometría';
    } catch (error) {
      console.error('❌ Error obteniendo tipo de biometría:', error);
      return 'Biometría';
    }
  }

  /**
   * Muestra el prompt de autenticación biométrica
   * @param {string} promptMessage - Mensaje personalizado para el prompt
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async authenticate(promptMessage = 'Autentícate para continuar') {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return {
          success: false,
          error: 'Biometría no disponible'
        };
      }

      console.log('🔐 Solicitando autenticación biométrica...');

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Usar contraseña',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false, // Permitir fallback a PIN/contraseña del dispositivo
      });

      if (result.success) {
        console.log('✅ Autenticación biométrica exitosa');
        return { success: true };
      } else {
        console.log('❌ Autenticación biométrica fallida:', result.error);
        return {
          success: false,
          error: result.error || 'Autenticación cancelada'
        };
      }
    } catch (error) {
      console.error('❌ Error durante autenticación biométrica:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido'
      };
    }
  }

  /**
   * Verifica si el usuario tiene biometría habilitada
   * @returns {Promise<boolean>}
   */
  async isBiometricEnabled() {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('❌ Error verificando si biometría está habilitada:', error);
      return false;
    }
  }

  /**
   * Habilita la autenticación biométrica y guarda las credenciales
   * @param {string} email - Email del usuario
   * @param {string} sessionToken - Token de sesión de Supabase
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async enableBiometric(email, sessionToken) {
    try {
      // Primero autenticar para confirmar
      const biometricName = await this.getBiometricTypeName();
      const authResult = await this.authenticate(
        `Habilitar ${biometricName} para RecipeTuner`
      );

      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error || 'Autenticación cancelada'
        };
      }

      // Guardar credenciales de forma segura
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
      await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email);
      await SecureStore.setItemAsync(BIOMETRIC_SESSION_KEY, sessionToken);

      console.log('✅ Biometría habilitada exitosamente para:', email);

      return { success: true };
    } catch (error) {
      console.error('❌ Error habilitando biometría:', error);
      return {
        success: false,
        error: error.message || 'Error guardando credenciales'
      };
    }
  }

  /**
   * Deshabilita la autenticación biométrica y elimina credenciales
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async disableBiometric() {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_SESSION_KEY);

      console.log('✅ Biometría deshabilitada exitosamente');

      return { success: true };
    } catch (error) {
      console.error('❌ Error deshabilitando biometría:', error);
      return {
        success: false,
        error: error.message || 'Error eliminando credenciales'
      };
    }
  }

  /**
   * Obtiene las credenciales guardadas (si existen y están habilitadas)
   * @returns {Promise<{email: string, sessionToken: string} | null>}
   */
  async getStoredCredentials() {
    try {
      const enabled = await this.isBiometricEnabled();
      if (!enabled) {
        console.log('⚠️ Biometría no habilitada, no hay credenciales');
        return null;
      }

      const email = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
      const sessionToken = await SecureStore.getItemAsync(BIOMETRIC_SESSION_KEY);

      if (!email || !sessionToken) {
        console.log('⚠️ Credenciales incompletas en SecureStore');
        // Limpiar si están incompletas
        await this.disableBiometric();
        return null;
      }

      console.log('✅ Credenciales recuperadas de SecureStore');
      return { email, sessionToken };
    } catch (error) {
      console.error('❌ Error obteniendo credenciales guardadas:', error);
      return null;
    }
  }

  /**
   * Actualiza el token de sesión guardado (útil cuando se refresca el token)
   * @param {string} newSessionToken - Nuevo token de sesión
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateSessionToken(newSessionToken) {
    try {
      const enabled = await this.isBiometricEnabled();
      if (!enabled) {
        return {
          success: false,
          error: 'Biometría no habilitada'
        };
      }

      await SecureStore.setItemAsync(BIOMETRIC_SESSION_KEY, newSessionToken);
      console.log('✅ Token de sesión actualizado en SecureStore');

      return { success: true };
    } catch (error) {
      console.error('❌ Error actualizando token de sesión:', error);
      return {
        success: false,
        error: error.message || 'Error actualizando token'
      };
    }
  }

  /**
   * Limpia todas las credenciales y deshabilita biometría
   * Usar durante logout
   * @returns {Promise<void>}
   */
  async clearAll() {
    try {
      await this.disableBiometric();
      console.log('✅ Todas las credenciales biométricas limpiadas');
    } catch (error) {
      console.error('❌ Error limpiando credenciales:', error);
    }
  }
}

// Exportar instancia singleton
const biometricService = new BiometricService();
export default biometricService;
