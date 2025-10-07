# RecipeTunnel Claude - App de Recetas con IA

Una aplicación móvil completa para Android que permite a los usuarios personalizar recetas usando inteligencia artificial, adaptándolas según condiciones médicas, alergias, intolerancias y preferencias del usuario.

## 🚀 Características Principales

### ✨ Funcionalidades Core
- **Adaptación de Recetas con IA**: Usa OpenAI GPT-4 para adaptar recetas según preferencias dietéticas
- **Captura de Fotos**: Toma fotos de recetas y extrae automáticamente ingredientes e instrucciones
- **Análisis de Imágenes**: OCR con Google Vision API para procesar texto de imágenes
- **Gestión de Preferencias**: Sistema completo de preferencias dietéticas y restricciones

### 📱 Funcionalidades Avanzadas
- **Recepción de Recetas por WhatsApp/Telegram/Email**: Recibe recetas de múltiples fuentes
- **Procesamiento Automático**: La IA extrae y procesa recetas automáticamente
- **Notificaciones Push**: Recibe alertas de nuevas recetas y adaptaciones
- **Sincronización**: Almacenamiento local con AsyncStorage

### 🎯 Funcionalidades de IA
- **Adaptación Inteligente**: Sustituye ingredientes problemáticos por alternativas seguras
- **Optimización de Tiempo**: Ajusta tiempos de cocción según preferencias
- **Personalización de Porciones**: Adapta cantidades según necesidades
- **Sugerencias Inteligentes**: Genera recetas basadas en ingredientes disponibles

## 🏗️ Stack Tecnológico

### Framework Principal
- **React Native**: 0.79.5
- **Expo**: SDK 53
- **JavaScript/JSX**

### Navegación
- **@react-navigation/native**: ^6.1.7
- **@react-navigation/stack**: ^6.3.17
- **@react-navigation/bottom-tabs**: ^6.5.8
- **@react-navigation/drawer**: ^6.6.3

### Componentes UI
- **react-native-paper**: ^5.10.3 (Material Design)
- **react-native-vector-icons**: ^10.0.0
- **react-native-reanimated**: ~3.6.0
- **react-native-gesture-handler**: ~2.24.0

### Servicios de IA y APIs
- **OpenAI GPT-4**: Para adaptación de recetas
- **Google Cloud Vision**: Para OCR de imágenes
- **WhatsApp Business API**: Para recepción de recetas
- **Telegram Bot API**: Para recepción de recetas
- **SendGrid**: Para recepción por email

### Funcionalidades del Dispositivo
- **expo-image-picker**: ~16.1.4 (Cámara y galería)
- **expo-camera**: Captura de fotos
- **expo-file-system**: ~16.0.5 (Manejo de archivos)
- **expo-media-library**: ~16.0.1 (Acceso a galería)
- **expo-notifications**: ~0.27.6 (Notificaciones push)
- **expo-linking**: ~6.2.2 (Enlaces externos)

### Estado y Almacenamiento
- **React Context API**: Estado global de la aplicación
- **AsyncStorage**: Persistencia local de datos
- **useReducer**: Manejo de estado complejo
- **Custom Hooks**: Hooks personalizados para lógica reutilizable

## 📱 Pantallas Principales

### 🏠 HomeScreen
- Dashboard principal con estadísticas
- Acceso rápido a funcionalidades
- Vista de recetas recientes
- Promoción de funcionalidades de IA

### 📖 RecipesScreen
- Lista de todas las recetas
- Filtros avanzados por cocina, dificultad, tiempo
- Búsqueda semántica
- Vista de recetas originales y adaptadas

### ➕ AddRecipeScreen
- Formulario completo para agregar recetas
- Validación de campos
- Selección de imagen desde galería
- **NUEVO**: Botón para capturar con cámara

### 📸 CameraRecipeScreen (NUEVA)
- Captura de fotos de recetas
- Análisis automático con Google Vision API
- Extracción de ingredientes e instrucciones con IA
- Guardado automático de recetas extraídas

### 👤 ProfileScreen
- Gestión de perfil de usuario
- Configuración de preferencias dietéticas
- Estadísticas de uso
- Configuración de la aplicación

### ⚙️ PreferencesScreen
- Configuración detallada de preferencias
- Restricciones dietéticas
- Alergias e intolerancias
- Preferencias de cocina y salud

### 🎯 OnboardingScreen
- Proceso de configuración inicial
- 10 pasos para configurar preferencias
- Barra de progreso visual
- Configuración completa del perfil

## 🔧 Configuración de APIs

### OpenAI API
```javascript
// En src/config/api.js
OPENAI: {
  API_KEY: 'tu_api_key_aqui',
  BASE_URL: 'https://api.openai.com/v1',
  MODEL: 'gpt-4',
  MAX_TOKENS: 2000,
}
```

### Google Cloud Vision API
```javascript
GOOGLE_VISION: {
  API_KEY: 'tu_api_key_aqui',
  BASE_URL: 'https://vision.googleapis.com/v1',
}
```

### WhatsApp Business API
```javascript
WHATSAPP: {
  ACCESS_TOKEN: 'tu_access_token_aqui',
  PHONE_NUMBER_ID: 'tu_phone_number_id',
  BASE_URL: 'https://graph.facebook.com/v18.0',
}
```

### Telegram Bot API
```javascript
TELEGRAM: {
  BOT_TOKEN: 'tu_bot_token_aqui',
  BASE_URL: 'https://api.telegram.org/bot',
}
```

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/recipe-tunnel-claude.git
cd recipe-tunnel-claude
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar APIs
Edita `src/config/api.js` y agrega tus API keys:
- OpenAI API Key
- Google Cloud Vision API Key
- WhatsApp Business API (opcional)
- Telegram Bot Token (opcional)
- SendGrid API Key (opcional)

