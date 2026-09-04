class UpdateDeviceConfigRequest {
  constructor({ calibrationFactor, calibrationOffset, reason }) {
    this.calibrationFactor = calibrationFactor;
    this.calibrationOffset = calibrationOffset;
    this.reason = reason;
  }

  static fromRequest(body = {}) {
    return new UpdateDeviceConfigRequest({
      calibrationFactor: body.calibrationFactor,
      calibrationOffset: body.calibrationOffset,
      reason: body.reason
    });
  }
}

module.exports = { UpdateDeviceConfigRequest };
