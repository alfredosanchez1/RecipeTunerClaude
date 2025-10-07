import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';

const CustomDrawerContent = (props) => {
  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props}>
        <View style={styles.header}>
          <Text style={styles.title}>RecipeTuner</Text>
        </View>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default CustomDrawerContent;
