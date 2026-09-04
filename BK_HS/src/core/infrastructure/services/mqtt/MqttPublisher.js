const { IMqttService } = require('../../../application/ports/services/IMqttService');

class MqttPublisher extends IMqttService {
  constructor({ mqttClient, qos = 1, logger = console }) {
    super();
    this.mqttClient = mqttClient;
    this.qos = qos;
    this.logger = logger;
  }

  async publish(topic, payload, { qos = this.qos, retain = false } = {}) {
    if (typeof topic !== 'string' || !topic.trim()) {
      throw new Error('topic es obligatorio para publicar MQTT');
    }
    if (![0, 1, 2].includes(qos)) {
      throw new Error('qos debe ser 0, 1 o 2');
    }

    const message = Buffer.isBuffer(payload) || typeof payload === 'string'
      ? payload
      : JSON.stringify(payload);
    const client = this.mqttClient.connect();

    await new Promise((resolve, reject) => {
      client.publish(topic, message, { qos, retain }, (error) => {
        if (error) return reject(error);
        return resolve();
      });
    });

    this.logger.info(`[MQTT] Mensaje publicado en ${topic}`);
  }
}

module.exports = { MqttPublisher };
