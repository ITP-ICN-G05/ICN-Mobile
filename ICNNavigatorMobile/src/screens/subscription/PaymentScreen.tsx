import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing } from '../../constants/colors';
import { useSubscription } from '../../hooks/useSubscription';
import { mockSubscriptionApi } from '../../services/mockSubscriptionApi';

type PlanType = 'free' | 'plus' | 'premium';
type BillingCycle = 'monthly' | 'yearly';
type PaymentMethod = 'apple' | 'google' | 'paypal' | 'mastercard' | 'visa';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: PlanType;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  discount?: string;
  features: PlanFeature[];
  recommended?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Basic/Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      { text: 'Company name & address access', included: true },
      { text: 'Items and sector information', included: true },
      { text: 'Website/contact details', included: true },
      { text: 'Basic export (CSV/PDF)', included: true },
      { text: 'News tab access', included: true },
      { text: 'ABN and company summary', included: false },
      { text: 'Capability types filtering', included: false },
      { text: 'ICN chat support', included: false },
      { text: 'Revenue & employee data', included: false },
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    discount: 'Save $19.89/year',
    features: [
      { text: 'Everything in Basic', included: true },
      { text: 'ABN and company summary', included: true },
      { text: 'Capability types filtering', included: true },
      { text: 'ICN chat support', included: true },
      { text: 'Limited export capabilities', included: true },
      { text: 'Gateway links access', included: true },
      { text: 'Company size filters', included: true },
      { text: 'Basic certifications info', included: true },
      { text: 'Revenue & employee count', included: false },
      { text: 'Diversity markers & full export', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    discount: 'Save $39.89/year',
    recommended: true,
    features: [
      { text: 'Everything in Plus', included: true },
      { text: 'Revenue & employee count data', included: true },
      { text: 'Diversity markers (Female/FN-owned)', included: true },
      { text: 'Advanced certifications', included: true },
      { text: 'Full export capabilities', included: true },
      { text: 'Local content percentage', included: true },
      { text: 'Demographic filters', included: true },
      { text: 'Priority support', included: true },
      { text: 'Advanced analytics access', included: true },
      { text: 'Enterprise API access (coming)', included: true },
    ],
  },
];

