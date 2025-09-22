import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { useUserTier } from '../../contexts/UserTierContext';
import { subscriptionApi, Subscription } from '../../services/subscriptionApi';

// Use the Subscription type directly from the API service
// Remove the duplicate SubscriptionDetails interface

interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  invoiceUrl?: string;
}

export default function ManageSubscriptionScreen() {
  const navigation = useNavigation();
  const { currentTier, setCurrentTier } = useUserTier();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSubscriptionDetails();
  }, []);

  const loadSubscriptionDetails = async () => {
    try {
      setLoading(true);
      const [subDetails, history] = await Promise.all([
        subscriptionApi.getSubscription(),
        subscriptionApi.getBillingHistory(),
      ]);
      
      setSubscription(subDetails);
      setBillingHistory(history);
    } catch (error) {
      console.error('Failed to load subscription:', error);
      // Mock data for testing - ensure it matches the Subscription type
      setSubscription({
        id: 'sub_123',
        userId: 'user_123',
        tier: currentTier as any,
        status: 'active',
        startDate: '2025-01-15',
        nextBillingDate: '2025-02-15', // Optional in type, but we provide it here
        amount: currentTier === 'premium' ? 19.99 : 9.99,
        currency: 'USD',
        paymentMethod: {
          id: 'pm_123',
          type: 'card',
          last4: '4242',
          brand: 'Visa',
          isDefault: true,
        },
        autoRenew: true,
        cancelAtPeriodEnd: false,
      });
      
      setBillingHistory([
        {
          id: '1',
          date: '2025-01-15',
          amount: 9.99,
          status: 'paid',
          description: 'Plus Monthly Subscription',
        },
        {
          id: '2',
          date: '2024-12-15',
          amount: 9.99,
          status: 'paid',
          description: 'Plus Monthly Subscription',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You\'ll continue to have access until the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        { 
          text: 'Cancel Subscription', 
          style: 'destructive',
          onPress: processCancellation,
        },
      ]
    );
  };

  const processCancellation = async () => {
    setProcessing(true);
    try {
      await subscriptionApi.cancelSubscription();
      
      setSubscription(prev => prev ? {
        ...prev,
        cancelAtPeriodEnd: true,
        status: 'cancelled',
      } : null);
      
      Alert.alert(
        'Subscription Cancelled',
        `Your subscription will end on ${subscription?.nextBillingDate || 'the end of your billing period'}. You'll continue to have access until then.`
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to cancel subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setProcessing(true);
    try {
      const reactivatedSub = await subscriptionApi.reactivateSubscription();
      setSubscription(reactivatedSub);
      
      Alert.alert('Success', 'Your subscription has been reactivated!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reactivate subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdatePaymentMethod = () => {
    navigation.navigate('UpdatePayment' as never);
  };

  const handleChangePlan = () => {
    navigation.navigate('Payment' as never);
  };

  const handleDownloadInvoice = async (invoice: BillingHistory) => {
    if (invoice.invoiceUrl) {
      // Download or open invoice
      Alert.alert('Invoice', 'Opening invoice...');
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return 'N/A';
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!subscription || currentTier === 'free') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.emptyState}>
          <Ionicons name="card-outline" size={64} color={Colors.black50} />
          <Text style={styles.emptyTitle}>No Active Subscription</Text>
          <Text style={styles.emptyText}>
            You're currently on the Free plan. Upgrade to access premium features!
          </Text>
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={handleChangePlan}
          >
            <Text style={styles.upgradeButtonText}>View Plans</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Current Plan Card */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planLabel}>Current Plan</Text>
              <Text style={styles.planName}>
                {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan
              </Text>
            </View>
            <View style={[
              styles.statusBadge,
              subscription.status === 'active' ? styles.statusActive : styles.statusCancelled
            ]}>
              <Text style={styles.statusText}>
                {subscription.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.planDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(subscription.amount)}/month
              </Text>
            </View>
            
            {subscription.nextBillingDate && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Next billing date</Text>
                <Text style={styles.detailValue}>
                  {formatDate(subscription.nextBillingDate)}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Member since</Text>
              <Text style={styles.detailValue}>
                {formatDate(subscription.startDate)}
              </Text>
            </View>

            {subscription.cancelAtPeriodEnd && subscription.nextBillingDate && (
              <View style={styles.cancelNotice}>
                <Ionicons name="information-circle" size={20} color={Colors.warning} />
                <Text style={styles.cancelNoticeText}>
                  Your subscription will end on {formatDate(subscription.nextBillingDate)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.planActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleChangePlan}
            >
              <Ionicons name="swap-horizontal-outline" size={20} color={Colors.primary} />
              <Text style={styles.actionButtonText}>Change Plan</Text>
            </TouchableOpacity>

            {subscription.cancelAtPeriodEnd ? (
              <TouchableOpacity 
                style={[styles.actionButton, styles.reactivateButton]}
                onPress={handleReactivateSubscription}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color={Colors.success} />
                ) : (
                  <>
                    <Ionicons name="refresh-outline" size={20} color={Colors.success} />
                    <Text style={[styles.actionButtonText, { color: Colors.success }]}>
                      Reactivate
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancelSubscription}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color={Colors.error} />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={20} color={Colors.error} />
                    <Text style={[styles.actionButtonText, { color: Colors.error }]}>
                      Cancel
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Payment Method */}
        {subscription.paymentMethod && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <TouchableOpacity 
              style={styles.paymentCard}
              onPress={handleUpdatePaymentMethod}
            >
              <View style={styles.paymentInfo}>
                <Ionicons 
                  name={subscription.paymentMethod.type === 'card' ? 'card' : 'logo-paypal'} 
                  size={24} 
                  color={Colors.text} 
                />
                <View style={styles.paymentDetails}>
                  {subscription.paymentMethod.type === 'card' ? (
                    <>
                      <Text style={styles.paymentText}>
                        {subscription.paymentMethod.brand} •••• {subscription.paymentMethod.last4}
                      </Text>
                      <Text style={styles.paymentSubtext}>Credit Card</Text>
                    </>
                  ) : (
                    <Text style={styles.paymentText}>PayPal</Text>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.black50} />
            </TouchableOpacity>
          </View>
        )}

        {/* Billing History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Billing History</Text>
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {billingHistory.map((item) => (
            <TouchableOpacity 
              key={item.id}
              style={styles.billingItem}
              onPress={() => handleDownloadInvoice(item)}
            >
              <View style={styles.billingInfo}>
                <Text style={styles.billingDescription}>{item.description}</Text>
                <Text style={styles.billingDate}>{formatDate(item.date)}</Text>
              </View>
              <View style={styles.billingAmount}>
                <Text style={styles.billingPrice}>{formatCurrency(item.amount)}</Text>
                <View style={[
                  styles.billingStatus,
                  item.status === 'paid' && styles.statusPaid,
                  item.status === 'pending' && styles.statusPending,
                  item.status === 'failed' && styles.statusFailed,
                ]}>
                  <Text style={styles.billingStatusText}>{item.status}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Additional Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Options</Text>
          
          <TouchableOpacity style={styles.optionItem}>
            <Ionicons name="download-outline" size={20} color={Colors.text} />
            <Text style={styles.optionText}>Download All Invoices</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.black50} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <Ionicons name="mail-outline" size={20} color={Colors.text} />
            <Text style={styles.optionText}>Update Billing Email</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.black50} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem}>
            <Ionicons name="card-outline" size={20} color={Colors.text} />
            <Text style={styles.optionText}>Redeem Promo Code</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.black50} />
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.supportSection}>
          <Ionicons name="help-circle-outline" size={24} color={Colors.primary} />
          <Text style={styles.supportText}>
            Need help with your subscription?
          </Text>
          <TouchableOpacity style={styles.supportButton}>
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.black50,
    textAlign: 'center',
    marginBottom: 24,
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  upgradeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  planCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  planLabel: {
    fontSize: 12,
    color: Colors.black50,
    marginBottom: 4,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: Colors.success + '30',
  },
  statusCancelled: {
    backgroundColor: Colors.error + '30',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text,
  },
  planDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.black20,
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.black50,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  cancelNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '20',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  cancelNoticeText: {
    fontSize: 13,
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
  },
  planActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 6,
  },
  cancelButton: {
    borderColor: Colors.error,
  },
  reactivateButton: {
    borderColor: Colors.success,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
  },
  paymentCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentDetails: {
    gap: 2,
  },
  paymentText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  paymentSubtext: {
    fontSize: 12,
    color: Colors.black50,
  },
  billingItem: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billingInfo: {
    flex: 1,
  },
  billingDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  billingDate: {
    fontSize: 12,
    color: Colors.black50,
  },
  billingAmount: {
    alignItems: 'flex-end',
  },
  billingPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  billingStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusPaid: {
    backgroundColor: Colors.success + '30',
  },
  statusPending: {
    backgroundColor: Colors.warning + '30',
  },
  statusFailed: {
    backgroundColor: Colors.error + '30',
  },
  billingStatusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  optionItem: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    marginLeft: 12,
  },
  supportSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  supportText: {
    fontSize: 14,
    color: Colors.black50,
    marginVertical: 8,
  },
  supportButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginTop: 8,
  },
  supportButtonText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});