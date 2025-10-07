import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const RecipeCard = ({
  recipe,
  onPress,
  onAdapt,
  showAdaptButton = false,
  isAdapted = false,
  style,
}) => {
  const theme = useTheme();

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'fácil':
        return '#4CAF50';
      case 'intermedio':
        return '#FF9800';
      case 'difícil':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getCookingTimeIcon = (cookingTime) => {
    if (typeof cookingTime === 'string' && cookingTime.toLowerCase().includes('rápido')) {
      return 'lightning-bolt';
    } else if (typeof cookingTime === 'string' && cookingTime.toLowerCase().includes('largo')) {
      return 'clock-outline';
    }
    return 'clock';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Card
      style={[styles.card, style]}
      onPress={onPress}
      elevation={3}
    >
      {/* Recipe Image */}
      {recipe.image && (
        <Card.Cover
          source={{ uri: recipe.image }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {/* Recipe Content */}
      <Card.Content style={styles.content}>
        {/* Header with title and badges */}
        <View style={styles.header}>
          <Title style={styles.title} numberOfLines={2}>
            {recipe.title}
          </Title>
          <View style={styles.badges}>
            {isAdapted && (
              <Chip
                icon="robot"
                style={[styles.badge, styles.adaptedBadge]}
                textStyle={styles.badgeText}
                compact
              >
                IA
              </Chip>
            )}
            {recipe.dietaryRestrictions?.map((restriction, index) => (
              <Chip
                key={index}
                style={[styles.badge, styles.dietaryBadge]}
                textStyle={styles.badgeText}
              >
                {restriction}
              </Chip>
            ))}
          </View>
        </View>

        {/* Description */}
        {recipe.description && (
          <Paragraph style={styles.description} numberOfLines={2}>
            {recipe.description}
          </Paragraph>
        )}

        {/* Recipe Details */}
        <View style={styles.details}>
          {/* Cuisine */}
          {recipe.cuisine && (
            <View style={styles.detailItem}>
              <Icon name="flag" size={16} color="#666" />
              <Paragraph style={styles.detailText}>{recipe.cuisine}</Paragraph>
            </View>
          )}

          {/* Difficulty */}
          {recipe.difficulty && (
            <View style={styles.detailItem}>
              <Icon
                name="star"
                size={16}
                color={getDifficultyColor(recipe.difficulty)}
              />
              <Paragraph style={styles.detailText}>{recipe.difficulty}</Paragraph>
            </View>
          )}

          {/* Cooking Time */}
          {recipe.cookingTime && (
            <View style={styles.detailItem}>
              <Icon
                name={getCookingTimeIcon(recipe.cookingTime)}
                size={16}
                color="#666"
              />
              <Paragraph style={styles.detailText}>{recipe.cookingTime}</Paragraph>
            </View>
          )}

          {/* Servings */}
          {recipe.servings && (
            <View style={styles.detailItem}>
              <Icon name="account-group" size={16} color="#666" />
              <Paragraph style={styles.detailText}>
                {recipe.servings} {recipe.servings === 1 ? 'porción' : 'porciones'}
              </Paragraph>
            </View>
          )}
        </View>

        {/* Ingredients Preview */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <View style={styles.ingredientsPreview}>
            <Paragraph style={styles.ingredientsLabel}>
              Ingredientes principales:
            </Paragraph>
            <View style={styles.ingredientsList}>
              {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
                <Paragraph key={index} style={styles.ingredientItem}>
                  • {ingredient.name}
                  {ingredient.amount && ` (${ingredient.amount}${ingredient.unit ? ` ${ingredient.unit}` : ''})`}
                </Paragraph>
              ))}
              {recipe.ingredients.length > 3 && (
                <Paragraph style={styles.moreIngredients}>
                  +{recipe.ingredients.length - 3} más...
                </Paragraph>
              )}
            </View>
          </View>
        )}

        {/* Creation Date */}
        {recipe.createdAt && (
          <View style={styles.dateContainer}>
            <Icon name="calendar" size={14} color="#999" />
            <Paragraph style={styles.dateText}>
              Creada el {formatDate(recipe.createdAt)}
            </Paragraph>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={onPress}
            style={styles.viewButton}
            compact
          >
            Ver Receta
          </Button>
          
          {showAdaptButton && onAdapt && !isAdapted && (
            <Button
              mode="outlined"
              onPress={onAdapt}
              icon="robot"
              style={styles.adaptButton}
              compact
            >
              Adaptar con IA
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width * 0.85,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  image: {
    height: 200,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 22,
    color: '#1F2937',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    height: 32,
    paddingHorizontal: 12,
  },
  adaptedBadge: {
    backgroundColor: '#10B981',
  },
  dietaryBadge: {
    backgroundColor: '#3B82F6',
    minWidth: 80,
  },
  badgeText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
    lineHeight: 16,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 15,
    lineHeight: 18,
  },
  details: {
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
  },
  ingredientsPreview: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  ingredientsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1F2937',
  },
  ingredientsList: {
    gap: 4,
  },
  ingredientItem: {
    fontSize: 13,
    color: '#4B5563',
  },
  moreIngredients: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
  },
  adaptButton: {
    flex: 1,
    borderColor: '#FF9800',
  },
});

export default RecipeCard;
