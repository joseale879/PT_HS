class UpdateDeviceRequest {
  constructor({ name, manufacturer = null, model = null, alertThreshold = null }) {
    this.name = name;
    this.manufacturer = manufacturer;
    this.model = model;
    this.alertThreshold = alertThreshold;
  }

  static fromRequest(body = {}) {
    return new UpdateDeviceRequest({
      name: body.name,
      manufacturer: body.manufacturer,
      model: body.model,
      alertThreshold: body.alertThreshold ?? body.umbralAlerta
    });
  }
}

module.exports = { UpdateDeviceRequest };
