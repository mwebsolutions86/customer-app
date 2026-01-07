import { Platform } from 'react-native';

export function platformShadow(webBox: string, nativeShadow?: Record<string, any>) {
  if (Platform.OS === 'web') return { boxShadow: webBox };
  return nativeShadow || {};
}

export default platformShadow;
