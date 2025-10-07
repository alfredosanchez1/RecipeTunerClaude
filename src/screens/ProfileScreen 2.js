import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  useTheme,
  Avatar,
  Divider,
  List,
  Switch,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useUser } from '../context/UserContext';

const ProfileScreen = ({ navigation }) => {
  const theme = useTheme();
  const { user, preferences, saveUserData, savePreferences, resetUserData } = useUser();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleEditProfile = () => {
    // Implementar edición de perfil
    Alert.alert('Editar Perfil', 'Función en desarrollo');
  };

  const handleEditPreferences = () => {
    navigation.navigate('Preferences');
  };

  const handleExportData = () => {
    Alert.alert(
      'Exportar Datos',
      '¿Deseas exportar tus recetas y preferencias?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Exportar', onPress: () => {
          Alert.alert('Éxito', 'Datos exportados correctamente');
        }},
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar Cuenta',
      '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => {
          resetUserData();
          Alert.alert('Cuenta Eliminada', 'Tu cuenta ha sido eliminada');
        }},
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', onPress: resetUserData },
      ]
    );
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <Avatar.Text
            size={80}
            label={user?.name?.charAt(0)?.toUpperCase() || 'U'}
            style={styles.avatar}
            color="#fff"
          />
          <View style={styles.profileInfo}>
            <Title style={styles.userName}>
              {user?.name || 'Usuario'}
            </Title>
            <Paragraph style={styles.userEmail}>
              {user?.email || 'usuario@ejemplo.com'}
            </Paragraph>
            <Button
              mode="outlined"
              onPress={handleEditProfile}
              style={styles.editButton}
              compact
            >
              Editar Perfil
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Stats */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Title style={styles.statsTitle}>Resumen de Actividad</Title>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Icon name="food-fork-drink" size={30} color="#4CAF50" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Recetas</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="robot" size={30} color="#FF9800" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Adaptadas</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="star" size={30} color="#2196F3" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Favoritas</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Preferences Summary */}
      <Card style={styles.preferencesCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title style={styles.cardTitle}>Preferencias Dietéticas</Title>
            <Button
              mode="text"
              onPress={handleEditPreferences}
              compact
            >
              Editar
            </Button>
          </View>
          
          <View style={styles.preferencesList}>
            <View style={styles.preferenceItem}>
              <Icon name="food-apple" size={20} color="#4CAF50" />
              <Text style={styles.preferenceLabel}>Restricciones:</Text>
              <Text style={styles.preferenceValue}>
                {preferences.dietaryRestrictions?.length > 0 
                  ? preferences.dietaryRestrictions.join(', ')
                  : 'Sin restricciones'
                }
              </Text>
            </View>

            <View style={styles.preferenceItem}>
              <Icon name="alert-circle" size={20} color="#F44336" />
              <Text style={styles.preferenceLabel}>Alergias:</Text>
              <Text style={styles.preferenceValue}>
                {preferences.allergies?.length > 0 
                  ? preferences.allergies.join(', ')
                  : 'Sin alergias'
                }
              </Text>
            </View>

            <View style={styles.preferenceItem}>
              <Icon name="fire" size={20} color="#FF9800" />
              <Text style={styles.preferenceLabel}>Nivel de picante:</Text>
              <Text style={styles.preferenceValue}>
                {preferences.spiceLevel || 'No especificado'}
              </Text>
            </View>

            <View style={styles.preferenceItem}>
              <Icon name="clock" size={20} color="#607D8B" />
              <Text style={styles.preferenceLabel}>Tiempo preferido:</Text>
              <Text style={styles.preferenceValue}>
                {preferences.cookingTime || 'No especificado'}
              </Text>
            </View>

            <View style={styles.preferenceItem}>
              <Icon name="account-group" size={20} color="#4CAF50" />
              <Text style={styles.preferenceLabel}>Porciones:</Text>
              <Text style={styles.preferenceValue}>
                {preferences.servings || 'No especificado'}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Settings */}
      <Card style={styles.settingsCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Configuración</Title>
          
          <List.Item
            title="Notificaciones"
            description="Recibir alertas sobre nuevas recetas y adaptaciones"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                color={theme.colors.primary}
              />
            )}
          />

          <Divider />

          <List.Item
            title="Exportar Datos"
            description="Descargar tus recetas y preferencias"
            left={(props) => <List.Icon {...props} icon="download" />}
            onPress={handleExportData}
          />

          <Divider />

          <List.Item
            title="Ayuda y Soporte"
            description="Obtener ayuda y contactar soporte"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            onPress={() => Alert.alert('Ayuda', 'Función en desarrollo')}
          />

          <Divider />

          <List.Item
            title="Acerca de"
            description="Información de la aplicación"
            left={(props) => <List.Icon {...props} icon="information" />}
            onPress={() => Alert.alert('Acerca de', 'RecipeTunnel Claude v1.0.0')}
          />
        </Card.Content>
      </Card>

      {/* Account Actions */}
      <Card style={styles.accountCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Cuenta</Title>
          
          <Button
            mode="outlined"
            onPress={handleLogout}
            icon="logout"
            style={styles.logoutButton}
            textColor={theme.colors.error}
          >
            Cerrar Sesión
          </Button>

          <Button
            mode="outlined"
            onPress={handleDeleteAccount}
            icon="delete"
            style={styles.deleteButton}
            textColor={theme.colors.error}
          >
            Eliminar Cuenta
          </Button>
        </Card.Content>
      </Card>

      {/* App Info */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <View style={styles.appInfo}>
            <Icon name="chef-hat" size={40} color={theme.colors.primary} />
            <Title style={styles.appTitle}>RecipeTunnel Claude</Title>
            <Paragraph style={styles.appVersion}>Versión 1.0.0</Paragraph>
            <Paragraph style={styles.appDescription}>
              Personaliza tus recetas con inteligencia artificial según tus necesidades dietéticas
            </Paragraph>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  profileCard: {
    margin: 20,
    marginBottom: 15,
    elevation: 3,
  },
  profileContent: {
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    backgroundColor: '#10B981',
    marginBottom: 15,
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  editButton: {
    borderColor: '#10B981',
  },
  statsCard: {
    margin: 20,
    marginBottom: 15,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    marginBottom: 20,
    color: '#1F2937',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 16,
  },
  preferencesCard: {
    margin: 20,
    marginBottom: 15,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 15,
    color: '#1F2937',
    fontWeight: '600',
  },
  preferencesList: {
    gap: 15,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 15,
    marginRight: 10,
    minWidth: 120,
  },
  preferenceValue: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
    lineHeight: 20,
  },
  settingsCard: {
    margin: 20,
    marginBottom: 15,
    elevation: 2,
  },
  accountCard: {
    margin: 20,
    marginBottom: 15,
    elevation: 2,
  },
  logoutButton: {
    marginBottom: 10,
    borderColor: '#DC2626',
  },
  deleteButton: {
    borderColor: '#F44336',
  },
  infoCard: {
    margin: 20,
    marginBottom: 30,
    elevation: 2,
  },
  appInfo: {
    alignItems: 'center',
    padding: 10,
  },
  appTitle: {
    fontSize: 20,
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'center',
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  appDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ProfileScreen;
