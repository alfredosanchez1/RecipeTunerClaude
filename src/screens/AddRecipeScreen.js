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
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useRecipe } from '../context/RecipeContext';
import { useUser } from '../context/UserContext';
import ImagePickerComponent from '../components/ImagePickerComponent';

const AddRecipeScreen = ({ navigation }) => {
  const theme = useTheme();
  const { saveRecipe, isLoading } = useRecipe();
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

  const toggleDietaryRestriction = (restriction) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }));
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

  const handleImagePick = (imageUri) => {
    setFormData(prev => ({ ...prev, image: imageUri }));
    setShowImagePicker(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Guardando receta...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Icon name="plus-circle" size={50} color={theme.colors.primary} />
          <Title style={styles.headerTitle}>Nueva Receta</Title>
          <Text style={styles.headerSubtitle}>
            Completa los detalles de tu receta
          </Text>
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
                value={formData.servings.toString()}
                onChangeText={(value) => handleInputChange('servings', value)}
                style={styles.input}
                keyboardType="numeric"
                error={!!errors.servings}
              />
              <HelperText type="error" visible={!!errors.servings}>
                {errors.servings}
              </HelperText>
            </View>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Imagen */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Imagen de la Receta</Title>
          <View style={styles.imageButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowImagePicker(true)}
              icon="image"
              style={[styles.imageButton, styles.halfButton]}
            >
              {formData.image ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('CameraRecipe')}
              icon="camera"
              style={[styles.imageButton, styles.halfButton]}
            >
              Capturar con Cámara
            </Button>
          </View>
          {formData.image && (
            <Text style={styles.imageText}>Imagen seleccionada ✓</Text>
          )}
        </View>

        <Divider style={styles.divider} />

        {/* Ingredientes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Ingredientes *</Title>
            <Button
              mode="text"
              onPress={addIngredient}
              icon="plus"
              compact
            >
              Agregar
            </Button>
          </View>
          
          {formData.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientRow}>
              <View style={styles.ingredientInputs}>
                <TextInput
                  label="Ingrediente"
                  value={ingredient.name}
                  onChangeText={(value) => handleIngredientChange(index, 'name', value)}
                  style={[styles.input, styles.ingredientName]}
                  error={!!errors.ingredients?.[index]}
                />
                <TextInput
                  label="Cantidad"
                  value={ingredient.amount}
                  onChangeText={(value) => handleIngredientChange(index, 'amount', value)}
                  style={[styles.input, styles.ingredientAmount]}
                />
                <TextInput
                  label="Unidad"
                  value={ingredient.unit}
                  onChangeText={(value) => handleIngredientChange(index, 'unit', value)}
                  style={[styles.input, styles.ingredientUnit]}
                />
              </View>
              {formData.ingredients.length > 1 && (
                <Button
                  mode="text"
                  onPress={() => removeIngredient(index)}
                  icon="delete"
                  textColor={theme.colors.error}
                  compact
                >
                  Eliminar
                </Button>
              )}
            </View>
          ))}
          {errors.ingredients && (
            <HelperText type="error" visible={true}>
              Completa todos los ingredientes
            </HelperText>
          )}
        </View>

        <Divider style={styles.divider} />

        {/* Instrucciones */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Instrucciones *</Title>
            <Button
              mode="text"
              onPress={addInstruction}
              icon="plus"
              compact
            >
              Agregar
            </Button>
          </View>
          
          {formData.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionRow}>
              <View style={styles.instructionNumber}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
              </View>
              <View style={styles.instructionContent}>
                <TextInput
                  label={`Paso ${index + 1}`}
                  value={instruction}
                  onChangeText={(value) => handleInstructionChange(index, value)}
                  style={styles.input}
                  multiline
                  numberOfLines={2}
                  error={!!errors.instructions?.[index]}
                />
                {formData.instructions.length > 1 && (
                  <Button
                    mode="text"
                    onPress={() => removeInstruction(index)}
                    icon="delete"
                    textColor={theme.colors.error}
                    compact
                    style={styles.removeButton}
                  >
                    Eliminar
                  </Button>
                )}
              </View>
            </View>
          ))}
          {errors.instructions && (
            <HelperText type="error" visible={true}>
              Completa todas las instrucciones
            </HelperText>
          )}
        </View>

        <Divider style={styles.divider} />

        {/* Restricciones Dietéticas */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Restricciones Dietéticas</Title>
          <Text style={styles.sectionDescription}>
            Selecciona las opciones que aplican a tu receta
          </Text>
          <View style={styles.chipContainer}>
            {dietaryRestrictionOptions.map((option) => (
              <Chip
                key={option}
                selected={formData.dietaryRestrictions.includes(option)}
                onPress={() => toggleDietaryRestriction(option)}
                style={styles.chip}
                mode="outlined"
              >
                {option}
              </Chip>
            ))}
          </View>
        </View>

        {/* Botones de Acción */}
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            disabled={isLoading}
          >
            Guardar Receta
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          >
            Cancelar
          </Button>
        </View>
      </ScrollView>

      {/* Image Picker Modal */}
      <ImagePickerComponent
        visible={showImagePicker}
        onDismiss={() => setShowImagePicker(false)}
        onImagePicked={handleImagePick}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 15,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  input: {
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
  },
  halfInput: {
    flex: 1,
  },
  imageButton: {
    marginBottom: 10,
  },
  imageText: {
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  halfButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  ingredientInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  ingredientName: {
    flex: 2,
  },
  ingredientAmount: {
    flex: 1,
  },
  ingredientUnit: {
    flex: 1,
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  instructionNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    marginTop: 5,
  },
  stepNumber: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  instructionContent: {
    flex: 1,
  },
  removeButton: {
    alignSelf: 'flex-end',
    marginTop: 5,
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
    gap: 15,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    borderColor: '#666',
  },
  divider: {
    marginVertical: 10,
  },
});

export default AddRecipeScreen;
