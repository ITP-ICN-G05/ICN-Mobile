import React from 'react';
import {
  View,
  Image,
  StyleSheet
} from 'react-native';
import { CARD_RAISE } from '../constants/mapConstants';
import { Company } from '@/types';

interface Props {
  selectedCompany: Company | null;
  tabBarHeight: number;
  insets: any;
}

export default function Watermark({ selectedCompany, tabBarHeight, insets }: Props) {
  const watermarkBottom = selectedCompany
    ? CARD_RAISE + 16
    : Math.max(tabBarHeight + 12, (insets?.bottom ?? 0) + 24);

  return (
    <View 
      pointerEvents="none" 
      style={[styles.logoWatermark, { bottom: watermarkBottom }]}
    >
      <Image
        src='./assets/ICN Logo Source/ICN-logo-full2.png'
        style={styles.watermarkLogo}
        resizeMode="contain"
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logoWatermark: {
    position: 'absolute',
    left: 16,
    opacity: 0.9,
    zIndex: 100,
    elevation: 10
  },
  watermarkLogo: {
    width: 96,
    height: 40
  }
});