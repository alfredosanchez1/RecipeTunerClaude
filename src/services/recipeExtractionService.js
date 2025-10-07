import { Alert } from 'react-native';
import { determineRecipeType, getRecipeIconInfo, getRecipeEmoji } from '../utils/recipeIcons';

// Configuración de APIs de extracción
const EXTRACTION_APIS = {
  // API gratuita para extracción básica
  MERCURY: 'https://mercury.postlight.com/parser',
  // API alternativa
  READABILITY: 'https://readability.com/api/content/v1/parser',
  // API de recetas específicas (requiere API key)
  SPOONACULAR: 'https://api.spoonacular.com/recipes/extract',
};

class RecipeExtractionService {
  constructor() {
    this.apiKey = null; // Para APIs que requieren key
  }

  /**
   * Extrae UNA SOLA receta desde una URL con datos básicos para confirmación
   * @param {string} url - URL de la receta
   * @returns {Promise<Object>} - Datos básicos de la receta para confirmación
   */
  async extractSingleRecipePreview(url) {
    try {
      console.log(`🔍 Extrayendo preview de receta desde: ${url}`);

      // Primero intentamos con APIs gratuitas
      let rawData = await this.tryFreeExtraction(url);

      if (!rawData) {
        console.log('APIs gratuitas fallaron, intentando extracción básica...');
        rawData = await this.tryBasicExtraction(url);
      }

      if (!rawData) {
        throw new Error('No se pudo extraer la receta con ningún método disponible');
      }

      console.log('✅ Datos extraídos, analizando contenido...');

      // Extraemos los datos básicos que necesitamos para el preview
      const preview = await this.extractBasicRecipeData(rawData, url);

      return preview;
    } catch (error) {
      console.error('❌ Error en extracción de preview:', error.message);
      throw error;
    }
  }

  /**
   * Extrae datos básicos de una receta para preview
   * @param {Object} rawData - Datos crudos extraídos
   * @param {string} url - URL fuente
   * @returns {Object} - Datos básicos para confirmación
   */
  async extractBasicRecipeData(rawData, url) {
    const content = rawData.content || '';

    console.log('📋 Extrayendo datos básicos de la receta...');

    // 1. Extraer el título principal
    const title = this.extractMainRecipeTitle(content, rawData.title);

    // 2. Contar ingredientes aproximados
    const ingredientsCount = this.countIngredients(content);

    // 3. Extraer tiempo de preparación
    const prepTime = this.extractPreparationTime(content);

    // 4. Extraer tiempo de cocción
    const cookTime = this.extractCookingTime(content);

    // 5. Extraer porciones
    const servings = this.extractServings(content);

    // 6. Extraer imagen principal
    const imageUrl = this.extractMainRecipeImage(content, url);

    // 7. Extraer descripción corta
    const description = this.extractShortDescription(content);

    // 8. Extraer algunos ingredientes para el preview
    const basicIngredients = this.extractBasicIngredients(content);

    // 9. Crear objeto temporal para clasificación
    const tempRecipe = {
      title: title,
      description: description,
      ingredients: basicIngredients,
      cookingTime: cookTime + prepTime
    };

    // 10. Determinar tipo de receta y obtener emoji
    const recipeType = determineRecipeType(tempRecipe);
    const recipeEmoji = getRecipeEmoji(recipeType);
    const iconInfo = getRecipeIconInfo(tempRecipe); // Mantener como fallback

    const preview = {
      title: title,
      description: description,
      ingredients: basicIngredients,
      ingredientsCount: ingredientsCount,
      preparationTime: prepTime,
      cookingTime: cookTime,
      totalTime: prepTime + cookTime,
      servings: servings,
      imageUrl: imageUrl,
      sourceUrl: url,
      recipeType: recipeType,
      emoji: recipeEmoji,
      iconName: iconInfo.icon, // Fallback
      iconColor: iconInfo.color, // Fallback
      isPreview: true,
      confidence: this.calculateExtractionConfidence(title, ingredientsCount, prepTime, cookTime)
    };

    console.log('📊 Preview extraído:', {
      title: preview.title,
      ingredientsCount: preview.ingredientsCount,
      prepTime: preview.preparationTime,
      cookTime: preview.cookingTime,
      servings: preview.servings,
      confidence: preview.confidence,
      hasImage: !!preview.imageUrl
    });

    return preview;
  }

  /**
   * Extrae el título principal de la receta
   */
  extractMainRecipeTitle(content, pageTitle) {
    console.log('🔍 Extrayendo título principal...');

    // Patrones específicos para títulos de recetas principales (en orden de prioridad)
    const titlePatterns = [
      // Schema.org markup (máxima prioridad)
      /<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?"name"\s*:\s*"([^"]{5,100})"[\s\S]*?<\/script>/gi,

