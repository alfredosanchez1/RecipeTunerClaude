import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Text,
  useTheme,
  Avatar,
  Divider,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const theme = useTheme();
  const { preferences } = useUser();
  const { user: authUser } = useAuth();

  const renderPreferenceSection = (title, items, icon, emptyMessage) => {
    if (!items || items.length === 0) {
      return (
        <View style={styles.preferenceSection}>
          <View style={styles.preferenceSectionHeader}>
            <Icon name={icon} size={20} color={theme.colors.primary} />
            <Title style={styles.preferenceSectionTitle}>{title}</Title>
          </View>
          <Text style={styles.emptyMessage}>{emptyMessage}</Text>
        </View>
      );
    }

    return (
      <View style={styles.preferenceSection}>
        <View style={styles.preferenceSectionHeader}>
          <Icon name={icon} size={20} color={theme.colors.primary} />
          <Title style={styles.preferenceSectionTitle}>{title}</Title>
        </View>
        <View style={styles.chipContainer}>
          {items.map((item, index) => (
            <Chip
              key={index}
              mode="outlined"
              style={styles.preferenceChip}
              textStyle={styles.chipText}
            >
              {item}
            </Chip>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <Avatar.Text
            size={80}
            label={authUser?.user_metadata?.first_name?.charAt(0)?.toUpperCase() || authUser?.email?.charAt(0)?.toUpperCase() || 'U'}
            style={styles.avatar}
            color="#fff"
          />
          <View style={styles.profileInfo}>
            <Title style={styles.userName}>
              {authUser?.user_metadata?.full_name || 'Usuario'}
            </Title>
            <Paragraph style={styles.userEmail}>
              {authUser?.email || 'usuario@ejemplo.com'}
            </Paragraph>
          </View>
        </Card.Content>
      </Card>

      {/* Preferences Summary */}
      <Card style={styles.preferencesCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Icon name="account-cog" size={24} color={theme.colors.primary} />
            <Title style={styles.cardTitle}>Resumen de Preferencias</Title>
          </View>
          <Divider style={styles.headerDivider} />

          {renderPreferenceSection(
            'Restricciones Dietéticas',
            preferences?.dietaryRestrictions,
            'food-off',
            'Ninguna restricción dietética seleccionada'
          )}

          {renderPreferenceSection(
            'Alergias',
            preferences?.allergies,
            'alert-circle',
            'Ninguna alergia registrada'
          )}

          {renderPreferenceSection(
            'Intolerancias',
            preferences?.intolerances,
            'minus-circle',
            'Ninguna intolerancia registrada'
          )}

          {renderPreferenceSection(
            'Condiciones Médicas',
            preferences?.medicalConditions,
            'medical-bag',
            'Ninguna condición médica registrada'
          )}

          {preferences?.dietType && (
            <View style={styles.preferenceSection}>
              <View style={styles.preferenceSectionHeader}>
                <Icon name="food-apple" size={20} color={theme.colors.primary} />
                <Title style={styles.preferenceSectionTitle}>Tipo de Dieta</Title>
              </View>
              <Text style={styles.singlePreference}>
                {preferences.dietType}
              </Text>
            </View>
          )}

          {preferences?.cookingTimePreference && (
            <View style={styles.preferenceSection}>
              <View style={styles.preferenceSectionHeader}>
                <Icon name="clock" size={20} color={theme.colors.primary} />
                <Title style={styles.preferenceSectionTitle}>Tiempo de Cocción</Title>
              </View>
              <Text style={styles.singlePreference}>
                {preferences.cookingTimePreference}
              </Text>
            </View>
          )}

        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.subscriptionButton]}
          onPress={() => navigation.navigate('Subscription')}
        >
          <Icon name="crown" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Suscripciones</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.preferencesButton]}
          onPress={() => navigation.navigate('Preferences')}
        >
          <Icon name="cog" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Preferencias</Text>
        </TouchableOpacity>
      </View>

      {/* Back to Home Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('HomeMain')}
      >
        <Icon name="arrow-left" size={20} color="#fff" />
        <Text style={styles.backButtonText}>Volver al Inicio</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacing} />
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
    elevation: 2,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#6366F1',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  preferencesCard: {
    margin: 20,
    marginBottom: 15,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    marginLeft: 10,
    fontSize: 18,
    color: '#1F2937',
  },
  headerDivider: {
    marginBottom: 20,
  },
  preferenceSection: {
    marginBottom: 24,
  },
  preferenceSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  preferenceSectionTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preferenceChip: {
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  chipText: {
    fontSize: 12,
    color: '#374151',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    paddingLeft: 28,
  },
  singlePreference: {
    fontSize: 14,
    color: '#374151',
    paddingLeft: 28,
    fontWeight: '500',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
  },
  subscriptionButton: {
    backgroundColor: '#FF9800',
  },
  preferencesButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default ProfileScreen;