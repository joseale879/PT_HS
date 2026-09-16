const test = require('node:test');
const assert = require('node:assert/strict');
const { parseTelemetryMessage } = require('../../src/mqtt/message-parser');

test('rechaza payloads MQTT que superan el limite configurado', () => {
  assert.throws(
    () => parseTelemetryMessage(Buffer.alloc(20, 32), { maxPayloadBytes: 10 }),
    /supera el maximo/
  );
});
