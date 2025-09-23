import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Text,
  Button,
  useTheme,
  Chip,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useUser } from '../context/UserContext';
import { theme } from '../styles/theme';
import { COOKING_TIME_OPTIONS, DIETARY_RESTRICTION_OPTIONS, CUISINE_OPTIONS, ALLERGY_OPTIONS, INTOLERANCE_OPTIONS } from '../config/preferences';


const PreferencesScreen = ({ navigation }) => {
  const theme = useTheme();
  const { preferences, savePreferences, completeOnboarding } = useUser();
  
  const [formData, setFormData] = useState({
    dietaryRestrictions: [],
    allergies: [],
    intolerances: [],
    cuisinePreferences: [],
    cookingTimePreference: 'Medio',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormData(preferences);
  }, [preferences]);

  // Usar las opciones de la configuración de la base de datos

  // Usar las opciones de la configuración

  // Usar las opciones de la configuración de la base de datos



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
      console.log('🔧 PREFERENCES SCREEN - Iniciando guardado...');
      console.log('📋 Datos del formulario a guardar:', JSON.stringify(formData, null, 2));
      console.log('📊 Estado actual de onboarding:', preferences.isOnboardingComplete);
      
      // Si el onboarding no está completo, marcar como completo al guardar
      const shouldCompleteOnboarding = !preferences.isOnboardingComplete;
      console.log('🎯 PREFERENCES SCREEN - ¿Completar onboarding?', shouldCompleteOnboarding);
      
      // Guardar las preferencias y marcar onboarding como completo si es necesario
      await savePreferences(formData, shouldCompleteOnboarding);
      console.log('✅ PREFERENCES SCREEN - Guardado exitoso');
      
      setIsEditing(false);
      setHasChanges(false);
      
      // Solo actualizar estado local si era necesario completar onboarding
      if (shouldCompleteOnboarding) {
        console.log('🎯 PREFERENCES SCREEN - Completando onboarding en estado local...');
        await completeOnboarding();
        console.log('✅ PREFERENCES SCREEN - Onboarding completado');
      }
      
      Alert.alert('Éxito', 'Preferencias guardadas correctamente');
    } catch (error) {
      console.error('❌ PREFERENCES SCREEN - Error guardando:', error);
      Alert.alert('Error', 'No se pudieron guardar las preferencias: ' + error.message);
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
      <View style={styles.radioButtonContainer}>
        {options.map((option) => (
          <Button
            key={option}
            mode={formData[field] === option ? "contained" : "outlined"}
            onPress={() => handleInputChange(field, option)}
            style={[
              styles.radioButton,
              formData[field] === option && styles.selectedRadioButton
            ]}
            disabled={!isEditing}
            compact
          >
            {option}
          </Button>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Navigation Header */}
      <View style={styles.navigationHeader}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          icon="arrow-left"
          style={styles.backButton}
          compact
        >
          Volver
        </Button>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Home')}
          icon="home"
          style={styles.homeButton}
          compact
        >
          Inicio
        </Button>
      </View>

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
        DIETARY_RESTRICTION_OPTIONS,
        'dietaryRestrictions',
        'food-apple',
        '#4CAF50'
      )}

      <Divider style={styles.divider} />

      {/* Allergies */}
             {renderChipSection(
         'Alergias Alimentarias',
         ALLERGY_OPTIONS,
         'allergies',
         'alert-circle',
         '#F44336'
       )}

      <Divider style={styles.divider} />

      {/* Intolerances */}
             {renderChipSection(
         'Intolerancias',
         INTOLERANCE_OPTIONS,
         'intolerances',
         'alert-octagon',
         '#FF9800'
       )}

      <Divider style={styles.divider} />

      {/* Cuisine Preferences */}
      {renderChipSection(
        'Preferencias de Cocina',
        CUISINE_OPTIONS,
        'cuisinePreferences',
        'flag',
        '#2196F3'
      )}

      <Divider style={styles.divider} />

      {/* Cooking Time Preference */}
      {renderRadioSection(
        'Tiempo de Preparación Preferido',
        COOKING_TIME_OPTIONS,
        'cookingTimePreference',
        'clock',
        '#607D8B'
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  navigationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#f8f9fa',
  },
  backButton: {
    borderColor: '#6B7280',
    borderWidth: 1,
    minWidth: 100,
  },
  homeButton: {
    backgroundColor: '#4CAF50',
    minWidth: 100,
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
  radioButtonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  radioButton: {
    marginBottom: 10,
    minWidth: 80,
  },
  selectedRadioButton: {
    backgroundColor: theme.colors.primary,
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
