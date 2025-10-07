const RecipeDetailScreen = ({ route }) => {
  const { recipeId } = route.params;
  const [recipe, setRecipe] = useState(null);
  const [servings, setServings] = useState(1);
  const [activeTimers, setActiveTimers] = useState([]);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [isCookingMode, setIsCookingMode] = useState(false);

  const scaleIngredients = (ingredients, originalServings, newServings) => {
    const ratio = newServings / originalServings;
    return ingredients.map(ingredient => ({
      ...ingredient,
      quantity: (parseFloat(ingredient.quantity) * ratio).toFixed(1)
    }));
  };

  const startTimer = (minutes, stepIndex) => {
    const timer = {
      id: Date.now(),
      minutes,
      stepIndex,
      startTime: Date.now()
    };
    setActiveTimers(prev => [...prev, timer]);
  };

  return (
    <ScrollView style={styles.container}>
      <ImageHeader 
        image={recipe?.image}
        title={recipe?.title}
        onBack={() => navigation.goBack()}
        onShare={() => shareRecipe(recipe)}
      />
      
      <RecipeMetadata 
        cookingTime={recipe?.cookingTime}
        difficulty={recipe?.difficulty}
        rating={recipe?.rating}
        servings={servings}
        onServingsChange={setServings}
      />
      
      <NutritionPanel nutrition={recipe?.nutrition} servings={servings} />
      
      <IngredientsSection 
        ingredients={scaleIngredients(recipe?.ingredients, recipe?.servings, servings)}
        checkedItems={checkedIngredients}
        onCheck={(id) => setCheckedIngredients(prev => ({...prev, [id]: !prev[id]}))}
        onGenerateShoppingList={() => navigation.navigate('ShoppingList', { recipe })}
      />
      
      <InstructionsSection 
        instructions={recipe?.instructions}
        onStartTimer={startTimer}
        isCookingMode={isCookingMode}
      />
      
      <ActionButtons 
        onAdapt={() => navigation.navigate('Adaptation', { recipeId })}
        onCookingMode={() => setIsCookingMode(!isCookingMode)}
        onFavorite={() => toggleFavorite(recipeId)}
      />
      
      <TimerOverlay 
        timers={activeTimers}
        onTimerComplete={(id) => setActiveTimers(prev => prev.filter(t => t.id !== id))}
      />
    </ScrollView>
  );
};