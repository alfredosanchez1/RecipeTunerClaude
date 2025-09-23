const AdaptationScreen = ({ route, navigation }) => {
  const { recipeId } = route.params;
  const [originalRecipe, setOriginalRecipe] = useState(null);
  const [adaptedRecipe, setAdaptedRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [adaptationProgress, setAdaptationProgress] = useState(0);
  const [compatibilityScore, setCompatibilityScore] = useState(0);

  const adaptRecipe = async () => {
    setIsLoading(true);
    try {
      const userProfile = await getUserProfile();
      const response = await fetch('YOUR_AI_API_ENDPOINT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe: originalRecipe,
          userProfile: userProfile,
          adaptationPrompt: ADAPTATION_PROMPT
        })
      });
      
      const result = await response.json();
      setAdaptedRecipe(result.adaptedRecipe);
      setCompatibilityScore(result.compatibilityScore);
    } catch (error) {
      Alert.alert('Error', 'No se pudo adaptar la receta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {isLoading ? (
        <LoadingComponent progress={adaptationProgress} />
      ) : (
        <>
          <CompatibilityCard score={compatibilityScore} />
          <RecipeComparison 
            original={originalRecipe}
            adapted={adaptedRecipe}
          />
          <NutritionalComparison 
            original={originalRecipe.nutrition}
            adapted={adaptedRecipe.nutrition}
          />
          <AdaptationExplanation changes={adaptedRecipe.changes} />
          <ActionButtons 
            onSave={() => saveAdaptedRecipe(adaptedRecipe)}
            onShare={() => shareRecipe(adaptedRecipe)}
            onReAdapt={() => adaptRecipe()}
          />
        </>
      )}
    </ScrollView>
  );
};