      // Meta tags específicos (alta prioridad)
      /<meta[^>]*property="og:title"[^>]*content="([^"]{5,100})"[^>]*>/gi,
      /<meta[^>]*name="title"[^>]*content="([^"]{5,100})"[^>]*>/gi,
      /<meta[^>]*name="twitter:title"[^>]*content="([^"]{5,100})"[^>]*>/gi,

      // H1 tags (alta prioridad - más probable que sea el título principal)
      /<h1[^>]*>([^<]{5,100})<\/h1>/gi,
      /<h1[^>]*>[\s\S]*?<[^>]*>([^<]{5,100})<\/[^>]*>[\s\S]*?<\/h1>/gi,

      // Recipe-specific selectors (prioridad media)
      /<div[^>]*class="[^"]*recipe[^"]*title[^"]*"[^>]*>[\s\S]*?<[^>]*>([^<]{5,100})<\/[^>]*>[\s\S]*?<\/div>/gi,
      /<span[^>]*class="[^"]*recipe[^"]*name[^"]*"[^>]*>([^<]{5,100})<\/span>/gi,
      /<div[^>]*class="[^"]*entry[^"]*title[^"]*"[^>]*>[\s\S]*?<[^>]*>([^<]{5,100})<\/[^>]*>[\s\S]*?<\/div>/gi,
      /<header[^>]*class="[^"]*entry[^"]*header[^"]*"[^>]*>[\s\S]*?<h[1-3][^>]*>([^<]{5,100})<\/h[1-3]>[\s\S]*?<\/header>/gi,

      // Títulos con clases comunes
      /<[^>]*class="[^"]*title[^"]*"[^>]*>([^<]{5,100})<\/[^>]*>/gi,
      /<[^>]*class="[^"]*heading[^"]*"[^>]*>([^<]{5,100})<\/[^>]*>/gi,

      // H2, H3 como fallback
      /<h2[^>]*>([^<]{5,100})<\/h2>/gi,
      /<h3[^>]*>([^<]{5,100})<\/h3>/gi,
    ];

    for (const pattern of titlePatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        // Extraer el primer match válido
        const regex = new RegExp(pattern.source, 'gi');
        let match;
        while ((match = regex.exec(content)) !== null) {
          if (match[1]) {
            const title = this.cleanRecipeTitle(match[1]);
            if (this.isValidRecipeTitle(title)) {
              console.log(`✅ Título encontrado con patrón: "${title}"`);
              return title;
            }
          }
        }
      }
    }

    // Fallback al título de la página si es válido
    if (pageTitle) {
      const cleanPageTitle = this.cleanRecipeTitle(pageTitle);
      if (this.isValidRecipeTitle(cleanPageTitle)) {
        console.log(`📄 Usando título de página: "${cleanPageTitle}"`);
        return cleanPageTitle;
      }
    }

    // Último intento: buscar cualquier texto significativo en H1, H2 o H3
    console.log('🔍 Último intento: buscando cualquier título significativo...');
    const fallbackPatterns = [
      /<h1[^>]*>([^<]+)<\/h1>/gi,
      /<h2[^>]*>([^<]+)<\/h2>/gi,
      /<h3[^>]*>([^<]+)<\/h3>/gi,
      /<title[^>]*>([^<]+)<\/title>/gi,
    ];

    for (const pattern of fallbackPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        const regex = new RegExp(pattern.source, 'gi');
        let match;
        while ((match = regex.exec(content)) !== null) {
          if (match[1]) {
            const title = this.cleanRecipeTitle(match[1]);
            if (title && title.length >= 3) {
              console.log(`📝 Usando título fallback: "${title}"`);
              return title;
            }
          }
        }
      }
    }

    console.log('⚠️ No se encontró ningún título válido, usando genérico');
    return 'Receta sin título';
  }

  /**
   * Cuenta el número aproximado de ingredientes
   */
  countIngredients(content) {
    console.log('🧮 Contando ingredientes...');

    // Patrones para listas de ingredientes (en orden de prioridad)
    const patterns = [
      // Schema.org JSON-LD (máxima prioridad)
      /"recipeIngredient"\s*:\s*\[([\s\S]*?)\]/gi,

      // Listas con clases específicas de ingredientes (alta prioridad)
      /<ul[^>]*class="[^"]*ingredient[^"]*"[^>]*>([\s\S]*?)<\/ul>/gi,
      /<ol[^>]*class="[^"]*ingredient[^"]*"[^>]*>([\s\S]*?)<\/ol>/gi,
      /<ul[^>]*class="[^"]*recipe[^"]*ingredient[^"]*"[^>]*>([\s\S]*?)<\/ul>/gi,
      /<ol[^>]*class="[^"]*recipe[^"]*ingredient[^"]*"[^>]*>([\s\S]*?)<\/ol>/gi,

      // Divs con ingredientes (prioridad media)
      /<div[^>]*class="[^"]*ingredient[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      /<div[^>]*class="[^"]*recipe[^"]*ingredient[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      /<section[^>]*class="[^"]*ingredient[^"]*"[^>]*>([\s\S]*?)<\/section>/gi,

      // IDs específicos de ingredientes
      /<ul[^>]*id="[^"]*ingredient[^"]*"[^>]*>([\s\S]*?)<\/ul>/gi,
      /<ol[^>]*id="[^"]*ingredient[^"]*"[^>]*>([\s\S]*?)<\/ol>/gi,

      // Listas genéricas (baja prioridad - solo si no encontramos nada más específico)
      /<ul[^>]*>([\s\S]*?)<\/ul>/gi,
    ];

    let maxCount = 0;

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          let count = 0;

          // Manejar JSON-LD de manera especial
          if (pattern.source.includes('recipeIngredient')) {
            try {
              // Contar elementos en el array JSON
              const jsonMatch = match.match(/"recipeIngredient"\s*:\s*\[([\s\S]*?)\]/gi);
              if (jsonMatch) {
                const ingredientsArray = jsonMatch[0];
                const ingredientCount = (ingredientsArray.match(/"/g) || []).length / 2; // Cada string tiene 2 comillas
                count = Math.floor(ingredientCount);
                console.log(`📊 JSON-LD encontró ${count} ingredientes`);
              }
            } catch (e) {
              console.log('⚠️ Error parseando JSON-LD ingredients:', e.message);
            }
          } else {
            // Contar elementos li dentro de la lista
            const liMatches = match.match(/<li[^>]*>[\s\S]*?<\/li>/gi);
            if (liMatches) {
              count = liMatches.length;

              // Filtrar listas que probablemente no son ingredientes
              if (count >= 3 && count <= 25) {
                // Verificar que los elementos parecen ingredientes
                const validIngredients = liMatches.filter(li => {
                  const text = li.replace(/<[^>]*>/g, '').trim();
                  return text.length > 3 && text.length < 150 && (
                    // Unidades en inglés
                    /\b(cup|cups|tsp|tbsp|teaspoon|tablespoon|oz|ounce|lb|pound|gram|grams|kg|kilogram|ml|milliliter|liter|piece|pieces|clove|cloves|slice|slices)\b/i.test(text) ||
                    // Unidades en español
                    /\b(taza|tazas|cucharada|cucharadas|cucharadita|cucharaditas|gramo|gramos|kilo|kilos|kilogramo|onza|onzas|libra|libras|mililitro|litro|pieza|piezas|diente|dientes|rebanada|rebanadas)\b/i.test(text) ||
                    // Números + ingredientes comunes
                    /\d+.*\b(salt|pepper|sugar|flour|oil|butter|egg|eggs|onion|garlic|tomato|chicken|beef|sal|pimienta|azúcar|harina|aceite|mantequilla|huevo|huevos|cebolla|ajo|tomate|pollo|carne)\b/i.test(text)
                  );
                });

                if (validIngredients.length >= Math.floor(count * 0.5)) {
                  console.log(`📊 Lista HTML encontró ${count} ingredientes válidos`);
                  count = validIngredients.length;
                } else {
                  count = 0; // No es una lista de ingredientes válida
                }
              }
            }
          }

          if (count > 0 && count >= 3 && count <= 30) {
            maxCount = Math.max(maxCount, count);
          }
        });
      }
    }

    const finalCount = maxCount > 0 ? maxCount : this.estimateIngredientsByContent(content);
    console.log(`📝 Ingredientes encontrados: ${finalCount}`);
    return finalCount;
  }

  /**
   * Estima ingredientes por contenido cuando no se encuentran listas
   */
  estimateIngredientsByContent(content) {
    // Contar menciones de unidades de medida comunes
    const unitPatterns = /\b(cup|cups|tsp|tbsp|teaspoon|tablespoon|oz|ounce|lb|pound|gram|grams|kg|kilogram|ml|liter|piece|pieces|clove|cloves|taza|tazas|cucharada|cucharadas|cucharadita|cucharaditas|gramo|gramos|kilo|onza|libra)\b/gi;
    const unitMatches = content.match(unitPatterns);

    if (unitMatches) {
      // Estimar basado en menciones de unidades (generalmente 1 unidad por ingrediente)
      return Math.min(Math.max(Math.floor(unitMatches.length * 0.7), 4), 15);
    }

    return 6; // Valor por defecto
  }

  /**
   * Extrae tiempo de preparación
   */
  extractPreparationTime(content) {
    console.log('⏱️ NUEVA VERSION: Extrayendo tiempo de preparación...');

    const patterns = [
      // Schema.org JSON-LD (máxima prioridad)
      /"prepTime"\s*:\s*"PT(\d+)M"/gi,
      /"prepTime"\s*:\s*"PT(\d+)H"/gi, // Horas en formato ISO
      /"prepTime"\s*:\s*"(\d+)\s*min"/gi,
      /"prepTime"\s*:\s*"(\d+)\s*minutes"/gi,

      // Meta tags
      /<meta[^>]*name="prepTime"[^>]*content="(\d+)"/gi,
      /<meta[^>]*property="recipe:prep_time"[^>]*content="(\d+)"/gi,

      // Etiquetas específicas de recetas
      /<span[^>]*class="[^"]*prep[^"]*time[^"]*"[^>]*>.*?(\d+).*?min/gi,
      /<div[^>]*class="[^"]*prep[^"]*time[^"]*"[^>]*>.*?(\d+).*?min/gi,
      /<time[^>]*class="[^"]*prep[^"]*"[^>]*>.*?(\d+).*?min/gi,

      // Texto directo (inglés)
      /prep[^:]*?[:\s]+(\d+)\s*min/gi,
      /preparation[^:]*?[:\s]+(\d+)\s*min/gi,
      /prep[^:]*?time[^:]*?[:\s]+(\d+)\s*min/gi,

      // Texto directo (español)
      /preparación[^:]*?[:\s]+(\d+)\s*min/gi,
      /tiempo[^:]*?preparación[^:]*?[:\s]+(\d+)\s*min/gi,
      /tiempo[^:]*?prep[^:]*?[:\s]+(\d+)\s*min/gi,

      // Patrones generales
      /(\d+)\s*min[^a-z]*prep/gi,
      /(\d+)\s*min[^a-z]*preparación/gi,
      /(\d+)\s*minutes[^a-z]*prep/gi,

      // Patrones con horas
      /prep[^:]*?[:\s]+(\d+)\s*h/gi,
      /preparación[^:]*?[:\s]+(\d+)\s*h/gi,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        let time = parseInt(match[1]);

        // Convertir horas a minutos si es necesario
        if (pattern.source.includes('PT') && pattern.source.includes('H')) {
          time = time * 60; // Convertir horas a minutos
        } else if (pattern.source.includes('\\s*h')) {
          time = time * 60; // Convertir horas a minutos
        }

        if (time > 0 && time <= 480) { // Máximo 8 horas de prep
          console.log(`⏱️ Tiempo de preparación encontrado: ${time} minutos`);
          return time;
        }
      }
    }

    console.log('⏱️ Tiempo de preparación por defecto: 15 minutos');
    return 15; // Valor por defecto
  }

  /**
   * Extrae tiempo de cocción
   */
  extractCookingTime(content) {
    console.log('🍳 Extrayendo tiempo de cocción...');

    const patterns = [
      // JSON-LD
      /"cookTime"\s*:\s*"PT(\d+)M"/gi,
      /"cookTime"\s*:\s*"(\d+)\s*min"/gi,

      // Meta tags
      /<meta[^>]*name="cookTime"[^>]*content="(\d+)"/gi,

      // Texto directo
      /cook[^:]*?[:\s]+(\d+)\s*min/gi,
      /cocción[^:]*?[:\s]+(\d+)\s*min/gi,
      /tiempo[^:]*?cocción[^:]*?[:\s]+(\d+)\s*min/gi,
      /horno[^:]*?[:\s]+(\d+)\s*min/gi,

      // Patrones generales
      /(\d+)\s*min[^a-z]*cook/gi,
      /(\d+)\s*min[^a-z]*cocción/gi,
      /(\d+)\s*min[^a-z]*horno/gi,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        const time = parseInt(match[1]);
        if (time > 0 && time <= 480) { // Máximo 8 horas de cocción
          console.log(`🍳 Tiempo de cocción: ${time} minutos`);
          return time;
        }
      }
    }

    console.log('🍳 Tiempo de cocción por defecto: 30 minutos');
    return 30; // Valor por defecto
  }

  /**
   * Extrae número de porciones
   */
  extractServings(content) {
    console.log('🍽️ Extrayendo porciones...');

    const patterns = [
      // Schema.org JSON-LD (máxima prioridad)
      /"recipeYield"\s*:\s*"?(\d+)"?/gi,
      /"yield"\s*:\s*"?(\d+)"?/gi,
      /"servings"\s*:\s*"?(\d+)"?/gi,

      // Meta tags
      /<meta[^>]*name="recipeYield"[^>]*content="(\d+)"/gi,
      /<meta[^>]*property="recipe:servings"[^>]*content="(\d+)"/gi,

      // Etiquetas específicas de recetas
      /<span[^>]*class="[^"]*serving[^"]*"[^>]*>.*?(\d+)/gi,
      /<div[^>]*class="[^"]*serving[^"]*"[^>]*>.*?(\d+)/gi,
      /<span[^>]*class="[^"]*yield[^"]*"[^>]*>.*?(\d+)/gi,

      // Texto directo (inglés)
      /servings[^:]*?[:\s]+(\d+)/gi,
      /serves[^:]*?[:\s]+(\d+)/gi,
      /yield[^:]*?[:\s]+(\d+)/gi,
      /makes[^:]*?(\d+)[^a-z]*servings/gi,

      // Texto directo (español)
      /porciones[^:]*?[:\s]+(\d+)/gi,
      /rinde[^:]*?[:\s]+(\d+)/gi,
      /para[^:]*?(\d+)[^a-z]*personas/gi,
      /sirve[^:]*?(\d+)[^a-z]*personas/gi,
      /raciones[^:]*?[:\s]+(\d+)/gi,

      // Patrones generales
      /(\d+)\s*servings/gi,
      /(\d+)\s*porciones/gi,
      /(\d+)\s*personas/gi,
      /(\d+)\s*raciones/gi,
      /(\d+)\s*portions/gi,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        const servings = parseInt(match[1]);
        if (servings > 0 && servings <= 20) { // Rango razonable
          console.log(`🍽️ Porciones: ${servings}`);
          return servings;
        }
      }
    }

    console.log('🍽️ Porciones por defecto: 4');
    return 4; // Valor por defecto
  }

  /**
   * Extrae imagen principal de la receta
   */
  extractMainRecipeImage(content, url) {
    console.log('🖼️ Extrayendo imagen principal...');

    const patterns = [
      // JSON-LD Schema.org - múltiples formatos
      /"image"\s*:\s*\[?\s*"([^"]+)"/gi,
      /"image"\s*:\s*\{\s*"@type"\s*:\s*"ImageObject"\s*,\s*"url"\s*:\s*"([^"]+)"/gi,
      /"image"\s*:\s*\{\s*"url"\s*:\s*"([^"]+)"/gi,

      // Open Graph - prioritario
      /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/gi,
      /<meta[^>]*content="([^"]+)"[^>]*property="og:image"/gi,

      // Twitter Cards
      /<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/gi,

      // Meta tags específicos de recetas
      /<meta[^>]*name="recipe:image"[^>]*content="([^"]+)"/gi,
      /<meta[^>]*name="image"[^>]*content="([^"]+)"/gi,

      // Imágenes con clases específicas de recetas - más específico
      /<img[^>]*class="[^"]*recipe[^"]*image[^"]*"[^>]*src="([^"]+)"/gi,
      /<img[^>]*class="[^"]*recipe[^"]*photo[^"]*"[^>]*src="([^"]+)"/gi,
      /<img[^>]*class="[^"]*recipe[^"]*main[^"]*"[^>]*src="([^"]+)"/gi,
      /<img[^>]*class="[^"]*main[^"]*recipe[^"]*"[^>]*src="([^"]+)"/gi,
      /<img[^>]*class="[^"]*hero[^"]*"[^>]*src="([^"]+)"/gi,
      /<img[^>]*class="[^"]*featured[^"]*"[^>]*src="([^"]+)"/gi,

      // Por ID específicos
      /<img[^>]*id="[^"]*recipe[^"]*"[^>]*src="([^"]+)"/gi,
      /<img[^>]*id="[^"]*hero[^"]*"[^>]*src="([^"]+)"/gi,

      // Data attributes
      /<img[^>]*data-src="([^"]+)"[^>]*class="[^"]*recipe[^"]*"/gi,
      /<img[^>]*data-original="([^"]+)"[^>]*class="[^"]*recipe[^"]*"/gi,

      // Selectores específicos de sitios populares
      /<img[^>]*class="[^"]*wp-post-image[^"]*"[^>]*src="([^"]+)"/gi,
      /<img[^>]*class="[^"]*entry-image[^"]*"[^>]*src="([^"]+)"/gi,

      // Imágenes grandes (probablemente de recetas)
      /<img[^>]*src="([^"]+)"[^>]*(?:width="[3-9]\d{2,}"|height="[3-9]\d{2,}")/gi,
      /<img[^>]*(?:width="[3-9]\d{2,}"|height="[3-9]\d{2,}")[^>]*src="([^"]+)"/gi,

      // Primera imagen del contenido principal (como fallback)
      /<img[^>]*src="([^"]+)"[^>]*>/gi,
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        const regex = new RegExp(pattern.source, 'gi');
        let match;
        while ((match = regex.exec(content)) !== null) {
          if (match[1]) {
            let imageUrl = match[1];

            // Convertir URLs relativas a absolutas
            if (imageUrl.startsWith('//')) {
              imageUrl = `https:${imageUrl}`;
            } else if (imageUrl.startsWith('/')) {
              try {
                const urlObj = new URL(url);
                imageUrl = `${urlObj.protocol}//${urlObj.hostname}${imageUrl}`;
              } catch (error) {
                continue;
              }
            }

            // Verificar que la URL es válida y no es un placeholder
            if (this.isValidImageUrl(imageUrl)) {
              console.log(`🖼️ Imagen encontrada: ${imageUrl}`);
              return imageUrl;
            }
          }
        }
      }
    }

    console.log('🖼️ No se encontró imagen válida');
    return null;
  }

  /**
   * Valida si una URL de imagen es válida
   */
  isValidImageUrl(url) {
    if (!url || url.length < 10) return false;

    // Filtrar URLs obviamente inválidas
    const invalidPatterns = [
      /placeholder/i,
      /logo/i,
      /icon/i,
      /avatar/i,
      /profile/i,
      /ad/i,
      /banner/i,
      /1x1/i,
      /spacer/i,
    ];

    return !invalidPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Extrae descripción corta
   */
  extractShortDescription(content) {
    const patterns = [
      // Meta description
      /<meta[^>]*name="description"[^>]*content="([^"]{20,200})"/gi,
      /<meta[^>]*property="og:description"[^>]*content="([^"]{20,200})"/gi,

      // Primer párrafo después del título
      /<p[^>]*>([^<]{20,200})<\/p>/gi,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        // Limpiar HTML de la descripción igual que el título
        const cleanDesc = this.cleanRecipeTitle(match[1]);
        if (cleanDesc.length >= 20 && cleanDesc.length <= 200) {
          console.log(`✅ Descripción encontrada: "${cleanDesc}"`);
          return cleanDesc;
        }
      }
    }

    console.log('⚠️ No se encontró descripción válida, usando genérica');
    return 'Receta deliciosa para preparar en casa';
  }

  /**
   * Calcula confianza en la extracción
   */
  calculateExtractionConfidence(title, ingredientsCount, prepTime, cookTime) {
    let confidence = 0;

    if (title && title !== 'Receta Importada') confidence += 30;
    if (ingredientsCount > 3 && ingredientsCount < 20) confidence += 25;
    if (prepTime > 0 && prepTime < 240) confidence += 20;
    if (cookTime > 0 && cookTime < 480) confidence += 25;

    return Math.min(confidence, 100);
  }

  /**
   * Extrae una receta desde una URL (método original mantenido para compatibilidad)
   * @param {string} url - URL de la receta
   * @returns {Promise<Object>} - Receta extraída
   */
  async extractRecipeFromUrl(url) {
    try {
      console.log(`Iniciando extracción de receta desde: ${url}`);

      // Primero intentamos con APIs gratuitas
      let recipe = await this.tryFreeExtraction(url);

      if (!recipe) {
        console.log('APIs gratuitas fallaron, intentando extracción específica...');
        // Si falla, intentamos con APIs de recetas específicas
        recipe = await this.tryRecipeSpecificExtraction(url);
      }

      if (!recipe) {
        console.log('APIs específicas fallaron, intentando extracción básica...');
        // Último recurso: extracción básica
        recipe = await this.tryBasicExtraction(url);
      }

      if (!recipe) {
        throw new Error('No se pudo extraer la receta con ningún método disponible');
      }

      console.log('Extracción exitosa, procesando datos...');
      // Limpiamos y estructuramos los datos
      return this.cleanAndStructureRecipe(recipe, url);
    } catch (error) {
      console.error('Error final en extracción:', error.message);
      throw error;
    }
  }

  /**
   * Detecta si una URL contiene múltiples recetas
   * @param {string} url - URL a analizar
   * @returns {Promise<Object>} - Lista de recetas encontradas
   */
  async detectMultipleRecipes(url) {
    try {
      // Primero intentamos con APIs gratuitas
      let recipes = await this.tryDetectMultipleRecipes(url);
      
      if (!recipes || recipes.length === 0) {
        // Si no detectamos múltiples, intentamos extraer una sola
        const singleRecipe = await this.extractRecipeFromUrl(url);
        return {
          isMultiple: false,
          recipes: [singleRecipe]
        };
      }

      return {
        isMultiple: true,
        recipes: recipes
      };
    } catch (error) {
      console.error('Error detecting multiple recipes:', error);
      throw error;
    }
  }

  /**
   * Intenta detectar múltiples recetas en una URL
   */
  async tryDetectMultipleRecipes(url) {
    try {
      console.log('Intentando detectar múltiples recetas...');
      
      // Primero intentamos con Mercury API
      try {
        const response = await fetch(`${EXTRACTION_APIS.MERCURY}?url=${encodeURIComponent(url)}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.content) {
            console.log('Mercury API exitosa, analizando contenido...');
            // Analizamos el contenido para detectar múltiples recetas
            const recipes = this.analyzeContentForMultipleRecipes(data.content, data.title, url);
            if (recipes && recipes.length > 1) {
              console.log(`Se detectaron ${recipes.length} recetas múltiples`);
              return recipes;
            }
          }
        }
      } catch (mercuryError) {
        console.log('Mercury API falló:', mercuryError.message);
      }

      // Si Mercury falla, intentamos extracción básica
      console.log('Intentando extracción básica para múltiples recetas...');
      const basicContent = await this.tryBasicExtraction(url);
      
      if (basicContent && basicContent.content) {
        // Analizamos el HTML básico para buscar múltiples recetas
        const recipes = this.analyzeContentForMultipleRecipes(basicContent.content, basicContent.title, url);
        if (recipes && recipes.length > 1) {
          console.log(`Se detectaron ${recipes.length} recetas en extracción básica`);
          return recipes;
        }
      }

      console.log('No se detectaron múltiples recetas');
      return null;
    } catch (error) {
      console.log('Error en detección de múltiples recetas:', error.message);
      return null;
    }
  }

  /**
   * Analiza el contenido HTML para detectar múltiples recetas
   */
  analyzeContentForMultipleRecipes(content, pageTitle, sourceUrl) {
    console.log('🔍 ANALIZANDO CONTENIDO PARA MÚLTIPLES RECETAS');
    console.log(`📄 Contenido HTML: ${content ? content.length : 0} caracteres`);
    console.log(`📝 Título de página: ${pageTitle}`);
    console.log(`🔗 URL fuente: ${sourceUrl}`);

    const recipes = [];

    // Búsqueda más amplia y precisa de títulos de recetas - PATRONES MEJORADOS
    const titlePatterns = [
      // 1. Títulos en headers - MEJORADO para capturar contenido completo
      /<h[1-6][^>]*>([^<]{5,150}(?:receta|recipe|plato|dish|comida|cocina|preparar|cocinar)[^<]{0,50})<\/h[1-6]>/gi,

      // 2. Títulos específicos con nombres de platillos - CAPTURA MÁS COMPLETA
      /<h[1-6][^>]*>([^<]{3,150}(?:pollo|chicken|carne|beef|pasta|arroz|rice|sopa|soup|ensalada|salad|pizza|salmon|salmón|atún|tuna|taco|postre|dessert|chocolate|torta|cake|pan|bread|hamburguesa|sandwich|lasaña|paella|risotto|curry|chili|tamal|empanada|quesadilla|burrito|enchilada|fajita|guacamole|ceviche|gazpacho|ratatouille|churrasco|asado|barbacoa|milanesa|croqueta)[^<]{0,100})<\/h[1-6]>/gi,

      // 3. Enlaces con nombres de recetas - CAPTURA EXTENDIDA
      /<a[^>]*href="[^"]*"[^>]*>([^<]{5,120}(?:pollo|chicken|carne|beef|pasta|arroz|rice|sopa|soup|ensalada|salad|pizza|salmon|salmón|taco|postre|dessert|chocolate|torta|cake|con|de|a la|al|en|casera|tradicional|fácil|rápida)[^<]{0,80})<\/a>/gi,

      // 4. Headers genéricos que pueden contener recetas - NUEVO PATRÓN AMPLIO
      /<h[1-6][^>]*>([^<]{10,120})<\/h[1-6]>/gi,

      // 5. Titles en divs con clases de receta - CONTENIDO COMPLETO
      /<div[^>]*class="[^"]*(?:recipe|receta|dish|meal|food|title|name)[^"]*"[^>]*>[\s\S]*?<[^>]*>([^<]{5,120})<\/[^>]*>[\s\S]*?<\/div>/gi,

      // 6. Títulos en metadatos y atributos - CAPTURA MÁS AMPLIA
      /<[^>]*title="([^"]{10,150}(?:receta|recipe|plato|dish|pollo|carne|pasta|arroz|sopa|ensalada|pizza)[^"]{0,100})"/gi,

      // 7. Spans y párrafos con contenido de recetas - MENOS RESTRICTIVO
      /<(?:span|p)[^>]*class="[^"]*(?:title|name|recipe)[^"]*"[^>]*>([^<]{5,120})<\/(?:span|p)>/gi,

      // 8. Patrones para blogs de cocina - CAPTURA COMPLETA
      /<h[1-6][^>]*>([^<]{5,150}(?:cómo hacer|how to make|receta de|recipe for)[^<]{0,100})<\/h[1-6]>/gi,

      // 9. Enlaces en elementos de navegación - MEJORADO
      /<li[^>]*>[\s]*<a[^>]*>([^<]{5,100})<\/a>[\s]*<\/li>/gi,

      // 10. NUEVO: Títulos en elementos article
      /<article[^>]*>[\s\S]*?<h[1-6][^>]*>([^<]{5,120})<\/h[1-6]>[\s\S]*?<\/article>/gi,

      // 11. NUEVO: Títulos con data attributes comunes
      /<[^>]*data-[^>]*(?:title|name|recipe)[^>]*>([^<]{5,120})<\/[^>]*>/gi
    ];

    console.log('🔍 Buscando títulos de recetas con patrones mejorados...');

    for (let patternIndex = 0; patternIndex < titlePatterns.length; patternIndex++) {
      const pattern = titlePatterns[patternIndex];
      console.log(`🔍 Probando patrón ${patternIndex + 1}/${titlePatterns.length}`);

      let matches;
      try {
        matches = content.match(pattern);
      } catch (error) {
        console.log(`❌ Error en patrón ${patternIndex + 1}:`, error.message);
        continue;
      }

      if (matches && matches.length > 0) {
        console.log(`📋 Encontrados ${matches.length} posibles títulos con patrón ${patternIndex + 1}`);

        // Extraemos el texto del grupo de captura - MEJORADO
        const extractedTitles = [];
        matches.forEach(match => {
          // Extraemos el contenido del primer grupo de captura usando regex global
          const regex = new RegExp(pattern.source, 'gi');
          let result;

          // Reset del regex para evitar problemas con lastIndex
          regex.lastIndex = 0;
          result = regex.exec(match);

          if (result && result[1]) {
            const title = result[1].trim();
            if (title && title.length > 0) {
              extractedTitles.push(title);
            }
          } else {
            // Fallback: extraer todo el texto sin HTML
            const fallbackTitle = match.replace(/<[^>]*>/g, '').trim();
            if (fallbackTitle && fallbackTitle.length > 3) {
              extractedTitles.push(fallbackTitle);
            }
          }
        });

        console.log(`📝 Títulos extraídos:`, extractedTitles.slice(0, 5));

        extractedTitles.forEach((title, index) => {
          if (recipes.length >= 10) return; // Limite máximo

          const cleanTitle = this.cleanRecipeTitle(title);
          console.log(`🧹 Título limpio: "${cleanTitle}" (original: "${title}")`);

          if (this.isValidRecipeTitle(cleanTitle) && cleanTitle.length >= 5 && cleanTitle.length <= 80) {
            console.log(`✅ Título válido encontrado: "${cleanTitle}"`);
            recipes.push({
              id: `recipe-${recipes.length}`,
              title: cleanTitle,
              description: this.generateDescriptionFromTitle(cleanTitle),
              imageUrl: this.extractRecipeImage(content, recipes.length, sourceUrl),
              difficulty: this.estimateDifficultyFromTitle(cleanTitle),
              cookingTime: this.estimateCookingTimeFromTitle(cleanTitle),
              servings: this.estimateServingsFromTitle(cleanTitle),
              ingredientsCount: this.estimateIngredientsFromTitle(cleanTitle),
              category: this.categorizeRecipeByTitle(cleanTitle),
              sourceUrl: sourceUrl,
              isExtracted: false,
            });
          } else {
            console.log(`❌ Título inválido: "${cleanTitle}" (longitud: ${cleanTitle.length}, válido: ${this.isValidRecipeTitle(cleanTitle)})`);
          }
        });

        if (recipes.length > 3) {
          console.log(`✅ Encontradas ${recipes.length} recetas, saliendo del bucle`);
          break; // Si ya tenemos buenas recetas, salimos
        }
      } else {
        console.log(`❌ Patrón ${patternIndex + 1} no encontró coincidencias`);
      }
    }

    // Si no encontramos múltiples recetas por títulos, buscamos por otros patrones
    if (recipes.length <= 1) {
      // Buscamos por enlaces de recetas
      const linkMatches = content.match(/<a[^>]*href="([^"]*)"[^>]*>([^<]*receta[^<]*)<\/a>/gi);
      
      if (linkMatches && linkMatches.length > 1) {
        linkMatches.forEach((match, index) => {
          const title = match.replace(/<[^>]*>/g, '').trim();
          if (title.length > 5 && title.length < 100) {
            recipes.push({
              id: `recipe-${index}`,
              title: title,
              description: `Receta encontrada en ${pageTitle}`,
              imageUrl: this.extractRecipeImage(content, index, sourceUrl),
              difficulty: 'medium',
              cookingTime: 30,
              servings: 4,
              sourceUrl: sourceUrl,
              isExtracted: false,
            });
          }
        });
      }
    }

    // Si aún no encontramos múltiples, buscamos por contenido estructurado
    if (recipes.length <= 1) {
      // Buscamos por listas de ingredientes múltiples
      const ingredientLists = content.match(/<ul[^>]*>[\s\S]*?<\/ul>/gi);
      
      if (ingredientLists && ingredientLists.length > 1) {
        ingredientLists.forEach((list, index) => {
          const title = this.extractTitleFromIngredientList(list, index);
          if (title) {
            recipes.push({
              id: `recipe-${index}`,
              title: title,
              description: `Receta con lista de ingredientes`,
              imageUrl: this.extractRecipeImage(content, index, sourceUrl),
              difficulty: 'medium',
              cookingTime: 30,
              servings: 4,
              sourceUrl: sourceUrl,
              isExtracted: false,
            });
          }
        });
      }
    }

    // 4. Búsqueda más agresiva de nombres reales de recetas
    if (recipes.length <= 1) {
      console.log('Búsqueda avanzada de recetas por nombres reales...');

      // Buscamos patrones más amplios de títulos de recetas
      const advancedPatterns = [
        // Títulos en diferentes elementos HTML
        /<h[1-6][^>]*>([^<]*(?:receta|recipe|cocina|plato|comida)[^<]*)<\/h[1-6]>/gi,
        // Enlaces con nombres de recetas
        /<a[^>]*>([^<]*(?:con|de|a la|al|en|casera|tradicional|fácil)[^<]*)<\/a>/gi,
        // Divs con clases relacionadas a recetas
        /<div[^>]*class="[^"]*(?:recipe|receta|dish|meal)[^"]*"[^>]*>[\s\S]*?<.*?>([^<]+)<\/.*?>[\s\S]*?<\/div>/gi,
        // Spans con contenido de recetas
        /<span[^>]*>([^<]*(?:pollo|carne|pasta|arroz|sopa|ensalada|postre)[^<]*)<\/span>/gi,
        // Títulos de artículos
        /<article[^>]*>[\s\S]*?<h[1-6][^>]*>([^<]+)<\/h[1-6]>[\s\S]*?<\/article>/gi
      ];

      for (const pattern of advancedPatterns) {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          console.log(`Encontrados ${matches.length} nombres con patrón avanzado`);

          matches.forEach((match, index) => {
            if (recipes.length >= 10) return; // Límite máximo

            let title = match.replace(/<[^>]*>/g, '').trim();
            title = this.cleanRecipeTitle(title);

            if (this.isValidRecipeTitle(title)) {
              recipes.push({
                id: `recipe-${recipes.length}`,
                title: title,
                description: this.generateDescriptionFromTitle(title),
                imageUrl: this.extractRecipeImage(content, recipes.length, sourceUrl),
                difficulty: this.estimateDifficultyFromTitle(title),
                cookingTime: this.estimateCookingTimeFromTitle(title),
                servings: this.estimateServingsFromTitle(title),
                ingredientsCount: this.estimateIngredientsFromTitle(title),
                category: this.categorizeRecipeByTitle(title),
                sourceUrl: sourceUrl,
                isExtracted: false,
              });
            }
          });

          if (recipes.length > 1) break; // Si encontramos recetas, salimos del loop
        }
      }
    }

    // 5. Si aún no encontramos recetas reales, extraemos del pageTitle
    if (recipes.length <= 1 && pageTitle) {
      console.log('Extrayendo recetas del título de la página...');

      const cleanPageTitle = this.cleanRecipeTitle(pageTitle);
      if (this.isValidRecipeTitle(cleanPageTitle)) {
        recipes.push({
          id: `recipe-0`,
          title: cleanPageTitle,
          description: this.generateDescriptionFromTitle(cleanPageTitle),
          imageUrl: this.extractRecipeImage(content, 0, sourceUrl),
          difficulty: this.estimateDifficultyFromTitle(cleanPageTitle),
          cookingTime: this.estimateCookingTimeFromTitle(cleanPageTitle),
          servings: this.estimateServingsFromTitle(cleanPageTitle),
          ingredientsCount: this.estimateIngredientsFromTitle(cleanPageTitle),
          category: this.categorizeRecipeByTitle(cleanPageTitle),
          sourceUrl: sourceUrl,
          isExtracted: false,
        });
      }
    }

    // Filtramos recetas duplicadas y limitamos a 10
    const uniqueRecipes = this.removeDuplicateRecipes(recipes);
    const finalRecipes = uniqueRecipes.slice(0, 10);
    
    console.log(`Total de recetas detectadas: ${finalRecipes.length}`);
    return finalRecipes;
  }

  /**
   * Extrae descripción de una receta específica
   */
  extractRecipeDescription(content, recipeIndex) {
    // Buscamos párrafos cerca del título de la receta
    const paragraphs = content.match(/<p[^>]*>([^<]*)<\/p>/gi);
    if (paragraphs && paragraphs[recipeIndex]) {
      // Usar la misma limpieza completa que para títulos
      const desc = this.cleanRecipeTitle(paragraphs[recipeIndex]);
      if (desc.length > 20 && desc.length < 200) {
        console.log(`✅ Descripción de receta ${recipeIndex}: "${desc}"`);
        return desc;
      }
    }
    console.log(`⚠️ No se encontró descripción para receta ${recipeIndex}`);
    return 'Receta deliciosa para compartir';
  }

  /**
   * Extrae imagen de una receta específica
   */
  extractRecipeImage(content, recipeIndex, sourceUrl) {
    try {
      console.log(`=== EXTRACCIÓN DE IMAGEN PARA RECETA ${recipeIndex} ===`);
      console.log(`URL fuente: ${sourceUrl}`);
      console.log(`Contenido HTML disponible: ${content ? content.length : 0} caracteres`);
      
      // Buscamos todas las imágenes en el contenido
      const images = content.match(/<img[^>]*src="([^"]*)"[^>]*>/gi);
      
      if (images && images.length > 0) {
        console.log(`Encontradas ${images.length} imágenes en total`);
        console.log('Primeras 5 imágenes encontradas:');
        images.slice(0, 5).forEach((img, i) => {
          const srcMatch = img.match(/src="([^"]*)"/);
          if (srcMatch) {
            console.log(`  Imagen ${i}: ${srcMatch[1]}`);
          }
        });
        
        // Filtramos imágenes que parecen ser de recetas (filtrado menos estricto)
        const recipeImages = images.filter(img => {
          const imgLower = img.toLowerCase();
          // Solo excluimos imágenes obviamente no relacionadas con recetas
          const isExcluded = imgLower.includes('ad') || 
                            imgLower.includes('banner') || 
                            imgLower.includes('logo') ||
                            imgLower.includes('icon') ||
                            imgLower.includes('avatar') ||
                            imgLower.includes('social') ||
                            imgLower.includes('share') ||
                            imgLower.includes('facebook') ||
                            imgLower.includes('twitter') ||
                            imgLower.includes('instagram');
          
          if (isExcluded) {
            const srcMatch = img.match(/src="([^"]*)"/);
            if (srcMatch) {
              console.log(`Imagen filtrada (${srcMatch[1]}): contiene palabras excluidas`);
            }
          }
          
          return !isExcluded;
        });
        
        console.log(`Después del filtro: ${recipeImages.length} imágenes válidas`);
        
        // Si no hay suficientes imágenes filtradas, usamos todas las disponibles
        if (recipeImages.length < 3) {
          console.log('Pocas imágenes filtradas, usando todas las disponibles');
          recipeImages.length = 0;
          images.forEach(img => recipeImages.push(img));
        }
        
        if (recipeImages[recipeIndex]) {
          const srcMatch = recipeImages[recipeIndex].match(/src="([^"]*)"/);
          if (srcMatch) {
            const imageUrl = srcMatch[1];
            console.log(`Imagen encontrada para receta ${recipeIndex}: ${imageUrl}`);
            
            // Convertimos URLs relativas a absolutas si es necesario
            if (imageUrl.startsWith('//')) {
              const absoluteUrl = `https:${imageUrl}`;
              console.log('URL convertida a absoluta:', absoluteUrl);
              return absoluteUrl;
            } else if (imageUrl.startsWith('/')) {
              // Convertimos URLs relativas usando la URL base
              try {
                const urlObj = new URL(sourceUrl);
                const absoluteUrl = `${urlObj.protocol}//${urlObj.hostname}${imageUrl}`;
                console.log('URL relativa convertida a absoluta:', absoluteUrl);
                return absoluteUrl;
              } catch (error) {
                console.log('Error convirtiendo URL relativa:', error.message);
                return null;
              }
            } else if (!imageUrl.startsWith('http')) {
              // URLs sin protocolo, asumimos que son relativas
              try {
                const urlObj = new URL(sourceUrl);
                const absoluteUrl = `${urlObj.protocol}//${urlObj.hostname}/${imageUrl}`;
                console.log('URL sin protocolo convertida a absoluta:', absoluteUrl);
                return absoluteUrl;
              } catch (error) {
                console.log('Error convirtiendo URL sin protocolo:', error.message);
                return null;
              }
            }
            
            console.log('URL de imagen válida:', imageUrl);
            return imageUrl;
          }
        }
        
        // Si no encontramos imagen específica, buscamos la primera imagen válida
        if (recipeImages.length > 0) {
          const firstValidImage = recipeImages[0];
          const srcMatch = firstValidImage.match(/src="([^"]*)"/);
          if (srcMatch) {
            const imageUrl = srcMatch[1];
            console.log('Usando primera imagen válida:', imageUrl);
            
            if (imageUrl.startsWith('//')) {
              return `https:${imageUrl}`;
            } else if (imageUrl.startsWith('/')) {
              try {
                const urlObj = new URL(sourceUrl);
                return `${urlObj.protocol}//${urlObj.hostname}${imageUrl}`;
              } catch (error) {
                return null;
              }
            } else if (!imageUrl.startsWith('http')) {
              try {
                const urlObj = new URL(sourceUrl);
                return `${urlObj.protocol}//${urlObj.hostname}/${imageUrl}`;
              } catch (error) {
                return null;
              }
            }
            return imageUrl;
          }
        }
      } else {
        console.log('No se encontraron etiquetas <img> en el contenido');
        
        // Buscamos otros patrones de imágenes
        const alternativePatterns = [
          /background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/gi,
          /src:\s*['"]([^'"]+)['"]/gi,
          /data-src="([^"]+)"/gi,
          /data-lazy-src="([^"]+)"/gi
        ];
        
        for (const pattern of alternativePatterns) {
          const matches = content.match(pattern);
          if (matches && matches.length > 0) {
            console.log(`Encontradas ${matches.length} imágenes con patrón alternativo:`, pattern.source);
            const imageUrl = matches[0];
            console.log('Primera imagen alternativa:', imageUrl);
            
            if (imageUrl.startsWith('//')) {
              return `https:${imageUrl}`;
            } else if (imageUrl.startsWith('/')) {
              try {
                const urlObj = new URL(sourceUrl);
                return `${urlObj.protocol}//${urlObj.hostname}${imageUrl}`;
              } catch (error) {
                return null;
              }
            }
            return imageUrl;
          }
        }
      }
      
      console.log('No se encontraron imágenes válidas');
      return null;
    } catch (error) {
      console.log('Error extrayendo imagen:', error.message);
      return null;
    }
  }

  /**
   * Extrae título desde una lista de ingredientes
   */
  extractTitleFromIngredientList(list, index) {
    // Buscamos un título antes de la lista
    const beforeList = list.substring(0, 200);
    const titleMatch = beforeList.match(/<h[2-6][^>]*>([^<]*)<\/h[2-6]>/i);
    
    if (titleMatch) {
      return titleMatch[1].trim();
    }
    
    // Si no hay título, generamos uno
    return `Receta ${index + 1}`;
  }

  /**
   * Estima dificultad basada en el título
   */
  estimateDifficultyFromTitle(title) {
    const titleLower = title.toLowerCase();
    
    if (/fácil|simple|rápida|express/i.test(titleLower)) return 'easy';
    if (/intermedia|moderada|clásica/i.test(titleLower)) return 'medium';
    if (/avanzada|compleja|gourmet|chef/i.test(titleLower)) return 'hard';
    
    return 'medium';
  }

  /**
   * Estima tiempo de cocción basado en el título
   */
  estimateCookingTimeFromTitle(title) {
    const titleLower = title.toLowerCase();
    
    if (/rápida|express|15|20|30/i.test(titleLower)) return 20;
    if (/lenta|largo|horno|asar/i.test(titleLower)) return 60;
    
    return 30;
  }

  /**
   * Estima porciones basado en el título
   */
  estimateServingsFromTitle(title) {
    const titleLower = title.toLowerCase();

    if (/individual|1|una/i.test(titleLower)) return 1;
    if (/familiar|grande|8|10/i.test(titleLower)) return 8;
    if (/pareja|2|dos/i.test(titleLower)) return 2;

    return 4;
  }

  /**
   * Estima número de ingredientes basado en el título
   */
  estimateIngredientsFromTitle(title) {
    const titleLower = title.toLowerCase();

    if (/simple|fácil|rápida|express|3|tres/i.test(titleLower)) return 5;
    if (/completa|gourmet|especial|tradicional|chef/i.test(titleLower)) return 12;
    if (/intermedia|casera|clásica/i.test(titleLower)) return 8;
    if (/ensalada|smoothie|bebida/i.test(titleLower)) return 4;
    if (/sopa|caldo|guiso/i.test(titleLower)) return 7;
    if (/pasta|arroz|paella/i.test(titleLower)) return 9;
    if (/postre|torta|pastel/i.test(titleLower)) return 6;

    return 6;
  }

  /**
   * Categoriza una receta basado en su título
   */
  categorizeRecipeByTitle(title) {
    const titleLower = title.toLowerCase();

    if (/postre|dessert|torta|pastel|helado|flan|mousse|tiramisu/i.test(titleLower)) return 'postre';
    if (/bebida|drink|jugo|smoothie|café|té|cocktail|agua/i.test(titleLower)) return 'bebida';
    if (/ensalada|salad/i.test(titleLower)) return 'ensalada';
    if (/sopa|soup|caldo|crema|gazpacho|bisque/i.test(titleLower)) return 'sopa';
    if (/pasta|espagueti|macarrones|lasaña|ravioli|fettuccine|linguine/i.test(titleLower)) return 'pasta';
    if (/pollo|chicken|gallina/i.test(titleLower)) return 'pollo';
    if (/carne|beef|res|cerdo|pork|cordero|lamb|ternera/i.test(titleLower)) return 'carne';
    if (/pescado|fish|salmón|atún|bacalao|merluza|mariscos|camarón|langosta/i.test(titleLower)) return 'pescado';
    if (/pan|bread|pizza|sandwich|bocadillo|tostada|bagel/i.test(titleLower)) return 'pan';
    if (/arroz|rice|paella|risotto|pilaf/i.test(titleLower)) return 'arroz';
    if (/vegetariano|vegano|vegan|quinoa|tofu|tempeh/i.test(titleLower)) return 'vegetariano';
    if (/entrada|aperitivo|tapas|antipasti|canapé|finger food/i.test(titleLower)) return 'entrada';

    return 'principal';
  }

  /**
   * Limpia el título de una receta eliminando texto no deseado
   */
  cleanRecipeTitle(title) {
    if (!title) return '';

    let cleaned = title
      // Eliminar etiquetas HTML residuales más agresivamente
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;[^&]*&gt;/g, '') // Eliminar etiquetas HTML codificadas

      // Decodificar entidades HTML comunes
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&hellip;/g, '...')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"')

      // Eliminar caracteres especiales y códigos extraños
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Caracteres de control
      .replace(/[^\w\s\-\u00C0-\u017F\u1E00-\u1EFF!@#$%^&*()+={}[\]|\\:";'<>?,./~`]/g, '') // Mantener solo caracteres válidos y acentos

      // Limpiar espacios múltiples y caracteres extraños
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '') // trim
      // Eliminar numeración al inicio SOLO si es muy clara
      .replace(/^\s*\d+\.\s+/, '')
      .replace(/^\s*\d+\s*[-–—]\s+/, '')
      // Eliminar prefijos comunes no deseados SOLO al inicio
      .replace(/^\s*recetas?\s+de\s+/gi, '')
      .replace(/^\s*cómo\s+hacer\s+/gi, '')
      .replace(/^\s*preparar\s+/gi, '')
      .replace(/^\s*cocinar\s+/gi, '')
      .replace(/^\s*recipe\s+for\s+/gi, '')
      .replace(/^\s*how\s+to\s+make\s+/gi, '');

    // Eliminar sufijos problemáticos SOLO si están claramente separados
    // Primero guardamos el título original para comparar
    const beforeSuffixClean = cleaned;

    cleaned = cleaned
      // Solo eliminar si hay separador claro antes del sufijo
      .replace(/\s+[-–—|]\s+recetas?\s+gratis.*$/gi, '')
      .replace(/\s+[-–—|]\s+paso\s+a\s+paso.*$/gi, '')
      .replace(/\s+[-–—|]\s+preparación.*$/gi, '')
      .replace(/\s+[-–—|]\s+ingredientes?.*$/gi, '')
      .replace(/\s+[-–—|]\s+instrucciones?.*$/gi, '')
      .replace(/\s+[-–—|]\s+receta\s+completa.*$/gi, '')
      .replace(/\s+[-–—|]\s+recipe\s+ingredients?.*$/gi, '')
      .replace(/\s+[-–—|]\s+cooking\s+instructions?.*$/gi, '')
      // Eliminar información específica entre paréntesis/corchetes con números y unidades
      .replace(/\s*\([^)]*\d+[^)]*(?:min|minuto|hora|ingredient|porcion|serving)[^)]*\)/gi, '')
      .replace(/\s*\[[^\]]*\d+[^\]]*(?:min|minuto|hora|ingredient|porcion|serving)[^\]]*\]/gi, '')
      // Solo eliminar palabras descriptivas al final si están precedidas por coma o separador
      .replace(/\s*[,|]\s*(fácil|easy|rápida?|quick|simple|tradicional|traditional|casera?|homemade|clásica?|classic|especial|special)\s*$/gi, '');

    // Si la limpieza eliminó más del 40% del contenido, usar una versión más conservadora
    if (cleaned.length < beforeSuffixClean.length * 0.6 && beforeSuffixClean.length > 10) {
      console.log(`⚠️ Limpieza demasiado agresiva, usando versión conservadora`);
      cleaned = beforeSuffixClean
        // Solo aplicar limpiezas muy conservadoras
        .replace(/\s*\([^)]*\d+[^)]*(?:min|minuto|hora)[^)]*\)/gi, '') // Solo info de tiempo
        .replace(/\s*\|.*$/g, ''); // Solo eliminar después de pipe
    }

    // Limpiar espacios y caracteres especiales de forma conservadora
    cleaned = cleaned
      .replace(/\s*[–—]\s*/g, ' - ') // Normalizar guiones manteniendo separación
      .replace(/\s+/g, ' ') // Normalizar espacios múltiples
      .replace(/^[\s\-–—,;:.!¡¿?]+/, '') // Solo eliminar puntuación al inicio
      .replace(/[\s\-–—,;:.!¡¿?]+$/, '') // Solo eliminar puntuación al final
      .trim();

    // Capitalizar primera letra manteniendo el resto
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    // Si el resultado es muy corto comparado con el original, devolver una versión menos procesada
    if (cleaned.length < title.length * 0.4 && title.length > 15) {
      console.log(`⚠️ Resultado muy corto, usando limpieza mínima`);
      cleaned = title
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
        .replace(/^\s*\d+\.\s+/, '')
        .replace(/\s*\|.*$/g, '')
        .trim();
      if (cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
    }

    console.log(`🧹 Título limpio: "${title}" → "${cleaned}" (${title.length} → ${cleaned.length} chars)`);
    return cleaned;
  }

  /**
   * Valida si un título es válido para una receta - VERSIÓN OPTIMIZADA
   */
  isValidRecipeTitle(title) {
    if (!title || title.length < 3 || title.length > 150) {
      console.log(`❌ Título inválido por longitud: "${title}" (${title ? title.length : 0} caracteres)`);
      return false;
    }

    // Patrones que NO queremos como títulos - VERSIÓN MENOS RESTRICTIVA
    const invalidPatterns = [
      /^\s*\d+\s*$/, // Solo números
      /^\s*(home|inicio|página principal|contact|about us|política de privacidad|términos|condiciones)/i,
      /^\s*(login|register|signup|newsletter|suscribirse|email|contraseña)/i,
      /^\s*(facebook|twitter|instagram|youtube|pinterest|linkedin|social media)/i,
      /^\s*(search results|buscar|find|encontrar|filtros|categorías)/i,
      /^\s*(copyright|©|®|™|all rights reserved|todos los derechos reservados)/i,
      /^\s*(loading|cargando|error|404|not found|página no encontrada)/i,
      /^\s*(advertisement|anuncio|publicidad|sponsored|patrocinado|banner)/i,
      /^\s*(click here|hacer clic|ver más|read more|leer más|continue reading)/i,
      /^\s*(share|compartir|print|imprimir|save|guardar|bookmark)/i,
      /^\s*(ingredientes?|instructions?|preparación|método|steps?|pasos?)\s*$/i, // Solo palabras genéricas EXACTAS
    ];

    for (const pattern of invalidPatterns) {
      if (pattern.test(title)) {
        console.log(`❌ Título inválido por patrón: "${title}" (patrón: ${pattern.source})`);
        return false;
      }
    }

    // NUEVA VALIDACIÓN: Si el título tiene más de 8 caracteres, es más permisivo
    if (title.length >= 8) {
      // Para títulos largos, solo verificar que no sea spam obvio
      const spamPatterns = [
        /^\s*(.*?)\s*\1\s*\1/, // Texto repetido 3 veces
        /[A-Z]{10,}/, // Más de 10 mayúsculas seguidas
        /\d{4,}/, // Más de 4 números seguidos (probablemente fecha o código)
        /[!@#$%^&*()]{3,}/, // Más de 3 símbolos seguidos
      ];

      for (const pattern of spamPatterns) {
        if (pattern.test(title)) {
          console.log(`❌ Título parece spam: "${title}" (patrón: ${pattern.source})`);
          return false;
        }
      }

      console.log(`✅ Título largo válido: "${title}"`);
      return true; // Títulos largos son generalmente válidos
    }

    // Para títulos cortos, verificar palabras clave de comida - KEYWORDS EXPANDIDOS
    const foodKeywords = /\b(pollo|chicken|carne|meat|beef|res|cerdo|pork|pescado|fish|salmon|salmón|atún|tuna|pasta|espagueti|spaghetti|arroz|rice|sopa|soup|ensalada|salad|postre|dessert|pan|bread|queso|cheese|huevo|egg|verdura|vegetable|fruta|fruit|cocina|kitchen|receta|recipe|plato|dish|comida|food|preparar|prepare|cocinar|cook|hornear|bake|freír|fry|asar|grill|guisar|stew|ingredientes|ingredients|salsa|sauce|crema|cream|leche|milk|aceite|oil|ajo|garlic|cebolla|onion|tomate|tomato|papa|potato|zanahoria|carrot|apio|celery|perejil|parsley|cilantro|orégano|oregano|sal|salt|pimienta|pepper|azúcar|sugar|harina|flour|mantequilla|butter|vinagre|vinegar|limón|lemon|naranja|orange|manzana|apple|banana|fresa|strawberry|chocolate|vainilla|vanilla|canela|cinnamon|miel|honey|yogurt|jamón|ham|tocino|bacon|camarón|shrimp|langosta|lobster|mejillones|mussels|almeja|clam|caldo|broth|consomé|bisque|gazpacho|minestrone|risotto|paella|lasaña|lasagna|ravioli|pizza|hamburguesa|burger|sandwich|taco|burrito|quesadilla|empanada|arepa|tamal|tamale|ceviche|sushi|tempura|curry|ramen|pho|bibimbap|kimchi|hummus|falafel|kebab|moussaka|ratatouille|wellington|casserole|stir|marinade|marinar|gratinar|flambé|braise|blanch|poach|steam|roast|barbacoa|barbecue|bbq|plancha|grill|horno|oven|estufa|stove|microondas|microwave|tradicional|traditional|casera|homemade|fácil|easy|rápida|quick|especial|special|gourmet|clásica|classic|italiana|italian|mexicana|mexican|china|chinese|japonesa|japanese|francesa|french|española|spanish|mediterránea|mediterranean|asiática|asian|vegetariana|vegetarian|vegana|vegan|saludable|healthy|light|diet|sin gluten|gluten-free|orgánica|organic|picante|spicy|dulce|sweet|salado|salty|agrio|sour|amargo|bitter|crujiente|crispy|suave|soft|cremosa|creamy|jugoso|juicy|tierno|tender|almuerzo|lunch|cena|dinner|desayuno|breakfast|merienda|snack|aperitivo|appetizer|entrante|entrada|principal|main|course|plato principal|lado|side|guarnición|acompañamiento|bebida|drink|jugo|juice|batido|smoothie|té|tea|café|coffee|agua|water|vino|wine|cerveza|beer|cocktail|martini|mojito|sangría|horchata|atole|champurrado|pozole|menudo|mole|enchilada|tostada|gordita|sope|huarache|tlayuda|elote|esquite|chilaquiles|migas|machaca|chorizo|carnitas|barbacoa|birria|cochinita|tamales|chiles|rellenos|flautas|taquitos|nachos|frijoles|beans|lentejas|lentils|garbanzos|chickpeas|quinoa|avena|oats|granola|cereal|yogur|leche|milk|mantequilla|butter|margarina|margarine|aceite|oil|vinagre|vinegar|mostaza|mustard|ketchup|mayonesa|mayonnaise|salsa|sauce|aderezo|dressing|especias|spices|hierbas|herbs|condimentos|seasonings|aderezos|condiments)\b/i;

    // NUEVA VALIDACIÓN: También aceptar títulos que contengan palabras comunes de cocina sin ser específicos
    const cookingWords = /\b(con|de|en|a la|al|para|casero|casera|rico|rica|delicioso|deliciosa|sabroso|sabrosa|nutritivo|nutritiva|caliente|frío|fría|fresco|fresca)\b/i;

    const hasKeyword = foodKeywords.test(title);
    const hasCookingWords = cookingWords.test(title);

    if (!hasKeyword && !hasCookingWords) {
      console.log(`❌ Título sin palabras clave de comida: "${title}"`);
      return false;
    } else {
      console.log(`✅ Título válido: "${title}"`);
      return true;
    }
  }

  /**
   * Genera una descripción basada en el título de la receta
   */
  generateDescriptionFromTitle(title) {
    const titleLower = title.toLowerCase();

    if (/postre|torta|pastel|helado/i.test(titleLower)) {
      return `Delicioso postre ${title.toLowerCase()} perfecto para cualquier ocasión especial.`;
    }
    if (/sopa|caldo|crema/i.test(titleLower)) {
      return `Reconfortante ${title.toLowerCase()} ideal para días fríos o cuando necesitas algo nutritivo.`;
    }
    if (/ensalada/i.test(titleLower)) {
      return `Fresca y saludable ${title.toLowerCase()} llena de sabor y nutrientes.`;
    }
    if (/pasta|espagueti|lasaña/i.test(titleLower)) {
      return `Sabrosa ${title.toLowerCase()} que te transportará directamente a Italia.`;
    }
    if (/pollo|chicken/i.test(titleLower)) {
      return `Jugoso ${title.toLowerCase()} preparado con ingredientes frescos y mucho sabor.`;
    }
    if (/carne|beef|res/i.test(titleLower)) {
      return `Exquisita ${title.toLowerCase()} cocinada a la perfección para una experiencia gastronómica única.`;
    }
    if (/pescado|fish|salmón|atún/i.test(titleLower)) {
      return `Fresco ${title.toLowerCase()} rico en omega-3 y sabor del mar.`;
    }
    if (/arroz|rice|paella/i.test(titleLower)) {
      return `Aromático ${title.toLowerCase()} que combina perfectamente sabor y tradición.`;
    }
    if (/bebida|smoothie|jugo/i.test(titleLower)) {
      return `Refrescante ${title.toLowerCase()} perfecto para hidratarte y disfrutar.`;
    }

    return `Deliciosa receta de ${title.toLowerCase()} preparada con ingredientes frescos y técnicas tradicionales.`;
  }

  /**
   * Elimina recetas duplicadas
   */
  removeDuplicateRecipes(recipes) {
    const seen = new Set();
    return recipes.filter(recipe => {
      const key = recipe.title.toLowerCase().trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Extrae una receta específica por ID
   */
  async extractSpecificRecipe(recipeId, sourceUrl) {
    try {
      // Aquí podrías implementar la extracción completa de una receta específica
      // Por ahora retornamos una receta simulada
      return {
        id: recipeId,
        title: 'Receta Extraída',
        description: 'Receta importada desde la web',
        ingredients: [
          { name: 'Ingrediente 1', quantity: '1', unit: 'taza' },
          { name: 'Ingrediente 2', quantity: '2', unit: 'cucharadas' }
        ],
        instructions: [
          'Paso 1: Preparar los ingredientes',
          'Paso 2: Cocinar según las instrucciones'
        ],
        servings: 4,
        cookingTime: 30,
        difficulty: 'medium',
        sourceUrl: sourceUrl,
        isExtracted: true,
      };
    } catch (error) {
      console.error('Error extracting specific recipe:', error);
      throw error;
    }
  }

  /**
   * Intenta extracción con APIs gratuitas
   */
  async tryFreeExtraction(url) {
    try {
      console.log('Intentando extracción con Mercury API...');
      
      // Usamos la API de Mercury (gratuita para uso básico)
      const response = await fetch(`${EXTRACTION_APIS.MERCURY}?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        console.log(`Mercury API falló con status: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (data && data.content) {
        console.log('Extracción exitosa con Mercury API');
        return {
          title: data.title || 'Receta Extraída',
          content: data.content,
          author: data.author,
          datePublished: data.date_published,
          leadImageUrl: data.lead_image_url,
        };
      } else {
        console.log('Mercury API no retornó contenido válido');
        return null;
      }
    } catch (error) {
      console.log('Error en Mercury API:', error.message);
      return null;
    }
  }

  /**
   * Intenta extracción con APIs específicas de recetas
   */
  async tryRecipeSpecificExtraction(url) {
    try {
      console.log('Intentando extracción específica de recetas...');
      
      // Aquí podrías integrar con Spoonacular u otras APIs de recetas
      // Por ahora retornamos null para usar la extracción gratuita
      return null;
    } catch (error) {
      console.log('Error en extracción específica:', error.message);
      return null;
    }
  }

  /**
   * Fallback: Extracción básica usando solo el título de la página
   */
  async tryBasicExtraction(url) {
    try {
      console.log('Intentando extracción básica...');
      
      // Hacemos una petición simple para obtener el título
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000 // 10 segundos de timeout
      });
      
      if (!response.ok) {
        console.log(`Respuesta HTTP no exitosa: ${response.status}`);
        return null;
      }
      
      const html = await response.text();
      
      if (!html || html.length < 100) {
        console.log('Contenido HTML muy corto o vacío');
        return null;
      }
      
      // Extraemos el título de la página
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'Receta de la Web';
      
      // Limpiamos el título de caracteres especiales
      const cleanTitle = title
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
      
      console.log('Extracción básica exitosa:', cleanTitle);
      
      // Creamos una receta básica con información mínima
      return {
        title: cleanTitle,
        content: html, // Incluimos HTML para análisis posterior
        author: null,
        datePublished: null,
        leadImageUrl: null,
      };
    } catch (error) {
      console.log('Error en extracción básica:', error.message);
      
      // Si falla completamente, creamos una receta mínima
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        const path = urlObj.pathname;
        
        return {
          title: `Receta de ${domain}`,
          content: `<html><title>Receta de ${domain}</title><body>Receta disponible en ${path}</body></html>`,
          author: null,
          datePublished: null,
          leadImageUrl: null,
        };
      } catch (fallbackError) {
        console.log('Fallback también falló:', fallbackError.message);
        return null;
      }
    }
  }

  /**
   * Limpia y estructura los datos extraídos
   */
  cleanAndStructureRecipe(rawData, sourceUrl) {
    const content = rawData.content || '';
    
    // Si no hay contenido HTML, creamos una receta básica
    if (!content || content.trim() === '') {
      return {
        title: rawData.title || 'Receta Extraída',
        description: 'Receta importada desde la web. Los detalles completos están disponibles en la página original.',
        ingredients: [
          { name: 'Ingredientes disponibles en la página original', quantity: '1', unit: 'receta' }
        ],
        instructions: [
          'Consulta la página original para ver los ingredientes e instrucciones completos.'
        ],
        servings: 4,
        cookingTime: 30,
        difficulty: 'medium',
        nutritionInfo: {},
        sourceUrl: sourceUrl,
        author: rawData.author,
        datePublished: rawData.datePublished,
        imageUrl: rawData.leadImageUrl,
        isExtracted: true,
        isBasicExtraction: true, // Marcamos que es extracción básica
      };
    }
    
    // Extraemos ingredientes usando patrones comunes
    const ingredients = this.extractIngredients(content);
    
    // Extraemos instrucciones
    const instructions = this.extractInstructions(content);
    
    // Extraemos información nutricional básica
    const nutritionInfo = this.extractNutritionInfo(content);
    
    // Estimamos tiempo de cocción basado en el contenido
    const cookingTime = this.estimateCookingTime(content);
    
    // Estimamos dificultad
    const difficulty = this.estimateDifficulty(content, ingredients.length, instructions.length);
    
    // Estimamos porciones
    const servings = this.estimateServings(content, ingredients);

    return {
      title: rawData.title || 'Receta Extraída',
      description: this.generateDescription(content),
      ingredients: ingredients,
      instructions: instructions,
      servings: servings,
      cookingTime: cookingTime,
      difficulty: difficulty,
      nutritionInfo: nutritionInfo,
      sourceUrl: sourceUrl,
      author: rawData.author,
      datePublished: rawData.datePublished,
      imageUrl: rawData.leadImageUrl,
      isExtracted: true,
      isBasicExtraction: false,
    };
  }

  /**
   * Extrae ingredientes del contenido HTML/texto
   */
  extractIngredients(content) {
    const ingredients = [];
    
    // Patrones comunes para ingredientes
    const patterns = [
      /<li[^>]*>([^<]*\d+[^<]*[a-zA-Z]+[^<]*)<\/li>/gi,
      /(\d+[\/\d\s]*\s*(?:taza|tazas|cucharada|cucharadas|cucharadita|cucharaditas|gramo|gramos|kilo|kilos|onza|onzas|libra|libras|ml|mililitros|l|litros|g|kg|oz|lb|tsp|tbsp|cup|cups|g|kg|ml|l|oz|lb)[^<]*)/gi,
      /([^<]*\d+[^<]*[a-zA-Z]+[^<]*)/gi,
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        matches.forEach(match => {
          const cleanMatch = match.replace(/<[^>]*>/g, '').trim();
          if (cleanMatch.length > 5 && cleanMatch.length < 100) {
            // Parseamos el ingrediente
            const parsed = this.parseIngredient(cleanMatch);
            if (parsed) {
              ingredients.push(parsed);
            }
          }
        });
        break; // Usamos el primer patrón que funcione
      }
    }

    // Si no encontramos ingredientes, creamos algunos genéricos
    if (ingredients.length === 0) {
      ingredients.push(
        { name: 'Ingredientes de la receta', quantity: '1', unit: 'porción' }
      );
    }

    return ingredients.slice(0, 15); // Limitamos a 15 ingredientes
  }

  /**
   * Extrae ingredientes básicos para preview (solo nombres principales)
   * @param {string} content - Contenido HTML de la página
   * @returns {Array} - Array de nombres de ingredientes básicos
   */
  extractBasicIngredients(content) {
    const fullIngredients = this.extractIngredients(content);

    // Extraer solo los nombres principales para el preview
    const basicIngredients = fullIngredients
      .slice(0, 6) // Solo los primeros 6 ingredientes
      .map(ingredient => {
        if (typeof ingredient === 'object' && ingredient.name) {
          return ingredient.name;
        }
        return ingredient || '';
      })
      .filter(name => name.length > 0);

    // Si no tenemos ingredientes, intentar extracción simple
    if (basicIngredients.length === 0) {
      const simpleIngredients = this.extractSimpleIngredients(content);
      return simpleIngredients.slice(0, 6);
    }

    return basicIngredients;
  }

  /**
   * Extracción simple de ingredientes usando patrones básicos
   * @param {string} content - Contenido HTML
   * @returns {Array} - Array de nombres de ingredientes
   */
  extractSimpleIngredients(content) {
    const ingredients = [];

    // Patrones para ingredientes comunes
    const commonIngredients = [
      'pollo', 'carne', 'pescado', 'arroz', 'pasta', 'tomate', 'cebolla',
      'ajo', 'aceite', 'sal', 'pimienta', 'queso', 'huevo', 'leche',
      'harina', 'azúcar', 'mantequilla', 'papa', 'zanahoria', 'apio'
    ];

    const lowerContent = content.toLowerCase();

    commonIngredients.forEach(ingredient => {
      if (lowerContent.includes(ingredient)) {
        ingredients.push(ingredient);
      }
    });

    return ingredients.slice(0, 6);
  }

  /**
   * Parsea un ingrediente en cantidad, unidad y nombre
   */
  parseIngredient(ingredientText) {
    // Patrones para extraer cantidad, unidad y nombre
    const quantityPattern = /^(\d+[\/\d\s]*)/;
    const unitPattern = /(taza|tazas|cucharada|cucharadas|cucharadita|cucharaditas|gramo|gramos|kilo|kilos|onza|onzas|libra|libras|ml|mililitros|l|litros|g|kg|oz|lb|tsp|tbsp|cup|cups|g|kg|ml|l|oz|lb)/i;
    
    const quantityMatch = ingredientText.match(quantityPattern);
    const unitMatch = ingredientText.match(unitPattern);
    
    let quantity = '1';
    let unit = '';
    let name = ingredientText;
    
    if (quantityMatch) {
      quantity = quantityMatch[1].trim();
      name = ingredientText.substring(quantityMatch[0].length).trim();
    }
    
    if (unitMatch) {
      unit = unitMatch[1];
      name = name.replace(unitMatch[0], '').trim();
    }
    
    // Limpiamos el nombre
    name = name.replace(/^[,\-\s]+/, '').replace(/[,\-\s]+$/, '');
    
    if (name.length < 2) return null;
    
    return { name, quantity, unit };
  }

  /**
   * Extrae instrucciones del contenido
   */
  extractInstructions(content) {
    const instructions = [];
    
    // Patrones para instrucciones
    const patterns = [
      /<li[^>]*>([^<]*Paso[^<]*[^<]*)<\/li>/gi,
      /<li[^>]*>([^<]*\d+[^<]*[^<]*)<\/li>/gi,
      /<p[^>]*>([^<]*[^<]*)<\/p>/gi,
    ];

    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        matches.forEach(match => {
          const cleanMatch = match.replace(/<[^>]*>/g, '').trim();
          if (cleanMatch.length > 10 && cleanMatch.length < 500) {
            // Filtramos contenido que no parece ser instrucción
            if (!this.isLikelyNotInstruction(cleanMatch)) {
              instructions.push(cleanMatch);
            }
          }
        });
        break;
      }
    }

    // Si no encontramos instrucciones, creamos una genérica
    if (instructions.length === 0) {
      instructions.push('Sigue las instrucciones de la receta original');
    }

    return instructions.slice(0, 20); // Limitamos a 20 pasos
  }

  /**
   * Determina si un texto no es una instrucción
   */
  isLikelyNotInstruction(text) {
    const notInstructionPatterns = [
      /^ingredientes?/i,
      /^preparación/i,
      /^tiempo/i,
      /^dificultad/i,
      /^porciones/i,
      /^calorías/i,
      /^nutrición/i,
    ];
    
    return notInstructionPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Extrae información nutricional básica
   */
  extractNutritionInfo(content) {
    const nutrition = {};
    
    // Patrones para información nutricional
    const patterns = {
      calories: /(\d+)\s*(?:calorías?|cal)/i,
      protein: /(\d+)\s*(?:g|gramos?)\s*(?:de\s+)?proteína/i,
      carbs: /(\d+)\s*(?:g|gramos?)\s*(?:de\s+)?carbohidratos/i,
      fat: /(\d+)\s*(?:g|gramos?)\s*(?:de\s+)?grasa/i,
      fiber: /(\d+)\s*(?:g|gramos?)\s*(?:de\s+)?fibra/i,
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = content.match(pattern);
      if (match) {
        nutrition[key] = parseInt(match[1]);
      }
    });

    return nutrition;
  }

  /**
   * Estima el tiempo de cocción
   */
  estimateCookingTime(content) {
    const timePatterns = [
      /(\d+)\s*(?:minutos?|min)/i,
      /(\d+)\s*(?:horas?|hr|h)/i,
      /tiempo.*?(\d+)/i,
    ];

    for (const pattern of timePatterns) {
      const match = content.match(pattern);
      if (match) {
        const time = parseInt(match[1]);
        if (pattern.source.includes('hora')) {
          return time * 60; // Convertimos a minutos
        }
        return time;
      }
    }

    // Estimación basada en el contenido
    const hasOven = /horno|hornear|asar/i.test(content);
    const hasStovetop = /estufa|fuego|cocinar|hervir|freír/i.test(content);
    
    if (hasOven) return 45;
    if (hasStovetop) return 25;
    return 30; // Tiempo por defecto
  }

  /**
   * Estima la dificultad
   */
  estimateDifficulty(content, ingredientsCount, instructionsCount) {
    let score = 0;
    
    // Más ingredientes = más difícil
    if (ingredientsCount > 10) score += 2;
    else if (ingredientsCount > 5) score += 1;
    
    // Más pasos = más difícil
    if (instructionsCount > 10) score += 2;
    else if (instructionsCount > 5) score += 1;
    
    // Técnicas avanzadas
    if (/marinar|fermentar|sous\s*vide|temperar/i.test(content)) score += 2;
    if (/horno|asar|gratinar/i.test(content)) score += 1;
    
    if (score >= 4) return 'hard';
    if (score >= 2) return 'medium';
    return 'easy';
  }

  /**
   * Estima las porciones
   */
  estimateServings(content, ingredients) {
    // Buscamos patrones de porciones
    const servingPatterns = [
      /(\d+)\s*(?:porciones?|servings?|personas?)/i,
      /para\s*(\d+)/i,
      /rinde\s*(\d+)/i,
    ];

    for (const pattern of servingPatterns) {
      const match = content.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    // Estimación basada en ingredientes
    const totalQuantity = ingredients.reduce((sum, ing) => {
      const qty = parseFloat(ing.quantity) || 1;
      return sum + qty;
    }, 0);

    if (totalQuantity > 20) return 8;
    if (totalQuantity > 15) return 6;
    if (totalQuantity > 10) return 4;
    return 2;
  }

  /**
   * Genera una descripción basada en el contenido
   */
  generateDescription(content) {
    // Buscamos la primera oración significativa
    const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 20);
    
    if (sentences.length > 0) {
      return sentences[0].trim().substring(0, 150) + '...';
    }
    
    return 'Receta importada desde la web con ingredientes e instrucciones detalladas.';
  }

  /**
   * Configura la API key para servicios premium
   */
  setApiKey(key) {
    this.apiKey = key;
  }
}

export default new RecipeExtractionService();
