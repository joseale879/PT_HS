class TelemetryRepository {
  async ingestTelemetry() {
    throw new Error('TelemetryRepository.ingestTelemetry no implementado');
  }
}

module.exports = { TelemetryRepository };
