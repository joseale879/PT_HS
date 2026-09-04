function getPositiveInteger(value, fallback, variableName) {
  if (value === undefined || value === '') return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${variableName} debe ser un entero mayor o igual a cero`);
  }

  return parsed;
}

function getMqttConfig(env = process.env) {
  const brokerUrl = env.MQTT_BROKER_URL;

  if (!brokerUrl) {
    throw new Error('Falta la variable MQTT_BROKER_URL');
  }

  try {
    const protocol = new URL(brokerUrl).protocol;
    if (!['mqtt:', 'mqtts:', 'ws:', 'wss:'].includes(protocol)) {
      throw new Error('protocolo no soportado');
    }
  } catch (_error) {
    throw new Error('MQTT_BROKER_URL debe ser una URL MQTT válida');
  }

  const username = env.MQTT_USERNAME || undefined;
  const password = env.MQTT_PASSWORD || undefined;

  const qos = getPositiveInteger(env.MQTT_QOS, 1, 'MQTT_QOS');
  if (qos > 2) {
    throw new Error('MQTT_QOS debe ser 0, 1 o 2');
  }

  return {
    brokerUrl,
    qos,
    options: {
      clientId: env.MQTT_CLIENT_ID || `hidrosmart-backend-${process.pid}`,
      clean: true,
      reconnectPeriod: getPositiveInteger(env.MQTT_RECONNECT_PERIOD_MS, 3000, 'MQTT_RECONNECT_PERIOD_MS'),
      connectTimeout: getPositiveInteger(env.MQTT_CONNECT_TIMEOUT_MS, 10000, 'MQTT_CONNECT_TIMEOUT_MS'),
      ...(username ? { username } : {}),
      ...(password ? { password } : {})
    }
  };
}

module.exports = { getMqttConfig };
