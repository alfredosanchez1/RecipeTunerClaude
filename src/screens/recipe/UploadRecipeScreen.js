import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

const UploadRecipeScreen = () => {
  const [recipe, setRecipe] = useState({
    title: '',
    description: '',
    ingredients: [{ name: '', quantity: '', unit: '' }],
    instructions: [''],
    image: null,
    servings: 1,
    cookingTime: 0,
    difficulty: 'easy'
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    
    if (!result.canceled) {
      setRecipe(prev => ({ ...prev, image: result.assets[0].uri }));
    }
  };

  const addIngredient = () => {
    setRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: '', unit: '' }]
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <ImageUploadSection 
        image={recipe.image}
        onImagePick={pickImage}
        onCameraPress={() => {/* Implementar cámara */}}
      />
      
      <TextInput
        style={styles.titleInput}
        placeholder="Nombre de la receta"
        value={recipe.title}
        onChangeText={(text) => setRecipe(prev => ({...prev, title: text}))}
      />
      
      <IngredientsList 
        ingredients={recipe.ingredients}
        onUpdate={(ingredients) => setRecipe(prev => ({...prev, ingredients}))}
        onAdd={addIngredient}
      />
      
      <InstructionsEditor 
        instructions={recipe.instructions}
        onUpdate={(instructions) => setRecipe(prev => ({...prev, instructions}))}
      />
      
      <TouchableOpacity style={styles.uploadButton} onPress={uploadRecipe}>
        <Text style={styles.buttonText}>Subir Receta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};