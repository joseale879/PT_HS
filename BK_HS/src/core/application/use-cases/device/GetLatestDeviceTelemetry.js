class GetLatestDeviceTelemetry {
  constructor({ deviceRepository }) {
    this.deviceRepository = deviceRepository;
  }

  async execute({ userId, deviceId }) {
    if (!userId) throw new Error('El usuario autenticado es obligatorio');
    if (!this.isUuid(deviceId)) {
      const error = new Error('deviceId no es v\u00e1lido');
      error.status = 400;
      throw error;
    }

    const telemetry = await this.deviceRepository.findLatestTelemetryForUser(deviceId, userId);
    if (!telemetry) {
      return null;
    }
    return telemetry;
  }

  isUuid(value) {
    return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}

module.exports = { GetLatestDeviceTelemetry };
