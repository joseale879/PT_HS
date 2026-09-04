class RegisterDeviceRequest {
  constructor({ homeId, code, name, type, manufacturer = null, model = null, alertThreshold = null }) {
    this.homeId = homeId;
    this.code = code;
    this.name = name;
    this.type = type;
    this.manufacturer = manufacturer;
    this.model = model;
    this.alertThreshold = alertThreshold;
  }

  static fromRequest(body = {}) {
    return new RegisterDeviceRequest({
      homeId: body.homeId,
      code: body.code,
      name: body.name,
      type: body.type,
      manufacturer: body.manufacturer,
      model: body.model,
      alertThreshold: body.alertThreshold ?? body.umbralAlerta
    });
  }
}

module.exports = { RegisterDeviceRequest };
