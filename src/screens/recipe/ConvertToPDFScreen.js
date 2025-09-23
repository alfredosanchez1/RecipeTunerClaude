import React, { useState, Fragment } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Image,
  Modal,
  Pressable,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as WebBrowser from 'expo-web-browser';
import recipeExtractionService from '../../services/recipeExtractionService';

const ConvertToPDFScreen = () => {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recipePreview, setRecipePreview] = useState(null);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [pdfPreviewHtml, setPdfPreviewHtml] = useState(null);
  const navigation = useNavigation();

  const openPDFViewer = async (pdfUri) => {
    try {
      console.log('🔍 Abriendo PDF:', pdfUri);

      // Primera estrategia: intentar abrir directamente con Linking
      try {
        const canOpen = await Linking.canOpenURL(pdfUri);
        if (canOpen) {
          await Linking.openURL(pdfUri);
          console.log('✅ PDF abierto directamente con Linking');
          return;
        }
      } catch (linkError) {
        console.log('❌ No se pudo abrir con Linking:', linkError.message);
      }

      // Segunda estrategia: copiar a directorio público y usar sharing con opciones mejoradas
      const fileName = `RecipeTuner_Recipe_${Date.now()}.pdf`;
      const documentDirectory = FileSystem.documentDirectory;
      const newPdfPath = `${documentDirectory}${fileName}`;

      // Copiar PDF a directorio accesible
      await FileSystem.copyAsync({
        from: pdfUri,
        to: newPdfPath
      });

      console.log('📄 PDF copiado a:', newPdfPath);

      // Usar sharing con configuración optimizada para PDFs
      const shareResult = await Sharing.shareAsync(newPdfPath, {
        dialogTitle: '📱 Selecciona una app para abrir el PDF',
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
      });

      console.log('✅ PDF compartido:', shareResult);

      // Si sharing fue exitoso, mostrar mensaje informativo
      if (shareResult.action !== Sharing.dismissedAction) {
        Alert.alert(
          '📄 PDF Abierto',
          'Selecciona "Safari" para ver en tamaño completo o "Archivos" para guardar permanentemente.',
          [
            {
              text: 'Abrir otra vez',
              onPress: () => Sharing.shareAsync(newPdfPath, {
                mimeType: 'application/pdf',
                UTI: 'com.adobe.pdf',
              }),
              style: 'default'
            },
            { text: 'OK', style: 'cancel' }
          ]
        );
      }

    } catch (error) {
      console.error('❌ Error abriendo PDF:', error);

      // Fallback final: mostrar opciones al usuario
      Alert.alert(
        '📄 PDF Generado',
        'El PDF está listo. ¿Cómo te gustaría abrirlo?',
        [
          {
            text: '🌐 Abrir en navegador',
            onPress: async () => {
              try {
                // Convertir el archivo local a base64 para mostrarlo en WebBrowser
                const base64 = await FileSystem.readAsStringAsync(pdfUri, {
                  encoding: FileSystem.EncodingType.Base64,
                });
                const pdfDataUri = `data:application/pdf;base64,${base64}`;

                await WebBrowser.openBrowserAsync(pdfDataUri, {
                  presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                  controlsColor: '#007AFF',
                  toolbarColor: '#ffffff',
                });
              } catch (browserError) {
                console.error('Error abriendo en navegador:', browserError);
                // Fallback a sharing
                await Sharing.shareAsync(pdfUri, { mimeType: 'application/pdf' });
              }
            },
            style: 'default'
          },
          {
            text: '📱 Compartir/Abrir',
            onPress: async () => {
              try {
                await Sharing.shareAsync(pdfUri, {
                  mimeType: 'application/pdf',
                  UTI: 'com.adobe.pdf',
                });
              } catch (shareError) {
                console.error('Error compartiendo PDF:', shareError);
                Alert.alert('Error', 'No se pudo compartir el PDF.');
              }
            },
            style: 'default'
          },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    }
  };

  const processUrl = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Por favor ingresa una URL válida');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      Alert.alert('Error', 'Por favor ingresa una URL válida que comience con http:// o https://');
      return;
    }

    setIsProcessing(true);
    setRecipePreview(null);

    try {
      console.log('🚀 EXTRAYENDO PREVIEW PARA PDF:', url);

      // Usamos el método para extraer una sola receta
      const preview = await recipeExtractionService.extractSingleRecipePreview(url);

      console.log('✅ PREVIEW EXTRAÍDO PARA PDF:', preview);

      // Ahora generar un PDF temporal para mostrar como preview
      const { pdfUri, htmlPreview } = await generatePreviewPDF(preview);

      setRecipePreview({
        ...preview,
        pdfPreviewUri: pdfUri
      });

      // Guardar el HTML para mostrar como preview visual
      setPdfPreviewHtml(htmlPreview);

    } catch (error) {
      console.error('❌ ERROR EN EXTRACCIÓN PARA PDF:', error);
      Alert.alert('Error', 'No se pudo extraer la receta. Verifica que la URL contenga una receta válida.');
    } finally {
      setIsProcessing(false);
    }
  };

  const cleanContentForPDF = (htmlContent) => {
    // Función para limpiar y optimizar HTML para PDF
    let cleanedContent = htmlContent;

    // Remover elementos no deseados
    const elementsToRemove = [
      /<script[\s\S]*?<\/script>/gi,
      /<style[\s\S]*?<\/style>/gi,
      /<nav[\s\S]*?<\/nav>/gi,
      /<header[\s\S]*?<\/header>/gi,
      /<footer[\s\S]*?<\/footer>/gi,
      /<aside[\s\S]*?<\/aside>/gi,
      /<div[^>]*class="[^"]*ad[^"]*"[\s\S]*?<\/div>/gi,
      /<div[^>]*class="[^"]*comment[^"]*"[\s\S]*?<\/div>/gi,
      /<div[^>]*class="[^"]*social[^"]*"[\s\S]*?<\/div>/gi,
      /<div[^>]*class="[^"]*share[^"]*"[\s\S]*?<\/div>/gi,
    ];

    elementsToRemove.forEach(pattern => {
      cleanedContent = cleanedContent.replace(pattern, '');
    });

    return cleanedContent;
  };

  const generatePDFFromURL = async () => {
    if (!url) return;

    setIsProcessing(true);
    try {
      console.log('📄 GENERANDO PDF DESDE URL:', url);

      // 1. Obtener contenido HTML de la URL
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const htmlContent = await response.text();
      console.log('✅ Contenido HTML obtenido');

      // 2. Limpiar contenido para PDF
      const cleanedHTML = cleanContentForPDF(htmlContent);

      // 3. Crear plantilla HTML optimizada para PDF
      const pdfHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
              }

              h1, h2, h3 {
                color: #2c3e50;
                margin-top: 30px;
                margin-bottom: 15px;
              }

              h1 {
                border-bottom: 3px solid #3498db;
                padding-bottom: 10px;
              }

              img {
                max-width: 100%;
                height: auto;
                margin: 20px 0;
                border-radius: 8px;
              }

              ul, ol {
                margin: 15px 0;
                padding-left: 30px;
              }

              li {
                margin-bottom: 8px;
              }

              .recipe-info {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #3498db;
              }

              .ingredients {
                background-color: #fff;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
              }

              .instructions {
                background-color: #fff;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
              }

              .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 20px;
              }

              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${cleanedHTML}
            <div class="footer">
              <p>Receta convertida a PDF desde: ${url}</p>
              <p>Generado con RecipeTuner - ${new Date().toLocaleDateString()}</p>
            </div>
          </body>
        </html>
      `;

      // 4. Generar PDF
      console.log('📄 Creando archivo PDF...');
      const { uri } = await Print.printToFileAsync({
        html: pdfHTML,
        base64: false,
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });

      console.log('✅ PDF generado:', uri);

      // 5. Abrir PDF en visor
      await openPDFViewer(uri);

    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      Alert.alert('Error', 'No se pudo generar el PDF. Intenta con otra URL.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePreviewPDF = async (recipeData) => {
    try {
      console.log('🖼️ Generando PDF preview...');

      // Crear HTML optimizado para la receta
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: white;
              }

              .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 3px solid #007AFF;
              }

              .recipe-title {
                font-size: 28px;
                color: #007AFF;
                margin-bottom: 10px;
                font-weight: bold;
              }

              .recipe-image {
                max-width: 100%;
                height: 300px;
                object-fit: cover;
                border-radius: 12px;
                margin: 20px 0;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              }

              .recipe-meta {
                display: flex;
                justify-content: space-around;
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
              }

              .meta-item {
                text-align: center;
              }

              .meta-label {
                font-size: 12px;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 1px;
              }

              .meta-value {
                font-size: 18px;
                font-weight: bold;
                color: #007AFF;
                margin-top: 5px;
              }

              .ingredients-section {
                margin: 30px 0;
              }

              .section-title {
                font-size: 20px;
                color: #333;
                margin-bottom: 15px;
                padding-bottom: 8px;
                border-bottom: 2px solid #e9ecef;
              }

              .watermark {
                position: fixed;
                bottom: 20px;
                right: 20px;
                font-size: 12px;
                color: #ccc;
                font-style: italic;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="recipe-title">${recipeData.title || 'Receta sin título'}</div>
              ${recipeData.imageUrl ? `<img src="${recipeData.imageUrl}" class="recipe-image" alt="Imagen de la receta" />` : ''}
            </div>

            <div class="recipe-meta">
              <div class="meta-item">
                <div class="meta-label">Ingredientes</div>
                <div class="meta-value">${recipeData.ingredientCount || 'N/A'}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Tiempo Prep.</div>
                <div class="meta-value">${recipeData.prepTime || 'N/A'}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Tiempo Total</div>
                <div class="meta-value">${recipeData.totalTime || 'N/A'}</div>
              </div>
            </div>

            <div class="ingredients-section">
              <div class="section-title">Preview de PDF Generado</div>
              <p>Este es un preview de cómo se verá tu receta en formato PDF.</p>
              <p><strong>Título:</strong> ${recipeData.title || 'Sin título'}</p>
              <p><strong>Confianza de extracción:</strong> ${Math.round((recipeData.confidence || 0) * 100)}%</p>
              ${recipeData.description ? `<p><strong>Descripción:</strong> ${recipeData.description}</p>` : ''}
            </div>

            <div class="watermark">
              Generado con RecipeTuner - Preview
            </div>
          </body>
        </html>
      `;

      // Generar PDF temporal
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        margins: {
          left: 20,
          top: 20,
          right: 20,
          bottom: 20,
        },
      });

      console.log('✅ PDF preview generado:', uri);
      return {
        pdfUri: uri,
        htmlPreview: htmlContent
      };

    } catch (error) {
      console.error('❌ Error generando PDF preview:', error);
      throw error;
    }
  };

  const generatePDFFromPreview = async () => {
    if (!recipePreview) return;

    setIsProcessing(true);
    try {
      console.log('📄 GENERANDO PDF DESDE PREVIEW...');

      // Crear HTML optimizado usando los datos del preview
      const pdfHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: 'Georgia', serif;
                line-height: 1.8;
                color: #2c3e50;
                max-width: 700px;
                margin: 0 auto;
                padding: 40px;
                background: white;
              }

              .header {
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 3px solid #e74c3c;
                padding-bottom: 30px;
              }

              h1 {
                color: #e74c3c;
                font-size: 28px;
                margin-bottom: 15px;
                font-weight: bold;
              }

              .description {
                font-style: italic;
                color: #7f8c8d;
                font-size: 16px;
                margin-bottom: 30px;
              }

              .recipe-info {
                display: flex;
                justify-content: space-around;
                background-color: #ecf0f1;
                padding: 20px;
                border-radius: 10px;
                margin: 30px 0;
                text-align: center;
              }

              .info-item {
                display: flex;
                flex-direction: column;
                align-items: center;
              }

              .info-label {
                font-size: 12px;
                color: #7f8c8d;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 5px;
              }

              .info-value {
                font-size: 18px;
                font-weight: bold;
                color: #2c3e50;
              }

              .recipe-image {
                width: 100%;
                max-width: 500px;
                height: 300px;
                object-fit: cover;
                border-radius: 15px;
                margin: 30px auto;
                display: block;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
              }

              .section {
                margin: 40px 0;
                padding: 25px;
                background: #f8f9fa;
                border-radius: 10px;
                border-left: 5px solid #3498db;
              }

              .section h2 {
                color: #2c3e50;
                font-size: 20px;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
              }

              .icon {
                margin-right: 10px;
                font-size: 24px;
              }

              .footer {
                margin-top: 60px;
                text-align: center;
                font-size: 14px;
                color: #95a5a6;
                border-top: 2px solid #ecf0f1;
                padding-top: 30px;
              }

              .source-url {
                word-break: break-all;
                color: #3498db;
                text-decoration: none;
              }

              @media print {
                body { margin: 0; padding: 20px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${recipePreview.title}</h1>
              ${recipePreview.description ? `<p class="description">${recipePreview.description}</p>` : ''}
            </div>

            ${recipePreview.imageUrl ? `<img src="${recipePreview.imageUrl}" alt="${recipePreview.title}" class="recipe-image" />` : ''}

            <div class="recipe-info">
              <div class="info-item">
                <div class="info-label">Ingredientes</div>
                <div class="info-value">${recipePreview.ingredientsCount}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Tiempo Total</div>
                <div class="info-value">${recipePreview.totalTime} min</div>
              </div>
              <div class="info-item">
                <div class="info-label">Porciones</div>
                <div class="info-value">${recipePreview.servings}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Confianza</div>
                <div class="info-value">${recipePreview.confidence}%</div>
              </div>
            </div>

            <div class="section">
              <h2><span class="icon">⏱️</span>Tiempos de Preparación</h2>
              <p><strong>Preparación:</strong> ${recipePreview.preparationTime} minutos</p>
              <p><strong>Cocción:</strong> ${recipePreview.cookingTime} minutos</p>
              <p><strong>Total:</strong> ${recipePreview.totalTime} minutos</p>
            </div>

            <div class="section">
              <h2><span class="icon">📝</span>Notas</h2>
              <p>Esta es una versión simplificada de la receta extraída automáticamente.</p>
              <p>Para ver los ingredientes completos e instrucciones detalladas, visita la URL original.</p>
            </div>

            <div class="footer">
              <p><strong>Fuente:</strong></p>
              <p class="source-url">${recipePreview.sourceUrl}</p>
              <br>
              <p>PDF generado con RecipeTuner - ${new Date().toLocaleDateString()}</p>
            </div>
          </body>
        </html>
      `;

      // Generar PDF
      console.log('📄 Creando archivo PDF optimizado...');
      const { uri } = await Print.printToFileAsync({
        html: pdfHTML,
        base64: false,
        margins: {
          top: 40,
          bottom: 40,
          left: 40,
          right: 40
        }
      });

      console.log('✅ PDF generado:', uri);

      // Abrir PDF en visor
      await openPDFViewer(uri);

    } catch (error) {
      console.error('❌ Error generando PDF optimizado:', error);
      Alert.alert('Error', 'No se pudo generar el PDF. Intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const openUrl = () => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <Fragment>
        <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
        <Text style={styles.title}>Convertir Receta a PDF</Text>
        <Text style={styles.subtitle}>
          Convierte cualquier receta web a un PDF limpio y organizado
        </Text>
      </View>

      <View style={styles.urlSection}>
        <Text style={styles.sectionTitle}>URL de la Receta</Text>

        <View style={styles.urlExamples}>
          <Text style={styles.examplesTitle}>Funciona con sitios como:</Text>
          <Text style={styles.exampleUrl}>• AllRecipes, Food Network, Tasty</Text>
          <Text style={styles.exampleUrl}>• Blogs de cocina populares</Text>
          <Text style={styles.exampleUrl}>• Sitios de recetas en español</Text>
        </View>

        <View style={styles.urlInputContainer}>
          <TextInput
            style={styles.urlInput}
            placeholder="https://ejemplo.com/receta"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {url ? (
            <TouchableOpacity style={styles.openUrlButton} onPress={openUrl}>
              <Ionicons name="open-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.processButton, (!url.trim() || isProcessing) && styles.disabledButton]}
            onPress={processUrl}
            disabled={!url.trim() || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="eye-outline" size={20} color="white" />
                <Text style={styles.buttonText}>Vista Previa</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pdfButton, (!url.trim() || isProcessing) && styles.disabledButton]}
            onPress={generatePDFFromURL}
            disabled={!url.trim() || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="document-outline" size={20} color="white" />
                <Text style={styles.buttonText}>PDF Directo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* PREVIEW DE LA RECETA */}
      {recipePreview && (
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Vista Previa</Text>

          <View style={styles.previewCard}>
            {recipePreview.pdfPreviewUri ? (
              <View style={styles.pdfPreviewContainer}>
                <View style={styles.pdfPreviewHeader}>
                  <Ionicons name="document-text" size={24} color="#007AFF" />
                  <Text style={styles.pdfPreviewLabel}>Vista Previa del PDF</Text>
                </View>

                {/* Vista previa visual de la receta */}
                <View style={styles.recipePreviewContainer}>
                  {recipePreview.imageUrl && (
                    <Image
                      source={{ uri: recipePreview.imageUrl }}
                      style={styles.recipePreviewImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.recipePreviewContent}>
                    <Text style={styles.recipePreviewTitle}>{recipePreview.title}</Text>
                    {recipePreview.description && (
                      <Text style={styles.recipePreviewDescription} numberOfLines={3}>
                        {recipePreview.description}
                      </Text>
                    )}
                    <View style={styles.recipePreviewMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={16} color="#666" />
                        <Text style={styles.metaText}>{recipePreview.totalTime} min</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="people-outline" size={16} color="#666" />
                        <Text style={styles.metaText}>{recipePreview.servings} porciones</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="list-outline" size={16} color="#666" />
                        <Text style={styles.metaText}>{recipePreview.ingredientsCount} ingredientes</Text>
                      </View>
                    </View>
                    <Text style={styles.confirmationText}>
                      ¿Es esta la receta que quieres procesar como PDF?
                    </Text>
                  </View>
                </View>

                <View style={styles.pdfButtonRow}>
                  <TouchableOpacity
                    style={styles.viewPDFButton}
                    onPress={async () => {
                      try {
                        // Convertir a base64 y abrir en navegador para mejor visualización
                        const base64 = await FileSystem.readAsStringAsync(recipePreview.pdfPreviewUri, {
                          encoding: FileSystem.EncodingType.Base64,
                        });
                        const pdfDataUri = `data:application/pdf;base64,${base64}`;

                        await WebBrowser.openBrowserAsync(pdfDataUri, {
                          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                          controlsColor: '#007AFF',
                          toolbarColor: '#ffffff',
                        });
                      } catch (error) {
                        console.error('Error abriendo en navegador:', error);
                        // Fallback a la función original
                        openPDFViewer(recipePreview.pdfPreviewUri);
                      }
                    }}
                  >
                    <Ionicons name="eye-outline" size={20} color="white" />
                    <Text style={styles.viewPDFButtonText}>Ver PDF</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.viewPDFButton, styles.sharePDFButton]}
                    onPress={() => openPDFViewer(recipePreview.pdfPreviewUri)}
                  >
                    <Ionicons name="open-outline" size={20} color="white" />
                    <Text style={styles.viewPDFButtonText}>Abrir/Compartir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.viewPDFButton, styles.confirmButton]}
                    onPress={() => {
                      Alert.alert(
                        'Confirmar Receta',
                        '¿Quieres generar un PDF optimizado de esta receta?',
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          {
                            text: 'Sí, generar PDF',
                            onPress: () => generatePDFFromPreview(),
                            style: 'default'
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.viewPDFButtonText}>Procesar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : recipePreview.imageUrl ? (
              <Image
                source={{ uri: recipePreview.imageUrl }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            ) : null}

            <View style={styles.previewContent}>
              <Text style={styles.previewTitle}>{recipePreview.title}</Text>

              {recipePreview.description && (
                <Text style={styles.previewDescription}>{recipePreview.description}</Text>
              )}

              <View style={styles.previewInfo}>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Ionicons name="list-outline" size={20} color="#007AFF" />
                    <Text style={styles.infoLabel}>Ingredientes</Text>
                    <Text style={styles.infoValue}>{recipePreview.ingredientsCount}</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Ionicons name="time-outline" size={20} color="#007AFF" />
                    <Text style={styles.infoLabel}>Tiempo total</Text>
                    <Text style={styles.infoValue}>{recipePreview.totalTime} min</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Ionicons name="people-outline" size={20} color="#007AFF" />
                    <Text style={styles.infoLabel}>Porciones</Text>
                    <Text style={styles.infoValue}>{recipePreview.servings}</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#28a745" />
                    <Text style={styles.infoLabel}>Confianza</Text>
                    <Text style={styles.infoValue}>{recipePreview.confidence}%</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.generatePDFButton}
            onPress={generatePDFFromPreview}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={20} color="white" />
                <Text style={styles.generatePDFButtonText}>Generar PDF Optimizado</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Opciones Disponibles</Text>
        <View style={styles.tipItem}>
          <Ionicons name="eye-outline" size={20} color="#007AFF" />
          <Text style={styles.tipText}>
            <Text style={styles.tipBold}>Vista Previa:</Text> Extrae y muestra los datos básicos antes de generar PDF
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="document-outline" size={20} color="#FF9500" />
          <Text style={styles.tipText}>
            <Text style={styles.tipBold}>PDF Directo:</Text> Convierte toda la página web directamente a PDF
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="document-text-outline" size={20} color="#28a745" />
          <Text style={styles.tipText}>
            <Text style={styles.tipBold}>PDF Optimizado:</Text> Genera un PDF limpio con solo los datos de la receta
          </Text>
        </View>
      </View>
        </ScrollView>

      </Fragment>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 22,
  },
  urlSection: {
    padding: 20,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  urlExamples: {
    marginBottom: 16,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  exampleUrl: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  urlInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    marginBottom: 16,
  },
  urlInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#212529',
  },
  openUrlButton: {
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#dee2e6',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  processButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfButton: {
    flex: 1,
    backgroundColor: '#FF9500',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  previewSection: {
    padding: 20,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#e9ecef',
  },
  pdfPreviewContainer: {
    width: '100%',
    backgroundColor: '#f8f9fa',
  },
  pdfPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderBottomWidth: 1,
    borderBottomColor: '#bbdefb',
  },
  pdfPreviewLabel: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  pdfPreviewPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
  },
  pdfPreviewText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
  },
  pdfPreviewSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  viewPDFButton: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewPDFButtonText: {
    marginLeft: 8,
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  pdfButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  sharePDFButton: {
    backgroundColor: '#28a745',
    flex: 1,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    flex: 1,
  },
  recipePreviewContainer: {
    backgroundColor: '#f8f9fa',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  recipePreviewImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#e9ecef',
  },
  recipePreviewContent: {
    padding: 16,
  },
  recipePreviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  recipePreviewDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    marginBottom: 12,
  },
  recipePreviewMeta: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  confirmationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
  },
  previewContent: {
    padding: 16,
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
    lineHeight: 28,
  },
  previewDescription: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 16,
    lineHeight: 22,
  },
  previewInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    textAlign: 'center',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginTop: 2,
    textAlign: 'center',
  },
  generatePDFButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generatePDFButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tipsSection: {
    padding: 20,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 32,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 12,
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: '600',
    color: '#495057',
  },
  // Estilos del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  pdfFullPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  pdfFullPreviewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 16,
    textAlign: 'center',
  },
  pdfFullPreviewText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    marginLeft: 8,
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalSecondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  modalSecondaryButtonText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ConvertToPDFScreen;