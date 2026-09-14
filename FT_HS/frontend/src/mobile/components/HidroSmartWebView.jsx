import React from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import { webViewBaseUrl, webViewOriginWhitelist } from '../config/webView';
import { colors } from '../constants/colors';
import webBundle from '../webBundle';
import { WebViewLoading } from './WebViewLoading';

export function HidroSmartWebView() {
  return (
    <WebView
      originWhitelist={webViewOriginWhitelist}
      source={{ html: webBundle, baseUrl: webViewBaseUrl }}
      style={styles.webview}
      javaScriptEnabled
      domStorageEnabled
      allowFileAccess
      allowUniversalAccessFromFileURLs
      setSupportMultipleWindows={false}
      startInLoadingState
      renderLoading={() => <WebViewLoading />}
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: colors.transparent,
  },
});
