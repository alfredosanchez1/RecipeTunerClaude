import axios from 'axios';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { getApiConfig } from '../config/api';
import aiService from './aiService';
import { Platform } from 'react-native';

class CommunicationService {
  constructor() {
    this.setupNotifications();
  }

  // Configurar notificaciones push
  async setupNotifications() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        throw new Error('Permisos de notificación denegados');
      }

      // Configurar canal de notificaciones para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    } catch (error) {
      console.error('Error configurando notificaciones:', error);
    }
  }

  // WhatsApp Business API
  async sendWhatsAppMessage(phoneNumber, message) {
    try {
      const config = getApiConfig('WHATSAPP');
      
      const response = await axios.post(
        `${config.BASE_URL}/${config.PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${config.ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error enviando mensaje de WhatsApp:', error);
      throw error;
    }
  }

  // Telegram Bot API
  async sendTelegramMessage(chatId, message) {
    try {
      const config = getApiConfig('TELEGRAM');
      
      const response = await axios.post(
        `${config.BASE_URL}${config.BOT_TOKEN}/sendMessage`,
        {
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error enviando mensaje de Telegram:', error);
      throw error;
    }
  }

  // Email usando SendGrid
  async sendEmail(to, subject, content) {
    try {
      const config = getApiConfig('EMAIL');
      
      const response = await axios.post(
        `${config.BASE_URL}/mail/send`,
        {
          personalizations: [
            {
              to: [{ email: to }],
              subject: subject
            }
          ],
          from: { email: config.FROM_EMAIL },
          content: [
            {
              type: 'text/html',
              value: content
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${config.API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error enviando email:', error);
      throw error;
    }
  }

  // Abrir WhatsApp con mensaje predefinido
  async openWhatsApp(phoneNumber, message = '') {
    try {
      const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      } else {
        // Fallback a WhatsApp Web
        const webUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        await Linking.openURL(webUrl);
        return true;
      }
    } catch (error) {
      console.error('Error abriendo WhatsApp:', error);
      throw error;
    }
  }

  // Abrir Telegram con mensaje predefinido
  async openTelegram(username, message = '') {
    try {
      const url = `https://t.me/${username}?text=${encodeURIComponent(message)}`;
      await Linking.openURL(url);
      return true;
    } catch (error) {
      console.error('Error abriendo Telegram:', error);
      throw error;
    }
  }

  // Abrir cliente de email
  async openEmail(to, subject = '', body = '') {
    try {
      const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      await Linking.openURL(url);
      return true;
    } catch (error) {
      console.error('Error abriendo email:', error);
      throw error;
    }
  }

  // Procesar receta recibida por WhatsApp
  async processWhatsAppRecipe(message, senderInfo) {
    try {
      // Extraer receta del mensaje usando IA
      const extractedRecipe = await this.extractRecipeFromMessage(message);
      
      // Crear notificación
      await this.sendNotification(
        'Nueva Receta Recibida',
        `Receta recibida de ${senderInfo.name || senderInfo.phoneNumber}`,
        { data: { recipe: extractedRecipe, source: 'whatsapp' } }
      );

      return extractedRecipe;
    } catch (error) {
      console.error('Error procesando receta de WhatsApp:', error);
      throw error;
    }
  }

  // Procesar receta recibida por Telegram
  async processTelegramRecipe(message, chatInfo) {
    try {
      // Extraer receta del mensaje usando IA
      const extractedRecipe = await this.extractRecipeFromMessage(message);
      
      // Crear notificación
      await this.sendNotification(
        'Nueva Receta Recibida',
        `Receta recibida de ${chatInfo.title || chatInfo.username}`,
        { data: { recipe: extractedRecipe, source: 'telegram' } }
      );

      return extractedRecipe;
    } catch (error) {
      console.error('Error procesando receta de Telegram:', error);
      throw error;
    }
  }

  // Procesar receta recibida por email
  async processEmailRecipe(emailContent, senderInfo) {
    try {
      // Extraer receta del email usando IA
      const extractedRecipe = await this.extractRecipeFromEmail(emailContent);
      
      // Crear notificación
      await this.sendNotification(
        'Nueva Receta Recibida',
        `Receta recibida de ${senderInfo.email}`,
        { data: { recipe: extractedRecipe, source: 'email' } }
      );

      return extractedRecipe;
    } catch (error) {
      console.error('Error procesando receta de email:', error);
      throw error;
    }
  }

  // Extraer receta de mensaje usando IA
  async extractRecipeFromMessage(message) {
    try {
      const prompt = `Extrae una receta del siguiente mensaje. Identifica título, ingredientes, cantidades e instrucciones:

${message}

Responde en formato JSON:
{
  "title": "título de la receta",
  "description": "descripción si está disponible",
  "ingredients": [{"name": "nombre", "amount": "cantidad"}],
  "instructions": ["paso 1", "paso 2"],
  "source": "whatsapp/telegram",
  "confidence": 0.8
}`;

      const result = await aiService.adaptWithClaude(prompt);
      return result;
    } catch (error) {
      console.error('Error extrayendo receta del mensaje:', error);
      return {
        title: 'Receta Extraída',
        description: 'Receta extraída del mensaje',
        ingredients: [],
        instructions: [],
        source: 'unknown',
        confidence: 0.5,
      };
    }
  }

  // Extraer receta de email usando IA
  async extractRecipeFromEmail(emailContent) {
    try {
      const prompt = `Extrae una receta del siguiente email. Identifica título, ingredientes, cantidades e instrucciones:

${emailContent}

Responde en formato JSON:
{
  "title": "título de la receta",
  "description": "descripción si está disponible",
  "ingredients": [{"name": "nombre", "amount": "cantidad"}],
  "instructions": ["paso 1", "paso 2"],
  "source": "email",
  "confidence": 0.8
}`;

      const result = await aiService.adaptWithClaude(prompt);
      return result;
    } catch (error) {
      console.error('Error extrayendo receta del email:', error);
      return {
        title: 'Receta Extraída',
        description: 'Receta extraída del email',
        ingredients: [],
        instructions: [],
        source: 'email',
        confidence: 0.5,
      };
    }
  }

  // Enviar notificación push
  async sendNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Enviar inmediatamente
      });
    } catch (error) {
      console.error('Error enviando notificación:', error);
    }
  }

  // Configurar webhook para WhatsApp
  async setupWhatsAppWebhook(webhookUrl) {
    try {
      const config = getApiConfig('WHATSAPP');
      
      const response = await axios.post(
        `${config.BASE_URL}/${config.PHONE_NUMBER_ID}/subscribed_apps`,
        {
          access_token: config.ACCESS_TOKEN,
          callback_url: webhookUrl,
          verify_token: 'your_verify_token_here',
          fields: ['messages', 'message_deliveries', 'message_reads']
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error configurando webhook de WhatsApp:', error);
      throw error;
    }
  }

  // Configurar webhook para Telegram
  async setupTelegramWebhook(webhookUrl) {
    try {
      const config = getApiConfig('TELEGRAM');
      
      const response = await axios.post(
        `${config.BASE_URL}${config.BOT_TOKEN}/setWebhook`,
        {
          url: webhookUrl,
          allowed_updates: ['message', 'edited_message', 'channel_post']
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error configurando webhook de Telegram:', error);
      throw error;
    }
  }

  // Verificar estado de las APIs
  async checkApiStatus() {
    const status = {
      whatsapp: false,
      telegram: false,
      email: false,
    };

    try {
      // Verificar WhatsApp
      const whatsappConfig = getApiConfig('WHATSAPP');
      if (whatsappConfig.ACCESS_TOKEN !== 'TU_ACCESS_TOKEN_AQUI') {
        status.whatsapp = true;
      }
    } catch (error) {
      console.error('WhatsApp API no configurada');
    }

    try {
      // Verificar Telegram
      const telegramConfig = getApiConfig('TELEGRAM');
      if (telegramConfig.BOT_TOKEN !== 'TU_BOT_TOKEN_AQUI') {
        status.telegram = true;
      }
    } catch (error) {
      console.error('Telegram API no configurada');
    }

    try {
      // Verificar Email
      const emailConfig = getApiConfig('EMAIL');
      if (emailConfig.API_KEY !== 'TU_API_KEY_AQUI') {
        status.email = true;
      }
    } catch (error) {
      console.error('Email API no configurada');
    }

    return status;
  }
}

export default new CommunicationService();
