import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Card,
  Title,
  Text,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const QuickStats = ({ totalRecipes, adaptedRecipes, preferences }) => {
  const theme = useTheme();

  const getDietaryRestrictionsCount = () => {
    return preferences.dietaryRestrictions?.length || 0;
  };

  const getAllergiesCount = () => {
    return preferences.allergies?.length || 0;
  };

  const getIntolerancesCount = () => {
    return preferences.intolerances?.length || 0;
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Total Recipes */}
        <Card style={[styles.statCard, { backgroundColor: '#4CAF50' }]}>
          <Card.Content style={styles.statContent}>
            <Icon name="food-fork-drink" size={30} color="#fff" />
            <Title style={styles.statNumber}>{totalRecipes}</Title>
            <Text style={styles.statLabel}>Recetas</Text>
          </Card.Content>
        </Card>

        {/* Adapted Recipes */}
        <Card style={[styles.statCard, { backgroundColor: '#FF9800' }]}>
          <Card.Content style={styles.statContent}>
            <Icon name="robot" size={30} color="#fff" />
            <Title style={styles.statNumber}>{adaptedRecipes}</Title>
            <Text style={styles.statLabel}>Adaptadas</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.row}>
        {/* Dietary Restrictions */}
        <Card style={[styles.statCard, { backgroundColor: '#2196F3' }]}>
          <Card.Content style={styles.statContent}>
            <Icon name="food-apple" size={30} color="#fff" />
            <Title style={styles.statNumber}>{getDietaryRestrictionsCount()}</Title>
            <Text style={styles.statLabel}>Restricciones</Text>
          </Card.Content>
        </Card>

        {/* Allergies */}
        <Card style={[styles.statCard, { backgroundColor: '#F44336' }]}>
          <Card.Content style={styles.statContent}>
            <Icon name="alert-circle" size={30} color="#fff" />
            <Title style={styles.statNumber}>{getAllergiesCount()}</Title>
            <Text style={styles.statLabel}>Alergias</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Preferences Summary */}
      <Card style={styles.preferencesCard}>
        <Card.Content>
          <Title style={styles.preferencesTitle}>Tus Preferencias</Title>
          <View style={styles.preferencesList}>
            {preferences.spiceLevel && (
              <View style={styles.preferenceItem}>
                <Icon name="fire" size={20} color="#FF5722" />
                <Text style={styles.preferenceText}>
                  Nivel de picante: {preferences.spiceLevel}
                </Text>
              </View>
            )}
            
            {preferences.cookingTime && (
              <View style={styles.preferenceItem}>
                <Icon name="clock" size={20} color="#607D8B" />
                <Text style={styles.preferenceText}>
                  Tiempo preferido: {preferences.cookingTime}
                </Text>
              </View>
            )}
            
            {preferences.servings && (
              <View style={styles.preferenceItem}>
                <Icon name="account-group" size={20} color="#4CAF50" />
                <Text style={styles.preferenceText}>
                  Porciones: {preferences.servings}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 15,
  },
  statCard: {
    flex: 1,
    elevation: 3,
  },
  statContent: {
    alignItems: 'center',
    padding: 15,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
  },
  preferencesCard: {
    backgroundColor: '#fff',
    elevation: 2,
  },
  preferencesTitle: {
    fontSize: 16,
    marginBottom: 15,
    color: '#1F2937',
    fontWeight: '600',
  },
  preferencesList: {
    gap: 12,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

export default QuickStats;
