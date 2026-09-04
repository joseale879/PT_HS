class IMqttService {
  async publish() {
    throw new Error('IMqttService.publish no implementado');
  }
}

module.exports = { IMqttService };
