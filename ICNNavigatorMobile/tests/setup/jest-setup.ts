// 1) Polyfill TextEncoder/TextDecoder for JSDOM BEFORE importing MSW
import { TextEncoder, TextDecoder } from 'util';

if (!(global as any).TextEncoder) {
  (global as any).TextEncoder = TextEncoder;
}
if (!(global as any).TextDecoder) {
  // Some libs expect TextDecoder to accept 'utf-8'
  (global as any).TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
}

// 2) fetch polyfill
import 'whatwg-fetch';

// React Native Reanimated mock (v3-safe)
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// RN Maps basic mock
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Mock = (props: any) => React.createElement(View, { ...props, testID: 'mock-map' });
  return { __esModule: true, default: Mock, Marker: Mock, Callout: Mock, PROVIDER_GOOGLE: 'google' };
});

// Expo Location mock surface
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(async () => ({ coords: { latitude: -37.81, longitude: 144.96 } })),
}));