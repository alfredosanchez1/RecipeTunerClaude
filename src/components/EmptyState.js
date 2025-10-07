import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Title,
  Paragraph,
  Button,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const EmptyState = ({
  icon = 'inbox-outline',
  title = 'No hay contenido',
  description = 'No se encontró ningún elemento para mostrar',
  actionText = 'Agregar',
  onAction,
  showAction = true,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Icon name={icon} size={80} color="#ccc" />
      <Title style={styles.title}>{title}</Title>
      <Paragraph style={styles.description}>{description}</Paragraph>
      
      {showAction && onAction && (
        <Button
          mode="contained"
          onPress={onAction}
          style={styles.actionButton}
        >
          {actionText}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 20,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
    color: '#666',
  },
  description: {
    textAlign: 'center',
    marginBottom: 30,
    color: '#999',
    fontSize: 16,
    lineHeight: 22,
  },
  actionButton: {
    paddingHorizontal: 30,
    backgroundColor: '#4CAF50',
  },
});

export default EmptyState;
