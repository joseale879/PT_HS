const { TOPICS, getTopicContext } = require('../../../../mqtt/topics');
const { handleReading } = require('../../../../mqtt/handlers/reading.handler');
const { handleDeviceStatus } = require('../../../../mqtt/handlers/device-status.handler');
const { handleActuatorStatus } = require('../../../../mqtt/handlers/actuator-status.handler');

class MqttSubscriber {
  constructor({ mqttClient, qos = 1, logger = console, handlers = {} }) {
    this.mqttClient = mqttClient;
    this.qos = qos;
    this.logger = logger;
    this.handlers = {
      telemetry: handlers.telemetry || handleReading,
      'device-status': handlers['device-status'] || handleDeviceStatus,
      'actuator-status': handlers['actuator-status'] || handleActuatorStatus
    };
    this.client = null;
    this.started = false;
    this.subscribed = false;
    this.onConnect = this.subscribeToTopics.bind(this);
    this.onClose = () => { this.subscribed = false; };
    this.onMessage = this.processMessage.bind(this);
  }

  start() {
    if (this.started) return this.client;

    this.client = this.mqttClient.connect();
    this.client.on('connect', this.onConnect);
    this.client.on('close', this.onClose);
    this.client.on('message', this.onMessage);
    this.started = true;

    if (this.client.connected) this.subscribeToTopics();
    return this.client;
  }

  subscribeToTopics() {
    if (this.subscribed || !this.client) return;

    const topics = [TOPICS.TELEMETRY, TOPICS.STATUS, TOPICS.ACTUATOR_STATUS];
    this.client.subscribe(topics, { qos: this.qos }, (error) => {
      if (error) {
        this.logger.error('[MQTT] Error al suscribirse:', error.message);
        return;
      }

      this.subscribed = true;
      this.logger.info(`[MQTT] Suscrito a ${topics.join(', ')}`);
    });
  }

  async processMessage(topic, message) {
    const context = getTopicContext(topic);
    const handler = context ? this.handlers[context.type] : null;

    if (!handler) {
      this.logger.warn(`[MQTT] Topic no manejado: ${topic}`);
      return;
    }

    try {
      await handler({ topic, message, context, logger: this.logger });
    } catch (error) {
      this.logger.error(`[MQTT] Mensaje rechazado en ${topic}:`, error.message);
    }
  }

  async stop() {
    if (!this.started) return;

    this.client?.removeListener('connect', this.onConnect);
    this.client?.removeListener('close', this.onClose);
    this.client?.removeListener('message', this.onMessage);
    this.started = false;
    this.subscribed = false;
    this.client = null;
    await this.mqttClient.disconnect();
  }
}

module.exports = { MqttSubscriber };
