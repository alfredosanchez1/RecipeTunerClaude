import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import {
  Portal,
  Modal,
  Card,
  Title,
  Paragraph,
  Button,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import BiometricService from '../services/BiometricService';

/**
 * Modal para configurar autenticación biométrica después del login
 * Se muestra solo una vez después del primer login exitoso
 */
const BiometricSetupModal = ({
  visible,
  onClose,
  onEnable,
  userEmail,
  sessionToken,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometría');
  const [scaleAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Animación de pulso continua
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Obtener tipo de biometría
      loadBiometricType();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const loadBiometricType = async () => {
    const type = await BiometricService.getBiometricTypeName();
    setBiometricType(type);
  };

  const handleEnable = async () => {
    setLoading(true);

    try {
      const result = await BiometricService.enableBiometric(userEmail, sessionToken);

      if (result.success) {
        console.log('✅ Biometría habilitada desde modal');
        onEnable && onEnable();
        onClose();
      } else {
        console.log('❌ No se pudo habilitar biometría:', result.error);
        // Aún así cerramos el modal, el usuario puede habilitarlo después desde Settings
        onClose();
      }
    } catch (error) {
      console.error('❌ Error habilitando biometría:', error);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    console.log('⏭️ Usuario omitió configuración de biometría');
    onClose();
  };

  // Determinar ícono según tipo de biometría
  const getIconName = () => {
    if (biometricType === 'Face ID') return 'face-recognition';
    if (biometricType === 'Touch ID') return 'fingerprint';
    return 'shield-lock';
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleSkip}
        contentContainerStyle={styles.modalContainer}
      >
        <Animated.View
          style={[
            styles.animatedContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <Card style={styles.card}>
            <Card.Content style={styles.content}>
              {/* Ícono animado */}
              <Animated.View
                style={[
                  styles.iconContainer,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <Icon
                  name={getIconName()}
                  size={80}
                  color={theme.colors.primary}
                />
              </Animated.View>

              {/* Título */}
              <Title style={styles.title}>
                Habilitar {biometricType}
              </Title>

              {/* Descripción */}
              <Paragraph style={styles.description}>
                Accede más rápido y de forma segura a RecipeTuner usando {biometricType}.
              </Paragraph>

              <Paragraph style={styles.description}>
                Tus datos están protegidos y nunca salen de tu dispositivo.
              </Paragraph>

              {/* Beneficios */}
              <View style={styles.benefitsContainer}>
                <View style={styles.benefitItem}>
                  <Icon name="lock" size={20} color="#4CAF50" />
                  <Paragraph style={styles.benefitText}>
                    100% seguro
                  </Paragraph>
                </View>

                <View style={styles.benefitItem}>
                  <Icon name="lightning-bolt" size={20} color="#FF9800" />
                  <Paragraph style={styles.benefitText}>
                    Acceso rápido
                  </Paragraph>
                </View>

                <View style={styles.benefitItem}>
                  <Icon name="shield-check" size={20} color="#2196F3" />
                  <Paragraph style={styles.benefitText}>
                    Sin contraseñas
                  </Paragraph>
                </View>
              </View>

              {/* Botones */}
              <Button
                mode="contained"
                onPress={handleEnable}
                style={styles.enableButton}
                loading={loading}
                disabled={loading}
                icon={getIconName()}
              >
                Habilitar {biometricType}
              </Button>

              <Button
                mode="text"
                onPress={handleSkip}
                style={styles.skipButton}
                disabled={loading}
              >
                Ahora no
              </Button>

              <Paragraph style={styles.footerText}>
                Puedes activarlo después desde Configuración
              </Paragraph>
            </Card.Content>
          </Card>
        </Animated.View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    padding: 20,
  },
  animatedContainer: {
    width: '100%',
  },
  card: {
    borderRadius: 20,
    elevation: 8,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#1F2937',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    color: '#4B5563',
    marginBottom: 10,
    lineHeight: 20,
  },
  benefitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 25,
    paddingHorizontal: 10,
  },
  benefitItem: {
    alignItems: 'center',
    flex: 1,
  },
  benefitText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 5,
  },
  enableButton: {
    width: '100%',
    paddingVertical: 8,
    marginBottom: 10,
  },
  skipButton: {
    marginBottom: 10,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 10,
  },
});

export default BiometricSetupModal;
