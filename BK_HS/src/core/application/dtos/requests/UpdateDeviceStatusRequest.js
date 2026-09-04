class UpdateDeviceStatusRequest {
  constructor({ status, reason = null }) {
    this.status = status;
    this.reason = reason;
  }

  static fromRequest(body = {}) {
    return new UpdateDeviceStatusRequest({ status: body.status, reason: body.reason });
  }
}

module.exports = { UpdateDeviceStatusRequest };
