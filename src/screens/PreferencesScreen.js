import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  useTheme,
  Chip,
  Divider,
  TextInput,
  List,
  RadioButton,
  Switch,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useUser } from '../context/UserContext';
import { theme } from '../styles/theme';

const PreferencesScreen = ({ navigation }) => {
  const theme = useTheme();
  const { preferences, savePreferences, completeOnboarding } = useUser();
  
  const [formData, setFormData] = useState({
    dietaryRestrictions: [],
    allergies: [],
    intolerances: [],
    medicalConditions: [],
    cuisinePreferences: [],
    spiceLevel: 'medium',
    cookingTime: 'medium',
    servings: 2,
    healthGoals: [],
    activityLevel: 'moderate',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormData(preferences);
  }, [preferences]);

  const dietaryRestrictionOptions = [
    'Vegetariano', 'Vegano', 'Sin Gluten', 'Sin Lactosa', 'Sin Azúcar',
    'Bajo en Carbohidratos', 'Alto en Proteínas', 'Bajo en Grasas',
    'Sin Mariscos', 'Sin Frutos Secos', 'Sin Huevos', 'Sin Soja'
  ];

  const allergyOptions = [
    'Lácteos', 'Huevos', 'Pescado', 'Mariscos', 'Frutos Secos',
    'Cacahuetes', 'Trigo', 'Soja', 'Sésamo', 'Mostaza', 'Apio',
    'Sulfitos', 'Lupino', 'Moluscos'
  ];

  const intoleranceOptions = [
    'Lactosa', 'Gluten', 'Fructosa', 'Histamina', 'FODMAPs',
    'Salicilatos', 'Oxalatos', 'Lectinas'
  ];

  const cuisinePreferenceOptions = [
    'Mexicana', 'Italiana', 'China', 'Japonesa', 'India', 'Francesa',
    'Española', 'Mediterránea', 'Americana', 'Árabe', 'Tailandesa',
    'Griega', 'Turca', 'Libanesa', 'Vietnamita', 'Coreana'
  ];

  const healthGoalOptions = [
    'Pérdida de Peso', 'Ganancia de Masa Muscular', 'Mantenimiento',
    'Mejora de Energía', 'Control de Azúcar en Sangre', 'Salud Cardíaca',
    'Salud Digestiva', 'Antiinflamatorio', 'Desintoxicación'
  ];

  const activityLevelOptions = [
    { value: 'sedentary', label: 'Sedentario (poco ejercicio)' },
    { value: 'light', label: 'Ligero (1-3 días/semana)' },
    { value: 'moderate', label: 'Moderado (3-5 días/semana)' },
    { value: 'active', label: 'Activo (6-7 días/semana)' },
    { value: 'very_active', label: 'Muy activo (ejercicio intenso diario)' }
  ];

  const handleToggleArray = (field, value) => {
    const currentArray = formData[field] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    setFormData(prev => ({ ...prev, [field]: newArray }));
    setHasChanges(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await savePreferences(formData);
      setIsEditing(false);
      setHasChanges(false);
      
      if (!preferences.isOnboardingComplete) {
        await completeOnboarding();
      }
      
      Alert.alert('Éxito', 'Preferencias guardadas correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar las preferencias');
    }
  };

  const handleCancel = () => {
    setFormData(preferences);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleCompleteOnboarding = async () => {
    try {
      await completeOnboarding();
      Alert.alert(
        '¡Bienvenido!',
        'Has completado la configuración inicial. Ahora puedes comenzar a usar la aplicación.',
        [
          {
            text: 'Continuar',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo completar la configuración');
    }
  };

  const   renderChipSection = (title, options, field, icon, color) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Icon name={icon} size={24} color={color} />
        <Title style={styles.sectionTitle}>{title}</Title>
      </View>
      <View style={styles.chipContainer}>
        {options.map((option) => (
          <Chip
            key={option}
            selected={formData[field]?.includes(option)}
            onPress={() => handleToggleArray(field, option)}
            style={[
              styles.chip,
              formData[field]?.includes(option) && styles.selectedChip
            ]}
            mode="outlined"
            disabled={!isEditing}
            textStyle={styles.chipText}
          >
            {option}
          </Chip>
        ))}
      </View>
    </View>
  );

  const renderRadioSection = (title, options, field, icon, color) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Icon name={icon} size={24} color={color} />
        <Title style={styles.sectionTitle}>{title}</Title>
      </View>
      <RadioButton.Group
        onValueChange={(value) => handleInputChange(field, value)}
        value={formData[field]}
      >
        {options.map((option) => (
          <RadioButton.Item
            key={option.value || option}
            label={option.label || option}
            value={option.value || option}
            style={styles.radioItem}
            disabled={!isEditing}
          />
        ))}
      </RadioButton.Group>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content style={styles.headerContent}>
          <Icon name="account-cog" size={50} color={theme.colors.primary} />
          <Title style={styles.headerTitle}>Preferencias Dietéticas</Title>
          <Text style={styles.headerDescription}>
            Configura tus restricciones, alergias y preferencias para obtener recetas personalizadas
          </Text>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {!isEditing ? (
          <Button
            mode="contained"
            onPress={() => setIsEditing(true)}
            icon="pencil"
            style={styles.editButton}
          >
            Editar Preferencias
          </Button>
        ) : (
          <View style={styles.editActions}>
            <Button
              mode="outlined"
              onPress={handleCancel}
              style={styles.cancelButton}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              icon="content-save"
              style={styles.saveButton}
              disabled={!hasChanges}
            >
              Guardar
            </Button>
          </View>
        )}
      </View>

      {/* Dietary Restrictions */}
      {renderChipSection(
        'Restricciones Dietéticas',
        dietaryRestrictionOptions,
        'dietaryRestrictions',
        'food-apple',
        '#4CAF50'
      )}

      <Divider style={styles.divider} />

      {/* Allergies */}
      {renderChipSection(
        'Alergias Alimentarias',
        allergyOptions,
        'allergies',
        'alert-circle',
        '#F44336'
      )}

      <Divider style={styles.divider} />

      {/* Intolerances */}
      {renderChipSection(
        'Intolerancias',
        intoleranceOptions,
        'intolerances',
        'alert-octagon',
        '#FF9800'
      )}

      <Divider style={styles.divider} />

      {/* Cuisine Preferences */}
      {renderChipSection(
        'Preferencias de Cocina',
        cuisinePreferenceOptions,
        'cuisinePreferences',
        'flag',
        '#2196F3'
      )}

      <Divider style={styles.divider} />

      {/* Spice Level */}
      {renderRadioSection(
        'Nivel de Picante',
        ['Mild', 'Medium', 'Hot', 'Extra Hot'],
        'spiceLevel',
        'fire',
        '#FF5722'
      )}

      <Divider style={styles.divider} />

      {/* Cooking Time */}
      {renderRadioSection(
        'Tiempo de Cocción Preferido',
        ['Quick', 'Medium', 'Long'],
        'cookingTime',
        'clock',
        '#607D8B'
      )}

      <Divider style={styles.divider} />

      {/* Servings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="account-group" size={24} color="#4CAF50" />
          <Title style={styles.sectionTitle}>Número de Porciones</Title>
        </View>
        <TextInput
          label="Porciones por receta"
          value={formData.servings?.toString() || '2'}
          onChangeText={(value) => handleInputChange('servings', parseInt(value) || 2)}
          keyboardType="numeric"
          style={styles.input}
          disabled={!isEditing}
        />
      </View>

      <Divider style={styles.divider} />

      {/* Health Goals */}
      {renderChipSection(
        'Objetivos de Salud',
        healthGoalOptions,
        'healthGoals',
        'heart-pulse',
        '#E91E63'
      )}

      <Divider style={styles.divider} />

      {/* Activity Level */}
      {renderRadioSection(
        'Nivel de Actividad Física',
        activityLevelOptions,
        'activityLevel',
        'run',
        '#9C27B0'
      )}

      {/* Onboarding Completion */}
      {!preferences.isOnboardingComplete && (
        <Card style={styles.onboardingCard}>
          <Card.Content>
            <Title style={styles.onboardingTitle}>¡Completa tu Configuración!</Title>
            <Text style={styles.onboardingDescription}>
              Una vez que hayas configurado tus preferencias, podrás comenzar a usar la aplicación
              y recibir recetas personalizadas según tus necesidades.
            </Text>
            <Button
              mode="contained"
              onPress={handleCompleteOnboarding}
              icon="check-circle"
              style={styles.completeButton}
            >
              Completar Configuración
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Tips */}
      <Card style={styles.tipsCard}>
        <Card.Content>
          <Title style={styles.tipsTitle}>💡 Consejos</Title>
          <Text style={styles.tipsText}>
            • Cuanto más específicas sean tus preferencias, mejores recetas recibirás{'\n'}
            • Puedes actualizar tus preferencias en cualquier momento{'\n'}
            • La IA considerará todas tus restricciones al adaptar recetas{'\n'}
            • Mantén actualizada la información sobre alergias por seguridad
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerCard: {
    margin: 20,
    marginBottom: 15,
    elevation: 3,
  },
  headerContent: {
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  headerDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  actionButtons: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: theme.colors.secondary,
  },
  editActions: {
    flexDirection: 'row',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    borderColor: theme.colors.textMuted,
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    marginLeft: 15,
    color: '#1F2937',
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    marginBottom: 10,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  selectedChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  radioItem: {
    paddingVertical: 8,
  },
  input: {
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    borderColor: theme.colors.border,
  },
  divider: {
    marginVertical: 10,
    marginHorizontal: 20,
  },
  onboardingCard: {
    margin: 20,
    marginBottom: 15,
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.secondary,
    elevation: 2,
  },
  onboardingTitle: {
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 10,
    fontWeight: '600',
  },
  onboardingDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 15,
    lineHeight: 20,
  },
  completeButton: {
    backgroundColor: theme.colors.secondary,
  },
  tipsCard: {
    margin: 20,
    marginBottom: 30,
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.accent,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 10,
    fontWeight: '600',
  },
  tipsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});

export default PreferencesScreen;
