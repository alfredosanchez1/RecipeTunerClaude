import React, { useState, useEffect } from 'react';
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
  Chip,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import {
  getSubscriptionPlans,
  getUserSubscription,
  hasActiveSubscription,
  getTrialDaysRemaining
} from '../services/supabase/subscriptions';
import { ensureUserProfile, getCurrentUser } from '../services/supabase/auth';
import { apiRequest, BACKEND_CONFIG } from '../config/backend';

const SubscriptionScreen = ({ navigation }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [hasActive, setHasActive] = useState(false);
  const [trialDays, setTrialDays] = useState(null);
  const [userRegion, setUserRegion] = useState('MX'); // Default a México
  const [isYearly, setIsYearly] = useState(false); // Toggle mensual/anual

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  // Detectar región del usuario
  const detectUserRegion = async () => {
    try {
      // Usar Intl.DateTimeFormat para detectar zona horaria
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Intentar usar fetch a un servicio de geolocalización
      try {
        const response = await fetch('https://ipapi.co/json/', { timeout: 5000 });
        const data = await response.json();

        if (data.country_code) {
          const region = data.country_code === 'MX' ? 'MX' : 'US';
          setUserRegion(region);
          return region;
        }
      } catch (geoError) {
        // Fallback silencioso a detección por timezone
      }

      // Fallback: detectar por zona horaria
      const mexicanTimezones = [
        'America/Mexico_City', 'America/Cancun', 'America/Merida',
        'America/Monterrey', 'America/Chihuahua', 'America/Hermosillo',
        'America/Mazatlan', 'America/Tijuana'
      ];

      const region = mexicanTimezones.includes(timezone) ? 'MX' : 'US';
      setUserRegion(region);
      return region;
    } catch (error) {
      // Default a México
      setUserRegion('MX');
      return 'MX';
    }
  };

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);

      // Detectar región del usuario
      const region = await detectUserRegion();

      // Asegurar que el usuario tiene perfil
      const currentUser = await getCurrentUser();
      if (currentUser) {
        await ensureUserProfile(currentUser);
      }

      // Cargar planes disponibles
      const plansData = await getSubscriptionPlans();

      // Filtrar plan para la región del usuario
      const regionPlan = plansData.find(plan =>
        (region === 'MX' && plan.name.includes('México')) ||
        (region === 'US' && plan.name.includes('USA'))
      );

      if (regionPlan) {
        // Crear plan unificado con precios mensuales y anuales
        const unifiedPlan = {
          ...regionPlan,
          planId: regionPlan.id,
          monthlyPrice: regionPlan.price_monthly,
          yearlyPrice: regionPlan.price_yearly,
          currency: region === 'MX' ? 'MXN' : 'USD',
          region: region,
          monthlyPriceId: regionPlan.stripe_price_id_monthly,
          yearlyPriceId: regionPlan.stripe_price_id_yearly
        };

        setPlans([unifiedPlan]);
      } else {
        setPlans(plansData); // Fallback a mostrar todos los planes
      }

      // Verificar suscripción actual
      const activeSubscription = await hasActiveSubscription();
      setHasActive(activeSubscription);

      if (activeSubscription) {
        const subscription = await getUserSubscription();
        setCurrentSubscription(subscription);
      }

      // Verificar días de trial
      const trialDaysRemaining = await getTrialDaysRemaining();
      setTrialDays(trialDaysRemaining);

    } catch (error) {
      console.error('Error cargando datos de suscripción:', error);
      Alert.alert('Error', 'No se pudieron cargar los planes de suscripción');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan) => {
    try {
      // Verificar si ya tiene una suscripción activa (no trial)
      if (hasActive && currentSubscription) {
        const isInTrial = currentSubscription.status === 'trialing';
        const isCanceled = currentSubscription.status === 'canceled';

        // Si está en trial, permitir cambiar libremente
        if (isInTrial) {
          Alert.alert(
            'Cambiar Plan Durante Trial',
            '¿Deseas cambiar tu plan durante el período de prueba? El nuevo plan también incluirá 7 días gratis.',
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Continuar',
                onPress: () => navigation.navigate('Payment', {
                  plan: plan,
                  isYearly: isYearly,
                  isUpgrade: true,
                  currentSubscription: currentSubscription
                })
              }
            ]
          );
          return;
        }

        // Si está cancelada pero aún vigente, ofrecer reactivar
        if (isCanceled) {
          Alert.alert(
            'Reactivar Suscripción',
            'Tu suscripción actual está cancelada pero aún vigente. ¿Deseas activar un nuevo plan?',
            [
              { text: 'No', style: 'cancel' },
              {
                text: 'Sí, Activar',
                onPress: () => navigation.navigate('Payment', {
                  plan: plan,
                  isYearly: isYearly,
                  isUpgrade: true,
                  currentSubscription: currentSubscription
                })
              }
            ]
          );
          return;
        }

        // Si tiene suscripción activa pagada, mostrar advertencia
        const periodEnd = currentSubscription.current_period_end
          ? new Date(currentSubscription.current_period_end).toLocaleDateString()
          : 'N/A';

        const daysRemaining = currentSubscription.current_period_end
          ? Math.ceil((new Date(currentSubscription.current_period_end) - new Date()) / (1000 * 60 * 60 * 24))
          : 0;

        Alert.alert(
          'Ya Tienes una Suscripción Activa',
          `Tu suscripción actual vence el ${periodEnd} (${daysRemaining} días restantes).\n\n` +
          `Al cambiar de plan ahora:\n` +
          `• Se calculará un crédito proporcional por el tiempo no usado\n` +
          `• El crédito se aplicará al nuevo plan\n` +
          `• El cambio es inmediato\n\n` +
          `¿Deseas continuar?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Cambiar Plan',
              onPress: () => navigation.navigate('Payment', {
                plan: plan,
                isYearly: isYearly,
                isUpgrade: true,
                currentSubscription: currentSubscription
              })
            }
          ]
        );
        return;
      }

      // Sin suscripción activa, proceder normalmente
      navigation.navigate('Payment', {
        plan: plan,
        isYearly: isYearly
      });
    } catch (error) {
      console.error('Error al suscribirse:', error);
      Alert.alert('Error', 'No se pudo procesar la suscripción');
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancelar Suscripción',
      '¿Estás seguro de que deseas cancelar tu suscripción? Mantendrás el acceso hasta el final del período actual.',
      [
        { text: 'No cancelar', style: 'cancel' },
        { text: 'Cancelar suscripción', style: 'destructive', onPress: cancelSubscription }
      ]
    );
  };

  const cancelSubscription = async () => {
    try {
      setLoading(true);

      console.error('Cancelando suscripción:', currentSubscription?.stripe_subscription_id);

      // Llamar a la API para cancelar
      const response = await apiRequest(BACKEND_CONFIG.STRIPE_ENDPOINTS.CANCEL_SUBSCRIPTION, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          subscriptionId: currentSubscription.stripe_subscription_id
        })
      });

      console.error('Respuesta de cancelación:', response);

      Alert.alert('Suscripción Cancelada', 'Tu suscripción ha sido cancelada correctamente');
      await loadSubscriptionData();

    } catch (error) {
      console.error('Error cancelando suscripción:', error);
      Alert.alert('Error', `No se pudo cancelar la suscripción: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planName) => {
    switch (planName.toLowerCase()) {
      case 'basico':
      case 'basic':
        return 'food-fork-drink';
      case 'premium':
        return 'crown';
      case 'pro':
        return 'diamond-stone';
      default:
        return 'chef-hat';
    }
  };

  const getPlanColor = (planName) => {
    switch (planName.toLowerCase()) {
      case 'basico':
      case 'basic':
        return '#4CAF50';
      case 'premium':
        return '#FF9800';
      case 'pro':
        return '#9C27B0';
      default:
        return theme.colors.primary;
    }
  };

  const mejorarTextoCaracteristica = (feature) => {
    // Mapeo para mejorar textos de características - solo funciones reales implementadas
    const mejoras = {
      // Clarificar funcionalidad offline
      'Modo offline': 'Consulta de recetas sin internet',
      'Offline mode': 'Recipe access without internet',

      // Características implementadas - mejorar textos
      'Recetas ilimitadas': 'Crear y guardar recetas ilimitadas',
      'Unlimited recipes': 'Create and save unlimited recipes',
      'Soporte prioritario 24/7': 'Soporte técnico prioritario',
      'Priority 24/7 support': 'Priority technical support',
      'Adaptaciones ilimitadas con IA': 'Conversión de recetas con IA (requiere internet)',
      'Unlimited AI adaptations': 'Recipe conversion with AI (requires internet)',

      // Condiciones médicas - nueva característica
      'Condiciones médicas': 'Adaptación para condiciones médicas',
      'Medical conditions': 'Medical condition adaptations',
      'Restricciones alimentarias': 'Adaptación para condiciones médicas',
      'Dietary restrictions': 'Medical condition adaptations',

      // Solo el planificador de comidas está en roadmap
      'Planificador de comidas semanal': 'Planificador de comidas (próximamente)',
      'Weekly meal planner': 'Meal planner (coming soon)',

      // Características reales - sin "próximamente"
      'Lista de compras automática': 'Lista de compras inteligente',
      'Automatic shopping lists': 'Smart shopping lists',
      'Análisis nutricional avanzado': 'Análisis nutricional completo',
      'Advanced nutritional analysis': 'Complete nutritional analysis',
      'Exportar recetas a PDF': 'Exportar recetas a PDF',
      'Export recipes to PDF': 'Export recipes to PDF',

      // Corregir terminología - no es "premium" sino "completo"
      'Acceso a recetas premium': 'Acceso completo a todas las recetas',
      'Access to premium recipes': 'Full access to all recipes',
      'Recetas personalizadas con IA': 'Recetas personalizadas sin límites',
      'AI-powered custom recipes': 'Unlimited personalized recipes',
    };

    return mejoras[feature] || feature;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando planes...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Icon name="crown" size={50} color={theme.colors.primary} />
        <Title style={styles.headerTitle}>Planes de Suscripción</Title>
        <Paragraph style={styles.headerSubtitle}>
          Elige el plan perfecto para tus necesidades culinarias
        </Paragraph>
      </View>

      {/* Toggle Mensual/Anual */}
      <View style={styles.billingToggleContainer}>
        <Text style={styles.billingToggleLabel}>Período de facturación:</Text>
        <View style={styles.billingToggle}>
          <Button
            mode={!isYearly ? "contained" : "outlined"}
            onPress={() => setIsYearly(false)}
            style={[styles.billingButton, !isYearly && styles.activeBillingButton]}
            compact
          >
            Mensual
          </Button>
          <Button
            mode={isYearly ? "contained" : "outlined"}
            onPress={() => setIsYearly(true)}
            style={[styles.billingButton, isYearly && styles.activeBillingButton]}
            compact
          >
            Anual
          </Button>
        </View>
        {isYearly && (
          <Text style={styles.discountText}>
            🎉 ¡Ahorra hasta 30% con el plan anual!
          </Text>
        )}
      </View>

      {/* Current Subscription Status */}
      {hasActive && currentSubscription && (
        <Card style={styles.currentSubscriptionCard}>
          <Card.Content>
            <View style={styles.currentSubscriptionHeader}>
              <Icon name="check-circle" size={24} color="#4CAF50" />
              <Title style={styles.currentSubscriptionTitle}>Suscripción Activa</Title>
            </View>
            <Text style={styles.currentPlanName}>{currentSubscription.plan?.name}</Text>
            <Text style={styles.currentPlanPrice}>
              ${currentSubscription.plan?.price_monthly}/mes
            </Text>

            {currentSubscription.status === 'trialing' && trialDays !== null && (
              <Chip
                icon="clock"
                style={styles.trialChip}
                textStyle={styles.trialChipText}
              >
                {trialDays} días de prueba restantes
              </Chip>
            )}

            <View style={styles.subscriptionActions}>
              <Button
                mode="outlined"
                onPress={handleCancelSubscription}
                icon="cancel"
                style={styles.cancelButton}
                textColor="#F44336"
              >
                Cancelar Suscripción
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Trial Banner */}
      {!hasActive && (
        <Card style={styles.trialBanner}>
          <Card.Content>
            <View style={styles.trialBannerContent}>
              <Icon name="gift" size={30} color="#FF9800" />
              <View style={styles.trialBannerText}>
                <Title style={styles.trialBannerTitle}>¡Prueba Gratuita!</Title>
                <Paragraph style={styles.trialBannerSubtitle}>
                  7 días gratis en cualquier plan premium
                </Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Plans Grid */}
      <View style={styles.plansContainer}>
        {plans.map((plan) => (
          <Card key={plan.id} style={styles.planCard}>
            <Card.Content>
              <View style={styles.planHeader}>
                <Icon
                  name={getPlanIcon(plan.name)}
                  size={40}
                  color={getPlanColor(plan.name)}
                />
                <Title style={styles.planName}>{plan.name}</Title>
                {plan.is_popular && (
                  <Chip
                    icon="star"
                    style={styles.popularChip}
                    textStyle={styles.popularChipText}
                  >
                    Más Popular
                  </Chip>
                )}
              </View>

              <View style={styles.planPricing}>
                <Text style={styles.planPrice}>
                  {plan.currency} ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                </Text>
                <Text style={styles.planPeriod}>
                  {isYearly ? '/año' : '/mes'}
                </Text>
              </View>

              {/* Mostrar precio mensual equivalente si es anual */}
              {isYearly && (
                <Text style={styles.monthlyEquivalent}>
                  Equivale a ${(plan.yearlyPrice / 12).toFixed(2)} {plan.currency}/mes
                </Text>
              )}

              <Paragraph style={styles.planDescription}>
                {plan.description}
              </Paragraph>

              <View style={styles.planFeatures}>
                <Text style={styles.featuresTitle}>Características:</Text>

                {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Icon name="check" size={16} color="#4CAF50" />
                    <Text style={styles.featureText}>{mejorarTextoCaracteristica(feature)}</Text>
                  </View>
                ))}

                {/* Features por defecto si no hay en la base de datos o si no es array */}
                {(!Array.isArray(plan.features) || plan.features.length === 0) && (
                  <>
                    <View style={styles.featureItem}>
                      <Icon name="check" size={16} color="#4CAF50" />
                      <Text style={styles.featureText}>
                        {plan.recipe_limit === -1 ? 'Recetas ilimitadas' : `${plan.recipe_limit} recetas/mes`}
                      </Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Icon name="check" size={16} color="#4CAF50" />
                      <Text style={styles.featureText}>Adaptaciones con IA</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <Icon name="check" size={16} color="#4CAF50" />
                      <Text style={styles.featureText}>Soporte prioritario</Text>
                    </View>
                  </>
                )}
              </View>

              <Divider style={styles.planDivider} />

              <Button
                mode={plan.is_popular ? "contained" : "outlined"}
                onPress={() => handleSubscribe(plan)}
                style={[
                  styles.subscribeButton,
                  plan.is_popular && styles.popularSubscribeButton
                ]}
                disabled={hasActive && currentSubscription?.plan?.id === plan.id}
              >
                {hasActive && currentSubscription?.plan?.id === plan.id
                  ? 'Plan Actual'
                  : 'Suscribirse'
                }
              </Button>
            </Card.Content>
          </Card>
        ))}
      </View>

      {/* Footer Info */}
      <Card style={styles.footerCard}>
        <Card.Content>
          <Title style={styles.footerTitle}>Información Importante</Title>

          <View style={styles.footerItem}>
            <Icon name="shield-check" size={20} color="#4CAF50" />
            <Text style={styles.footerText}>
              Pago seguro procesado por Stripe
            </Text>
          </View>

          <View style={styles.footerItem}>
            <Icon name="autorenew" size={20} color="#2196F3" />
            <Text style={styles.footerText}>
              Cancela en cualquier momento
            </Text>
          </View>

          <View style={styles.footerItem}>
            <Icon name="gift" size={20} color="#FF9800" />
            <Text style={styles.footerText}>
              7 días de prueba gratuita
            </Text>
          </View>

          <View style={styles.footerItem}>
            <Icon name="headset" size={20} color="#9C27B0" />
            <Text style={styles.footerText}>
              Soporte 24/7 disponible
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4B5563',
  },
  header: {
    alignItems: 'center',
    padding: 30,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#4B5563',
    lineHeight: 24,
  },
  currentSubscriptionCard: {
    margin: 20,
    marginBottom: 15,
    elevation: 3,
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  currentSubscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  currentSubscriptionTitle: {
    marginLeft: 10,
    fontSize: 18,
    color: '#1F2937',
  },
  currentPlanName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  currentPlanPrice: {
    fontSize: 20,
    color: '#4CAF50',
    marginBottom: 15,
  },
  trialChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF3E0',
    marginBottom: 15,
  },
  trialChipText: {
    color: '#E65100',
  },
  subscriptionActions: {
    marginTop: 10,
  },
  cancelButton: {
    borderColor: '#F44336',
  },
  trialBanner: {
    margin: 20,
    marginBottom: 15,
    elevation: 2,
    backgroundColor: '#FFF8E1',
  },
  trialBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trialBannerText: {
    marginLeft: 15,
    flex: 1,
  },
  trialBannerTitle: {
    fontSize: 18,
    color: '#E65100',
    marginBottom: 5,
  },
  trialBannerSubtitle: {
    color: '#EF6C00',
  },
  plansContainer: {
    padding: 20,
    paddingTop: 0,
  },
  planCard: {
    marginBottom: 20,
    elevation: 2,
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    color: '#1F2937',
  },
  popularChip: {
    backgroundColor: '#E3F2FD',
  },
  popularChipText: {
    color: '#1976D2',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 15,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  planPeriod: {
    fontSize: 18,
    color: '#4B5563',
    marginLeft: 5,
  },
  planDescription: {
    textAlign: 'center',
    color: '#4B5563',
    marginBottom: 20,
    lineHeight: 22,
  },
  planFeatures: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  planDivider: {
    marginBottom: 20,
  },
  subscribeButton: {
    borderRadius: 8,
  },
  popularSubscribeButton: {
    backgroundColor: '#1976D2',
  },
  footerCard: {
    margin: 20,
    marginTop: 0,
    elevation: 2,
  },
  footerTitle: {
    fontSize: 18,
    marginBottom: 15,
    color: '#1F2937',
    fontWeight: '600',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerText: {
    marginLeft: 15,
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  // Estilos para toggle mensual/anual
  billingToggleContainer: {
    margin: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  billingToggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  billingButton: {
    minWidth: 80,
    marginHorizontal: 2,
  },
  activeBillingButton: {
    elevation: 2,
  },
  discountText: {
    marginTop: 8,
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  monthlyEquivalent: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
    fontStyle: 'italic',
  },
});

export default SubscriptionScreen;