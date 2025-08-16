import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useRecipe } from '../context/RecipeContext';
import { useUser } from '../context/UserContext';

const RecipeDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { recipeId } = route.params;
  const { recipes, deleteRecipe, adaptRecipeWithAI } = useRecipe();
  const { user } = useUser();
  
  const recipe = recipes.find(r => r.id === recipeId);
  const [isAdapting, setIsAdapting] = useState(false);

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Receta no encontrada</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Receta',
      '¿Estás seguro de que quieres eliminar esta receta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteRecipe(recipe.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleAdaptWithAI = async () => {
    setIsAdapting(true);
    try {
      await adaptRecipeWithAI(recipe, user.preferences);
      Alert.alert(
        'Éxito',
        'Receta adaptada exitosamente. Puedes verla en la sección de recetas adaptadas.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo adaptar la receta. Inténtalo de nuevo.');
    } finally {
      setIsAdapting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.description}>{recipe.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información General</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cocina:</Text>
          <Text style={styles.infoValue}>{recipe.cuisine}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dificultad:</Text>
          <Text style={styles.infoValue}>{recipe.difficulty}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tiempo de cocción:</Text>
          <Text style={styles.infoValue}>{recipe.cookingTime} minutos</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Porciones:</Text>
          <Text style={styles.infoValue}>{recipe.servings}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredientes</Text>
        {recipe.ingredients.map((ingredient, index) => (
          <Text key={index} style={styles.ingredient}>
            • {ingredient}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instrucciones</Text>
        {recipe.instructions.map((instruction, index) => (
          <View key={index} style={styles.instructionRow}>
            <Text style={styles.instructionNumber}>{index + 1}.</Text>
            <Text style={styles.instruction}>{instruction}</Text>
          </View>
        ))}
      </View>

      {recipe.dietaryRestrictions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restricciones Dietéticas</Text>
          <View style={styles.tagsContainer}>
            {recipe.dietaryRestrictions.map((restriction, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{restriction}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.adaptButton]}
          onPress={handleAdaptWithAI}
          disabled={isAdapting}
        >
          <Text style={styles.buttonText}>
            {isAdapting ? 'Adaptando...' : 'Adaptar con IA'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.editButton]}
          onPress={() => navigation.navigate('EditRecipe', { recipeId: recipe.id })}
        >
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={styles.buttonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  ingredient: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  instructionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 10,
    minWidth: 25,
  },
  instruction: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    padding: 20,
    gap: 15,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  adaptButton: {
    backgroundColor: '#007AFF',
  },
  editButton: {
    backgroundColor: '#34C759',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default RecipeDetailScreen;
