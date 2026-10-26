class UpdateDeviceProvisioningRequest {
  constructor({ hardwareId = null, provisioningStatus, provisioningError = null }) {
    this.hardwareId = hardwareId;
    this.provisioningStatus = provisioningStatus;
    this.provisioningError = provisioningError;
  }

  static fromRequest(body = {}) {
    return new UpdateDeviceProvisioningRequest({
      hardwareId: body.hardwareId,
      provisioningStatus: body.provisioningStatus ?? body.provisioningState,
      provisioningError: body.provisioningError
    });
  }
}

module.exports = { UpdateDeviceProvisioningRequest };
