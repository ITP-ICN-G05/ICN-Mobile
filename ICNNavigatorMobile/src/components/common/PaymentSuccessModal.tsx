import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface PaymentSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  planName: string;
  amount: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  features?: string[];
}

const { width } = Dimensions.get('window');

export default function PaymentSuccessModal({
  visible,
  onClose,
  planName,
  amount,
  billingCycle,
  nextBillingDate,
  features = [],
}: PaymentSuccessModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate modal entrance
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(checkAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      checkAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible, scaleAnim, checkAnim, fadeAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Success Icon */}
          <View style={styles.successIconContainer}>
            <Animated.View
              style={[
                styles.successIcon,
                {
                  transform: [{ scale: checkAnim }],
                },
              ]}
            >
              <Ionicons name="checkmark" size={48} color={Colors.white} />
            </Animated.View>
          </View>

          {/* Success Message */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successSubtitle}>
              Welcome to {planName}
            </Text>

            {/* Payment Details */}
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount Paid</Text>
                <Text style={styles.detailValue}>{amount}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Billing Cycle</Text>
                <Text style={styles.detailValue}>
                  {billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Next Billing Date</Text>
                <Text style={styles.detailValue}>{nextBillingDate}</Text>
              </View>
            </View>

            {/* New Features Unlocked */}
            {features.length > 0 && (
              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>🎉 Features Unlocked</Text>
                {features.slice(0, 3).map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons
                      name="sparkles"
                      size={16}
                      color={Colors.warning}
                    />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Receipt Info */}
            <View style={styles.receiptInfo}>
              <Ionicons name="mail-outline" size={16} color={Colors.black50} />
              <Text style={styles.receiptText}>
                A receipt has been sent to your email
              </Text>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onClose}
            >
              <Text style={styles.primaryButtonText}>Start Exploring</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onClose}
            >
              <Text style={styles.secondaryButtonText}>View Receipt</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    width: width - 40,
    maxWidth: 400,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: Colors.black50,
    textAlign: 'center',
    marginBottom: 24,
  },
  detailsContainer: {
    backgroundColor: Colors.orange[400],
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  featuresContainer: {
    width: '100%',
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  receiptInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  receiptText: {
    fontSize: 13,
    color: Colors.black50,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});