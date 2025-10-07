import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text,
  useTheme,
  Divider,
} from 'react-native-paper';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { apiRequest, BACKEND_CONFIG } from '../config/backend';

const PaymentScreen = ({ route, navigation }) => {
  const { plan, isYearly } = route.params;
  const theme = useTheme();
  const { confirmPayment, createPaymentMethod } = useStripe();
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const selectedPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

  const handlePayment = async () => {
    try {
      if (!cardComplete) {
        Alert.alert('Error', 'Por favor completa la información de la tarjeta');
        return;
      }

      setLoading(true);

      // 1. Crear Payment Method con Stripe
      const { paymentMethod, error: pmError } = await createPaymentMethod({
        paymentMethodType: 'Card',
      });

      if (pmError) {
        console.error('Error creando payment method:', pmError);
        Alert.alert('Error', pmError.message);
        return;
      }

      // 2. Crear suscripción en el backend
      const subscriptionPayload = {
        planId: plan.planId,
        isYearly: isYearly,
        paymentMethodId: paymentMethod.id,
        metadata: {
          app_name: 'recipetuner',
          plan_id: plan.planId,
          plan_name: plan.name,
          billing_cycle: isYearly ? 'yearly' : 'monthly',
          amount: String(selectedPrice),
          currency: plan.currency
        }
      };

      const response = await apiRequest(BACKEND_CONFIG.STRIPE_ENDPOINTS.CREATE_SUBSCRIPTION, {
        method: 'POST',
        auth: true,
        body: JSON.stringify(subscriptionPayload)
      });

      if (response && response.success) {
        // Si hay client_secret, confirmar el pago
        if (response.client_secret) {
          const { error: confirmError } = await confirmPayment(response.client_secret, {
            paymentMethodType: 'Card',
          });

          if (confirmError) {
            console.error('Error confirmando pago:', confirmError);
            Alert.alert('Error', confirmError.message);
            return;
          }
        }

        // Éxito
        Alert.alert(
          '¡Éxito!',
          'Tu suscripción ha sido creada. ¡Disfruta de RecipeTuner Premium!',
          [
            {
              text: 'Continuar',
              onPress: () => {
                navigation.navigate('Main');
              }
            }
          ]
        );
      } else {
        throw new Error('Respuesta inválida del servidor');
      }

    } catch (error) {
      console.error('Error procesando pago:', error);

      let errorMessage = 'No se pudo procesar el pago.';
      if (error.message.includes('timeout') || error.message.includes('network') || error.message.includes('CFNetwork')) {
        errorMessage = 'El servidor está tardando en responder. Por favor, verifica tu conexión a internet e intenta nuevamente.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipPayment = async () => {
    try {
      setLoading(true);

      // Crear suscripción sin payment method (solo trial)
      const subscriptionPayload = {
        planId: plan.planId,
        isYearly: isYearly,
        paymentMethodId: '', // String vacío para trial sin tarjeta
        metadata: {
          app_name: 'recipetuner',
          plan_id: plan.planId,
          plan_name: plan.name,
          billing_cycle: isYearly ? 'yearly' : 'monthly',
          amount: String(selectedPrice),
          currency: plan.currency
        }
      };

      const response = await apiRequest(BACKEND_CONFIG.STRIPE_ENDPOINTS.CREATE_SUBSCRIPTION, {
        method: 'POST',
        auth: true,
        body: JSON.stringify(subscriptionPayload)
      });

      if (response && response.success) {
        Alert.alert(
          '¡Trial Activado!',
          'Tienes 7 días gratis para probar RecipeTuner Premium. Puedes agregar tu tarjeta después.',
          [
            {
              text: 'Continuar',
              onPress: () => {
                navigation.navigate('Main');
              }
            }
          ]
        );
      } else {
        throw new Error('Respuesta inválida del servidor');
      }

    } catch (error) {
      console.error('❌ Error creando trial:', error);
      Alert.alert('Error', `No se pudo iniciar el trial: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Icon name="credit-card" size={50} color={theme.colors.primary} />
        <Title style={styles.headerTitle}>Método de Pago</Title>
        <Paragraph style={styles.headerSubtitle}>
          Completa tu suscripción
        </Paragraph>
      </View>

      {/* Plan Summary */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Title style={styles.summaryTitle}>Resumen de tu Plan</Title>
          <Divider style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Plan:</Text>
            <Text style={styles.summaryValue}>{plan.name}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ciclo:</Text>
            <Text style={styles.summaryValue}>
              {isYearly ? 'Anual' : 'Mensual'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Precio:</Text>
            <Text style={styles.summaryPrice}>
              {plan.currency} ${selectedPrice}
            </Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.trialNotice}>
            <Icon name="gift" size={24} color="#FF9800" />
            <Text style={styles.trialText}>
              7 días gratis • Sin cargos hasta el {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Card Form */}
      <Card style={styles.cardForm}>
        <Card.Content>
          <Title style={styles.cardFormTitle}>Información de Pago</Title>
          <Paragraph style={styles.cardFormSubtitle}>
            Usa una tarjeta de prueba: 4242 4242 4242 4242
          </Paragraph>

          <View style={styles.cardFieldContainer}>
            <CardField
              postalCodeEnabled={true}
              placeholders={{
                number: '4242 4242 4242 4242',
                expiration: 'MM/AA',
                cvc: 'CVC',
                postalCode: 'Código Postal',
              }}
              cardStyle={styles.card}
              style={styles.cardField}
              onCardChange={(cardDetails) => {
                setCardComplete(cardDetails.complete);
              }}
            />
          </View>

          <View style={styles.securityNotice}>
            <Icon name="shield-check" size={20} color="#4CAF50" />
            <Text style={styles.securityText}>
              Pago seguro procesado por Stripe
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={handlePayment}
          loading={loading}
          disabled={!cardComplete || loading}
          style={styles.payButton}
          icon="check"
        >
          Confirmar Suscripción
        </Button>

        <Button
          mode="outlined"
          onPress={handleSkipPayment}
          disabled={loading}
          style={styles.skipButton}
        >
          Empezar Trial Sin Tarjeta
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          Cancelar
        </Button>
      </View>

      {/* Info */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <View style={styles.infoItem}>
            <Icon name="information" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              No se te cobrará durante los 7 días de prueba
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="calendar-remove" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              Cancela en cualquier momento antes del fin del trial
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="autorenew" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              Renovación automática al final del período
            </Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  summaryCard: {
    margin: 20,
    marginBottom: 15,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  divider: {
    marginVertical: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  trialNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  trialText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#E65100',
    flex: 1,
  },
  cardForm: {
    margin: 20,
    marginBottom: 15,
    elevation: 2,
  },
  cardFormTitle: {
    fontSize: 18,
    marginBottom: 5,
  },
  cardFormSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
  },
  cardFieldContainer: {
    marginBottom: 15,
  },
  cardField: {
    height: 50,
  },
  card: {
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4CAF50',
  },
  actions: {
    padding: 20,
    paddingTop: 0,
  },
  payButton: {
    marginBottom: 12,
    paddingVertical: 6,
  },
  skipButton: {
    marginBottom: 12,
  },
  infoCard: {
    margin: 20,
    marginTop: 0,
    marginBottom: 30,
    elevation: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});

export default PaymentScreen;
