import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Title,
  Text,
  useTheme,
  Chip,
  Divider,
  HelperText,
  ActivityIndicator,
  Card,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { useRecipe } from '../context/RecipeContext';
import { useUser } from '../context/UserContext';
import { useSubscription } from '../context/SubscriptionContext';
import ImagePickerComponent from '../components/ImagePickerComponent';

const AddRecipeScreen = ({ navigation }) => {
  const theme = useTheme();
  const { saveRecipe, isLoading, recipes } = useRecipe();
  const {
    canCreateRecipes,
    maxRecipes,
    subscriptionStatus,
    remainingTrialDays
  } = useSubscription();
  const { preferences } = useUser();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cuisine: '',
    difficulty: '',
    cookingTime: '',
    servings: '',
    ingredients: [{ name: '', amount: '', unit: '' }],
    instructions: [''],
    dietaryRestrictions: [],
    image: null,
  });

  const [errors, setErrors] = useState({});
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showMainOptions, setShowMainOptions] = useState(true);

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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index][field] = value;
    setFormData(prev => ({ ...prev, ingredients: newIngredients }));
  };

  const handleInstructionChange = (index, value) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData(prev => ({ ...prev, instructions: newInstructions }));
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', amount: '', unit: '' }]
    }));
  };

  const removeIngredient = (index) => {
    if (formData.ingredients.length > 1) {
      const newIngredients = formData.ingredients.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, ingredients: newIngredients }));
    }
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const removeInstruction = (index) => {
    if (formData.instructions.length > 1) {
      const newInstructions = formData.instructions.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, instructions: newInstructions }));
    }
  };

  const handleDietaryRestrictionToggle = (restriction) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }));
  };

  const handleImagePick = (imageUri) => {
    setFormData(prev => ({ ...prev, image: imageUri }));
    setShowImagePicker(false);
  };

  const handleImportFromWeb = () => {
    navigation.navigate('ImportRecipe');
  };

  const handleScanWithCamera = () => {
    navigation.navigate('CameraRecipe');
  };

  const handleImportFile = () => {
    navigation.navigate('ImportFile');
  };

  const handlePasteFromMemory = () => {
    navigation.navigate('PasteRecipe');
  };

  const handleCreateManual = () => {
    setShowMainOptions(false);
  };

  const handleBackToOptions = () => {
    setShowMainOptions(true);
    setFormData({
      title: '',
      description: '',
      cuisine: '',
      difficulty: '',
      cookingTime: '',
      servings: '',
      ingredients: [{ name: '', amount: '', unit: '' }],
      instructions: [''],
      dietaryRestrictions: [],
      image: null,
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }
    if (!formData.cuisine) {
      newErrors.cuisine = 'Selecciona una cocina';
    }
    if (!formData.difficulty) {
      newErrors.difficulty = 'Selecciona la dificultad';
    }
    if (!formData.cookingTime) {
      newErrors.cookingTime = 'Selecciona el tiempo de cocción';
    }
    if (!formData.servings || formData.servings < 1) {
      newErrors.servings = 'El número de porciones debe ser mayor a 0';
    }

    // Validar ingredientes
    const ingredientErrors = [];
    formData.ingredients.forEach((ingredient, index) => {
      if (!ingredient.name.trim()) {
        ingredientErrors[index] = 'El nombre del ingrediente es requerido';
      }
    });
    if (ingredientErrors.length > 0) {
      newErrors.ingredients = ingredientErrors;
    }

    // Validar instrucciones
    const instructionErrors = [];
    formData.instructions.forEach((instruction, index) => {
      if (!instruction.trim()) {
        instructionErrors[index] = 'La instrucción es requerida';
      }
    });
    if (instructionErrors.length > 0) {
      newErrors.instructions = instructionErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Check recipe limits before saving
    if (!canCreateRecipes) {
      Alert.alert(
        'Límite de recetas alcanzado',
        `Has alcanzado el límite de ${maxRecipes} recetas. ${subscriptionStatus === 'trial' ? 'Tu período de prueba permite crear hasta ' + maxRecipes + ' recetas.' : 'Necesitas una suscripción activa para crear más recetas.'}`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ver suscripciones', onPress: () => navigation.navigate('Subscription') }
        ]
      );
      return;
    }

    if (recipes.length >= maxRecipes) {
      Alert.alert(
        'Límite de recetas alcanzado',
        `Has alcanzado el límite de ${maxRecipes} recetas para tu ${subscriptionStatus === 'trial' ? 'período de prueba' : 'suscripción actual'}.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ver suscripciones', onPress: () => navigation.navigate('Subscription') }
        ]
      );
      return;
    }

    try {
      const recipeData = {
        ...formData,
        servings: parseInt(formData.servings),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveRecipe(recipeData);
      
      Alert.alert(
        '¡Éxito!',
        'Receta guardada correctamente',
        [
          {
            text: 'Ver Recetas',
            onPress: () => navigation.navigate('Recipes'),
          },
          {
            text: 'Agregar Otra',
            onPress: () => {
              setFormData({
                title: '',
                description: '',
                cuisine: '',
                difficulty: '',
                cookingTime: '',
                servings: '',
                ingredients: [{ name: '', amount: '', unit: '' }],
                instructions: [''],
                dietaryRestrictions: [],
                image: null,
              });
              setErrors({});
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la receta. Intenta de nuevo.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Guardando receta...</Text>
      </View>
    );
  }

  // Mostrar opciones principales
  if (showMainOptions) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Icon name="plus-circle" size={50} color={theme.colors.primary} />
            <Title style={styles.headerTitle}>Nueva Receta</Title>
            <Text style={styles.headerSubtitle}>
              Elige cómo quieres agregar tu receta
            </Text>
          </View>

          <View style={styles.optionsContainer}>
            <Card style={styles.optionCard} onPress={handleImportFromWeb}>
              <Card.Content style={styles.optionContent}>
                <Icon name="web" size={50} color="#4F46E5" />
                <Title style={styles.optionTitle}>Importar desde Web</Title>
                <Text style={styles.optionDescription}>
                  Busca y importa recetas desde sitios web de cocina
                </Text>
              </Card.Content>
            </Card>

                      <Card style={styles.optionCard} onPress={handleScanWithCamera}>
            <Card.Content style={styles.optionContent}>
              <Icon name="camera" size={50} color="#2196F3" />
              <Title style={styles.optionTitle}>Escanear con Cámara</Title>
              <Text style={styles.optionDescription}>
                Captura una o varias fotos de una receta impresa o escrita
              </Text>
            </Card.Content>
          </Card>

            <Card style={styles.optionCard} onPress={handleImportFile}>
              <Card.Content style={styles.optionContent}>
                <Icon name="file-document" size={50} color="#4CAF50" />
                <Title style={styles.optionTitle}>Importar Archivo</Title>
                <Text style={styles.optionDescription}>
                  Procesar archivos .txt, .pdf o .docx con IA
                </Text>
              </Card.Content>
            </Card>

            <Card style={styles.optionCard} onPress={handlePasteFromMemory}>
              <Card.Content style={styles.optionContent}>
                <Icon name="content-paste" size={50} color="#9C27B0" />
                <Title style={styles.optionTitle}>Enviar desde Memoria</Title>
                <Text style={styles.optionDescription}>
                  Pega texto copiado desde cualquier lugar
                </Text>
              </Card.Content>
            </Card>
          </View>

          <View style={styles.backButton}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              icon="arrow-left"
            >
              Volver
            </Button>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Mostrar formulario manual
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Icon name="pencil" size={50} color={theme.colors.primary} />
          <Title style={styles.headerTitle}>Crear Receta Manual</Title>
          <Text style={styles.headerSubtitle}>
            Completa los detalles de tu receta
          </Text>
        </View>

        {/* Botón para volver a las opciones */}
        <View style={styles.backToOptions}>
          <Button
            mode="text"
            onPress={handleBackToOptions}
            icon="arrow-left"
            textColor={theme.colors.primary}
          >
            Cambiar método
          </Button>
        </View>

        {/* Información Básica */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Información Básica</Title>
          
          <TextInput
            label="Título de la receta *"
            value={formData.title}
            onChangeText={(value) => handleInputChange('title', value)}
            style={styles.input}
            error={!!errors.title}
          />
          <HelperText type="error" visible={!!errors.title}>
            {errors.title}
          </HelperText>

          <TextInput
            label="Descripción *"
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            style={styles.input}
            multiline
            numberOfLines={3}
            error={!!errors.description}
          />
          <HelperText type="error" visible={!!errors.description}>
            {errors.description}
          </HelperText>

          <View style={styles.row}>
            <View style={[styles.halfInput, { marginRight: 10 }]}>
              <TextInput
                label="Cocina *"
                value={formData.cuisine}
                onChangeText={(value) => handleInputChange('cuisine', value)}
                style={styles.input}
                error={!!errors.cuisine}
              />
              <HelperText type="error" visible={!!errors.cuisine}>
                {errors.cuisine}
              </HelperText>
            </View>
            <View style={styles.halfInput}>
              <TextInput
                label="Dificultad *"
                value={formData.difficulty}
                onChangeText={(value) => handleInputChange('difficulty', value)}
                style={styles.input}
                error={!!errors.difficulty}
              />
              <HelperText type="error" visible={!!errors.difficulty}>
                {errors.difficulty}
              </HelperText>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.halfInput, { marginRight: 10 }]}>
              <TextInput
                label="Tiempo de cocción *"
                value={formData.cookingTime}
                onChangeText={(value) => handleInputChange('cookingTime', value)}
                style={styles.input}
                error={!!errors.cookingTime}
              />
              <HelperText type="error" visible={!!errors.cookingTime}>
                {errors.cookingTime}
              </HelperText>
            </View>
            <View style={styles.halfInput}>
              <TextInput
                label="Porciones *"
                value={formData.servings}
                onChangeText={(value) => handleInputChange('servings', value)}
                style={styles.input}
                error={!!errors.servings}
              />
              <HelperText type="error" visible={!!errors.servings}>
                {errors.servings}
              </HelperText>
            </View>
          </View>
        </View>

        {/* Ingredientes */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Ingredientes</Title>
          {formData.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <View style={styles.ingredientInputs}>
                <TextInput
                  label="Nombre del ingrediente"
                  value={ingredient.name}
                  onChangeText={(value) => handleIngredientChange(index, 'name', value)}
                  style={[styles.input, styles.ingredientName]}
                />
                <View style={styles.amountRow}>
                  <TextInput
                    label="Cantidad"
                    value={ingredient.amount}
                    onChangeText={(value) => handleIngredientChange(index, 'amount', value)}
                    style={[styles.input, styles.amountInput]}
                    keyboardType="numeric"
                  />
                  <TextInput
                    label="Unidad"
                    value={ingredient.unit}
                    onChangeText={(value) => handleIngredientChange(index, 'unit', value)}
                    style={[styles.input, styles.unitInput]}
                  />
                </View>
              </View>
              {formData.ingredients.length > 1 && (
                <Button
                  mode="text"
                  onPress={() => removeIngredient(index)}
                  icon="delete"
                  textColor={theme.colors.error}
                  style={styles.removeButton}
                >
                  Eliminar
                </Button>
              )}
            </View>
          ))}
          <Button
            mode="outlined"
            onPress={addIngredient}
            icon="plus"
            style={styles.addButton}
          >
            Agregar Ingrediente
          </Button>
        </View>

        {/* Instrucciones */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Instrucciones</Title>
          {formData.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionRow}>
              <Text style={styles.stepNumber}>Paso {index + 1}</Text>
              <View style={styles.instructionInputRow}>
                <TextInput
                  label="Instrucción"
                  value={instruction}
                  onChangeText={(value) => handleInstructionChange(index, value)}
                  style={[styles.input, styles.instructionInput]}
                  multiline
                  numberOfLines={3}
                />
                {formData.instructions.length > 1 && (
                  <Button
                    mode="text"
                    onPress={() => removeInstruction(index)}
                    icon="delete"
                    textColor={theme.colors.error}
                    style={styles.removeButton}
                  >
                    Eliminar
                  </Button>
                )}
              </View>
            </View>
          ))}
          <Button
            mode="outlined"
            onPress={addInstruction}
            icon="plus"
            style={styles.addButton}
          >
            Agregar Paso
          </Button>
        </View>

        {/* Restricciones Dietéticas */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Restricciones Dietéticas</Title>
          <View style={styles.chipContainer}>
            {dietaryRestrictionOptions.map((restriction) => (
              <Chip
                key={restriction}
                selected={formData.dietaryRestrictions.includes(restriction)}
                onPress={() => handleDietaryRestrictionToggle(restriction)}
                style={styles.chip}
                mode="outlined"
              >
                {restriction}
              </Chip>
            ))}
          </View>
        </View>

        {/* Imagen */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Imagen de la Receta</Title>
          <ImagePickerComponent
            onImagePicked={handleImagePick}
            currentImage={formData.image}
          />
        </View>

        {/* Botones de Acción */}
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : 'Guardar Receta'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  optionsContainer: {
    padding: 20,
  },
  optionCard: {
    marginBottom: 15,
    elevation: 2,
    borderRadius: 8,
  },
  optionContent: {
    padding: 20,
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    padding: 20,
    alignItems: 'center',
  },
  backToOptions: {
    padding: 20,
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
  },
  ingredientRow: {
    marginBottom: 15,
  },
  ingredientInputs: {
    marginBottom: 10,
  },
  ingredientName: {
    marginBottom: 10,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountInput: {
    flex: 1,
    marginRight: 10,
  },
  unitInput: {
    flex: 1,
  },
  removeButton: {
    alignSelf: 'flex-end',
  },
  addButton: {
    marginTop: 10,
  },
  instructionRow: {
    marginBottom: 20,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  instructionInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionInput: {
    flex: 1,
    marginRight: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    marginBottom: 10,
  },
  actionButtons: {
    padding: 20,
    backgroundColor: '#fff',
  },
  submitButton: {
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default AddRecipeScreen;
