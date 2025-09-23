import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  useTheme,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AIAdaptationCard = ({ onPress, preferences }) => {
  const theme = useTheme();

  const getAdaptationSuggestions = () => {
    const suggestions = [];
    
    if (preferences.dietaryRestrictions?.length > 0) {
      suggestions.push(`Adaptar para ${preferences.dietaryRestrictions.join(', ')}`);
    }
    
    if (preferences.allergies?.length > 0) {
      suggestions.push(`Evitar ${preferences.allergies.join(', ')}`);
    }
    
    if (preferences.cookingTime === 'quick') {
      suggestions.push('Versión rápida');
    }
    
    if (preferences.spiceLevel === 'mild') {
      suggestions.push('Menos picante');
    } else if (preferences.spiceLevel === 'hot') {
      suggestions.push('Más picante');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Personalizar según tus gustos');
    }
    
    return suggestions.slice(0, 3);
  };

  const suggestions = getAdaptationSuggestions();

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <Icon name="robot" size={40} color="#4CAF50" />
          <View style={styles.headerText}>
            <Title style={styles.title}>Adaptación con IA</Title>
            <Paragraph style={styles.subtitle}>
              Personaliza tus recetas según tus necesidades
            </Paragraph>
          </View>
        </View>

        <View style={styles.suggestionsContainer}>
          <Paragraph style={styles.suggestionsLabel}>
            Sugerencias de adaptación:
          </Paragraph>
          {suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Icon name="lightbulb-outline" size={16} color="#FF9800" />
              <Paragraph style={styles.suggestionText}>{suggestion}</Paragraph>
            </View>
          ))}
        </View>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Icon name="brain" size={20} color="#2196F3" />
            <Paragraph style={styles.featureText}>IA Inteligente</Paragraph>
          </View>
          <View style={styles.feature}>
            <Icon name="shield-check" size={20} color="#4CAF50" />
            <Paragraph style={styles.featureText}>Seguro para la salud</Paragraph>
          </View>
          <View style={styles.feature}>
            <Icon name="clock-fast" size={20} color="#FF9800" />
            <Paragraph style={styles.featureText}>Adaptación rápida</Paragraph>
          </View>
        </View>

        <Button
          mode="contained"
          onPress={onPress}
          style={styles.adaptButton}
          icon="robot"
        >
          Adaptar Receta
        </Button>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 3,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 18,
  },
  suggestionsContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  suggestionsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1F2937',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 16,
  },
  adaptButton: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
  },
});

export default AIAdaptationCard;
