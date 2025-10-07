import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const globalStyles = StyleSheet.create({
  // Contenedores principales
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Tarjetas
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.md,
    ...theme.shadows.small,
  },
  
  // Botones
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...theme.typography.button,
  },
  buttonTextSecondary: {
    ...theme.typography.button,
    color: theme.colors.primary,
  },
  
  // Inputs
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  
  // Textos
  text: {
    ...theme.typography.body,
  },
  textLarge: {
    ...theme.typography.bodyLarge,
  },
  textSmall: {
    ...theme.typography.bodySmall,
  },
  textMuted: {
    ...theme.typography.caption,
  },
  
  // Títulos
  title: {
    ...theme.typography.heading2,
  },
  titleLarge: {
    ...theme.typography.heading1,
  },
  titleSmall: {
    ...theme.typography.heading3,
  },
  
  // Espaciado
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    marginBottom: theme.spacing.md,
  },
  
  // Separadores
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  
  // Estados
  error: {
    color: theme.colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  success: {
    color: theme.colors.success,
    fontSize: 14,
    textAlign: 'center',
  },
  warning: {
    color: theme.colors.warning,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default globalStyles;
