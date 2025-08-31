import axios from 'axios';
import { Platform } from 'react-native';

// Replace with your Mac’s LAN IP (from `ipconfig getifaddr en0`)
const LAN_IP = 'http://192.168.1.23:8080';

// Android emulator uses 10.0.2.2 for localhost
const ANDROID_EMULATOR = 'http://10.0.2.2:8080';

// Decide base URL depending on platform
const base =
  Platform.OS === 'android' ? ANDROID_EMULATOR : LAN_IP;

// Allow override with EXPO_PUBLIC_API_URL
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || base,
});

export default api;
