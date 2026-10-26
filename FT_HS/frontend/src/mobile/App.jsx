import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';

import { HidroSmartWebView } from './components/HidroSmartWebView';
import { MobileShell } from './components/MobileShell';

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    NavigationBar.setStyle('dark');
  }, []);

  return (
    <MobileShell>
      <NavigationBar style="dark" />
      <HidroSmartWebView />
    </MobileShell>
  );
}
