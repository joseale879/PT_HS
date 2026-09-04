import { Platform, StatusBar } from 'react-native';

export const statusBarTopOffset = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