### 4. Ejecutar la Aplicación
```bash
npm start
```

### 5. Escanear QR con Expo Go
- Instala Expo Go en tu dispositivo Android
- Escanea el código QR que aparece en la terminal

## 📋 Uso de la Aplicación

### 🔍 Agregar Receta Manualmente
1. Ve a la pestaña "Agregar"
2. Completa el formulario con título, descripción, ingredientes, etc.
3. Selecciona una imagen desde la galería
4. Guarda la receta

### 📸 Capturar Receta con Cámara
1. Ve a "Agregar" → "Capturar con Cámara"
2. Toma una foto de tu receta
3. La IA analiza la imagen y extrae ingredientes
4. Revisa y edita la receta extraída
5. Guarda la receta

### 🤖 Adaptar Receta con IA
1. Ve a "Recetas" y selecciona una receta
2. Toca "Adaptar con IA"
3. La IA adapta la receta según tus preferencias
4. Revisa los cambios y guarda la versión adaptada

### 📱 Recibir Recetas por WhatsApp/Telegram
1. Configura los webhooks en las APIs correspondientes
2. Envía una receta por mensaje
3. La IA procesa automáticamente el mensaje
4. Recibe notificación de nueva receta
5. Revisa y guarda la receta extraída

## 🎨 Arquitectura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── RecipeCard.js   # Tarjeta de receta
│   ├── QuickStats.js   # Estadísticas rápidas
│   ├── AIAdaptationCard.js # Promoción de IA
│   ├── EmptyState.js   # Estado vacío
│   ├── ImagePickerComponent.js # Selector de imágenes
│   ├── FilterModal.js  # Modal de filtros
│   └── CustomDrawerContent.js # Contenido del drawer
├── context/            # Contextos de React
│   ├── UserContext.js  # Estado del usuario
│   └── RecipeContext.js # Estado de recetas
├── navigation/         # Navegación
│   └── MainNavigator.js # Navegador principal
├── screens/            # Pantallas de la aplicación
│   ├── HomeScreen.js   # Pantalla principal
│   ├── RecipesScreen.js # Lista de recetas
│   ├── AddRecipeScreen.js # Agregar receta
│   ├── CameraRecipeScreen.js # Captura con cámara
│   ├── RecipeDetailScreen.js # Detalle de receta
│   ├── AdaptedRecipeScreen.js # Recetas adaptadas
│   ├── ProfileScreen.js # Perfil del usuario
│   ├── PreferencesScreen.js # Preferencias
│   └── OnboardingScreen.js # Configuración inicial
├── services/           # Servicios externos
│   ├── aiService.js    # Servicio de IA
│   ├── imageService.js # Servicio de imágenes
│   └── communicationService.js # Servicio de comunicación
└── config/             # Configuración
    └── api.js          # Configuración de APIs
```

## 🔒 Permisos Requeridos

### Android
- **Cámara**: Para capturar fotos de recetas
- **Almacenamiento**: Para acceder a la galería
- **Notificaciones**: Para recibir alertas de nuevas recetas
- **Internet**: Para conectarse a las APIs de IA

## 🧪 Testing

### Pruebas Manuales
1. **Funcionalidad de Cámara**: Captura fotos y verifica análisis
2. **Adaptación con IA**: Crea recetas y adáptalas
3. **Gestión de Preferencias**: Configura y modifica preferencias
4. **Navegación**: Verifica todas las pantallas y transiciones

### Pruebas de API
1. **OpenAI**: Verifica adaptación de recetas
2. **Google Vision**: Prueba análisis de imágenes
3. **WhatsApp/Telegram**: Verifica recepción de mensajes

## 🚀 Despliegue

### Build de Producción
```bash
expo build:android
```

### Publicación en Google Play Store
1. Genera APK firmado
2. Sube a Google Play Console
3. Configura metadatos y capturas
4. Publica en producción

## 🤝 Contribución

### Cómo Contribuir
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de Código
- Usa ESLint y Prettier
- Sigue las convenciones de React Native
- Documenta funciones complejas
- Escribe tests para nuevas funcionalidades

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

### Problemas Comunes
- **Error de permisos**: Verifica permisos de cámara y almacenamiento
- **Error de API**: Verifica que las API keys estén configuradas
- **Error de red**: Verifica conexión a internet

### Contacto
- **Issues**: Usa GitHub Issues para reportar bugs
- **Discussions**: Usa GitHub Discussions para preguntas
- **Email**: soporte@recipetunnel.com

## 🗺️ Roadmap

### Versión 1.1
- [ ] Soporte para múltiples idiomas
- [ ] Modo offline con sincronización
- [ ] Historial de adaptaciones
- [ ] Exportar recetas en PDF

### Versión 1.2
- [ ] Integración con servicios de entrega
- [ ] Lista de compras automática
- [ ] Planificador de comidas semanal
- [ ] Análisis nutricional avanzado

### Versión 2.0
- [ ] Soporte para iOS
- [ ] Web app complementaria
- [ ] API pública para desarrolladores
- [ ] Marketplace de recetas

## 🙏 Agradecimientos

- **OpenAI** por proporcionar acceso a GPT-4
- **Google Cloud** por la API de Vision
- **Expo** por el framework de desarrollo
- **React Native** por la plataforma móvil
- **Comunidad** por el feedback y contribuciones

---

**Desarrollado con ❤️ para hacer la cocina más accesible y personalizada para todos.**
