export type HidroSmartBleDevice = {
  id: string;
  name: string;
  rssi?: number | null;
};

export type NativeBleStatus = {
  state?: string;
  hardwareId?: string;
  deviceCode?: string;
  firmwareVersion?: string;
  savedNetworks?: number;
  wifiConnected?: boolean;
  mqttConnected?: boolean;
  ssid?: string;
  ip?: string;
  rssi?: number;
  message?: string;
};

type NativeMessage = {
  type: string;
  payload?: unknown;
};

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

function sendNative(type: string, payload: Record<string, unknown> = {}) {
  if (!window.ReactNativeWebView) {
    throw new Error('Bluetooth móvil solo está disponible desde la app HidroSmart.');
  }
  window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isStatus(value: unknown): value is NativeBleStatus {
  return isRecord(value);
}

export const deviceProvisioning = {
  isAvailable() {
    return typeof window !== 'undefined' && Boolean(window.ReactNativeWebView);
  },

  scan() {
    sendNative('BLE_SCAN_START');
  },

  stopScan() {
    sendNative('BLE_SCAN_STOP');
  },

  connect(deviceId: string) {
    sendNative('BLE_CONNECT', { deviceId });
  },

  provision(payload: {
    ssid: string;
    password: string;
    mqttHost: string;
    mqttPort: number;
    deviceCode?: string;
  }) {
    sendNative('BLE_PROVISION', payload);
  },

  disconnect() {
    sendNative('BLE_DISCONNECT');
  },

  subscribe(callback: (message: NativeMessage) => void) {
    const handler = (event: MessageEvent) => {
      try {
        const data: unknown = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!isRecord(data) || typeof data.type !== 'string') return;
        callback({ type: data.type, payload: data.payload });
      } catch {
        // Ignora mensajes que no pertenecen al puente HidroSmart.
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  },
};

export type NativeBleProvisioningConnection = {
  deviceName: string;
  initialStatus: NativeBleStatus | null;
  write: (payload: {
    ssid: string;
    password: string;
    mqttHost: string;
    mqttPort: number;
    deviceCode?: string;
  }) => Promise<void>;
  disconnect: () => void;
};

export async function connectNativeBleProvisioning(
  onStatus: (status: NativeBleStatus) => void
): Promise<NativeBleProvisioningConnection> {
  if (!deviceProvisioning.isAvailable()) {
    throw new Error('La app nativa de HidroSmart no está disponible.');
  }

  return new Promise((resolve, reject) => {
    let connected = false;
    let connecting = false;
    let latestStatus: NativeBleStatus | null = null;
    let writeResolve: (() => void) | null = null;
    let writeReject: ((error: Error) => void) | null = null;
    let writeTimeout: ReturnType<typeof setTimeout> | null = null;
    let scanTimeout: ReturnType<typeof setTimeout> | null = null;
    let unsubscribe: () => void = () => undefined;

    const finishError = (error: Error) => {
      if (scanTimeout) clearTimeout(scanTimeout);
      if (writeTimeout) clearTimeout(writeTimeout);
      unsubscribe();
      if (writeReject) writeReject(error);
      if (!connected) reject(error);
    };

    const finishConnection = (name: string) => {
      if (scanTimeout) clearTimeout(scanTimeout);
      connected = true;
      resolve({
        deviceName: name || 'HidroSmart',
        initialStatus: latestStatus,
        write: (payload) =>
          new Promise<void>((resolveWrite, rejectWrite) => {
            if (!connected) {
              rejectWrite(new Error('El ESP32 no está conectado.'));
              return;
            }
            writeResolve = resolveWrite;
            writeReject = rejectWrite;
            writeTimeout = setTimeout(() => {
              writeResolve = null;
              writeReject = null;
              rejectWrite(new Error('El ESP32 no confirmó la configuración BLE.'));
            }, 15000);
            try {
              deviceProvisioning.provision(payload);
            } catch (error) {
              if (writeTimeout) clearTimeout(writeTimeout);
              writeResolve = null;
              writeReject = null;
              rejectWrite(error instanceof Error ? error : new Error(String(error)));
            }
          }),
        disconnect: () => {
          connected = false;
          unsubscribe();
          try {
            deviceProvisioning.disconnect();
          } catch {
            // La WebView puede estar cerrándose.
          }
        },
      });
    };

    unsubscribe = deviceProvisioning.subscribe((message) => {
      if (message.type === 'BLE_DEVICE_FOUND' && !connecting) {
        const device = isRecord(message.payload)
          ? (message.payload as Partial<HidroSmartBleDevice>)
          : {};
        if (!device.id) return;
        connecting = true;
        try {
          deviceProvisioning.connect(String(device.id));
        } catch (error) {
          finishError(error instanceof Error ? error : new Error(String(error)));
        }
        return;
      }

      if (message.type === 'BLE_STATUS' && isStatus(message.payload)) {
        latestStatus = message.payload;
        onStatus(message.payload);
        return;
      }

      if (message.type === 'BLE_CONNECTED' && isRecord(message.payload)) {
        finishConnection(
          typeof message.payload.name === 'string' ? message.payload.name : 'HidroSmart'
        );
        return;
      }

      if (message.type === 'BLE_CONFIG_SENT' && writeResolve) {
        if (writeTimeout) clearTimeout(writeTimeout);
        const resolveWrite = writeResolve;
        writeResolve = null;
        writeReject = null;
        resolveWrite();
        return;
      }

      if (message.type === 'BLE_ERROR') {
        const payload = isRecord(message.payload) ? message.payload : {};
        const error = new Error(
          typeof payload.message === 'string' ? payload.message : 'Error BLE'
        );
        if (writeReject) {
          if (writeTimeout) clearTimeout(writeTimeout);
          const rejectWrite = writeReject;
          writeResolve = null;
          writeReject = null;
          rejectWrite(error);
        } else {
          finishError(error);
        }
      }
    });

    try {
      deviceProvisioning.scan();
      scanTimeout = setTimeout(
        () => finishError(new Error('No se encontró un ESP32 HidroSmart cercano.')),
        20000
      );
    } catch (error) {
      finishError(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
