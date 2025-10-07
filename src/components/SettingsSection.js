import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SettingsSection = ({ title, items }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.item,
            item.danger && styles.dangerItem
          ]}
          onPress={item.onPress}
          disabled={item.type === 'switch'}
        >
          <View style={styles.itemLeft}>
            <MaterialCommunityIcons 
              name={item.icon} 
              size={24} 
              color={item.danger ? '#ff4444' : '#666'} 
            />
            <Text style={[
              styles.itemLabel,
              item.danger && styles.dangerText
            ]}>
              {item.label}
            </Text>
          </View>
          
          {item.type === 'switch' ? (
            <Switch
              value={item.value}
              onValueChange={item.onValueChange}
              trackColor={{ false: '#ddd', true: '#4CAF50' }}
              thumbColor={item.value ? '#fff' : '#f4f3f4'}
            />
          ) : (
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={24} 
              color="#ccc" 
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  dangerItem: {
    borderBottomColor: '#ffebee',
  },
  dangerText: {
    color: '#ff4444',
  },
});

export default SettingsSection;
