import React from 'react';
import { StatusBar } from 'react-native';

import { colors } from '../constants/colors';

export function AppStatusBar() {
  return <StatusBar barStyle="dark-content" backgroundColor={colors.background} translucent={false} />;
}
