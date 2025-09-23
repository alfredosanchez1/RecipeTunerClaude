import { Platform, Alert, Linking } from 'react-native';
import * as Calendar from 'react-native-calendar-events';

class RemindersService {
  constructor() {
    this.isAvailable = Platform.OS === 'ios';
  }

  async requestPermissions() {
    if (!this.isAvailable) {
      Alert.alert(
        'No disponible',
        'Esta función solo está disponible en iOS.'
      );
      return false;
    }

    try {
      const status = await Calendar.requestPermissions();
      return status === 'authorized';
    } catch (error) {
      console.error('Error requesting calendar permissions:', error);
      Alert.alert(
        'Error de permisos',
        'No se pudieron obtener los permisos para acceder a Recordatorios.'
      );
      return false;
    }
  }

  async exportIngredientsToReminders(recipe) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      const listName = `🛒 Ingredientes: ${recipe.title}`;

      // Crear la lista de recordatorios
      const remindersList = await this.createRemindersList(listName);

      if (!remindersList) {
        this.showManualExportOption(recipe, 'ingredients');
        return false;
      }

      // Agregar cada ingrediente como recordatorio
      let addedCount = 0;
      for (const ingredient of recipe.ingredients) {
        const title = `${ingredient.amount || ''} ${ingredient.unit || ''} ${ingredient.name}`.trim();
        const notes = ingredient.notes || '';

        try {
          await Calendar.saveReminder(title, {
            calendarId: remindersList.id,
            notes: notes,
            completed: false,
          });
          addedCount++;
        } catch (error) {
          console.error('Error adding ingredient reminder:', error);
        }
      }

      Alert.alert(
        '✅ Éxito',
        `Se agregaron ${addedCount} ingredientes a Recordatorios.\n\nLista: "${listName}"`
      );

