class UpdateDeviceRequest {
  constructor({ name, location, manufacturer = null, model = null, alertThreshold = null }) {
    this.name = name;
    this.location = location;
    this.manufacturer = manufacturer;
    this.model = model;
    this.alertThreshold = alertThreshold;
  }

  static fromRequest(body = {}) {
    return new UpdateDeviceRequest({
      name: body.name,
      location: body.location,
      manufacturer: body.manufacturer,
      model: body.model,
      alertThreshold: body.alertThreshold ?? body.umbralAlerta
    });
  }
}

module.exports = { UpdateDeviceRequest };
