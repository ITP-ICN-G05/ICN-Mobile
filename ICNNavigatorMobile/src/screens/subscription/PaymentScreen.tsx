import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { useUserTier } from '../../contexts/UserTierContext';
import { subscriptionApi } from '../../services/subscriptionApi';

interface PlanOption {
  id: string;
  tier: 'free' | 'plus' | 'premium';
  name: string;
  price: number;
  period: 'month' | 'year';
  description: string;
  features: string[];
  highlighted?: boolean;
  discount?: string;
}

const plans: PlanOption[] = [
  {
    id: 'free',
    tier: 'free',
    name: 'Free',
    price: 0,
    period: 'month',
    description: 'Perfect for getting started',
    features: [
      '100 searches per month',
      '10 saved companies',
      'Basic filters',
      '10 exports per month',
      'Email support',
    ],
  },
  {
    id: 'plus_monthly',
    tier: 'plus',
    name: 'Plus',
    price: 9.99,
    period: 'month',
    description: 'Great for small businesses',
    features: [
      '500 searches per month',
      '50 saved companies',
      'Advanced filters',
      'Company size filter',
      'Diversity filters',
      '50 exports per month',
      'Priority support',
      'Bookmark folders',
    ],
    highlighted: true,
  },
  {
    id: 'premium_monthly',
    tier: 'premium',
    name: 'Premium',
    price: 19.99,
    period: 'month',
    description: 'For power users',
    features: [
      'Unlimited searches',
      'Unlimited saved companies',
      'All advanced filters',
      'Revenue data access',
      'Unlimited exports',
      'API access',
      'Phone support',
      'Custom reports',
      'Team collaboration',
    ],
    discount: 'BEST VALUE',
  },
];

