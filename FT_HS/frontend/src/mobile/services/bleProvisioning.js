import { BleManager, State } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
import { decode, encode } from 'base-64';

export const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
export const CONFIG_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
export const STATUS_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a9';

class BleProvisioningService {
  constructor() {
    this.manager = new BleManager();
    this.device = null;
    this.monitorSubscription = null;
  }

  async requestPermissions() {
    if (Platform.OS !== 'android') return true;

    if (Number(Platform.Version) >= 31) {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      return (
        result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
          PermissionsAndroid.RESULTS.GRANTED
      );
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  async ensureBluetooth() {
    const state = await this.manager.state();
    if (state !== State.PoweredOn) {
      throw new Error('Activa el Bluetooth del teléfono.');
    }
    return true;
  }

  async scan(onResult) {
    if (!(await this.requestPermissions())) {
      throw new Error('HidroSmart necesita permiso de Bluetooth.');
    }
    await this.ensureBluetooth();
    this.manager.stopDeviceScan();
    this.manager.startDeviceScan([SERVICE_UUID], null, (error, device) => {
      if (error) {
        onResult({ type: 'error', message: error.message });
        return;
      }
      if (!device) return;

      const name = device.name || device.localName || '';
      if (!name.startsWith('HidroSmart-')) return;
      onResult({
        type: 'device',
        device: { id: device.id, name, rssi: device.rssi },
      });
    });
  }

  stopScan() {
    this.manager.stopDeviceScan();
  }

  async connect(deviceId, onStatus) {
    this.stopScan();
    let device = await this.manager.connectToDevice(deviceId, { autoConnect: false });
    device = await device.discoverAllServicesAndCharacteristics();

    if (Platform.OS === 'android') {
      try {
        device = await device.requestMTU(185);
      } catch {
        // La conexión sigue siendo válida aunque el MTU no cambie.
      }
    }

    this.device = device;

    let lastReadError = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const characteristic = await device.readCharacteristicForService(SERVICE_UUID, STATUS_UUID);
        if (characteristic.value) {
          onStatus(this.parseStatus(decode(characteristic.value)));
          lastReadError = null;
          break;
        }
      } catch (error) {
        lastReadError = error;
      }

      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    if (lastReadError) {
      onStatus({ state: 'ble_read_error', message: lastReadError.message });
    }

    this.monitorSubscription = device.monitorCharacteristicForService(
      SERVICE_UUID,
      STATUS_UUID,
      (error, characteristic) => {
        if (error) {
          onStatus({ state: 'ble_error', message: error.message });
          return;
        }
        if (characteristic?.value) {
          onStatus(this.parseStatus(decode(characteristic.value)));
        }
      }
    );

    return {
      id: device.id,
      name: device.name || device.localName || 'HidroSmart',
    };
  }

  parseStatus(message) {
    try {
      return JSON.parse(message);
    } catch {
      return { state: 'unknown', message };
    }
  }

  async provision({ ssid, password, mqttHost, mqttPort = 1883, deviceCode }) {
    if (!this.device) throw new Error('No hay ESP32 conectado.');

    const payload = JSON.stringify({
      ssid,
      password,
      mqttHost,
      mqttPort,
      ...(deviceCode ? { deviceCode } : {}),
    });
    await this.device.writeCharacteristicWithResponseForService(
      SERVICE_UUID,
      CONFIG_UUID,
      encode(payload)
    );
  }

  async disconnect() {
    this.monitorSubscription?.remove();
    this.monitorSubscription = null;
    if (this.device) {
      try {
        await this.device.cancelConnection();
      } catch {
        // El dispositivo ya puede estar desconectado.
      }
    }
    this.device = null;
  }

  destroy() {
    this.monitorSubscription?.remove();
    this.monitorSubscription = null;
    this.manager.destroy();
  }
}

export const bleProvisioning = new BleProvisioningService();
