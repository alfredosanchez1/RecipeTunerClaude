import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#10B981', '#059669']} style={styles.gradient}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Text style={styles.title}>RecetasIA</Text>
        <Text style={styles.subtitle}>Recetas adaptadas a tu salud</Text>
        
        <View style={styles.featuresList}>
          <FeatureItem 
            icon="medical-bag" 
            text="Adaptadas a tus condiciones médicas" 
          />
          <FeatureItem 
            icon="food-apple" 
            text="Considera alergias e intolerancias" 
          />
          <FeatureItem 
            icon="chart-line" 
            text="Optimización nutricional automática" 
          />
        </View>
        
        <TouchableOpacity 
          style={styles.startButton} 
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.buttonText}>Comenzar</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};