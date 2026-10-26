import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import { webViewBaseUrl, webViewOriginWhitelist } from '../config/webView';
import { colors } from '../constants/colors';
import { bleProvisioning } from '../services/bleProvisioning';
import webBundle from '../webBundle';
import { WebViewLoading } from './WebViewLoading';

export function HidroSmartWebView() {
  const webViewRef = useRef(null);

  const sendToWeb = (type, payload = {}) => {
    const message = JSON.stringify({ type, payload });
    const script = `
      window.dispatchEvent(new MessageEvent('message', {
        data: ${JSON.stringify(message)}
      }));
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
  };

  const handleMessage = async (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case 'BLE_SCAN_START':
          sendToWeb('BLE_SCAN_STARTED');
          await bleProvisioning.scan((result) => {
            sendToWeb(
              result.type === 'device' ? 'BLE_DEVICE_FOUND' : 'BLE_ERROR',
              result.type === 'device' ? result.device : { message: result.message }
            );
          });
          break;
        case 'BLE_SCAN_STOP':
          bleProvisioning.stopScan();
          sendToWeb('BLE_SCAN_STOPPED');
          break;
        case 'BLE_CONNECT': {
          const connected = await bleProvisioning.connect(message.payload?.deviceId, (status) => {
            sendToWeb('BLE_STATUS', status);
          });
          sendToWeb('BLE_CONNECTED', connected);
          break;
        }
        case 'BLE_PROVISION':
          await bleProvisioning.provision(message.payload || {});
          sendToWeb('BLE_CONFIG_SENT');
          break;
        case 'BLE_DISCONNECT':
          await bleProvisioning.disconnect();
          sendToWeb('BLE_DISCONNECTED');
          break;
        default:
          break;
      }
    } catch (error) {
      sendToWeb('BLE_ERROR', {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

  useEffect(() => () => bleProvisioning.destroy(), []);

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={webViewOriginWhitelist}
      source={{ html: webBundle, baseUrl: webViewBaseUrl }}
      style={styles.webview}
      javaScriptEnabled
      domStorageEnabled
      allowFileAccess
      allowUniversalAccessFromFileURLs
      setSupportMultipleWindows={false}
      startInLoadingState
      onMessage={handleMessage}
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
