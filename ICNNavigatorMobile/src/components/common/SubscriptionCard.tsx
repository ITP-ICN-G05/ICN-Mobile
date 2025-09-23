import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface SubscriptionCardProps {
  plan: 'free' | 'plus' | 'premium';
  renewalDate?: string;
  monthlyPrice?: number;
  onUpgrade?: () => void;
  onManage?: () => void;
  onCancel?: () => void;
}

export default function SubscriptionCard({
  plan,
  renewalDate,
  monthlyPrice,
  onUpgrade,
  onManage,
  onCancel,
}: SubscriptionCardProps) {
  const getPlanDetails = () => {
    switch (plan) {
      case 'free':
        return {
          name: 'Free',
          color: Colors.black50,
          icon: 'person-outline',
          features: ['10 Basic Services', '2 exports/month'],
        };
      case 'plus':
        return {
          name: 'Plus',
          color: Colors.primary,
          icon: 'star-outline',
          features: ['50 exports/month', 'Advanced filters', 'Save up to 50 companies'],
        };
      case 'premium':
        return {
          name: 'Premium',
          color: Colors.warning,
          icon: 'star',
          features: ['Unlimited exports', 'All features', 'Priority support'],
        };
      default:
        return {
          name: 'Free',
          color: Colors.black50,
          icon: 'person-outline',
          features: [],
        };
    }
  };

  const planDetails = getPlanDetails();

  const handleCancelSubscription = () => {
    // Direct cancellation without dialog
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.planBadge, { backgroundColor: planDetails.color }]}>
          <Ionicons name={planDetails.icon as any} size={20} color={Colors.white} />
          <Text style={styles.planName}>{planDetails.name}</Text>
        </View>
        
        {plan !== 'free' && monthlyPrice && (
          <View>
            <Text style={styles.price}>${monthlyPrice}/month</Text>
            {renewalDate && (
              <Text style={styles.renewalText}>Renews {renewalDate}</Text>
            )}
          </View>
        )}
      </View>

      {/* Features */}
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>Your Plan Features:</Text>
        {planDetails.features.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {plan === 'free' ? (
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Ionicons name="rocket-outline" size={18} color={Colors.white} />
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.manageButton} onPress={onManage}>
              <Text style={styles.manageButtonText}>Manage Subscription</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSubscription}>
              <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
            </TouchableOpacity>
          </>
        )}
        // In the actions section, update the price display logic
        {plan !== 'free' && (
          <View>
            {monthlyPrice ? (
              <>
                <Text style={styles.price}>${monthlyPrice.toFixed(2)}/month</Text>
                {renewalDate && (
                  <Text style={styles.renewalText}>Renews {renewalDate}</Text>
                )}
              </>
            ) : (
              <>
                {/* For yearly plans without monthlyPrice, show appropriate pricing */}
                <Text style={styles.price}>
                  {plan === 'plus' ? '$99.99/year' : plan === 'premium' ? '$199.99/year' : ''}
                </Text>
                {renewalDate && (
                  <Text style={styles.renewalText}>Renews {renewalDate}</Text>
                )}
              </>
            )}
          </View>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'right',
  },
  renewalText: {
    fontSize: 12,
    color: Colors.black50,
    marginTop: 2,
    textAlign: 'right',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.black50,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  actions: {
    gap: 8,
  },
  upgradeButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  manageButton: {
    backgroundColor: Colors.orange[400],
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  manageButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  cancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: Colors.error,
    textDecorationLine: 'underline',
  },
});