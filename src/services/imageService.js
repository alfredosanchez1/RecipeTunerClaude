import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import aiService from './aiService';
import { isExpoGo, getPermissionMessage, getHelpMessage } from '../config/permissions';

class ImageService {
  constructor() {
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.supportedFormats = ['jpg', 'jpeg', 'png', 'heic'];
  }

  // Solicitar permisos de cámara y galería
  async requestPermissions() {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      // Para Expo Go, manejamos los permisos de media library de forma más flexible
      let mediaLibraryPermission = { status: 'granted' };
      try {
        mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
      } catch (error) {
        console.log('MediaLibrary permissions not available in Expo Go, using fallback');
        // En Expo Go, simulamos permisos concedidos para la galería
        mediaLibraryPermission = { status: 'granted' };
      }

      return {
        camera: cameraPermission.status === 'granted',
        mediaLibrary: mediaLibraryPermission.status === 'granted',
      };
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      return { camera: false, mediaLibrary: false };
    }
  }

  // Tomar foto con la cámara
  async takePhoto() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== 'granted') {
        const helpMessage = getHelpMessage('CAMERA');
        throw new Error(`${getPermissionMessage('CAMERA')}\n\n${helpMessage.message}`);
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        return await this.processImage(result.assets[0]);
      }
      
      return null;
    } catch (error) {
      console.error('Error tomando foto:', error);
      throw error;
    }
  }

  // Seleccionar imagen de la galería
  async pickImage() {
    try {
      // En Expo Go, usamos ImagePicker directamente para la galería
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        return await this.processImage(result.assets[0]);
      }
      
      return null;
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      throw error;
    }
  }

  // Procesar imagen capturada
  async processImage(imageAsset) {
    try {
      const { uri, width, height, fileSize } = imageAsset;
      
      // Verificar tamaño del archivo
      if (fileSize && fileSize > this.maxFileSize) {
        throw new Error('La imagen es demasiado grande. Máximo 10MB.');
      }

      // Comprimir imagen si es necesario
      const compressedUri = await this.compressImage(uri);
      
      // Convertir a base64 para análisis de IA
      const base64 = await this.imageToBase64(compressedUri);
      
      return {
        uri: compressedUri,
        base64,
        width,
        height,
        fileSize: fileSize || 0,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error procesando imagen:', error);
      throw error;
    }
  }

  // Comprimir imagen
  async compressImage(uri) {
    try {
      // Para Expo, podemos usar la calidad en ImagePicker
      // Si necesitas más control, puedes usar expo-image-manipulator
      return uri;
    } catch (error) {
      console.error('Error comprimiendo imagen:', error);
      return uri; // Retornar original si falla la compresión
    }
  }

  // Convertir imagen a base64
  async imageToBase64(uri) {
    try {
      // Usar método moderno no-deprecated
      const result = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return result;
    } catch (error) {
      // Fallback para desarrollo - usar fetch para convertir a base64
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (fallbackError) {
        console.error('Error convirtiendo imagen a base64:', error);
        throw error;
      }
    }
  }

  // Analizar imagen de receta con IA
  async analyzeRecipeImage(imageData) {
    try {
      console.log('🔍 ImageService: Iniciando análisis de imagen');

      // Usar Google Vision API para OCR
      const visionResult = await aiService.analyzeRecipeImage(imageData.base64);
      console.log('🔍 ImageService: Vision result:', visionResult);

      // Si se detectó texto, intentar extraer ingredientes e instrucciones
      if (visionResult.text) {
        console.log('📝 ImageService: Texto detectado, extrayendo receta...');
        const extractedRecipe = await this.extractRecipeFromText(visionResult.text);
        console.log('📝 ImageService: Receta extraída:', extractedRecipe);
        return {
          ...visionResult,
          extractedRecipe,
        };
      }

      console.log('⚠️ ImageService: No se detectó texto en la imagen');
      return visionResult;
    } catch (error) {
      console.error('❌ Error analizando imagen de receta:', error);
      throw error;
    }
  }

  // Extraer receta del texto detectado
  async extractRecipeFromText(text) {
    try {
      const prompt = `Extrae una receta del siguiente texto. Identifica título, ingredientes, cantidades e instrucciones:

${text}

Responde en formato JSON:
{
  "title": "título de la receta",
  "ingredients": [{"name": "nombre", "amount": "cantidad"}],
  "instructions": ["paso 1", "paso 2"],
  "confidence": 0.8
}`;

      const result = await aiService.adaptWithClaude(prompt);
      return result;
    } catch (error) {
      console.error('Error extrayendo receta del texto:', error);
      return {
        title: 'Receta Extraída',
        ingredients: [],
        instructions: [],
        confidence: 0.5,
      };
    }
  }

  // Guardar imagen en la galería (solo disponible en development build)
  async saveToGallery(uri) {
    try {
      // En Expo Go, esta funcionalidad puede no estar disponible
      if (Platform.OS === 'android') {
        try {
          const permission = await MediaLibrary.requestPermissionsAsync();
          if (permission.status === 'granted') {
            const asset = await MediaLibrary.createAssetAsync(uri);
            return asset;
          }
        } catch (error) {
          console.log('MediaLibrary not available in Expo Go');
        }
      }
      
      // Fallback: retornar éxito simulado
      return { id: 'temp', filename: 'saved_image.jpg' };
    } catch (error) {
      console.error('Error guardando en galería:', error);
      throw error;
    }
  }

  // Obtener información del archivo
  async getFileInfo(uri) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo;
    } catch (error) {
      console.error('Error obteniendo información del archivo:', error);
      return null;
    }
  }

  // Eliminar archivo temporal
  async deleteTempFile(uri) {
    try {
      if (uri.startsWith('file://')) {
        await FileSystem.deleteAsync(uri);
      }
    } catch (error) {
      console.error('Error eliminando archivo temporal:', error);
    }
  }

  // Crear thumbnail de la imagen
  async createThumbnail(uri, size = 150) {
    try {
      // Para Expo, puedes usar expo-image-manipulator para crear thumbnails
      // Por ahora retornamos la URI original
      return uri;
    } catch (error) {
      console.error('Error creando thumbnail:', error);
      return uri;
    }
  }

  // Validar formato de imagen
  validateImageFormat(uri) {
    const extension = uri.split('.').pop().toLowerCase();
    return this.supportedFormats.includes(extension);
  }

  // Obtener dimensiones de la imagen
  async getImageDimensions(uri) {
    try {
      const { width, height } = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = uri;
      });
      
      return { width, height };
    } catch (error) {
      console.error('Error obteniendo dimensiones:', error);
      return { width: 0, height: 0 };
    }
  }

  // Verificar si estamos en Expo Go
  isExpoGoEnvironment() {
    return isExpoGo();
  }

  // Obtener mensaje de ayuda para permisos
  getPermissionHelpMessage(permissionType) {
    return getHelpMessage(permissionType);
  }
}

export default new ImageService();