      return true;
    } catch (error) {
      console.error('Error exporting ingredients:', error);
      this.showManualExportOption(recipe, 'ingredients');
      return false;
    }
  }

  async exportInstructionsToReminders(recipe) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      const listName = `👨‍🍳 Pasos: ${recipe.title}`;

      // Crear la lista de recordatorios
      const remindersList = await this.createRemindersList(listName);

      if (!remindersList) {
        this.showManualExportOption(recipe, 'instructions');
        return false;
      }

      // Agregar cada paso como recordatorio
      let addedCount = 0;
      for (let i = 0; i < recipe.instructions.length; i++) {
        const step = recipe.instructions[i];
        const title = `Paso ${i + 1}: ${step.substring(0, 50)}${step.length > 50 ? '...' : ''}`;
        const notes = step;

        try {
          await Calendar.saveReminder(title, {
            calendarId: remindersList.id,
            notes: notes,
            completed: false,
          });
          addedCount++;
        } catch (error) {
          console.error('Error adding instruction reminder:', error);
        }
      }

      Alert.alert(
        '✅ Éxito',
        `Se agregaron ${addedCount} pasos de cocina a Recordatorios.\n\nLista: "${listName}"`
      );

      return true;
    } catch (error) {
      console.error('Error exporting instructions:', error);
      this.showManualExportOption(recipe, 'instructions');
      return false;
    }
  }

  async exportCompleteRecipeToReminders(recipe) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      // Exportar ingredientes
      const ingredientsSuccess = await this.exportIngredientsToReminders(recipe);

      // Pequeña pausa entre exportaciones
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Exportar instrucciones
      const instructionsSuccess = await this.exportInstructionsToReminders(recipe);

      if (ingredientsSuccess && instructionsSuccess) {
        Alert.alert(
          '🎉 Receta exportada',
          `La receta "${recipe.title}" se exportó completamente a Recordatorios.\n\n✅ Lista de ingredientes\n✅ Pasos de cocina`
        );
      }

      return ingredientsSuccess && instructionsSuccess;
    } catch (error) {
      console.error('Error exporting complete recipe:', error);
      this.showManualExportOption(recipe, 'complete');
      return false;
    }
  }

  async createRemindersList(listName) {
    try {
      // Intentar obtener las listas existentes
      const calendars = await Calendar.getCalendars();
      const reminderCalendars = calendars.filter(cal => cal.allowsModifications && cal.type === 'reminder');

      if (reminderCalendars.length === 0) {
        throw new Error('No reminder calendars available');
      }

      // Usar la primera lista de recordatorios disponible
      return reminderCalendars[0];
    } catch (error) {
      console.error('Error creating/getting reminders list:', error);
      return null;
    }
  }

  showManualExportOption(recipe, type) {
    let title = '';
    let message = '';
    let textToCopy = '';

    switch (type) {
      case 'ingredients':
        title = '📋 Copiar ingredientes';
        message = 'Se copiará la lista de ingredientes al portapapeles para que puedas pegarla manualmente en Recordatorios.';
        textToCopy = this.formatIngredientsForCopy(recipe);
        break;
      case 'instructions':
        title = '📋 Copiar instrucciones';
        message = 'Se copiarán las instrucciones al portapapeles para que puedas pegarlas manualmente en Recordatorios.';
        textToCopy = this.formatInstructionsForCopy(recipe);
        break;
      case 'complete':
        title = '📋 Copiar receta completa';
        message = 'Se copiará la receta completa al portapapeles para que puedas pegarla manualmente en Recordatorios.';
        textToCopy = this.formatCompleteRecipeForCopy(recipe);
        break;
    }

    Alert.alert(
      title,
      message,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Copiar',
          onPress: () => {
            // En lugar de copiar al portapapeles, abrir la app de Recordatorios
            this.openRemindersApp();
            Alert.alert(
              'Texto para copiar',
              textToCopy,
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  }

  formatIngredientsForCopy(recipe) {
    const ingredients = recipe.ingredients.map(ingredient => {
      const amount = ingredient.amount || '';
      const unit = ingredient.unit || '';
      const name = ingredient.name;
      return `• ${amount} ${unit} ${name}`.trim().replace(/\s+/g, ' ');
    });

    return `🛒 Ingredientes para: ${recipe.title}\n\n${ingredients.join('\n')}`;
  }

  formatInstructionsForCopy(recipe) {
    const instructions = recipe.instructions.map((instruction, index) => {
      return `${index + 1}. ${instruction}`;
    });

    return `👨‍🍳 Instrucciones para: ${recipe.title}\n\n${instructions.join('\n\n')}`;
  }

  formatCompleteRecipeForCopy(recipe) {
    const ingredients = this.formatIngredientsForCopy(recipe);
    const instructions = this.formatInstructionsForCopy(recipe);

    return `${ingredients}\n\n${instructions}`;
  }

  openRemindersApp() {
    // Intentar abrir la app de Recordatorios
    const reminderUrl = 'x-apple-reminder://';

    Linking.canOpenURL(reminderUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(reminderUrl);
        } else {
          // Fallback a configuración de recordatorios
          return Linking.openURL('App-Prefs:root=REMINDERS');
        }
      })
      .catch(err => {
        console.error('Error opening Reminders app:', err);
        Alert.alert(
          'Abrir Recordatorios',
          'Abre manualmente la app de Recordatorios de iOS para pegar la información.'
        );
      });
  }

  showExportOptions(recipe) {
    Alert.alert(
      '📱 Exportar a Recordatorios',
      `¿Qué quieres exportar de "${recipe.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: '🛒 Solo ingredientes',
          onPress: () => this.exportIngredientsToReminders(recipe)
        },
        {
          text: '👨‍🍳 Solo pasos',
          onPress: () => this.exportInstructionsToReminders(recipe)
        },
        {
          text: '📋 Todo',
          onPress: () => this.exportCompleteRecipeToReminders(recipe)
        }
      ]
    );
  }
}

export default new RemindersService();