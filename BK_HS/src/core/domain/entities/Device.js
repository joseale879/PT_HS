class Device {
  constructor({ id = null, code, name, type, hardwareId = null, location = null, manufacturer = null, model = null, alertThreshold = null, status = 'Active', connectivityStatus = 'UNKNOWN', firmwareVersion = null, lastConnectionAt = null, lastIp = null, wifiSsid = null, wifiRssiDbm = null, signalQuality = null, batteryLevel = null, provisioningStatus = 'PENDING', provisioningError = null, provisioningUpdatedAt = null, provisionedAt = null }) {
    this.id = id;
    this.code = Device.validateText(code, 'code', 3, 100);
    this.name = Device.validateText(name, 'name', 1, 100);
    this.type = Device.validateText(type, 'type', 1, 50);
    this.hardwareId = Device.optionalHardwareId(hardwareId);
    this.location = Device.optionalText(location, 'location', 120);
    this.manufacturer = Device.optionalText(manufacturer, 'manufacturer', 100);
    this.model = Device.optionalText(model, 'model', 100);
    this.alertThreshold = Device.validatePositive(alertThreshold, 'alertThreshold');
    this.status = status;
    this.connectivityStatus = connectivityStatus;
    this.firmwareVersion = firmwareVersion;
    this.lastConnectionAt = lastConnectionAt;
    this.lastIp = Device.optionalText(lastIp, 'lastIp', 45);
    this.wifiSsid = Device.optionalText(wifiSsid, 'wifiSsid', 32);
    this.wifiRssiDbm = wifiRssiDbm;
    this.signalQuality = signalQuality;
    this.batteryLevel = batteryLevel;
    this.provisioningStatus = provisioningStatus;
    this.provisioningError = provisioningError;
    this.provisioningUpdatedAt = provisioningUpdatedAt;
    this.provisionedAt = provisionedAt;
  }

  static create(attributes) {
    return new Device(attributes);
  }

  static validateText(value, field, min, max) {
    if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
      throw new Error(`${field} debe tener entre ${min} y ${max} caracteres`);
    }
    return value.trim();
  }

  static optionalText(value, field, max) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value !== 'string' || value.trim().length > max) {
      throw new Error(`${field} no puede superar ${max} caracteres`);
    }
    return value.trim();
  }

  static optionalHardwareId(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{3,32}$/.test(value.trim())) {
      throw new Error('hardwareId debe tener entre 3 y 32 caracteres seguros');
    }
    return value.trim();
  }

  static validatePositive(value, field) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) {
      throw new Error(`${field} debe ser un número mayor o igual a cero`);
    }
    return number;
  }
}

module.exports = { Device };
