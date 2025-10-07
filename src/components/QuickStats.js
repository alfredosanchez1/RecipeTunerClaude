import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Card,
  Title,
  Text,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const QuickStats = ({ totalRecipes, adaptedRecipes, preferences, onViewRecipes, onViewAdaptedRecipes }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Total Recipes */}
        <Card style={styles.statCard} onPress={onViewRecipes}>
          <Card.Content style={styles.statContent}>
            <Icon name="food-fork-drink" size={40} color="#4CAF50" />
            <Title style={styles.statNumber}>{totalRecipes}</Title>
            <Text style={styles.statLabel}>Recetas</Text>
            <Text style={styles.statAction}>Toca para ver</Text>
          </Card.Content>
        </Card>

        {/* Adapted Recipes */}
        <Card style={styles.statCard} onPress={onViewAdaptedRecipes}>
          <Card.Content style={styles.statContent}>
            <Icon name="robot" size={40} color="#FF9800" />
            <Title style={styles.statNumber}>{adaptedRecipes}</Title>
            <Text style={styles.statLabel}>Adaptadas</Text>
            <Text style={styles.statAction}>Toca para ver</Text>
          </Card.Content>
        </Card>
      </View>
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
    marginBottom: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    elevation: 2,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  statContent: {
    alignItems: 'center',
    padding: 20,
    minHeight: 100,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  statAction: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
  },
});

export default QuickStats;
