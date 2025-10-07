/**
 * Servicio de validación de recetas contra preferencias del usuario
 * Actúa como segundo filtro de seguridad después de la adaptación de IA
 */

import communicationService from './communicationService';

class RecipeValidationService {
  constructor() {
    // Mapeo de ingredientes problemáticos comunes
    this.allergenMap = {
      // Lácteos
      lacteos: ['leche', 'queso', 'mantequilla', 'yogurt', 'crema', 'nata', 'suero', 'caseína', 'lactosa'],

      // Gluten
      gluten: ['harina de trigo', 'trigo', 'cebada', 'centeno', 'avena', 'pan', 'pasta', 'sémola'],

      // Frutos secos
      'frutos secos': ['almendras', 'nueces', 'avellanas', 'pistachos', 'cacahuetes', 'maní', 'pecanas'],

      // Mariscos
      mariscos: ['camarón', 'langosta', 'cangrejo', 'mejillones', 'ostras', 'almejas', 'pulpo', 'calamar'],

      // Huevos
      huevos: ['huevo', 'clara', 'yema', 'mayonesa'],

      // Soja
      soja: ['soja', 'tofu', 'tempeh', 'salsa de soja', 'miso', 'edamame'],

      // Pescado
      pescado: ['salmón', 'atún', 'bacalao', 'sardinas', 'anchoas', 'merluza', 'trucha'],

      // Azúcar (para diabéticos)
      azucar: ['azúcar', 'miel', 'jarabe', 'fructosa', 'glucosa', 'sacarosa', 'dulce']
    };

    // Mapeo de restricciones dietéticas
    this.dietaryMap = {
      vegetariano: ['carne', 'pollo', 'pescado', 'mariscos', 'jamón', 'chorizo', 'bacon'],
      vegano: ['carne', 'pollo', 'pescado', 'mariscos', 'leche', 'huevo', 'queso', 'mantequilla', 'miel'],
      kosher: ['cerdo', 'jamón', 'tocino', 'mariscos', 'pulpo', 'calamar'],
      halal: ['cerdo', 'jamón', 'tocino', 'alcohol', 'vino', 'cerveza']
    };

    // Mapeo de condiciones médicas
    this.medicalMap = {
      diabetes: ['azúcar', 'miel', 'jarabe', 'dulces', 'postres', 'refrescos'],
      hipertension: ['sal', 'sodio', 'embutidos', 'conservas', 'encurtidos'],
      'enfermedad renal': ['sal', 'potasio', 'plátano', 'naranja', 'tomate'],
      'colesterol alto': ['mantequilla', 'yema', 'vísceras', 'embutidos', 'frituras']
    };
  }

  /**
   * Validar una receta adaptada contra las preferencias del usuario
   */
  async validateRecipe(adaptedRecipe, userPreferences) {
    try {
      console.log('🔍 Validando receta adaptada contra preferencias del usuario...');

      const conflicts = [];
      const warnings = [];

      // Extraer ingredientes de la receta
      const ingredients = this.extractIngredients(adaptedRecipe);
      console.log('📋 Ingredientes extraídos:', ingredients);

      // Validar contra alergias
      if (userPreferences.allergies && userPreferences.allergies.length > 0) {
        const allergyConflicts = this.checkAllergies(ingredients, userPreferences.allergies);
        conflicts.push(...allergyConflicts);
      }

      // Validar contra intolerancias
      if (userPreferences.intolerances && userPreferences.intolerances.length > 0) {
        const intoleranceConflicts = this.checkIntolerances(ingredients, userPreferences.intolerances);
        conflicts.push(...intoleranceConflicts);
      }

      // Validar contra restricciones dietéticas
      if (userPreferences.dietaryRestrictions && userPreferences.dietaryRestrictions.length > 0) {
        const dietaryConflicts = this.checkDietaryRestrictions(ingredients, userPreferences.dietaryRestrictions);
        conflicts.push(...dietaryConflicts);
      }

      // Validar contra condiciones médicas
      if (userPreferences.medicalConditions && userPreferences.medicalConditions.length > 0) {
        const medicalConflicts = this.checkMedicalConditions(ingredients, userPreferences.medicalConditions);
        warnings.push(...medicalConflicts);
      }

      const validationResult = {
        isValid: conflicts.length === 0,
        hasCriticalIssues: conflicts.length > 0,
        hasWarnings: warnings.length > 0,
        conflicts,
        warnings,
        recipe: adaptedRecipe,
        validatedAt: new Date().toISOString()
      };

      // Si hay conflictos críticos, enviar notificación
      if (conflicts.length > 0) {
        await this.sendValidationAlert(adaptedRecipe, conflicts, 'critical');
      }

      // Si hay advertencias, enviar notificación menos urgente
      if (warnings.length > 0 && conflicts.length === 0) {
        await this.sendValidationAlert(adaptedRecipe, warnings, 'warning');
      }

      console.log('✅ Validación completada:', validationResult);
      return validationResult;

    } catch (error) {
      console.error('❌ Error validando receta:', error);
      return {
        isValid: true, // En caso de error, no bloquear la receta
        hasCriticalIssues: false,
        hasWarnings: false,
        conflicts: [],
        warnings: [],
        error: error.message,
        recipe: adaptedRecipe
      };
    }
  }

