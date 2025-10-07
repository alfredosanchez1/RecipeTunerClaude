import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  Modal,
  Portal,
  Button,
  Title,
  Paragraph,
  useTheme,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const ImagePickerComponent = ({
  visible,
  onDismiss,
  onImagePicked,
}) => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permisos requeridos',
        'Necesitamos acceso a la cámara y galería para seleccionar imágenes.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    try {
      setIsLoading(true);
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImagePicked(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen de la galería.');
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      setIsLoading(true);
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImagePicked(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo tomar la foto.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (option) => {
    if (option === 'gallery') {
      pickImageFromGallery();
    } else if (option === 'camera') {
      takePhoto();
    }
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <View style={styles.container}>
          <Icon name="camera" size={60} color={theme.colors.primary} />
          <Title style={styles.title}>Seleccionar Imagen</Title>
          <Paragraph style={styles.description}>
            Elige cómo quieres agregar una imagen a tu receta
          </Paragraph>

          <View style={styles.options}>
            <Button
              mode="contained"
              onPress={() => handleOptionSelect('gallery')}
              icon="image-multiple"
              style={[styles.optionButton, styles.galleryButton]}
              disabled={isLoading}
              loading={isLoading}
            >
              Galería
            </Button>

            <Button
              mode="contained"
              onPress={() => handleOptionSelect('camera')}
              icon="camera"
              style={[styles.optionButton, styles.cameraButton]}
              disabled={isLoading}
              loading={isLoading}
            >
              Cámara
            </Button>
          </View>

          <Button
            mode="outlined"
            onPress={onDismiss}
            style={styles.cancelButton}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 0,
  },
  container: {
    padding: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    lineHeight: 22,
  },
  options: {
    width: '100%',
    marginBottom: 20,
    gap: 15,
  },
  optionButton: {
    paddingVertical: 12,
    borderRadius: 8,
  },
  galleryButton: {
    backgroundColor: '#2196F3',
  },
  cameraButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    borderColor: '#666',
    width: '100%',
  },
});

export default ImagePickerComponent;
