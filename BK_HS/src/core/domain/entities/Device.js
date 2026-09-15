class Device {
  constructor({ id = null, code, name, type, location = null, manufacturer = null, model = null, alertThreshold = null, status = 'Active', connectivityStatus = 'UNKNOWN', firmwareVersion = null, lastConnectionAt = null, wifiRssiDbm = null, signalQuality = null, batteryLevel = null }) {
    this.id = id;
    this.code = Device.validateText(code, 'code', 3, 100);
    this.name = Device.validateText(name, 'name', 1, 100);
    this.type = Device.validateText(type, 'type', 1, 50);
    this.location = Device.optionalText(location, 'location', 120);
    this.manufacturer = Device.optionalText(manufacturer, 'manufacturer', 100);
    this.model = Device.optionalText(model, 'model', 100);
    this.alertThreshold = Device.validatePositive(alertThreshold, 'alertThreshold');
    this.status = status;
    this.connectivityStatus = connectivityStatus;
    this.firmwareVersion = firmwareVersion;
    this.lastConnectionAt = lastConnectionAt;
    this.wifiRssiDbm = wifiRssiDbm;
    this.signalQuality = signalQuality;
    this.batteryLevel = batteryLevel;
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
