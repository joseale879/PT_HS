const mqtt = require('mqtt');
const { getMqttConfig } = require('../../../../config/mqtt');

class MqttClient {
  constructor({ mqttModule = mqtt, configFactory = getMqttConfig, logger = console } = {}) {
    this.mqttModule = mqttModule;
    this.configFactory = configFactory;
    this.logger = logger;
    this.client = null;
  }

  connect() {
    if (this.client) return this.client;

    const config = this.configFactory();
    this.logger.info(`[MQTT] Conectando al broker: ${config.brokerUrl}`);
    this.client = this.mqttModule.connect(config.brokerUrl, config.options);

    this.client.on('connect', () => this.logger.info('[MQTT] Broker conectado correctamente'));
    this.client.on('reconnect', () => this.logger.info('[MQTT] Intentando reconectar con el broker...'));
    this.client.on('offline', () => this.logger.warn('[MQTT] Broker sin conexión'));
    this.client.on('error', (error) => this.logger.error('[MQTT] Error de conexión:', error.message));

    return this.client;
  }

  disconnect() {
    const client = this.client;
    this.client = null;
    if (!client) return Promise.resolve();

    return new Promise((resolve) => {
      client.end(true, () => {
        this.logger.info('[MQTT] Cliente desconectado');
        resolve();
      });
    });
  }
}

module.exports = { MqttClient };
