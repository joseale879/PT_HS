class DeactivateDeviceRequest {
  constructor({ reason }) {
    this.reason = reason;
  }

  static fromRequest(body = {}) {
    return new DeactivateDeviceRequest({ reason: body.reason });
  }
}

module.exports = { DeactivateDeviceRequest };
