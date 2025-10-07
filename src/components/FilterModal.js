import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Modal,
  Portal,
  Button,
  Title,
  Text,
  useTheme,
  Chip,
  Divider,
  RadioButton,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const FilterModal = ({
  visible,
  onDismiss,
  onApply,
  currentFilters,
  userPreferences,
}) => {
  const theme = useTheme();
  const [filters, setFilters] = useState(currentFilters);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  const cuisineOptions = [
    'Mexicana', 'Italiana', 'China', 'Japonesa', 'India', 'Francesa',
    'Española', 'Mediterránea', 'Americana', 'Árabe', 'Tailandesa', 'Otros'
  ];

  const difficultyOptions = ['Fácil', 'Intermedio', 'Difícil'];
  const cookingTimeOptions = ['Rápido (15-30 min)', 'Medio (30-60 min)', 'Largo (60+ min)'];

  const dietaryRestrictionOptions = [
    'Vegetariano', 'Vegano', 'Sin Gluten', 'Sin Lactosa', 'Sin Azúcar',
    'Bajo en Carbohidratos', 'Alto en Proteínas', 'Bajo en Grasas'
  ];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDietaryRestrictionToggle = (restriction) => {
    const currentRestrictions = filters.dietaryRestrictions || [];
    const newRestrictions = currentRestrictions.includes(restriction)
      ? currentRestrictions.filter(r => r !== restriction)
      : [...currentRestrictions, restriction];
    
    handleFilterChange('dietaryRestrictions', newRestrictions);
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      cuisine: '',
      difficulty: '',
      cookingTime: '',
      dietaryRestrictions: [],
    };
    setFilters(resetFilters);
  };

  const hasActiveFilters = () => {
    return (
      filters.cuisine ||
      filters.difficulty ||
      filters.cookingTime ||
      (filters.dietaryRestrictions && filters.dietaryRestrictions.length > 0)
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Icon name="filter-variant" size={30} color={theme.colors.primary} />
            <Title style={styles.title}>Filtros de Búsqueda</Title>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Cuisine Filter */}
            <View style={styles.section}>
              <Title style={styles.sectionTitle}>Tipo de Cocina</Title>
              <View style={styles.chipContainer}>
                {cuisineOptions.map((cuisine) => (
                  <Chip
                    key={cuisine}
                    selected={filters.cuisine === cuisine}
                    onPress={() => handleFilterChange('cuisine', cuisine)}
                    style={styles.chip}
                    mode="outlined"
                  >
                    {cuisine}
                  </Chip>
                ))}
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Difficulty Filter */}
            <View style={styles.section}>
              <Title style={styles.sectionTitle}>Nivel de Dificultad</Title>
              <RadioButton.Group
                onValueChange={(value) => handleFilterChange('difficulty', value)}
                value={filters.difficulty}
              >
                {difficultyOptions.map((difficulty) => (
                  <RadioButton.Item
                    key={difficulty}
                    label={difficulty}
                    value={difficulty}
                    style={styles.radioItem}
                  />
                ))}
              </RadioButton.Group>
            </View>

            <Divider style={styles.divider} />

            {/* Cooking Time Filter */}
            <View style={styles.section}>
              <Title style={styles.sectionTitle}>Tiempo de Cocción</Title>
              <RadioButton.Group
                onValueChange={(value) => handleFilterChange('cookingTime', value)}
                value={filters.cookingTime}
              >
                {cookingTimeOptions.map((time) => (
                  <RadioButton.Item
                    key={time}
                    label={time}
                    value={time}
                    style={styles.radioItem}
                  />
                ))}
              </RadioButton.Group>
            </View>

            <Divider style={styles.divider} />

            {/* Dietary Restrictions Filter */}
            <View style={styles.section}>
              <Title style={styles.sectionTitle}>Restricciones Dietéticas</Title>
              <Text style={styles.sectionDescription}>
                Selecciona las opciones que aplican a tu búsqueda
              </Text>
              <View style={styles.chipContainer}>
                {dietaryRestrictionOptions.map((restriction) => (
                  <Chip
                    key={restriction}
                    selected={filters.dietaryRestrictions?.includes(restriction)}
                    onPress={() => handleDietaryRestrictionToggle(restriction)}
                    style={styles.chip}
                    mode="outlined"
                  >
                    {restriction}
                  </Chip>
                ))}
              </View>
            </View>

            {/* User Preferences Suggestion */}
            {userPreferences && (
              <View style={styles.preferencesSection}>
                <Title style={styles.sectionTitle}>Basado en tus Preferencias</Title>
                <Text style={styles.sectionDescription}>
                  Considera estos filtros basados en tu perfil:
                </Text>
                <View style={styles.preferencesChips}>
                  {userPreferences.dietaryRestrictions?.map((restriction) => (
                    <Chip
                      key={restriction}
                      icon="account-check"
                      style={[styles.chip, styles.preferenceChip]}
                      mode="outlined"
                    >
                      {restriction}
                    </Chip>
                  ))}
                  {userPreferences.allergies?.map((allergy) => (
                    <Chip
                      key={allergy}
                      icon="alert"
                      style={[styles.chip, styles.allergyChip]}
                      mode="outlined"
                    >
                      Sin {allergy}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={handleReset}
              style={styles.resetButton}
              disabled={!hasActiveFilters()}
            >
              Limpiar Filtros
            </Button>
            
            <View style={styles.mainActions}>
              <Button
                mode="outlined"
                onPress={onDismiss}
                style={styles.cancelButton}
              >
                Cancelar
              </Button>
              
              <Button
                mode="contained"
                onPress={handleApply}
                style={styles.applyButton}
                disabled={!hasActiveFilters()}
              >
                Aplicar Filtros
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 0,
    maxHeight: '80%',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    marginLeft: 15,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1F2937',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 15,
    lineHeight: 20,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    marginBottom: 10,
  },
  radioItem: {
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 15,
  },
  preferencesSection: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  preferencesChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preferenceChip: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  allergyChip: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  actions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  resetButton: {
    marginBottom: 15,
    borderColor: '#6B7280',
  },
  mainActions: {
    flexDirection: 'row',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    borderColor: '#6B7280',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#10B981',
  },
});

export default FilterModal;
