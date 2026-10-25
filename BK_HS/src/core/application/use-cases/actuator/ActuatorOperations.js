const { randomUUID } = require('node:crypto');
const { actuatorCommandTopic } = require('../../../../mqtt/topics');

const ACTUATOR_COMMANDS = {
  VALVE: ['OPEN', 'CLOSED'],
  PUMP: ['ON', 'OFF']
};
const COMMAND_STATUSES = ['Pending', 'Published', 'Acknowledged', 'Failed', 'TimedOut', 'Cancelled'];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function assertUuid(value, field) {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) badRequest(`${field} no es válido`);
}

function normalizeActuator(value) {
  const actuator = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!Object.hasOwn(ACTUATOR_COMMANDS, actuator)) badRequest('actuator debe ser VALVE o PUMP');
  return actuator;
}

function normalizeCommand(actuator, value) {
  const command = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!ACTUATOR_COMMANDS[actuator].includes(command)) {
    badRequest(`command no es válido para ${actuator}`);
  }
  return command;
}

function normalizeCorrelationId(value) {
  if (value === undefined || value === null || value === '') return randomUUID();
  assertUuid(value, 'correlationId');
  return value;
}

class SendActuatorCommand {
  constructor({ repository, publisher, clock = () => new Date() }) {
    this.repository = repository;
    this.publisher = publisher;
    this.clock = clock;
  }

  async execute({ userId, deviceId, actuator, command, correlationId }) {
    assertUuid(userId, 'userId');
    assertUuid(deviceId, 'deviceId');
    const normalizedActuator = normalizeActuator(actuator);
    const normalizedCommand = normalizeCommand(normalizedActuator, command);
    const normalizedCorrelationId = normalizeCorrelationId(correlationId);

    const pending = await this.repository.createPending({
      userId,
      deviceId,
      actuator: normalizedActuator,
      command: normalizedCommand,
      correlationId: normalizedCorrelationId
    });
    if (!pending) {
      const error = new Error('Dispositivo no encontrado o no pertenece a un hogar activo');
      error.status = 404;
      throw error;
    }

    const payload = {
      actuator: normalizedActuator,
      command: normalizedCommand,
      correlationId: normalizedCorrelationId,
      timestamp: this.clock().toISOString()
    };

    try {
      await this.publisher.publish(
        actuatorCommandTopic(pending.deviceCode, normalizedActuator.toLowerCase()),
        payload,
        { qos: 1, retain: false }
      );
      return await this.repository.markPublished({ userId, commandId: pending.commandId });
    } catch (cause) {
      await this.repository.markFailed({
        userId,
        commandId: pending.commandId,
        errorMessage: cause instanceof Error ? cause.message : 'No fue posible publicar el comando'
      });
      const error = new Error('No fue posible publicar el comando al dispositivo');
      error.status = 503;
      error.cause = cause;
      throw error;
    }
  }
}

class ListActuatorStates {
  constructor({ repository }) { this.repository = repository; }

  execute({ userId, homeId }) {
    assertUuid(userId, 'userId');
    if (homeId !== undefined && homeId !== null && homeId !== '') assertUuid(homeId, 'homeId');
    return this.repository.listStates({ userId, homeId: homeId || null });
  }
}

class GetActuatorStates {
  constructor({ repository }) { this.repository = repository; }

  execute({ userId, deviceId }) {
    assertUuid(userId, 'userId');
    assertUuid(deviceId, 'deviceId');
    return this.repository.getStatesByDevice({ userId, deviceId });
  }
}

class ListActuatorCommands {
  constructor({ repository }) { this.repository = repository; }

  execute({ userId, homeId, status }) {
    assertUuid(userId, 'userId');
    if (homeId !== undefined && homeId !== null && homeId !== '') assertUuid(homeId, 'homeId');
    if (status !== undefined && status !== null && !COMMAND_STATUSES.includes(status)) {
      badRequest('status no es válido');
    }
    return this.repository.listCommands({ userId, homeId: homeId || null, status: status || null });
  }
}

module.exports = {
  ACTUATOR_COMMANDS,
  COMMAND_STATUSES,
  SendActuatorCommand,
  ListActuatorStates,
  GetActuatorStates,
  ListActuatorCommands
};
