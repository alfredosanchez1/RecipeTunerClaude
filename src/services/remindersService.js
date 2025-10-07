import { Platform, Alert, Linking, Share } from 'react-native';

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

    // Para simplificar, siempre retornamos true y manejamos los permisos en tiempo real
    return true;
  }

  async exportIngredientsToReminders(recipe) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      const listName = `🛒 Ingredientes: ${recipe.title}`;

      // Crear el texto de ingredientes con formato mejorado
      let ingredientsText = `${listName}\n`;
      ingredientsText += `${'='.repeat(listName.length)}\n\n`;

      recipe.ingredients.forEach((ingredient, index) => {
        const amount = ingredient.amount || ingredient.quantity || '';
        const unit = ingredient.unit || '';
        const name = ingredient.name || ingredient;
        ingredientsText += `☐ ${amount} ${unit} ${name}`.trim() + '\n';
      });

      ingredientsText += `\n💡 SUGERENCIA: Desplázate en la pantalla de compartir y elige el icono amarillo "Notas" (no Recordatorios).`;

      // Usar el sistema de compartir de iOS
      await Share.share({
        message: ingredientsText,
        title: `🛒 ${recipe.title} - Ingredientes`,
        url: undefined
      });

      return true;
    } catch (error) {
      console.error('Error sharing ingredients:', error);
      this.showManualExportOption(recipe, 'ingredients');
      return false;
    }
  }

  async exportInstructionsToReminders(recipe) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      const listName = `👨‍🍳 Pasos: ${recipe.title}`;

      // Crear el texto de pasos de cocina con formato mejorado
      let instructionsText = `${listName}\n`;
      instructionsText += `${'='.repeat(listName.length)}\n\n`;

      recipe.instructions.forEach((instruction, index) => {
        instructionsText += `${index + 1}. ${instruction}\n\n`;
      });

      instructionsText += `💡 SUGERENCIA: Desplázate en la pantalla de compartir y elige el icono amarillo "Notas" (no Recordatorios).`;

      // Usar el sistema de compartir de iOS
      await Share.share({
        message: instructionsText,
        title: `👨‍🍳 ${recipe.title} - Pasos`,
        url: undefined
      });

      return true;
    } catch (error) {
      console.error('Error sharing instructions:', error);
      this.showManualExportOption(recipe, 'instructions');
      return false;
    }
  }

  async exportCompleteRecipeToReminders(recipe) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      const recipeName = recipe.title;

      // Crear texto completo de la receta con mejor formato
      let completeText = `RECETA: ${recipeName.toUpperCase()}\n`;
      completeText += `${'='.repeat(recipeName.length + 8)}\n\n`;

      // Agregar ingredientes
      completeText += `🛒 LISTA DE COMPRAS:\n`;
      completeText += `${'-'.repeat(20)}\n`;
      recipe.ingredients.forEach((ingredient, index) => {
        const amount = ingredient.amount || ingredient.quantity || '';
        const unit = ingredient.unit || '';
        const name = ingredient.name || ingredient;
        completeText += `☐ ${amount} ${unit} ${name}`.trim() + '\n';
      });

      completeText += '\n👨‍🍳 PREPARACIÓN:\n';
      completeText += `${'-'.repeat(15)}\n`;
      recipe.instructions.forEach((instruction, index) => {
        completeText += `${index + 1}. ${instruction}\n\n`;
      });

      // Agregar sugerencia
      completeText += `\n💡 SUGERENCIA: Desplázate en la pantalla de compartir y elige el icono amarillo "Notas" (no Recordatorios).`;

      // Usar el sistema de compartir de iOS
      await Share.share({
        message: completeText,
        title: `🍳 ${recipeName}`,
        url: undefined
      });

      return true;
    } catch (error) {
      console.error('Error sharing complete recipe:', error);
      this.showManualExportOption(recipe, 'complete');
      return false;
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
      const amount = ingredient.amount || ingredient.quantity || '';
      const unit = ingredient.unit || '';
      const name = ingredient.name || ingredient;
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
      '📝 Opciones de exportación',
      `¿Qué quieres hacer con "${recipe.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: '📝 Compartir a Notas',
          onPress: () => this.showShareToNotesOptions(recipe)
        },
        {
          text: '📋 Copiar texto',
          onPress: () => this.showCopyTextOption(recipe)
        }
      ]
    );
  }

  showShareToNotesOptions(recipe) {
    Alert.alert(
      '📝 Compartir a Notas iPhone',
      `¿Qué quieres exportar de "${recipe.title}"?\n\n💡 IMPORTANTE: En la pantalla de compartir, desplázate y selecciona el icono amarillo de "Notas" para guardarla.`,
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
          text: '📋 Receta completa',
          onPress: () => this.exportCompleteRecipeToReminders(recipe)
        }
      ]
    );
  }

  showCopyTextOption(recipe) {
    Alert.alert(
      '📋 Copiar texto al portapapeles',
      `Elige qué copiar al portapapeles para pegarlo en correos, mensajes o cualquier otra app.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: '🛒 Ingredientes',
          onPress: () => this.copyTextToClipboard(recipe, 'ingredients')
        },
        {
          text: '👨‍🍳 Pasos',
          onPress: () => this.copyTextToClipboard(recipe, 'instructions')
        },
        {
          text: '📋 Todo',
          onPress: () => this.copyTextToClipboard(recipe, 'complete')
        }
      ]
    );
  }

  async copyTextToClipboard(recipe, type) {
    try {
      let textToCopy = '';
      let listName = '';

      switch (type) {
        case 'ingredients':
          listName = `${recipe.title} - Ingredientes`;
          textToCopy = this.formatIngredientsForCopy(recipe);
          break;
        case 'instructions':
          listName = `${recipe.title} - Pasos`;
          textToCopy = this.formatInstructionsForCopy(recipe);
          break;
        case 'complete':
          listName = recipe.title;
          textToCopy = this.formatCompleteRecipeForCopy(recipe);
          break;
      }

      // Usar Share con opción de copiar al portapapeles
      await Share.share({
        message: textToCopy,
        title: `📋 ${listName}`
      });

      // Mostrar confirmación
      Alert.alert(
        '✅ Texto listo para copiar',
        `El texto está preparado. En la pantalla anterior usa el botón "Copiar" para copiarlo al portapapeles.\n\nDespués podrás pegarlo en correos, mensajes, notas o cualquier otra app.`,
        [
          { text: 'Perfecto' }
        ]
      );

    } catch (error) {
      console.error('Error preparing text:', error);
      Alert.alert('Error', 'No se pudo preparar el texto');
    }
  }
}

export default new RemindersService();