// Configuración de APIs y servicios externos
export const API_CONFIG = {
  // OpenAI API para adaptación de recetas y OCR
  OPENAI: {
    API_KEY: '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',
    BASE_URL: 'https://api.openai.com/v1',
    MODEL: 'gpt-4o',
    VISION_MODEL: 'gpt-4o',
    MAX_TOKENS: 2000,
  },
  
  // Claude API (alternativa a OpenAI)
  CLAUDE: {
    API_KEY: 'TU_API_KEY_AQUI', // Reemplazar con tu API key real
    BASE_URL: 'https://api.anthropic.com/v1',
    MODEL: 'claude-3-sonnet-20240229',
    MAX_TOKENS: 4000,
  },
  
  // Google Cloud Vision API para OCR de imágenes
  GOOGLE_VISION: {
    API_KEY: 'TU_API_KEY_AQUI', // Reemplazar con tu API key real
    BASE_URL: 'https://vision.googleapis.com/v1',
  },
  
  // WhatsApp Business API (requiere aprobación de Meta)
  WHATSAPP: {
    ACCESS_TOKEN: 'TU_ACCESS_TOKEN_AQUI',
    PHONE_NUMBER_ID: 'TU_PHONE_NUMBER_ID',
    BASE_URL: 'https://graph.facebook.com/v18.0',
  },
  
  // Telegram Bot API
  TELEGRAM: {
    BOT_TOKEN: 'TU_BOT_TOKEN_AQUI',
    BASE_URL: 'https://api.telegram.org/bot',
  },
  
  // Email (usando SendGrid o similar)
  EMAIL: {
    API_KEY: 'TU_API_KEY_AQUI',
    FROM_EMAIL: 'recetas@recipetuner.com',
    BASE_URL: 'https://api.sendgrid.com/v3',
  },
  
  // Servicio de procesamiento de imágenes
  IMAGE_PROCESSING: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'heic'],
    COMPRESSION_QUALITY: 0.8,
  },
};

// Función para obtener la configuración según el entorno
export const getApiConfig = (service) => {
  const config = API_CONFIG[service];
  if (!config) {
    throw new Error(`Servicio ${service} no configurado`);
  }
  return config;
};

// Función para validar si las APIs están configuradas
export const validateApiKeys = () => {
  const missingKeys = [];
  
  Object.entries(API_CONFIG).forEach(([service, config]) => {
    if (config.API_KEY && config.API_KEY === 'TU_API_KEY_AQUI') {
      missingKeys.push(service);
    }
  });
  
  return {
    isValid: missingKeys.length === 0,
    missingKeys,
  };
};

// Función para obtener el servicio de IA preferido
export const getPreferredAIService = () => {
  const openaiKey = API_CONFIG.OPENAI.API_KEY;
  const claudeKey = API_CONFIG.CLAUDE.API_KEY;
  
  if (claudeKey && claudeKey !== 'TU_API_KEY_AQUI') {
    return 'CLAUDE';
  } else if (openaiKey && openaiKey !== 'TU_API_KEY_AQUI') {
    return 'OPENAI';
  }
  
  return null;
};
