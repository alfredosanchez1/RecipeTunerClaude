const ShoppingListScreen = () => {
  const [shoppingList, setShoppingList] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});
  const [groupBy, setGroupBy] = useState('category'); // 'category' or 'recipe'

  const groupedItems = useMemo(() => {
    return shoppingList.reduce((groups, item) => {
      const key = groupBy === 'category' ? item.category : item.recipeTitle;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {});
  }, [shoppingList, groupBy]);

  const renderSectionItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.listItem, checkedItems[item.id] && styles.checkedItem]}
      onPress={() => toggleItemCheck(item.id)}
    >
      <CheckBox 
        checked={checkedItems[item.id] || false}
        onPress={() => toggleItemCheck(item.id)}
      />
      <Text style={[styles.itemText, checkedItems[item.id] && styles.checkedText]}>
        {item.quantity} {item.unit} {item.name}
      </Text>
      {item.substitutes && (
        <TouchableOpacity onPress={() => showSubstitutes(item.substitutes)}>
          <Text style={styles.substitutesText}>Ver sustitutos</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ShoppingListHeader 
        totalItems={shoppingList.length}
        checkedItems={Object.keys(checkedItems).filter(key => checkedItems[key]).length}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
      />
      
      <SectionList
        sections={Object.keys(groupedItems).map(key => ({
          title: key,
          data: groupedItems[key]
        }))}
        renderItem={renderSectionItem}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        keyExtractor={(item) => item.id}
      />
      
      <FloatingActionButton 
        onPress={() => navigation.navigate('AddToShoppingList')}
        icon="plus"
      />
    </View>
  );
};