import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';

const { width } = Dimensions.get('window');

const OnboardingScreen = () => {
  const navigation = useNavigation();
  const { completeOnboarding } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState({
    dietaryRestrictions: [],
    allergies: [],
    intolerances: [],
    cuisinePreferences: [],
    spiceLevel: 'medium',
    cookingTime: '30-60',
    servings: '2-4',
    healthGoals: [],
    activityLevel: 'moderate',
  });

  const steps = [
    {
      title: '¡Bienvenido a RecipeTunnel!',
      subtitle: 'Vamos a personalizar tu experiencia culinaria',
      description: 'Te ayudaremos a configurar tus preferencias para que la IA pueda adaptar recetas perfectamente a tus necesidades.',
      icon: '👋',
    },
    {
      title: 'Restricciones Dietéticas',
      subtitle: '¿Tienes alguna restricción dietética?',
      description: 'Selecciona todas las que apliquen para obtener recetas adaptadas.',
      icon: '🥗',
      options: [
        'Vegetariano', 'Vegano', 'Sin gluten', 'Sin lactosa', 'Bajo en carbohidratos',
        'Bajo en grasas', 'Alto en proteínas', 'Keto', 'Paleo', 'Mediterráneo'
      ],
      key: 'dietaryRestrictions',
    },
    {
      title: 'Alergias e Intolerancias',
      subtitle: '¿Tienes alguna alergia o intolerancia?',
      description: 'Es importante que nos indiques para evitar ingredientes problemáticos.',
      icon: '⚠️',
      options: [
        'Nueces', 'Mariscos', 'Huevos', 'Leche', 'Trigo', 'Soya', 'Pescado',
        'Cacahuetes', 'Sésamo', 'Sulfitos'
      ],
      key: 'allergies',
    },
    {
      title: 'Preferencias de Cocina',
      subtitle: '¿Qué tipo de cocina prefieres?',
      description: 'Selecciona tus estilos favoritos para recibir recetas que te encanten.',
      icon: '🍳',
      options: [
        'Italiana', 'Mexicana', 'Asiática', 'Mediterránea', 'India', 'Francesa',
        'Americana', 'Árabe', 'Griega', 'Japonesa'
      ],
      key: 'cuisinePreferences',
    },
    {
      title: 'Nivel de Picante',
      subtitle: '¿Qué tan picante te gusta tu comida?',
      description: 'Selecciona tu preferencia para adaptar las recetas.',
      icon: '🌶️',
      options: ['Suave', 'Medio', 'Picante', 'Muy picante'],
      key: 'spiceLevel',
      singleChoice: true,
    },
    {
      title: 'Tiempo de Cocción',
      subtitle: '¿Cuánto tiempo prefieres dedicar a cocinar?',
      description: 'Te mostraremos recetas que se ajusten a tu disponibilidad.',
      icon: '⏰',
      options: ['15-30 min', '30-60 min', '1-2 horas', 'Más de 2 horas'],
      key: 'cookingTime',
      singleChoice: true,
    },
    {
      title: 'Porciones',
      subtitle: '¿Para cuántas personas sueles cocinar?',
      description: 'Adaptaremos las cantidades de ingredientes.',
      icon: '👥',
      options: ['1-2', '2-4', '4-6', '6+'],
      key: 'servings',
      singleChoice: true,
    },
    {
      title: 'Metas de Salud',
      subtitle: '¿Tienes alguna meta de salud específica?',
      description: 'Nos ayudará a sugerir recetas que apoyen tus objetivos.',
      icon: '💪',
      options: [
        'Perder peso', 'Ganar masa muscular', 'Mantener peso', 'Mejorar energía',
        'Controlar azúcar', 'Reducir colesterol', 'Mejorar digestión'
      ],
      key: 'healthGoals',
    },
    {
      title: 'Nivel de Actividad',
      subtitle: '¿Cuál es tu nivel de actividad física?',
      description: 'Para calcular mejor tus necesidades nutricionales.',
      icon: '🏃‍♀️',
      options: ['Sedentario', 'Leve', 'Moderado', 'Activo', 'Muy activo'],
      key: 'activityLevel',
      singleChoice: true,
    },
    {
      title: '¡Listo para Cocinar!',
      subtitle: 'Tu perfil está configurado',
      description: 'Ahora la IA puede crear recetas perfectamente adaptadas a tus preferencias y necesidades.',
      icon: '🎉',
    },
  ];

  const handleOptionToggle = (stepKey, option) => {
    if (steps[currentStep].singleChoice) {
      setPreferences(prev => ({
        ...prev,
        [stepKey]: option,
      }));
    } else {
      setPreferences(prev => ({
        ...prev,
        [stepKey]: prev[stepKey].includes(option)
          ? prev[stepKey].filter(item => item !== option)
          : [...prev[stepKey], option],
      }));
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await completeOnboarding(preferences);
      navigation.replace('Main');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const canProceed = currentStepData.singleChoice 
    ? preferences[currentStepData.key] 
    : preferences[currentStepData.key]?.length > 0 || currentStep === 0 || currentStep === steps.length - 1;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.stepIndicator}>
            Paso {currentStep + 1} de {steps.length}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentStep + 1) / steps.length) * 100}%` }
              ]} 
            />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.icon}>{currentStepData.icon}</Text>
          <Text style={styles.title}>{currentStepData.title}</Text>
          <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>
          <Text style={styles.description}>{currentStepData.description}</Text>

          {currentStepData.options && (
            <View style={styles.optionsContainer}>
              {currentStepData.options.map((option) => {
                const isSelected = currentStepData.singleChoice
                  ? preferences[currentStepData.key] === option
                  : preferences[currentStepData.key]?.includes(option);

                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      isSelected && styles.optionButtonSelected,
                    ]}
                    onPress={() => handleOptionToggle(currentStepData.key, option)}
                  >
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Atrás</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            !canProceed && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!canProceed}
        >
          <Text style={styles.nextButtonText}>
            {isLastStep ? '¡Comenzar!' : 'Siguiente'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: '#f8f9fa',
  },
  stepIndicator: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  icon: {
    fontSize: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#2563EB',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
  },
  optionButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  optionButtonSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 40,
    gap: 15,
  },
  backButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  nextButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default OnboardingScreen;
