import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { useSubscription } from '../../hooks/useSubscription';
import { mockSubscriptionApi } from '../../services/mockSubscriptionApi';

export default function ManageSubscriptionScreen() {
  const navigation = useNavigation<any>();
  const { 
    subscription, 
    cancelSubscription,
    refreshSubscription,
    loading 
  } = useSubscription();
  
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingBilling, setLoadingBilling] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingBilling(true);
    try {
      const [history, methods] = await Promise.all([
        mockSubscriptionApi.getBillingHistory(5),
        mockSubscriptionApi.getPaymentMethods(),
      ]);
      setBillingHistory(history);
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingBilling(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshSubscription(),
      loadData(),
    ]);
    setRefreshing(false);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleChangePlan = () => {
    navigation.navigate('Payment');
  };

  const handleCancelSubscription = () => {
    if (!subscription || subscription.tier === 'free') {
      Alert.alert('No Active Subscription', 'You are currently on the free plan.');
      return;
    }

    Alert.alert(
      'Cancel Subscription',
      'Are you sure? You will be immediately downgraded to the free plan.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        { 
          text: 'Cancel & Downgrade', 
          style: 'destructive',
          onPress: async () => {
            await cancelSubscription();
            await loadData(); // Refresh data
            navigation.goBack(); // Return to profile after cancellation
          }
        },
      ]
    );
  };

  const handleUpdatePaymentMethod = () => {
    Alert.alert('Update Payment Method', 'This feature will be available soon.');
  };

  const handleDownloadInvoices = () => {
    Alert.alert('Download Invoices', 'Your invoices have been sent to your email.');
  };

  const handleUpdateBillingEmail = () => {
    Alert.alert('Update Billing Email', 'Feature coming soon!');
  };

  const handleRedeemPromo = () => {
    navigation.navigate('Payment');
  };

  const getTierDisplay = () => {
    if (!subscription) return { name: 'Free', color: Colors.black50 };
    
    switch (subscription.tier) {
      case 'premium':
        return { name: 'Premium Plan', color: Colors.warning };
      case 'plus':
        return { name: 'Plus Plan', color: Colors.primary };
      default:
        return { name: 'Free Plan', color: Colors.black50 };
    }
  };

  const tierDisplay = getTierDisplay();

  if (loading || loadingBilling) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading subscription...</Text>
        </View>
      </View>
    );
  }

  const isFreeTier = !subscription || subscription.tier === 'free';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Current Plan Card */}
        <View style={styles.planCard}>
          {subscription?.status === 'active' && !isFreeTier && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>ACTIVE</Text>
            </View>
          )}
          
          <Text style={styles.planLabel}>Current Plan</Text>
          <Text style={[styles.planName, { color: tierDisplay.color }]}>
            {tierDisplay.name}
          </Text>

          {!isFreeTier && (
            <>
              <View style={styles.planDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={styles.detailValue}>
                    ${subscription?.amount?.toFixed(2) || '0.00'}/
                    {subscription?.billingPeriod === 'yearly' ? 'year' : 
                    (subscription?.billingPeriod === 'monthly' ? 'month' : 
                      (subscription?.amount && subscription.amount >= 50 ? 'year' : 'month'))}
                  </Text>
                </View>
                
                {subscription?.nextBillingDate && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Next billing date</Text>
                    <Text style={styles.detailValue}>
                      {new Date(subscription.nextBillingDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Member since</Text>
                  <Text style={styles.detailValue}>
                    {subscription?.startDate 
                      ? new Date(subscription.startDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.planActions}>
                <TouchableOpacity 
                  style={styles.changePlanButton}
                  onPress={handleChangePlan}
                >
                  <Ionicons name="swap-horizontal" size={20} color={Colors.primary} />
                  <Text style={styles.changePlanText}>Change Plan</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleCancelSubscription}
                >
                  <Ionicons name="close-circle-outline" size={20} color={Colors.error} />
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {isFreeTier && (
            <View style={styles.freeActions}>
              <Text style={styles.freeText}>
                Upgrade to unlock premium features
              </Text>
              <TouchableOpacity 
                style={styles.upgradeButton}
                onPress={handleChangePlan}
              >
                <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Payment Method */}
        {!isFreeTier && paymentMethods.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            {paymentMethods.map((method, index) => (
              <TouchableOpacity 
                key={method.id}
                style={styles.paymentMethodItem}
                onPress={handleUpdatePaymentMethod}
              >
                <View style={styles.paymentMethodInfo}>
                  <Ionicons name="card-outline" size={24} color={Colors.black50} />
                  <View style={styles.paymentMethodDetails}>
                    <Text style={styles.paymentMethodType}>
                      {method.brand || 'Card'} •••• {method.last4}
                    </Text>
                    <Text style={styles.paymentMethodExpiry}>
                      {method.type === 'card' ? `Expires ${method.expiryMonth}/${method.expiryYear}` : 'Payment Method'}
                    </Text>
                  </View>
                  {method.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>DEFAULT</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.black50} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Billing History */}
        {billingHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.billingHeader}>
              <Text style={styles.sectionTitle}>Billing History</Text>
              <TouchableOpacity onPress={() => Alert.alert('View All', 'Full billing history coming soon!')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {billingHistory.map((item) => (
              <View key={item.id} style={styles.billingItem}>
                <View style={styles.billingInfo}>
                  <Text style={styles.billingDescription}>{item.description}</Text>
                  <Text style={styles.billingDate}>
                    {new Date(item.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
                <View style={styles.billingAmount}>
                  <Text style={styles.billingPrice}>${item.amount.toFixed(2)}</Text>
                  <Text style={[styles.billingStatus, { color: item.status === 'paid' ? Colors.success : Colors.warning }]}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Additional Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Options</Text>
          
          <TouchableOpacity style={styles.optionItem} onPress={handleDownloadInvoices}>
            <View style={styles.optionLeft}>
              <Ionicons name="download-outline" size={20} color={Colors.black50} />
              <Text style={styles.optionText}>Download All Invoices</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.black50} />
          </TouchableOpacity>

          {!isFreeTier && (
            <TouchableOpacity style={styles.optionItem} onPress={handleUpdateBillingEmail}>
              <View style={styles.optionLeft}>
                <Ionicons name="mail-outline" size={20} color={Colors.black50} />
                <Text style={styles.optionText}>Update Billing Email</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.black50} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.optionItem} onPress={handleRedeemPromo}>
            <View style={styles.optionLeft}>
              <Ionicons name="pricetag-outline" size={20} color={Colors.black50} />
              <Text style={styles.optionText}>Redeem Promo Code</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.black50} />
          </TouchableOpacity>
        </View>

        {/* Demo Notice */}
        <View style={styles.demoNotice}>
          <Ionicons name="information-circle" size={20} color={Colors.warning} />
          <Text style={styles.demoNoticeText}>
            This is a demo environment with mock data. No real charges are being processed.
          </Text>
        </View>

        {/* Support */}
        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>Need Help?</Text>
          <Text style={styles.supportText}>
            Contact our support team for assistance with billing or subscription issues.
          </Text>
          <TouchableOpacity 
            style={styles.supportButton}
            onPress={() => Alert.alert('Support', 'Opening support chat...')}
          >
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: Colors.black50,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  planCard: {
    backgroundColor: Colors.white,
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '600',
  },
  planLabel: {
    fontSize: 14,
    color: Colors.black50,
    fontWeight: '500',
    marginBottom: 4,
  },
  activeBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '600',
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  planDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.black20,
    paddingTop: 16,
    marginBottom: 20,
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
    color: Colors.text,
    fontWeight: '500',
  },
  planActions: {
    flexDirection: 'row',
    gap: 12,
  },
  changePlanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.orange[400],
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  changePlanText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.error,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.error,
  },
  reactivateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.success,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  reactivateText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.success,
  },
  freeActions: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  freeText: {
    fontSize: 14,
    color: Colors.black50,
    marginBottom: 16,
    textAlign: 'center',
  },
  upgradeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  billingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
    marginTop: 0,
  },
  contentGap: {
    gap: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodDetails: {
    marginLeft: 12,
    flex: 1,
  },
  paymentMethodType: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  paymentMethodExpiry: {
    fontSize: 12,
    color: Colors.black50,
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  defaultText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '600',
  },
  billingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  billingInfo: {
    flex: 1,
  },
  billingDescription: {
    fontSize: 14,
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
  },
  billingStatus: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.black20,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 14,
    color: Colors.text,
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
    fontSize: 12,
    color: Colors.text,
  },
  supportSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
    marginTop: 20,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: Colors.black50,
    textAlign: 'center',
    marginBottom: 16,
  },
  supportButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  supportButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});