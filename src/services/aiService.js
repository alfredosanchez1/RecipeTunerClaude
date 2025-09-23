import axios from 'axios';
import { getApiConfig, getPreferredAIService } from '../config/api';

class AIService {
  constructor() {
    this.preferredService = getPreferredAIService();
  }

  // Adaptar receta usando IA real
  async adaptRecipeWithAI(recipe, userPreferences) {
    try {
      if (!this.preferredService) {
        throw new Error('No hay servicios de IA configurados');
      }

      const prompt = this.buildRecipeAdaptationPrompt(recipe, userPreferences);
      
      if (this.preferredService === 'CLAUDE') {
        return await this.adaptWithClaude(prompt);
      } else if (this.preferredService === 'OPENAI') {
        return await this.adaptWithOpenAI(prompt);
      }
    } catch (error) {
      console.error('Error en adaptación con IA:', error);
      throw error;
    }
  }

  // Construir prompt para adaptación de receta
  buildRecipeAdaptationPrompt(recipe, userPreferences) {
    const restrictions = userPreferences.dietaryRestrictions.join(', ') || 'ninguna';
    const allergies = userPreferences.allergies.join(', ') || 'ninguna';
    const intolerances = userPreferences.intolerances.join(', ') || 'ninguna';
    const spiceLevel = userPreferences.spiceLevel || 'medio';
    const cookingTime = userPreferences.cookingTime || '30-60 min';
    const servings = userPreferences.servings || '2-4';

    return `Adapta la siguiente receta según las preferencias del usuario:

RECETA ORIGINAL:
Título: ${recipe.title}
Descripción: ${recipe.description}
Cocina: ${recipe.cuisine}
Dificultad: ${recipe.difficulty}
Tiempo de cocción: ${recipe.cookingTime}
Porciones: ${recipe.servings}

Ingredientes:
${recipe.ingredients.map(ing => `- ${ing.name}: ${ing.amount}`).join('\n')}

Instrucciones:
${recipe.instructions.map((inst, index) => `${index + 1}. ${inst}`).join('\n')}

PREFERENCIAS DEL USUARIO:
- Restricciones dietéticas: ${restrictions}
- Alergias: ${allergies}
- Intolerancias: ${intolerances}
- Nivel de picante preferido: ${spiceLevel}
- Tiempo de cocción preferido: ${cookingTime}
- Porciones preferidas: ${servings}

Por favor, adapta la receta considerando:
1. Sustituir ingredientes problemáticos por alternativas seguras
2. Ajustar el nivel de picante según la preferencia
3. Optimizar el tiempo de cocción si es posible
4. Adaptar las porciones
5. Mantener el sabor y la calidad de la receta original
6. Calcular información nutricional completa por porción
7. Incluir alternativas de ingredientes y métodos de cocción
8. Agregar consejos, advertencias y notas de compra relevantes
9. Proporcionar un resumen detallado de todos los cambios realizados

Responde en formato JSON con la siguiente estructura:
{
  "title": "Título adaptado",
  "description": "Descripción adaptada",
  "cuisine": "tipo de cocina",
  "difficulty": "fácil/medio/difícil",
  "cookingTime": "tiempo en minutos",
  "servings": "número de porciones",
  "ingredients": [{"name": "nombre", "amount": "cantidad", "unit": "unidad", "notes": "notas"}],
  "instructions": ["instrucción 1", "instrucción 2"],
  "nutrition": {
    "calories": "calorías por porción",
    "protein": "gramos de proteína",
    "carbs": "gramos de carbohidratos",
    "fat": "gramos de grasa",
    "fiber": "gramos de fibra",
    "sodium": "miligramos de sodio"
  },
  "dietaryRestrictions": ["restricciones aplicables"],
  "tags": ["etiquetas relevantes"],
  "tips": ["consejos útiles"],
  "warnings": ["advertencias si aplican"],
  "shoppingNotes": ["notas para compras"],
  "alternatives": {
    "ingredients": [{"ingredient": "ingrediente", "alternatives": ["alternativa1", "alternativa2"]}],
    "cookingMethods": "métodos alternativos de cocción"
  },
  "adaptationSummary": {
    "majorChanges": ["cambios principales"],
    "substitutions": [{"original": "ingrediente original", "replacement": "sustituto", "reason": "razón del cambio"}],
    "nutritionImprovements": ["mejoras nutricionales"],
    "timeAdjustments": "ajustes de tiempo realizados"
  }
}`;
  }

  // Adaptar usando Claude API
  async adaptWithClaude(prompt) {
    const config = getApiConfig('CLAUDE');
    
    const response = await axios.post(
      `${config.BASE_URL}/messages`,
      {
        model: config.MODEL,
        max_tokens: config.MAX_TOKENS,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${config.API_KEY}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      }
    );

    const content = response.data.content[0].text;
    return this.parseAIResponse(content);
  }

