import React, { useState, useEffect } from 'react';
import { ScrollView, Alert, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../../context/UserContext';
import { SettingsSection, UserProfileHeader, AppInfoSection } from '../../components';
import { globalStyles } from '../../styles/globalStyles';
import { useRealmDatabase } from '../../hooks/useRealmDatabase';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { user, setUser } = useUser();
  const { testDatabase, isInitialized } = useRealmDatabase();
  const [notifications, setNotifications] = useState({
    mealReminders: true,
    healthAlerts: true,
    recipeUpdates: false
  });

  // Función para probar Realm Database
  const handleTestDatabase = async () => {
    try {
      const result = await testDatabase();

      if (result.success) {
        const message = `Realm Database funciona perfectamente\n\nTests ejecutados:\n${result.tests.map(test => `- ${test}`).join('\n')}\n\nTimestamp: ${result.timestamp}`;
        Alert.alert('✅ Prueba Exitosa', message);
      } else {
        Alert.alert('❌ Error en Test', result.message);
      }
    } catch (error) {
      console.error('❌ Error en prueba de Realm Database:', error);
      Alert.alert('❌ Error', 'Error al probar Realm Database: ' + error.message);
    }
  };

  // Función alternativa para probar Realm Database
  const handleTestDatabaseAlt = async () => {
    try {
      const result = await testDatabase();

      if (result.success) {
        const message = `Realm Database funciona perfectamente\n\nTests ejecutados:\n- Inicialización\n- Crear objeto\n- Leer objeto\n- Eliminar objeto\n\nTimestamp: ${result.timestamp}`;
        Alert.alert('✅ Prueba Exitosa', message);
      } else {
        Alert.alert('❌ Error en Test', result.message);
      }
    } catch (error) {
      console.error('❌ Error en prueba de Realm Database:', error);
      Alert.alert('❌ Error', 'Error al probar Realm Database: ' + error.message);
    }
  };

  // Función para exportar datos del usuario
  const exportUserData = () => {
    Alert.alert('Exportar Datos', 'Función en desarrollo');
  };

  // Función para mostrar alerta de eliminación de cuenta
  const showDeleteAccountAlert = () => {
    Alert.alert(
      'Eliminar Cuenta',
      '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => console.log('Cuenta eliminada') }
      ]
    );
  };

  const settingSections = [
    {
      title: 'Cuenta',
      items: [
        { 
          label: 'Editar Perfil', 
          onPress: () => navigation.navigate('EditProfile'),
          icon: 'account-edit'
        },
        { 
          label: 'Cambiar Contraseña', 
          onPress: () => navigation.navigate('ChangePassword'),
          icon: 'lock'
        }
      ]
    },
    {
      title: 'Notificaciones',
      items: [
        { 
          label: 'Recordatorios de Comidas', 
          type: 'switch',
          value: notifications.mealReminders,
          onValueChange: (value) => setNotifications(prev => ({...prev, mealReminders: value})),
          icon: 'bell'
        },
        { 
          label: 'Alertas de Salud', 
          type: 'switch',
          value: notifications.healthAlerts,
          onValueChange: (value) => setNotifications(prev => ({...prev, healthAlerts: value})),
          icon: 'medical-bag'
        }
      ]
    },
    {
      title: 'Datos',
      items: [
        { 
          label: 'Exportar Mis Datos', 
          onPress: exportUserData,
          icon: 'download'
        },
        { 
          label: 'Eliminar Cuenta', 
          onPress: () => showDeleteAccountAlert(),
          icon: 'delete',
          danger: true
        }
      ]
    },
    {
      title: 'Desarrollo',
      items: [
        {
          label: '🧪 Probar Realm Database',
          onPress: handleTestDatabase,
          icon: 'database'
        },
        {
          label: '🧪 Probar Realm Database (Alt)',
          onPress: handleTestDatabaseAlt,
          icon: 'database-outline'
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
    <ScrollView style={globalStyles.container}>
      <UserProfileHeader user={user} />
      
      {settingSections.map((section, index) => (
        <SettingsSection key={index} title={section.title} items={section.items} />
      ))}
      
      <AppInfoSection />
    </ScrollView>
  );
};

export default SettingsScreen;