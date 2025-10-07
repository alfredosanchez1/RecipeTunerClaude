import AsyncStorage from '@react-native-async-storage/async-storage';

const LOGS_STORAGE_KEY = '@recipetuner_logs';
const MAX_LOGS = 100; // Máximo número de logs a guardar
const MAX_LOG_AGE_DAYS = 7; // Días antes de limpiar logs antiguos

// Niveles de log
export const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARNING: 'WARNING',
  INFO: 'INFO',
};

// Categorías de log
export const LOG_CATEGORIES = {
  AUTH: 'auth',
  PASSWORD_RESET: 'password-reset',
  SUBSCRIPTION: 'subscription',
  RECIPE: 'recipe',
  DATABASE: 'database',
  NETWORK: 'network',
  API: 'api',
  GENERAL: 'general',
};

/**
 * Guardar un log
 * @param {string} level - Nivel del log (ERROR, WARNING, INFO)
 * @param {string} category - Categoría del log
 * @param {string} message - Mensaje descriptivo
 * @param {object} details - Detalles adicionales (error, stack, etc.)
 */
export const log = async (level, category, message, details = {}) => {
  try {
    const logEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      details: {
        ...details,
        // Sanitizar información sensible
        stack: details.stack || details.error?.stack,
        errorMessage: details.error?.message,
      },
    };

    // Obtener logs existentes
    const existingLogs = await getLogs();

    // Agregar nuevo log al inicio
    const updatedLogs = [logEntry, ...existingLogs];

    // Mantener solo los últimos MAX_LOGS
    const trimmedLogs = updatedLogs.slice(0, MAX_LOGS);

    // Guardar logs actualizados
    await AsyncStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(trimmedLogs));

    // También hacer console.log en desarrollo
    if (__DEV__) {
      console.log(`[${level}] [${category}] ${message}`, details);
    }
  } catch (error) {
    // Si falla el logging, al menos mostrar en consola
    console.error('Error guardando log:', error);
  }
};

/**
 * Obtener todos los logs
 */
export const getLogs = async () => {
  try {
    const logsJson = await AsyncStorage.getItem(LOGS_STORAGE_KEY);
    if (!logsJson) return [];

    const logs = JSON.parse(logsJson);

    // Limpiar logs antiguos
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_LOG_AGE_DAYS);

    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= cutoffDate;
    });

    // Si se eliminaron logs, actualizar storage
    if (filteredLogs.length !== logs.length) {
      await AsyncStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(filteredLogs));
    }

    return filteredLogs;
  } catch (error) {
    console.error('Error obteniendo logs:', error);
    return [];
  }
};

/**
 * Limpiar todos los logs
 */
export const clearLogs = async () => {
  try {
    await AsyncStorage.removeItem(LOGS_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error limpiando logs:', error);
    return false;
  }
};

/**
 * Exportar logs como texto
 */
export const exportLogsAsText = async () => {
  try {
    const logs = await getLogs();

    if (logs.length === 0) {
      return 'No hay logs disponibles.';
    }

    let text = `RecipeTuner - Logs de Depuración\n`;
    text += `Exportado: ${new Date().toLocaleString()}\n`;
    text += `Total de logs: ${logs.length}\n`;
    text += `${'='.repeat(50)}\n\n`;

    logs.forEach((log, index) => {
      text += `[${index + 1}] ${new Date(log.timestamp).toLocaleString()}\n`;
      text += `Nivel: ${log.level}\n`;
      text += `Categoría: ${log.category}\n`;
      text += `Mensaje: ${log.message}\n`;

      if (log.details.errorMessage) {
        text += `Error: ${log.details.errorMessage}\n`;
      }

      if (log.details.stack) {
        text += `Stack:\n${log.details.stack}\n`;
      }

      text += `${'-'.repeat(50)}\n\n`;
    });

    return text;
  } catch (error) {
    console.error('Error exportando logs:', error);
    return 'Error exportando logs.';
  }
};

/**
 * Helpers para logging rápido
 */
export const logError = (category, message, error) => {
  return log(LOG_LEVELS.ERROR, category, message, { error });
};

export const logWarning = (category, message, details = {}) => {
  return log(LOG_LEVELS.WARNING, category, message, details);
};

export const logInfo = (category, message, details = {}) => {
  return log(LOG_LEVELS.INFO, category, message, details);
};

export default {
  log,
  getLogs,
  clearLogs,
  exportLogsAsText,
  logError,
  logWarning,
  logInfo,
  LOG_LEVELS,
  LOG_CATEGORIES,
};
