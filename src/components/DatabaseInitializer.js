import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import realmDatabaseService from '../services/realmDatabase';

const DatabaseInitializer = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      console.log('🚀 DATABASE INITIALIZER - Forzando inicialización de Realm...');
      setIsLoading(true);

      // Forzar inicialización
      const success = await realmDatabaseService.init();

      if (success) {
        console.log('✅ DATABASE INITIALIZER - Realm inicializado correctamente');
        setIsInitialized(true);
        setError(null);
      } else {
        throw new Error('No se pudo inicializar Realm Database');
      }
    } catch (err) {
      console.error('❌ DATABASE INITIALIZER - Error:', err);
      setError(err.message);
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, fontSize: 16 }}>Inicializando base de datos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, color: 'red', textAlign: 'center' }}>
          Error inicializando base de datos
        </Text>
        <Text style={{ fontSize: 14, color: 'gray', textAlign: 'center', marginTop: 10 }}>
          {error}
        </Text>
      </View>
    );
  }

  return children;
};

export default DatabaseInitializer;