export default function PaymentScreen() {
  const navigation = useNavigation();
  const { 
    subscription, 
    currentTier, 
    createSubscription, 
    upgradeSubscription, 
    downgradeToFree,
    validatePromoCode,
    loading: subscriptionLoading 
  } = useSubscription();
  
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(() => {
    // Start with the next logical upgrade, but don't force it
    if (currentTier === 'free') return 'plus';
    if (currentTier === 'plus') return 'premium';
    return 'premium';
  });
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('apple');
  const [isProcessing, setIsProcessing] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [showEnterpriseInfo, setShowEnterpriseInfo] = useState(false);

  // Don't auto-change selection based on tier changes

  const handleBack = () => {
    navigation.goBack();
  };

  const getPrice = (plan: Plan) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getPriceText = (plan: Plan) => {
    const price = getPrice(plan);
    if (price === 0) return 'FREE';
    return `$${price.toFixed(2)}`;
  };

  const getBillingPeriodText = () => {
    return billingCycle === 'monthly' ? '/month' : '/year';
  };

  const getSavingsText = (plan: Plan) => {
    if (billingCycle === 'yearly' && plan.monthlyPrice > 0) {
      const monthlyCost = plan.monthlyPrice * 12;
      const yearlyCost = plan.yearlyPrice;
      const savings = monthlyCost - yearlyCost;
      if (savings > 0) {
        return `Save $${savings.toFixed(2)}/year`;
      }
    }
    return plan.discount || '';
  };

  const handleSelectPlan = (planId: PlanType) => {
    setSelectedPlan(planId);
  };

  const handleUpgrade = async () => {
    const plan = plans.find(p => p.id === selectedPlan);
    if (!plan) return;

    if (plan.id === 'free') {
      if (currentTier !== 'free') {
        // Downgrade to free
        setIsProcessing(true);
        const result = await downgradeToFree();
        setIsProcessing(false);
        
        if (result.success) {
          navigation.goBack();
        }
      } else {
        Alert.alert('Free Plan', 'You already have access to the free plan.');
      }
      return;
    }

    setIsProcessing(true);

    try {
      // Determine if this is a new subscription or an upgrade
      let result;
      if (currentTier === 'free') {
        // Create new subscription
        result = await createSubscription(
          plan.id as 'plus' | 'premium',
          billingCycle,
          selectedPaymentMethod,
          promoApplied ? promoCode : undefined
        );
      } else {
        // Upgrade existing subscription
        const planId = `${plan.id}_${billingCycle}`;
        result = await upgradeSubscription(planId);
      }

      if (result.success) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'apple':
        return 'logo-apple';
      case 'google':
        return 'logo-google';
      case 'paypal':
        return 'logo-paypal';
      case 'mastercard':
        return 'card';
      case 'visa':
        return 'card';
      default:
        return 'card';
    }
  };

  const getPaymentMethodName = (method: PaymentMethod) => {
    switch (method) {
      case 'apple':
        return 'Apple Pay';
      case 'google':
        return 'Google Pay';
      case 'paypal':
        return 'PayPal';
      case 'mastercard':
        return 'Mastercard';
      case 'visa':
        return 'Visa';
      default:
        return 'Credit Card';
    }
  };

  const handleApplyPromoCode = async () => {
    const validation = await validatePromoCode(promoCode);
    
    if (validation.valid) {
      setPromoDiscount(validation.discount);
      setPromoApplied(true);
      Alert.alert('Success', `Promo code applied! ${validation.discount}% discount`);
    } else {
      Alert.alert('Invalid Code', 'The promo code you entered is invalid or expired.');
      setPromoCode('');
    }
  };

  const getDiscountedPrice = (price: number) => {
    if (promoApplied && price > 0) {
      return price * (1 - promoDiscount / 100);
    }
    return price;
  };

  const getButtonText = () => {
    if (selectedPlan === 'free') {
      if (currentTier !== 'free') {
        return 'Downgrade to Free';
      }
      return 'Continue with Free';
    }
    
    if (currentTier === 'free') {
      return `Subscribe to ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}`;
    }
    
    if (selectedPlan === currentTier) {
      return 'Current Plan';
    }
    
    // Determine if it's an upgrade or downgrade
    const tierOrder = { free: 0, plus: 1, premium: 2 };
    if (tierOrder[selectedPlan] > tierOrder[currentTier]) {
      return `Upgrade to ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}`;
    } else {
      return `Change to ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}`;
    }
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);
  const basePrice = selectedPlanData ? getPrice(selectedPlanData) : 0;
  const totalPrice = getDiscountedPrice(basePrice);

  if (subscriptionLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 16, color: Colors.black50 }}>Loading subscription...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Safe area for top (Dynamic Island) */}
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose Your Plan</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* Billing Cycle Selector */}
        <View style={styles.billingCycleContainer}>
          <TouchableOpacity
            style={[styles.billingOption, billingCycle === 'monthly' && styles.billingOptionActive]}
            onPress={() => setBillingCycle('monthly')}
          >
            <Text style={[styles.billingText, billingCycle === 'monthly' && styles.billingTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.billingOption, billingCycle === 'yearly' && styles.billingOptionActive]}
            onPress={() => setBillingCycle('yearly')}
          >
            <Text style={[styles.billingText, billingCycle === 'yearly' && styles.billingTextActive]}>
              Yearly
            </Text>
            {billingCycle === 'yearly' && (
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>Save 15%</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Plans */}
        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              selectedPlan === plan.id && styles.planCardSelected,
              plan.recommended && styles.planCardRecommended,
              currentTier === plan.id && styles.planCardCurrent,
            ]}
            onPress={() => handleSelectPlan(plan.id)}
            disabled={false}
          >
            {plan.recommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>MOST POPULAR</Text>
              </View>
            )}
            
            {currentTier === plan.id && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentText}>CURRENT PLAN</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.planPrice}>{getPriceText(plan)}</Text>
                  {plan.monthlyPrice > 0 && (
                    <Text style={styles.planPeriod}>{getBillingPeriodText()}</Text>
                  )}
                </View>
                {getSavingsText(plan) ? (
                  <Text style={styles.planDiscount}>{getSavingsText(plan)}</Text>
                ) : null}
              </View>
              <View style={[
                styles.radioButton,
                selectedPlan === plan.id && styles.radioButtonSelected,
              ]}>
                {selectedPlan === plan.id && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </View>

            <View style={styles.featuresContainer}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons
                    name={feature.included ? 'checkmark-circle' : 'close-circle'}
                    size={18}
                    color={feature.included ? Colors.success : Colors.black50}
                  />
                  <Text style={[
                    styles.featureText,
                    !feature.included && styles.featureTextDisabled,
                  ]}>
                    {feature.text}
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}

        {/* Mock Payment Methods Section */}
        {selectedPlan !== 'free' && (
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment Method (Mock)</Text>
            <Text style={styles.mockNote}>This is a demo - no real payment will be processed</Text>
            
            <View style={styles.paymentMethods}>
              {(['apple', 'google', 'paypal'] as PaymentMethod[]).map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.paymentMethod,
                    selectedPaymentMethod === method && styles.paymentMethodSelected,
                  ]}
                  onPress={() => setSelectedPaymentMethod(method)}
                >
                  <Ionicons
                    name={getPaymentMethodIcon(method) as any}
                    size={24}
                    color={selectedPaymentMethod === method ? Colors.primary : Colors.black50}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Promotion Code Section */}
        {selectedPlan !== 'free' && (
          <View style={styles.promoSection}>
            <Text style={styles.sectionTitle}>Promotion Code (Try: WELCOME20)</Text>
            <View style={styles.promoInputContainer}>
              <TextInput
                style={styles.promoInput}
                placeholder="Enter promo code"
                placeholderTextColor={Colors.black50}
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
                editable={!promoApplied}
              />
              {promoApplied ? (
                <TouchableOpacity 
                  style={styles.promoRemoveButton}
                  onPress={() => {
                    setPromoCode('');
                    setPromoApplied(false);
                    setPromoDiscount(0);
                  }}
                >
                  <Ionicons name="close-circle" size={20} color={Colors.error} />
                  <Text style={styles.promoRemoveText}>Remove</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.promoApplyButton, !promoCode && styles.promoApplyButtonDisabled]}
                  onPress={handleApplyPromoCode}
                  disabled={!promoCode}
                >
                  <Text style={styles.promoApplyText}>Apply</Text>
                </TouchableOpacity>
              )}
            </View>
            {promoApplied && (
              <View style={styles.promoSuccessBadge}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.promoSuccessText}>
                  {promoDiscount}% discount applied!
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Order Summary */}
        {selectedPlan !== 'free' && (
          <View style={styles.orderSummary}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {selectedPlanData?.name} Plan ({billingCycle})
              </Text>
              <Text style={styles.summaryValue}>
                ${basePrice.toFixed(2)}
              </Text>
            </View>
            
            {promoApplied && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Promo Code ({promoCode.toUpperCase()})
                </Text>
                <Text style={styles.discountValue}>
                  -{promoDiscount}%
                </Text>
              </View>
            )}
            
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total (Mock)</Text>
              <View>
                {promoApplied && basePrice > 0 && (
                  <Text style={styles.originalPrice}>${basePrice.toFixed(2)}</Text>
                )}
                <Text style={styles.totalValue}>
                  ${totalPrice.toFixed(2)}{getBillingPeriodText()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Demo Notice */}
        <View style={styles.demoNotice}>
          <Ionicons name="information-circle" size={20} color={Colors.warning} />
          <Text style={styles.demoNoticeText}>
            This is a demo environment. No actual charges will be made.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Button - Safe area for bottom */}
      <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea}>
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.upgradeButton,
              (isProcessing || (selectedPlan === currentTier && selectedPlan !== 'free')) && styles.upgradeButtonDisabled,
            ]}
            onPress={handleUpgrade}
            disabled={isProcessing || (selectedPlan === currentTier && selectedPlan !== 'free')}
          >
            {isProcessing ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.upgradeButtonText}>
                  {getButtonText()}
                </Text>
                {totalPrice > 0 && (
                  <Text style={styles.upgradeButtonPrice}>
                    ${totalPrice.toFixed(2)}{getBillingPeriodText()} (Mock)
                  </Text>
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  safeTop: {
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  trialBanner: {
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  trialContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trialTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  trialSubtitle: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  billingCycleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  billingOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  billingOptionActive: {
    backgroundColor: Colors.primary,
  },
  billingText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  billingTextActive: {
    color: Colors.white,
  },
  saveBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  saveBadgeText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '600',
  },
  planCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.black20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  planCardRecommended: {
    borderColor: Colors.warning,
  },
  planCardCurrent: {
    backgroundColor: Colors.orange[400],
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    left: 16,
    backgroundColor: Colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.white,
  },
  currentBadge: {
    position: 'absolute',
    top: -10,
    left: 16,
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.white,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  planPeriod: {
    fontSize: 16,
    color: Colors.black50,
    marginLeft: 4,
  },
  planDiscount: {
    fontSize: 12,
    color: Colors.success,
    marginTop: 4,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.black50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  featuresContainer: {
    marginTop: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
  },
  featureTextDisabled: {
    color: Colors.black50,
    textDecorationLine: 'line-through',
  },
  paymentSection: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mockNote: {
    fontSize: 12,
    color: Colors.warning,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  paymentMethod: {
    flex: 1,
    aspectRatio: 1.5,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.black20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.orange[400],
  },
  orderSummary: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.black50,
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.black20,
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  promoSection: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promoInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  promoInput: {
    flex: 1,
    backgroundColor: Colors.orange[400],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.black20,
  },
  promoApplyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    justifyContent: 'center',
    borderRadius: 8,
  },
  promoApplyButtonDisabled: {
    backgroundColor: Colors.black50,
  },
  promoApplyText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  promoRemoveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 4,
  },
  promoRemoveText: {
    color: Colors.error,
    fontSize: 14,
  },
  promoSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  promoSuccessText: {
    color: Colors.success,
    fontSize: 13,
  },
  discountValue: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '600',
  },
  originalPrice: {
    fontSize: 12,
    color: Colors.black50,
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '20',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  demoNoticeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  bottomSafeArea: {
    backgroundColor: Colors.white,
  },
  bottomContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.black20,
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeButtonDisabled: {
    backgroundColor: Colors.black50,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
  upgradeButtonPrice: {
    fontSize: 14,
    color: Colors.white,
    marginTop: 4,
    opacity: 0.9,
  },
});