export default function PaymentScreen() {
  const navigation = useNavigation();
  const { currentTier, setCurrentTier } = useUserTier();
  const [selectedPlan, setSelectedPlan] = useState<PlanOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');

  useEffect(() => {
    // Pre-select current plan
    const current = plans.find(p => p.tier === currentTier);
    if (current) setSelectedPlan(current);
  }, [currentTier]);

  const handleSelectPlan = (plan: PlanOption) => {
    if (plan.tier === currentTier) {
      Alert.alert('Current Plan', 'You are already on this plan.');
      return;
    }
    setSelectedPlan(plan);
  };

  const calculateYearlyPrice = (monthlyPrice: number) => {
    // 20% discount for yearly
    return (monthlyPrice * 12 * 0.8).toFixed(2);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      Alert.alert('No Plan Selected', 'Please select a subscription plan.');
      return;
    }

    if (selectedPlan.tier === 'free') {
      // Downgrade to free
      Alert.alert(
        'Downgrade to Free',
        'Are you sure you want to downgrade to the Free plan? You will lose access to premium features.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Downgrade', 
            style: 'destructive',
            onPress: () => processFreeDowngrade()
          }
        ]
      );
      return;
    }

    setProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Process payment with your payment provider
      const paymentResult = await processPayment();
      
      if (paymentResult.success) {
        // Update subscription on backend
        await subscriptionApi.createSubscription({
          tier: selectedPlan.tier,
          planId: selectedPlan.id,
          billingPeriod: billingPeriod,
          paymentMethodId: paymentResult.paymentMethodId,
        });
        
        // Update local state
        setCurrentTier(selectedPlan.tier);
        
        Alert.alert(
          'Success!',
          `You've successfully subscribed to ${selectedPlan.name}!`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Payment Failed',
        error.message || 'There was an error processing your payment. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const processPayment = async () => {
    // TODO: Integrate with Stripe, RevenueCat, or your payment provider
    // This is a mock implementation
    
    // For Stripe:
    // const { paymentIntent } = await stripe.confirmPayment({...});
    
    // For RevenueCat:
    // const { customerInfo } = await Purchases.purchasePackage(package);
    
    return {
      success: true,
      paymentMethodId: 'pm_mock_123',
      subscriptionId: 'sub_mock_123',
    };
  };

  const processFreeDowngrade = async () => {
    setProcessing(true);
    try {
      await subscriptionApi.cancelSubscription();
      setCurrentTier('free');
      
      Alert.alert(
        'Downgraded',
        'You have been downgraded to the Free plan.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to downgrade. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const renderPlanCard = (plan: PlanOption) => {
    const isCurrentPlan = plan.tier === currentTier;
    const isSelected = selectedPlan?.id === plan.id;
    const yearlyPrice = billingPeriod === 'yearly' && plan.price > 0 
      ? calculateYearlyPrice(plan.price) 
      : null;

    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          plan.highlighted && styles.planCardHighlighted,
          isSelected && styles.planCardSelected,
          isCurrentPlan && styles.planCardCurrent,
        ]}
        onPress={() => handleSelectPlan(plan)}
        activeOpacity={0.8}
      >
        {plan.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{plan.discount}</Text>
          </View>
        )}
        
        {isCurrentPlan && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentText}>CURRENT PLAN</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planDescription}>{plan.description}</Text>
        </View>

        <View style={styles.priceSection}>
          {plan.price === 0 ? (
            <Text style={styles.priceText}>Free</Text>
          ) : (
            <>
              <View style={styles.priceRow}>
                <Text style={styles.currency}>$</Text>
                <Text style={styles.price}>
                  {billingPeriod === 'yearly' && yearlyPrice 
                    ? yearlyPrice 
                    : plan.price}
                </Text>
                <Text style={styles.period}>
                  /{billingPeriod === 'yearly' ? 'year' : 'month'}
                </Text>
              </View>
              {billingPeriod === 'yearly' && plan.price > 0 && (
                <Text style={styles.monthlyCost}>
                  ${(parseFloat(yearlyPrice!) / 12).toFixed(2)}/month
                </Text>
              )}
            </>
          )}
        </View>

        <View style={styles.featuresSection}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons 
                name="checkmark-circle" 
                size={18} 
                color={plan.highlighted ? Colors.primary : Colors.success} 
              />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.selectButton,
            isSelected && styles.selectButtonActive,
            isCurrentPlan && styles.selectButtonCurrent,
          ]}
          onPress={() => handleSelectPlan(plan)}
        >
          <Text style={[
            styles.selectButtonText,
            isSelected && styles.selectButtonTextActive,
          ]}>
            {isCurrentPlan ? 'Current Plan' : isSelected ? 'Selected' : 'Select Plan'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Billing Period Toggle */}
        <View style={styles.billingToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              billingPeriod === 'monthly' && styles.toggleButtonActive,
            ]}
            onPress={() => setBillingPeriod('monthly')}
          >
            <Text style={[
              styles.toggleText,
              billingPeriod === 'monthly' && styles.toggleTextActive,
            ]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              billingPeriod === 'yearly' && styles.toggleButtonActive,
            ]}
            onPress={() => setBillingPeriod('yearly')}
          >
            <Text style={[
              styles.toggleText,
              billingPeriod === 'yearly' && styles.toggleTextActive,
            ]}>
              Yearly
            </Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveText}>Save 20%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {plans.map(renderPlanCard)}
        </View>

        {/* Payment Method Selection */}
        {selectedPlan && selectedPlan.price > 0 && (
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={[
                  styles.paymentMethod,
                  paymentMethod === 'card' && styles.paymentMethodActive,
                ]}
                onPress={() => setPaymentMethod('card')}
              >
                <Ionicons name="card-outline" size={24} color={Colors.text} />
                <Text style={styles.paymentMethodText}>Credit Card</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.paymentMethod,
                  paymentMethod === 'paypal' && styles.paymentMethodActive,
                ]}
                onPress={() => setPaymentMethod('paypal')}
              >
                <Ionicons name="logo-paypal" size={24} color={Colors.text} />
                <Text style={styles.paymentMethodText}>PayPal</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Features Comparison */}
        <TouchableOpacity 
          style={styles.compareButton}
          onPress={() => navigation.navigate('CompareePlans' as never)}
        >
          <Ionicons name="analytics-outline" size={20} color={Colors.primary} />
          <Text style={styles.compareText}>Compare all features</Text>
        </TouchableOpacity>

        {/* Terms */}
        <View style={styles.terms}>
          <Text style={styles.termsText}>
            By subscribing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
          <Text style={styles.termsText}>
            You can cancel anytime. No questions asked.
          </Text>
        </View>
      </ScrollView>

      {/* Subscribe Button */}
      {selectedPlan && (
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[
              styles.subscribeButton,
              processing && styles.subscribeButtonDisabled,
            ]}
            onPress={handleSubscribe}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.subscribeButtonText}>
                {selectedPlan.tier === 'free' 
                  ? 'Downgrade to Free'
                  : selectedPlan.tier === currentTier
                  ? 'Current Plan'
                  : `Subscribe to ${selectedPlan.name}`
                }
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  toggleTextActive: {
    color: Colors.white,
  },
  saveBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  saveText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '600',
  },
  plansContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  planCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.black20,
  },
  planCardHighlighted: {
    borderColor: Colors.primary,
  },
  planCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.orange[400],
  },
  planCardCurrent: {
    borderColor: Colors.success,
  },
  discountBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: Colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: '700',
  },
  currentBadge: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: '700',
  },
  planHeader: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: Colors.black50,
  },
  priceSection: {
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text,
  },
  priceText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text,
  },
  period: {
    fontSize: 16,
    color: Colors.black50,
    marginLeft: 4,
  },
  monthlyCost: {
    fontSize: 12,
    color: Colors.black50,
    marginTop: 4,
  },
  featuresSection: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 10,
    flex: 1,
  },
  selectButton: {
    backgroundColor: Colors.black20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonActive: {
    backgroundColor: Colors.primary,
  },
  selectButtonCurrent: {
    backgroundColor: Colors.success,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  selectButtonTextActive: {
    color: Colors.white,
  },
  paymentSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentMethod: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.black20,
  },
  paymentMethodActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.orange[400],
  },
  paymentMethodText: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 8,
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  compareText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 8,
    textDecorationLine: 'underline',
  },
  terms: {
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: Colors.black50,
    textAlign: 'center',
    marginBottom: 8,
  },
  termsLink: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.black20,
  },
  subscribeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});