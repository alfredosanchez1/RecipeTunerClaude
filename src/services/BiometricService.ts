/**
 * BiometricService.ts
 * Servicio Singleton para gestión de autenticación biométrica (Face ID / Touch ID)
 *
 * Funcionalidades:
 * - Detectar disponibilidad de biometría
 * - Autenticar al usuario
 * - Guardar/recuperar credenciales de forma segura
 * - Habilitar/deshabilitar Face ID
 * - Gestión de sesión verificada
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Claves para almacenamiento
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_EMAIL_KEY = 'biometric_email';
const BIOMETRIC_PASSWORD_KEY = 'biometric_password';
const BIOMETRIC_SESSION_KEY = 'biometric_verified_session';
const DONT_SHOW_SETUP_KEY = 'dont_show_biometric_setup';

interface BiometricResult {
  success: boolean;
  error?: string;
}

interface StoredCredentials {
  email: string;
  password: string;
}

class BiometricService {
  private static instance: BiometricService;
  private isInitialized: boolean = false;
  private supportedTypes: number[] = [];

  private constructor() {
    // Constructor privado para patrón Singleton
  }

  /**
   * Obtener instancia única del servicio
   */
  public static getInstance(): BiometricService {
    if (!BiometricService.instance) {
      BiometricService.instance = new BiometricService();
    }
    return BiometricService.instance;
  }

  /**
   * Inicializa el servicio y verifica capacidades del dispositivo
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (compatible) {
        this.supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      }
      this.isInitialized = true;
      console.log('[BiometricService] Inicializado:', {
        compatible,
        types: this.supportedTypes
      });
    } catch (error) {
      console.error('[BiometricService] Error inicializando:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Verifica si el dispositivo tiene biometría disponible
   * @returns true si Face ID o Touch ID está disponible
   */
  public async isAvailable(): Promise<boolean> {
    try {
      await this.initialize();

      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return false;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return enrolled;
    } catch (error) {
      console.error('[BiometricService] Error checking availability:', error);
      return false;
    }
  }

  /**
   * Obtiene el nombre del tipo de biometría disponible
   * @returns 'Face ID', 'Touch ID', o 'Biometría'
   */
  public async getBiometricTypeName(): Promise<string> {
    try {
      await this.initialize();

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face ID';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Touch ID';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'Iris Scanner';
      }

      return 'Biometría';
    } catch (error) {
      console.error('[BiometricService] Error getting biometric type:', error);
      return 'Biometría';
    }
  }

  /**
   * Solicita autenticación biométrica al usuario
   * @param promptMessage Mensaje a mostrar en el prompt de autenticación
   * @returns BiometricResult con success true/false y posible error
   */
  public async authenticate(promptMessage: string = 'Autenticarse'): Promise<BiometricResult> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return {
          success: false,
          error: 'Biometría no disponible en este dispositivo'
        };
      }

      console.log('[BiometricService] Solicitando autenticación biométrica...');

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false, // Permite usar PIN/contraseña del dispositivo como fallback
      });

      if (result.success) {
        console.log('[BiometricService] Autenticación exitosa');
        return { success: true };
      } else {
        console.log('[BiometricService] Autenticación fallida:', result.error);
        return {
          success: false,
          error: this.getErrorMessage(result.error)
        };
      }
    } catch (error) {
      console.error('[BiometricService] Error durante autenticación:', error);
      return {
        success: false,
        error: 'Error al autenticar. Por favor intenta de nuevo.'
      };
    }
  }

  /**
   * Habilita Face ID guardando credenciales de forma segura
   * @param email Email del usuario
   * @param password Contraseña del usuario
   * @returns BiometricResult
   */
  public async enableBiometric(email: string, password: string): Promise<BiometricResult> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return {
          success: false,
          error: 'Biometría no disponible en este dispositivo'
        };
      }

      // Primero autenticar
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

      // Guardar credenciales en SecureStore (encriptado por iOS Keychain)
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
      await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email);
      await SecureStore.setItemAsync(BIOMETRIC_PASSWORD_KEY, password);

      console.log('[BiometricService] Biometric enabled for:', email);
      return { success: true };
    } catch (error) {
      console.error('[BiometricService] Error enabling biometric:', error);
      return {
        success: false,
        error: 'No se pudo habilitar Face ID. Por favor intenta de nuevo.'
      };
    }
  }

  /**
   * Deshabilita Face ID eliminando credenciales almacenadas
   * @returns BiometricResult
   */
  public async disableBiometric(): Promise<BiometricResult> {
    try {
      // Eliminar credenciales de SecureStore
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_PASSWORD_KEY);

      // Marcar como deshabilitado en AsyncStorage
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');

      // Limpiar sesión verificada
      await AsyncStorage.removeItem(BIOMETRIC_SESSION_KEY);

      console.log('[BiometricService] Biometric disabled');
      return { success: true };
    } catch (error) {
      console.error('[BiometricService] Error disabling biometric:', error);
      return {
        success: false,
        error: 'No se pudo deshabilitar Face ID'
      };
    }
  }

  /**
   * Verifica si Face ID está habilitado
   * @returns true si está habilitado
   */
  public async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('[BiometricService] Error checking if enabled:', error);
      return false;
    }
  }

  /**
   * Obtiene las credenciales almacenadas de forma segura
   * @returns StoredCredentials o null si no existen
   */
  public async getStoredCredentials(): Promise<StoredCredentials | null> {
    try {
      const enabled = await this.isBiometricEnabled();
      if (!enabled) {
        console.log('[BiometricService] Biometric not enabled, no credentials');
        return null;
      }

      const email = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
      const password = await SecureStore.getItemAsync(BIOMETRIC_PASSWORD_KEY);

      if (!email || !password) {
        console.log('[BiometricService] Incomplete credentials, cleaning up');
        // Limpiar si están incompletas
        await this.disableBiometric();
        return null;
      }

      console.log('[BiometricService] Credentials retrieved successfully');
      return { email, password };
    } catch (error) {
      console.error('[BiometricService] Error getting stored credentials:', error);
      return null;
    }
  }

  /**
   * Marca la sesión actual como verificada biométricamente
   * Se usa para saber que el usuario ya pasó por BiometricLockScreen
   */
  public async markSessionAsVerified(): Promise<void> {
    try {
      await AsyncStorage.setItem(BIOMETRIC_SESSION_KEY, 'true');
      console.log('[BiometricService] Session marked as verified');
    } catch (error) {
      console.error('[BiometricService] Error marking session as verified:', error);
    }
  }

  /**
   * Verifica si la sesión actual está verificada biométricamente
   * @returns true si la sesión está verificada
   */
  public async isSessionVerified(): Promise<boolean> {
    try {
      const verified = await AsyncStorage.getItem(BIOMETRIC_SESSION_KEY);
      return verified === 'true';
    } catch (error) {
      console.error('[BiometricService] Error checking session verification:', error);
      return false;
    }
  }

  /**
   * Limpia la verificación de sesión (llamar al hacer logout)
   */
  public async clearSessionVerification(): Promise<void> {
    try {
      await AsyncStorage.removeItem(BIOMETRIC_SESSION_KEY);
      console.log('[BiometricService] Session verification cleared');
    } catch (error) {
      console.error('[BiometricService] Error clearing session verification:', error);
    }
  }

  /**
   * Guarda la preferencia del usuario de no volver a mostrar el setup modal
   */
  public async setDontShowSetupAgain(value: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(DONT_SHOW_SETUP_KEY, value ? 'true' : 'false');
    } catch (error) {
      console.error('[BiometricService] Error setting dont show setup:', error);
    }
  }

  /**
   * Verifica si el usuario marcó "No volver a mostrar" en el setup modal
   */
  public async shouldShowSetup(): Promise<boolean> {
    try {
      const dontShow = await AsyncStorage.getItem(DONT_SHOW_SETUP_KEY);
      return dontShow !== 'true';
    } catch (error) {
      console.error('[BiometricService] Error checking should show setup:', error);
      return true; // Por defecto, mostrar
    }
  }

  /**
   * Actualiza el password guardado (útil cuando el usuario cambia su contraseña)
   * @param newPassword Nueva contraseña
   * @returns BiometricResult
   */
  public async updatePassword(newPassword: string): Promise<BiometricResult> {
    try {
      const enabled = await this.isBiometricEnabled();
      if (!enabled) {
        return {
          success: false,
          error: 'Biometría no habilitada'
        };
      }

      await SecureStore.setItemAsync(BIOMETRIC_PASSWORD_KEY, newPassword);
      console.log('[BiometricService] Password updated successfully');

      return { success: true };
    } catch (error) {
      console.error('[BiometricService] Error updating password:', error);
      return {
        success: false,
        error: 'Error actualizando contraseña'
      };
    }
  }

  /**
   * Limpia todas las credenciales y deshabilita biometría
   * Usar durante logout
   */
  public async clearAll(): Promise<void> {
    try {
      await this.disableBiometric();
      console.log('[BiometricService] All credentials cleared');
    } catch (error) {
      console.error('[BiometricService] Error clearing credentials:', error);
    }
  }

  /**
   * Convierte códigos de error de LocalAuthentication a mensajes amigables
   * @param error Código de error
   * @returns Mensaje de error en español
   */
  private getErrorMessage(error: string | undefined): string {
    switch (error) {
      case 'user_cancel':
        return 'Autenticación cancelada';
      case 'system_cancel':
        return 'Autenticación cancelada por el sistema';
      case 'lockout':
        return 'Demasiados intentos fallidos. Por favor usa tu contraseña.';
      case 'lockout_permanent':
        return 'Face ID bloqueado. Desbloquea tu dispositivo primero.';
      case 'not_enrolled':
        return 'No tienes Face ID configurado en tu dispositivo';
      case 'not_available':
        return 'Face ID no está disponible';
      default:
        return 'Error de autenticación. Por favor intenta de nuevo.';
    }
  }

  /**
   * Método de depuración para ver el estado completo
   */
  public async debugStatus(): Promise<void> {
    console.log('=== BiometricService Debug Status ===');
    console.log('Available:', await this.isAvailable());
    console.log('Biometric Type:', await this.getBiometricTypeName());
    console.log('Enabled:', await this.isBiometricEnabled());
    console.log('Session Verified:', await this.isSessionVerified());
    console.log('Should Show Setup:', await this.shouldShowSetup());

    const credentials = await this.getStoredCredentials();
    console.log('Has Stored Credentials:', credentials !== null);
    if (credentials) {
      console.log('Stored Email:', credentials.email);
    }
    console.log('====================================');
  }
}

// Exportar instancia única
export default BiometricService.getInstance();
