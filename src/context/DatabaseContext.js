import React, { createContext, useContext, useState, useEffect } from 'react';
import realmDatabaseService from '../services/realmDatabase';

const DatabaseContext = createContext();

export const DatabaseProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initAttempts, setInitAttempts] = useState(0);

  const initializeDatabase = async () => {
    console.log('🔄 DATABASE CONTEXT - Inicializando base de datos...');
    setIsLoading(true);
    setError(null);

    try {
      const success = await realmDatabaseService.init();

      if (success) {
        console.log('✅ DATABASE CONTEXT - Base de datos inicializada correctamente');
        setIsInitialized(true);
        setError(null);
      } else {
        throw new Error('No se pudo inicializar Realm Database');
      }
    } catch (err) {
      console.error('❌ DATABASE CONTEXT - Error inicializando base de datos:', err);
      setError(err.message);
      setIsInitialized(false);

      // Intentar reinicializar después de un breve delay (máximo 3 intentos)
      if (initAttempts < 3) {
        console.log(`🔄 DATABASE CONTEXT - Reintentando inicialización (intento ${initAttempts + 1}/3)...`);
        setInitAttempts(prev => prev + 1);
        setTimeout(() => {
          initializeDatabase();
        }, 2000);
      } else {
        console.error('❌ DATABASE CONTEXT - Máximo de intentos alcanzado, persistencia no disponible');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Inicializar cuando se monta el componente
  useEffect(() => {
    initializeDatabase();
  }, []);

  // Reset attempts cuando se inicializa correctamente
  useEffect(() => {
    if (isInitialized) {
      setInitAttempts(0);
    }
  }, [isInitialized]);

  const value = {
    isInitialized,
    isLoading,
    error,
    initAttempts,
    retryInitialization: initializeDatabase
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase debe usarse dentro de DatabaseProvider');
  }
  return context;
};

export default DatabaseContext;