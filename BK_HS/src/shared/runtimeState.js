const state = {
  mqttConnected: false,
  mqttSubscribed: false
};

function setMqttState(changes) {
  if (typeof changes.connected === 'boolean') state.mqttConnected = changes.connected;
  if (typeof changes.subscribed === 'boolean') state.mqttSubscribed = changes.subscribed;
}

function getRuntimeState() {
  return { ...state };
}

module.exports = { setMqttState, getRuntimeState };
