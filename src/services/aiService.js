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
6. Agregar notas explicativas sobre los cambios realizados

Responde en formato JSON con la siguiente estructura:
{
  "title": "Título adaptado",
  "description": "Descripción adaptada",
  "ingredients": [{"name": "nombre", "amount": "cantidad", "notes": "notas"}],
  "instructions": ["instrucción 1", "instrucción 2"],
  "adaptations": {
    "dietaryChanges": ["cambios realizados"],
    "allergySubstitutions": ["sustituciones"],
    "timeOptimizations": ["optimizaciones"],
    "notes": "notas generales"
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

  // Analizar imagen de receta usando Google Vision API
  async analyzeRecipeImage(imageUri) {
    try {
      const config = getApiConfig('GOOGLE_VISION');
      
      // Convertir imagen a base64
      const base64Image = await this.imageToBase64(imageUri);
      
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
    } catch (error) {
      console.error('Error analizando imagen:', error);
      throw error;
    }
  }

  // Convertir imagen a base64
  async imageToBase64(imageUri) {
    // Esta función dependerá de cómo manejes las imágenes en tu app
    // Puedes usar expo-file-system para leer archivos
    return imageUri; // Placeholder
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
