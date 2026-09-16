import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../constants/colors';
import { statusBarTopOffset } from '../constants/layout';
import { AppStatusBar } from './AppStatusBar';

export function MobileShell({ children }) {
  return (
    <View style={styles.safeArea}>
      <AppStatusBar />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: statusBarTopOffset,
  },
});
