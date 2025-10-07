import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const UserProfileHeader = ({ user }) => {
  return (
    <View style={styles.header}>
      <View style={styles.avatarContainer}>
        <Image
          source={
            user?.avatar 
              ? { uri: user.avatar }
              : { uri: 'https://via.placeholder.com/60x60/4CAF50/FFFFFF?text=U' }
          }
          style={styles.avatar}
        />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {user?.name || 'Usuario'}
        </Text>
        <Text style={styles.userEmail}>
          {user?.email || 'usuario@ejemplo.com'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
    marginHorizontal: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
});

export default UserProfileHeader;
