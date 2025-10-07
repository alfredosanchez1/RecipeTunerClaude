import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';

const NutritionDashboardScreen = () => {
  const [period, setPeriod] = useState('week'); // 'day', 'week', 'month'
  const [nutritionData, setNutritionData] = useState(null);
  
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
  };

  return (
    <ScrollView style={styles.container}>
      <PeriodSelector 
        selected={period}
        onSelect={setPeriod}
        options={['day', 'week', 'month']}
      />
      
      <MacronutrientsCard 
        calories={nutritionData?.calories}
        protein={nutritionData?.protein}
        carbs={nutritionData?.carbs}
        fats={nutritionData?.fats}
        goals={nutritionData?.goals}
      />
      
      <PieChart
        data={[
          { name: 'Proteínas', population: nutritionData?.protein, color: '#10B981' },
          { name: 'Carbohidratos', population: nutritionData?.carbs, color: '#3B82F6' },
          { name: 'Grasas', population: nutritionData?.fats, color: '#F59E0B' }
        ]}
        width={screenWidth - 32}
        height={220}
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
      />
      
      <NutritionTrendsChart 
        data={nutritionData?.trends}
        period={period}
      />
      
      <HealthAlertsSection alerts={nutritionData?.alerts} />
      
      <RecommendationsSection
        recommendations={nutritionData?.recommendations}
        onSelectRecipe={(recipe) => navigation.navigate('RecipeDetail', {
          recipe: recipe,
          isAdapted: recipe.isAdapted || false,
          returnTo: 'NutritionDashboard',
          returnParams: {}
        })}
      />
    </ScrollView>
  );
};