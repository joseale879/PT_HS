import {
  connectNativeBleProvisioning,
  deviceProvisioning,
} from '@features/devices/provisioning/deviceProvisioning';

export const BLE_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
export const BLE_CONFIG_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
export const BLE_STATUS_CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a9';

export type BleProvisioningStatus = {
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
};

type BleCharacteristic = {
  value: DataView | null;
  readValue?: () => Promise<DataView>;
  startNotifications: () => Promise<BleCharacteristic>;
  writeValueWithResponse?: (value: BufferSource) => Promise<void>;
  writeValue?: (value: BufferSource) => Promise<void>;
  addEventListener: (type: 'characteristicvaluechanged', listener: EventListener) => void;
  removeEventListener: (type: 'characteristicvaluechanged', listener: EventListener) => void;
};

type BleService = {
  getCharacteristic: (uuid: string) => Promise<BleCharacteristic>;
};

type BleServer = {
  getPrimaryService: (uuid: string) => Promise<BleService>;
};

type BleDevice = {
  name?: string | null;
  gatt?: {
    connect: () => Promise<BleServer>;
    disconnect?: () => void;
  };
};

type BluetoothApi = {
  requestDevice: (options: {
    filters: Array<{ services: string[] }>;
    optionalServices?: string[];
  }) => Promise<BleDevice>;
};

type NavigatorWithBluetooth = Navigator & { bluetooth?: BluetoothApi };

export type BleProvisioningConnection = {
  deviceName: string;
  initialStatus: BleProvisioningStatus | null;
  write: (payload: BleProvisioningPayload) => Promise<void>;
  disconnect: () => void;
};

export type BleProvisioningPayload = {
  ssid: string;
  password: string;
  mqttHost: string;
  mqttPort: number;
  deviceCode?: string;
};

function getBluetooth(): BluetoothApi | null {
  if (typeof navigator === 'undefined') return null;
  return (navigator as NavigatorWithBluetooth).bluetooth || null;
}

function decodeStatus(value: DataView | null): BleProvisioningStatus | null {
  if (!value) return null;

  try {
    const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return parsed && typeof parsed === 'object' ? (parsed as BleProvisioningStatus) : null;
  } catch {
    return null;
  }
}

export function isBleProvisioningSupported(): boolean {
  return getBluetooth() !== null || deviceProvisioning.isAvailable();
}

export async function connectBleProvisioning(
  onStatus: (status: BleProvisioningStatus) => void
): Promise<BleProvisioningConnection> {
  if (deviceProvisioning.isAvailable()) {
    return connectNativeBleProvisioning(onStatus);
  }

  const bluetooth = getBluetooth();
  if (!bluetooth) {
    throw new Error('Web Bluetooth no está disponible. Usa Chrome/Edge en localhost o HTTPS.');
  }

  const device = await bluetooth.requestDevice({
    filters: [{ services: [BLE_SERVICE_UUID] }],
    optionalServices: [BLE_SERVICE_UUID],
  });
  if (!device.gatt) throw new Error('El dispositivo BLE no expone un servidor GATT.');

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(BLE_SERVICE_UUID);
  const configCharacteristic = await service.getCharacteristic(BLE_CONFIG_CHARACTERISTIC_UUID);
  const statusCharacteristic = await service.getCharacteristic(BLE_STATUS_CHARACTERISTIC_UUID);
  await statusCharacteristic.startNotifications();

  let initialStatus = decodeStatus(statusCharacteristic.value);
  if (statusCharacteristic.readValue) {
    try {
      initialStatus = decodeStatus(await statusCharacteristic.readValue());
    } catch {
      // La lectura inicial puede no estar disponible en algunos navegadores.
    }
  }

  const listener: EventListener = (event) => {
    const target = event.target as BleCharacteristic | null;
    const status = decodeStatus(target?.value || statusCharacteristic.value);
    if (status) onStatus(status);
  };
  statusCharacteristic.addEventListener('characteristicvaluechanged', listener);

  return {
    deviceName: device.name || 'HidroSmart',
    initialStatus,
    write: (payload) => writeBleProvisioning(configCharacteristic, payload),
    disconnect: () => {
      statusCharacteristic.removeEventListener('characteristicvaluechanged', listener);
      device.gatt?.disconnect?.();
    },
  };
}

export async function writeBleProvisioning(
  characteristic: BleCharacteristic,
  payload: BleProvisioningPayload
): Promise<void> {
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const value = encoded.buffer as ArrayBuffer;

  if (characteristic.writeValueWithResponse) {
    await characteristic.writeValueWithResponse(value);
    return;
  }
  if (characteristic.writeValue) {
    await characteristic.writeValue(value);
    return;
  }
  throw new Error('La característica BLE no permite escribir la configuración.');
}
