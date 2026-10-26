class IngestReading {
  constructor({ telemetryRepository }) {
    this.telemetryRepository = telemetryRepository;
  }

  async execute(reading) {
    if (!reading || typeof reading !== 'object') {
      throw this.badRequest('La lectura de telemetría es obligatoria');
    }
    if (typeof reading.deviceCode !== 'string' || !reading.deviceCode.trim()) {
      throw this.badRequest('deviceCode es obligatorio');
    }
    if (typeof reading.mqttMessageId !== 'string' || !reading.mqttMessageId.trim()) {
      throw this.badRequest('mqttMessageId es obligatorio para persistir una lectura MQTT');
    }
    if (!Number.isFinite(Number(reading.consumptionLiters)) || Number(reading.consumptionLiters) < 0) {
      throw this.badRequest('consumptionLiters no es válido');
    }
    return this.telemetryRepository.ingestTelemetry({
      ...reading,
      deviceCode: reading.deviceCode.trim(),
      mqttMessageId: reading.mqttMessageId.trim(),
    });
  }

  badRequest(message) {
    const error = new Error(message);
    error.status = 400;
    return error;
  }
}

module.exports = { IngestReading };
