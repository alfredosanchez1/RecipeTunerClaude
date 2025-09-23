// Tema global para RecipeTunnel Claude
// Colores optimizados para máxima legibilidad
import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Colores principales
    primary: '#2563EB',        // Azul más vibrante
    primaryContainer: '#3B82F6', // Azul claro
    onPrimary: '#FFFFFF',      // Texto sobre primary
    onPrimaryContainer: '#1D4ED8', // Texto sobre container

    // Colores secundarios
    secondary: '#10B981',      // Verde
    secondaryContainer: '#D1FAE5', // Verde muy claro
    onSecondary: '#FFFFFF',    // Texto sobre secondary
    onSecondaryContainer: '#065F46', // Texto sobre container

    // Colores terciarios
    tertiary: '#F59E0B',       // Naranja
    tertiaryContainer: '#FEF3C7', // Amarillo muy claro
    onTertiary: '#FFFFFF',     // Texto sobre tertiary
    onTertiaryContainer: '#92400E', // Texto sobre container

    // Estados
    error: '#DC2626',          // Rojo error
    errorContainer: '#FEE2E2', // Rojo muy claro
    onError: '#FFFFFF',        // Texto sobre error
    onErrorContainer: '#991B1B', // Texto sobre error container

    // Fondos
    background: '#FFFFFF',     // Blanco puro
    onBackground: '#1F2937',   // Texto sobre fondo
    surface: '#F8FAFC',        // Gris muy claro
    onSurface: '#1F2937',      // Texto sobre superficie
    surfaceVariant: '#F1F5F9', // Gris claro alternativo
    onSurfaceVariant: '#4B5563', // Texto sobre superficie variante

    // Elevaciones de superficie (requerido para Paper 5.x)
    elevation: {
      level0: '#FFFFFF',       // Sin elevación
      level1: '#F8FAFC',       // Elevación 1
      level2: '#F1F5F9',       // Elevación 2
      level3: '#E2E8F0',       // Elevación 3
      level4: '#CBD5E1',       // Elevación 4
      level5: '#94A3B8',       // Elevación 5
    },

    // Bordes
    outline: '#E5E7EB',        // Gris claro
    outlineVariant: '#F3F4F6', // Gris muy claro

    // Overlays
    shadow: '#000000',         // Negro para sombras
    scrim: '#000000',          // Negro para overlay

    // Colores específicos para la app (mantenemos compatibilidad)
    textSecondary: '#374151',  // Gris oscuro
    textTertiary: '#4B5563',  // Gris medio
    textMuted: '#6B7280',     // Gris medio-claro
    border: '#E5E7EB',        // Gris claro
    borderLight: '#F3F4F6',   // Gris muy claro
    recipeCard: '#FFFFFF',     // Blanco para tarjetas de recetas
    dietaryBadge: '#3B82F6',  // Azul para badges dietéticos
    adaptedBadge: '#10B981',  // Verde para recetas adaptadas
    cameraButton: '#10B981',  // Verde para botón de cámara
    galleryButton: '#6B7280', // Gris para botón de galería
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