  /**
   * Extraer lista de ingredientes de la receta
   */
  extractIngredients(recipe) {
    const ingredients = [];

    if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
      recipe.ingredients.forEach(ingredient => {
        if (typeof ingredient === 'string') {
          ingredients.push(ingredient.toLowerCase());
        } else if (ingredient.name) {
          ingredients.push(ingredient.name.toLowerCase());
        }
      });
    }

    return ingredients;
  }

  /**
   * Verificar conflictos con alergias
   */
  checkAllergies(ingredients, allergies) {
    const conflicts = [];

    allergies.forEach(allergy => {
      const allergyLower = allergy.toLowerCase();
      const problematicIngredients = this.allergenMap[allergyLower] || [allergyLower];

      ingredients.forEach(ingredient => {
        problematicIngredients.forEach(problematic => {
          if (ingredient.includes(problematic)) {
            conflicts.push({
              type: 'allergy',
              severity: 'critical',
              restriction: allergy,
              ingredient: ingredient,
              reason: `Contiene ${problematic} - alérgico a ${allergy}`
            });
          }
        });
      });
    });

    return conflicts;
  }

  /**
   * Verificar conflictos con intolerancias
   */
  checkIntolerances(ingredients, intolerances) {
    const conflicts = [];

    intolerances.forEach(intolerance => {
      const intoleranceLower = intolerance.toLowerCase();
      const problematicIngredients = this.allergenMap[intoleranceLower] || [intoleranceLower];

      ingredients.forEach(ingredient => {
        problematicIngredients.forEach(problematic => {
          if (ingredient.includes(problematic)) {
            conflicts.push({
              type: 'intolerance',
              severity: 'critical',
              restriction: intolerance,
              ingredient: ingredient,
              reason: `Contiene ${problematic} - intolerante a ${intolerance}`
            });
          }
        });
      });
    });

    return conflicts;
  }

  /**
   * Verificar conflictos con restricciones dietéticas
   */
  checkDietaryRestrictions(ingredients, restrictions) {
    const conflicts = [];

    restrictions.forEach(restriction => {
      const restrictionLower = restriction.toLowerCase();
      const forbiddenIngredients = this.dietaryMap[restrictionLower] || [];

      ingredients.forEach(ingredient => {
        forbiddenIngredients.forEach(forbidden => {
          if (ingredient.includes(forbidden)) {
            conflicts.push({
              type: 'dietary',
              severity: 'critical',
              restriction: restriction,
              ingredient: ingredient,
              reason: `Contiene ${forbidden} - incompatible con dieta ${restriction}`
            });
          }
        });
      });
    });

    return conflicts;
  }

  /**
   * Verificar conflictos con condiciones médicas
   */
  checkMedicalConditions(ingredients, conditions) {
    const warnings = [];

    conditions.forEach(condition => {
      const conditionLower = condition.toLowerCase();
      const problematicIngredients = this.medicalMap[conditionLower] || [];

      ingredients.forEach(ingredient => {
        problematicIngredients.forEach(problematic => {
          if (ingredient.includes(problematic)) {
            warnings.push({
              type: 'medical',
              severity: 'warning',
              condition: condition,
              ingredient: ingredient,
              reason: `Contiene ${problematic} - considerar para ${condition}`
            });
          }
        });
      });
    });

    return warnings;
  }

  /**
   * Enviar alerta de validación
   */
  async sendValidationAlert(recipe, issues, severity) {
    try {
      const title = severity === 'critical'
        ? '🚨 Problema de Seguridad en Receta'
        : '⚠️ Advertencia en Receta Adaptada';

      const issueText = issues.map(issue => `• ${issue.reason}`).join('\n');

      const body = `La receta "${recipe.title}" tiene posibles problemas:\n\n${issueText}`;

      await communicationService.sendNotification(title, body, {
        type: 'recipe_validation',
        severity,
        recipeId: recipe.id,
        issueCount: issues.length
      });

      console.log(`📱 Notificación de validación enviada: ${severity}`);
    } catch (error) {
      console.error('❌ Error enviando notificación de validación:', error);
    }
  }

  /**
   * Generar recomendaciones de re-adaptación
   */
  generateReAdaptationSuggestions(conflicts) {
    const suggestions = [];

    conflicts.forEach(conflict => {
      if (conflict.type === 'allergy' || conflict.type === 'intolerance') {
        suggestions.push(`Eliminar o sustituir ${conflict.ingredient}`);
      } else if (conflict.type === 'dietary') {
        suggestions.push(`Encontrar alternativa vegetal para ${conflict.ingredient}`);
      }
    });

    return suggestions;
  }

  /**
   * Verificar si las notificaciones de validación están habilitadas
   */
  async isValidationNotificationEnabled() {
    try {
      // Por ahora retornamos true - se puede conectar con AsyncStorage o SecureStore
      // para verificar las preferencias de notificación del usuario
      return true;
    } catch (error) {
      console.error('Error verificando preferencias de notificación:', error);
      return true; // Default a habilitado por seguridad
    }
  }
}

export default new RecipeValidationService();