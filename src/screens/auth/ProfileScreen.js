const ProfileScreen = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState({
    basicInfo: { age: '', weight: '', height: '', activityLevel: '' },
    healthConditions: [],
    allergies: [],
    dietaryPreferences: [],
    nutritionalGoals: {},
    restrictions: {}
  });

  const steps = [
    { component: BasicInfoStep, title: "Información Básica" },
    { component: HealthConditionsStep, title: "Condiciones Médicas" },
    { component: AllergiesStep, title: "Alergias e Intolerancias" },
    { component: DietaryPreferencesStep, title: "Preferencias Dietéticas" },
    { component: NutritionalGoalsStep, title: "Objetivos Nutricionales" }
  ];

  return (
    <View style={styles.container}>
      <ProgressIndicator currentStep={currentStep} totalSteps={steps.length} />
      <ScrollView style={styles.stepContainer}>
        {React.createElement(steps[currentStep - 1].component, {
          data: profile,
          onUpdate: setProfile
        })}
      </ScrollView>
      <NavigationButtons 
        currentStep={currentStep}
        onNext={() => setCurrentStep(prev => prev + 1)}
        onPrev={() => setCurrentStep(prev => prev - 1)}
        onSave={saveProfile}
      />
    </View>
  );
};