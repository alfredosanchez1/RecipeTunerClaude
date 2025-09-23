import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AppInfoSection = () => {
  return (
    <View style={styles.infoSection}>
      <Text style={styles.appName}>RecipeTuner</Text>
      <Text style={styles.version}>Versión 1.0.0</Text>
      <Text style={styles.description}>
        Tu asistente personal de cocina con IA
      </Text>
      <Text style={styles.copyright}>
        © 2024 RecipeTuner. Todos los derechos reservados.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  infoSection: {
    alignItems: 'center',
    padding: 30,
    marginHorizontal: 15,
    marginBottom: 30,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  version: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  description: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  copyright: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default AppInfoSection;
