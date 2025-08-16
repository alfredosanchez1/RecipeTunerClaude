// Tema global para RecipeTunnel Claude
// Colores optimizados para máxima legibilidad

export const theme = {
  colors: {
    // Colores principales
    primary: '#2563EB',        // Azul más vibrante
    primaryLight: '#3B82F6',   // Azul claro
    primaryDark: '#1D4ED8',    // Azul oscuro
    
    // Colores secundarios
    secondary: '#10B981',      // Verde
    accent: '#F59E0B',         // Naranja
    
    // Estados
    success: '#059669',        // Verde éxito
    warning: '#D97706',        // Naranja advertencia
    error: '#DC2626',          // Rojo error
    
    // Fondos
    background: '#FFFFFF',     // Blanco puro
    surface: '#F8FAFC',        // Gris muy claro
    card: '#FFFFFF',           // Blanco para tarjetas
    
    // Textos - COLORES ALTAMENTE LEGIBLES
    text: '#1F2937',          // Gris muy oscuro (casi negro)
    textSecondary: '#374151',  // Gris oscuro
    textTertiary: '#4B5563',  // Gris medio
    textMuted: '#6B7280',     // Gris medio-claro
    
    // Bordes
    border: '#E5E7EB',        // Gris claro
    borderLight: '#F3F4F6',   // Gris muy claro
    
    // Colores específicos para la app
    recipeCard: '#FFFFFF',     // Blanco para tarjetas de recetas
    dietaryBadge: '#3B82F6',  // Azul para badges dietéticos
    adaptedBadge: '#10B981',  // Verde para recetas adaptadas
    cameraButton: '#10B981',  // Verde para botón de cámara
    galleryButton: '#6B7280', // Gris para botón de galería
    
    // Colores de fondo alternativos
    backgroundAlt: '#F9FAFB', // Gris muy claro alternativo
    surfaceAlt: '#F1F5F9',    // Gris claro alternativo
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48
  },
  
  typography: {
    // Títulos principales
    heading1: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#1F2937',
      lineHeight: 40
    },
    heading2: {
      fontSize: 24,
      fontWeight: '600',
      color: '#1F2937',
      lineHeight: 32
    },
    heading3: {
      fontSize: 20,
      fontWeight: '600',
      color: '#1F2937',
      lineHeight: 28
    },
    
    // Texto del cuerpo
    body: {
      fontSize: 16,
      color: '#374151',
      lineHeight: 24
    },
    bodyLarge: {
      fontSize: 18,
      color: '#374151',
      lineHeight: 28
    },
    bodySmall: {
      fontSize: 14,
      color: '#4B5563',
      lineHeight: 20
    },
    
    // Texto secundario
    caption: {
      fontSize: 14,
      color: '#6B7280',
      lineHeight: 20
    },
    captionSmall: {
      fontSize: 12,
      color: '#6B7280',
      lineHeight: 16
    },
    
    // Texto de botones
    button: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
      lineHeight: 24
    },
    buttonSmall: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
      lineHeight: 20
    }
  },
  
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    full: 9999
  },
  
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8
    }
  }
};

// Colores específicos para componentes
export const componentColors = {
  // Colores para chips y badges
  chip: {
    primary: '#DBEAFE',       // Azul muy claro
    primaryText: '#1E40AF',   // Azul oscuro
    secondary: '#D1FAE5',     // Verde muy claro
    secondaryText: '#065F46', // Verde oscuro
    warning: '#FEF3C7',       // Amarillo muy claro
    warningText: '#92400E',   // Amarillo oscuro
    error: '#FEE2E2',         // Rojo muy claro
    errorText: '#991B1B',     // Rojo oscuro
  },
  
  // Colores para estados
  status: {
    active: '#10B981',        // Verde
    inactive: '#6B7280',      // Gris
    pending: '#F59E0B',       // Naranja
    error: '#DC2626',         // Rojo
  }
};

export default theme;