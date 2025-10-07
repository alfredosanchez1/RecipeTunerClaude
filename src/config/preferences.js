// Configuración de opciones para preferencias dietéticas

export const COOKING_TIME_OPTIONS = [
  'Rápido (15-30 min)',
  'Medio (30-60 min)',
  'Largo (60+ min)'
];

export const DIETARY_RESTRICTION_OPTIONS = [
  'Vegetariano',
  'Vegano',
  'Sin Gluten',
  'Sin Lactosa',
  'Bajo en Carbohidratos',
  'Bajo en Grasas',
  'Bajo en Sodio',
  'Alto en Proteínas',
  'Keto',
  'Paleo',
  'Mediterráneo',
  'Sin Azúcar',
  'Sin FODMAPs'
];

export const DIET_TYPE_OPTIONS = [
  'Dieta Mediterránea',
  'Dieta DASH',
  'Dieta Plant-Based/Whole Food Plant-Based',
  'Dieta Cetogénica'
];

export const ALLERGY_OPTIONS = [
  'Lácteos',
  'Huevos',
  'Pescado',
  'Mariscos',
  'Frutos Secos',
  'Cacahuetes',
  'Trigo',
  'Soja',
  'Sésamo',
  'Mostaza',
  'Apio',
  'Sulfitos',
  'Lupino',
  'Moluscos'
];

export const INTOLERANCE_OPTIONS = [
  'Lactosa',
  'Gluten',
  'Fructosa',
  'Histamina',
  'FODMAPs',
  'Salicilatos',
  'Oxalatos',
  'Lectinas'
];

export const DIFFICULTY_OPTIONS = [
  'Fácil',
  'Medio',
  'Difícil',
  'Experto'
];

export const SERVING_SIZE_OPTIONS = [
  1, 2, 3, 4, 5, 6, 8, 10, 12
];

export const MEASUREMENT_UNITS = [
  'g',
  'kg',
  'ml',
  'l',
  'taza',
  'cucharada',
  'cucharadita',
  'pizca',
  'unidad',
  'rodaja',
  'diente'
];

// Condiciones médicas organizadas por categoría
export const MEDICAL_CONDITIONS = {
  metabolic: {
    title: "Trastornos Metabólicos",
    icon: "🩸",
    conditions: [
      { id: "diabetes_type1", name: "Diabetes Tipo 1", priority: "high" },
      { id: "diabetes_type2", name: "Diabetes Tipo 2", priority: "high" },
      { id: "prediabetes", name: "Prediabetes", priority: "medium" },
      { id: "insulin_resistance", name: "Resistencia a la Insulina", priority: "medium" }
    ]
  },
  cardiovascular: {
    title: "Enfermedades Cardiovasculares",
    icon: "❤️",
    conditions: [
      { id: "hypertension", name: "Hipertensión", priority: "high" },
      { id: "high_cholesterol", name: "Colesterol Alto", priority: "high" },
      { id: "high_triglycerides", name: "Triglicéridos Altos", priority: "medium" },
      { id: "heart_disease", name: "Enfermedad Coronaria", priority: "high" }
    ]
  }
};

// Lista plana para fácil uso en UI
export const MEDICAL_CONDITIONS_LIST = [
  ...MEDICAL_CONDITIONS.metabolic.conditions,
  ...MEDICAL_CONDITIONS.cardiovascular.conditions
];

// Prompts específicos por condición médica para la IA
export const MEDICAL_CONDITION_PROMPTS = {
  hypertension: "Reduce sodio a menos de 1500mg por porción. Elimina sal agregada, embutidos, enlatados. Potencia sabor con hierbas y especias naturales.",

  diabetes_type2: "Mantén carbohidratos bajo 30g por porción. Usa edulcorantes naturales como stevia. Prioriza proteínas magras y grasas saludables. Índice glucémico bajo.",

  diabetes_type1: "Control estricto de carbohidratos para manejo de insulina. Indica claramente gramos de carbohidratos por porción. Evita azúcares simples.",

  prediabetes: "Prevención con dieta baja en azúcar y carbohidratos refinados. Incluye fibra y proteínas para estabilizar glucosa.",

  insulin_resistance: "Control de carbohidratos refinados y azúcares. Prioriza alimentos con bajo índice glucémico y alta fibra.",

  high_cholesterol: "Limita grasas saturadas a menos de 7% del total. Elimina grasas trans. Incluye fibra soluble y esteroles vegetales.",

  high_triglycerides: "Control de carbohidratos simples y azúcares. Reduce alcohol. Incluye omega-3 y grasas monoinsaturadas.",

  heart_disease: "Dieta antiinflamatoria. Reduce sodio, grasas saturadas y trans. Incluye antioxidantes y omega-3."
};

// Condiciones que requieren disclaimer médico
export const CONDITIONS_REQUIRING_DISCLAIMER = [
  'diabetes_type1',
  'heart_disease',
  'hypertension'
];
