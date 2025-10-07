const MyRecipesScreen = () => {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const renderRecipeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => navigation.navigate('RecipeDetail', {
        recipe: item,
        isAdapted: item.isAdapted || false,
        returnTo: 'MyRecipesScreen',
        returnParams: {}
      })}
    >
      <Image source={{ uri: item.image }} style={styles.recipeImage} />
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeTitle}>{item.title}</Text>
        <Text style={styles.recipeStats}>
          {item.cookingTime}min • {item.servings} porciones
        </Text>
        <View style={styles.tagsContainer}>
          {item.tags.map(tag => (
            <Text key={tag} style={styles.tag}>{tag}</Text>
          ))}
        </View>
      </View>
      <OptionsMenu 
        onEdit={() => editRecipe(item.id)}
        onAdapt={() => adaptRecipe(item.id)}
        onShare={() => shareRecipe(item.id)}
        onDelete={() => deleteRecipe(item.id)}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SearchAndFilterBar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      <FlatList
        data={filteredRecipes}
        renderItem={renderRecipeItem}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        refreshing={loading}
        onRefresh={loadRecipes}
        ListEmptyComponent={<EmptyState />}
      />
      
      <FloatingActionButton 
        onPress={() => navigation.navigate('UploadRecipe')}
        icon="plus"
      />
    </View>
  );
};