const { Device } = require('../../../domain/entities/Device');

const VALID_STATUSES = new Set(['PENDING', 'BLE_READY', 'WIFI_CONNECTED', 'MQTT_CONNECTED', 'COMPLETE', 'FAILED']);

class UpdateDeviceProvisioning {
  constructor({ deviceRepository }) {
    this.deviceRepository = deviceRepository;
  }

  async execute({ userId, deviceId, hardwareId, provisioningStatus, provisioningError = null }) {
    if (!userId) throw new Error('El usuario autenticado es obligatorio');
    if (!this.isUuid(deviceId)) this.badRequest('deviceId no es valido');
    if (!VALID_STATUSES.has(String(provisioningStatus || '').trim().toUpperCase())) {
      this.badRequest('provisioningStatus no es valido');
    }
    const normalizedHardwareId = hardwareId === undefined || hardwareId === null || hardwareId === ''
      ? null
      : Device.optionalHardwareId(hardwareId);
    if (provisioningError !== null && provisioningError !== undefined &&
      (typeof provisioningError !== 'string' || provisioningError.trim().length > 255)) {
      this.badRequest('provisioningError no puede superar 255 caracteres');
    }

    const device = await this.deviceRepository.updateProvisioningForUser({
      userId,
      deviceId,
      hardwareId: normalizedHardwareId,
      provisioningStatus: String(provisioningStatus).trim().toUpperCase(),
      provisioningError: provisioningError?.trim() || null
    });
    if (!device) {
      const error = new Error('Dispositivo no encontrado');
      error.status = 404;
      throw error;
    }
    return device;
  }

  isUuid(value) {
    return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  badRequest(message) {
    const error = new Error(message);
    error.status = 400;
    throw error;
  }
}

module.exports = { UpdateDeviceProvisioning };