  // Adaptar usando OpenAI API
  async adaptWithOpenAI(prompt) {
    const config = getApiConfig('OPENAI');

    const response = await axios.post(
      `${config.BASE_URL}/chat/completions`,
      {
        model: config.MODEL,
        max_tokens: config.MAX_TOKENS,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${config.API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;

    // Si el prompt contiene "AdaptationRequestScreen" o "success", usar parseado directo
    if (prompt.includes('=== RECETA ORIGINAL ===') || prompt.includes('"success"')) {
      return this.parseAdvancedAIResponse(content);
    }

    return this.parseAIResponse(content);
  }

  // Parsear respuesta de IA
  parseAIResponse(content) {
    try {
      // Intentar extraer JSON de la respuesta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Si no hay JSON, crear estructura básica
      return {
        title: 'Receta Adaptada',
        description: 'Receta adaptada según tus preferencias',
        ingredients: [],
        instructions: [],
        adaptations: {
          dietaryChanges: ['Adaptación realizada'],
          allergySubstitutions: ['Sustituciones aplicadas'],
          timeOptimizations: ['Tiempo optimizado'],
          notes: content
        }
      };
    } catch (error) {
      console.error('Error parseando respuesta de IA:', error);
      return {
        title: 'Receta Adaptada',
        description: 'Receta adaptada según tus preferencias',
        ingredients: [],
        instructions: [],
        adaptations: {
          dietaryChanges: ['Adaptación realizada'],
          allergySubstitutions: ['Sustituciones aplicadas'],
          timeOptimizations: ['Tiempo optimizado'],
          notes: content
        }
      };
    }
  }

  // Parsear respuesta avanzada de IA (para AdaptationRequestScreen)
  parseAdvancedAIResponse(content) {
    try {
      console.log('🤖 AIService: Parseando respuesta avanzada de IA');
      console.log('📝 Contenido recibido:', content);

      // Intentar extraer JSON de la respuesta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ JSON parseado exitosamente:', parsed);
        return parsed;
      }

      // Si no hay JSON válido, retornar error estructurado
      console.log('❌ No se encontró JSON válido en la respuesta');
      return {
        success: false,
        reason: 'No se proporcionó la lista de ingredientes original ni las instrucciones de la receta en el formato correcto. La IA no pudo generar una respuesta válida.',
        suggestions: [
          'Intenta con una receta más simple',
          'Verifica que la receta tenga ingredientes e instrucciones claros'
        ]
      };
    } catch (error) {
      console.error('❌ Error parseando respuesta avanzada de IA:', error);
      return {
        success: false,
        reason: `Error procesando la respuesta de la IA: ${error.message}`,
        suggestions: [
          'Intenta nuevamente con comentarios más específicos',
          'Verifica que la receta original esté completa'
        ]
      };
    }
  }

  // Extraer receta de archivo (para ImportFileScreen)
  async extractRecipeFromFile(prompt, mimeType, base64File) {
    console.log('🔍 AIService: Extrayendo receta de archivo', mimeType);
    console.log('📄 Tamaño del archivo base64:', base64File.length);
    const config = getApiConfig('OPENAI');

    // Para PDFs, usar modelo de visión con estructura específica
    const messages = mimeType.includes('pdf') ? [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64File}`
            }
          }
        ]
      }
    ] : [
      {
        role: 'user',
        content: prompt + `\n\nArchivo adjunto en base64: data:${mimeType};base64,${base64File}`
      }
    ];

    try {
      const response = await axios.post(
        `${config.BASE_URL}/chat/completions`,
        {
          model: mimeType.includes('pdf') ? (config.VISION_MODEL || 'gpt-4o') : config.MODEL,
          max_tokens: config.MAX_TOKENS,
          messages: messages,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${config.API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      console.log('📝 AIService: Respuesta de extracción recibida');

      // Usar el parser básico para extracción
      return this.parseAIResponse(content);
    } catch (error) {
      console.error('❌ Error en extractRecipeFromFile:');
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Data:', error.response?.data);
      console.error('❌ Message:', error.message);
      throw error;
    }
  }

  // Extraer receta de texto (para ImportFileScreen)
  async extractRecipeFromText(prompt, textToProcess) {
    const config = getApiConfig('OPENAI');

    const response = await axios.post(
      `${config.BASE_URL}/chat/completions`,
      {
        model: config.MODEL,
        max_tokens: config.MAX_TOKENS,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${config.API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;

    // Usar el parser básico para extracción
    return this.parseAIResponse(content);
  }

  // Analizar imagen de receta usando OpenAI Vision API
  async analyzeRecipeImage(base64Image) {
    try {
      console.log('🤖 AIService: Iniciando análisis de imagen con OpenAI Vision');

      // Intentar primero con OpenAI Vision API
      if (this.preferredService === 'OPENAI') {
        try {
          return await this.analyzeWithOpenAIVision(base64Image);
        } catch (error) {
          console.log('🤖 AIService: OpenAI Vision falló, usando fallback mock');
          return this.mockOCRResponse();
        }
      }

      // Fallback para Google Vision si estuviera configurado
      const visionConfig = getApiConfig('GOOGLE_VISION');
      if (visionConfig.API_KEY && visionConfig.API_KEY !== 'TU_API_KEY_AQUI') {
        return await this.analyzeWithGoogleVision(base64Image, visionConfig);
      }

      // Si no hay APIs configuradas, usar respuesta simulada
      console.log('🤖 AIService: No hay APIs configuradas, usando respuesta simulada');
      const mockResult = this.mockOCRResponse();
      console.log('🤖 AIService: Mock response:', mockResult);
      return mockResult;

    } catch (error) {
      console.error('❌ Error analizando imagen:', error);
      // Fallback en caso de error
      return this.mockOCRResponse();
    }
  }

  // Analizar imagen con OpenAI Vision API
  async analyzeWithOpenAIVision(base64Image) {
    console.log('🤖 AIService: Usando OpenAI Vision API para OCR');
    const config = getApiConfig('OPENAI');

    const response = await axios.post(
      `${config.BASE_URL}/chat/completions`,
      {
        model: config.VISION_MODEL || "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analiza esta imagen de receta y extrae TODO el texto que veas. Identifica el título de la receta y qué tipo de comida es.

Responde en formato JSON exactamente así:
{
  "text": "todo el texto extraído de la imagen",
  "title": "título claro y específico de la receta",
  "labels": ["tipo de comida", "ingrediente principal", "estilo de cocina"],
  "confidence": 0.95
}`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1500
      },
      {
        headers: {
          'Authorization': `Bearer ${config.API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    console.log('🤖 AIService: OpenAI Vision response:', content);

    try {
      // Intentar parsear JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          text: parsed.text || '',
          title: parsed.title || 'Receta Detectada',
          labels: parsed.labels || [],
          confidence: parsed.confidence || 0.8
        };
      }
    } catch (parseError) {
      console.log('🤖 AIService: Error parsing JSON, usando texto crudo');
    }

    // Si no se puede parsear JSON, usar el contenido como texto
    return {
      text: content,
      title: 'Receta Detectada',
      labels: ['Recipe', 'Food'],
      confidence: 0.8
    };
  }

  // Analizar imagen con Google Vision API (fallback)
  async analyzeWithGoogleVision(base64Image, config) {
    console.log('🤖 AIService: Usando Google Vision API como fallback');

    const response = await axios.post(
      `${config.BASE_URL}/images:annotate?key=${config.API_KEY}`,
      {
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 1
              },
              {
                type: 'LABEL_DETECTION',
                maxResults: 10
              }
            ]
          }
        ]
      }
    );

    return this.parseVisionResponse(response.data);
  }

  // Respuesta simulada para OCR durante desarrollo
  mockOCRResponse() {
    return {
      text: `RECETA DE PASTA ITALIANA

Ingredientes:
- 400g de pasta (espaguetis o linguine)
- 3 dientes de ajo
- 1/2 taza de aceite de oliva
- 1 cucharadita de hojuelas de chile rojo
- 1/2 taza de perejil fresco picado
- Sal y pimienta al gusto
- Queso parmesano rallado

Instrucciones:
1. Hierve agua con sal en una olla grande
2. Cocina la pasta según las instrucciones del paquete
3. Mientras tanto, calienta el aceite en una sartén grande
4. Añade el ajo picado y las hojuelas de chile
5. Escurre la pasta reservando 1 taza del agua de cocción
6. Mezcla la pasta con el aceite aromático
7. Añade el perejil y mezcla bien
8. Sirve con queso parmesano

Tiempo: 20 minutos
Porciones: 4`,
      title: 'Pasta Italiana con Ajo y Chile',
      labels: ['Food', 'Recipe', 'Pasta', 'Italian', 'Cooking'],
      confidence: 0.85
    };
  }

  // Convertir imagen a base64 (función legacy - ya no se usa)
  async imageToBase64(imageUri) {
    // Esta función ya no se usa porque la imagen viene en base64 desde imageService
    return imageUri;
  }

  // Parsear respuesta de Google Vision
  parseVisionResponse(visionData) {
    const textAnnotations = visionData.responses[0]?.textAnnotations || [];
    const labels = visionData.responses[0]?.labelAnnotations || [];
    
    let extractedText = '';
    if (textAnnotations.length > 0) {
      extractedText = textAnnotations[0].description;
    }

    const detectedLabels = labels.map(label => label.description);

    return {
      text: extractedText,
      labels: detectedLabels,
      confidence: labels.length > 0 ? labels[0].score : 0
    };
  }

  // Generar sugerencias de recetas basadas en ingredientes
  async generateRecipeSuggestions(ingredients, userPreferences) {
    const prompt = `Basándote en estos ingredientes: ${ingredients.join(', ')}, 
    y las preferencias del usuario: ${JSON.stringify(userPreferences)}, 
    sugiere 3 recetas diferentes que se puedan preparar. 
    Responde en formato JSON con título, descripción, ingredientes adicionales necesarios e instrucciones básicas.`;

    try {
      if (this.preferredService === 'CLAUDE') {
        return await this.adaptWithClaude(prompt);
      } else if (this.preferredService === 'OPENAI') {
        return await this.adaptWithOpenAI(prompt);
      }
    } catch (error) {
      console.error('Error generando sugerencias:', error);
      throw error;
    }
  }
}

export default new AIService();
