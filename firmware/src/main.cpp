#include <Arduino.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <cstring>
#include <esp_system.h>
#include <time.h>

#include "config.h"

#ifndef HIDROSMART_FLOW_FACTOR
#define HIDROSMART_FLOW_FACTOR 7.5f
#endif

#ifndef HIDROSMART_SAMPLE_INTERVAL_MS
#define HIDROSMART_SAMPLE_INTERVAL_MS 5000UL
#endif

#ifndef HIDROSMART_MQTT_KEEPALIVE_SECONDS
#define HIDROSMART_MQTT_KEEPALIVE_SECONDS 30
#endif

namespace {
constexpr char TELEMETRY_SUFFIX[] = "/telemetry";
constexpr char STATUS_SUFFIX[] = "/status";

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

volatile uint32_t pulseCount = 0;
uint32_t sequence = 0;
uint32_t bootId = 0;
float totalLiters = 0.0f;
unsigned long lastSampleAt = 0;

String deviceTopic(const char* suffix) {
  return String("hidrosmart/devices/") + HIDROSMART_DEVICE_CODE + suffix;
}

String isoTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo, 10)) return "";

  char value[25];
  strftime(value, sizeof(value), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(value);
}

String statusPayload(const char* status) {
  const String timestamp = isoTimestamp();
  return String("{\"deviceId\":\"") + HIDROSMART_DEVICE_CODE +
    "\",\"status\":\"" + status +
    "\",\"timestamp\":\"" + timestamp +
    "\",\"wifiRssiDbm\":" + String(WiFi.RSSI()) + "}";
}

void IRAM_ATTR onPulse() {
  pulseCount++;
}

void connectWifi() {
  if (WiFi.status() == WL_CONNECTED) return;

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(HIDROSMART_WIFI_SSID, HIDROSMART_WIFI_PASSWORD);

  Serial.print("Conectando al WiFi: ");
  Serial.println(HIDROSMART_WIFI_SSID);

  const unsigned long startedAt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < 20000UL) {
    delay(250);
    Serial.print('.');
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi conectado. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("[WiFi] No fue posible conectar; se reintentará.");
  }
}

bool connectMqtt() {
  if (WiFi.status() != WL_CONNECTED) return false;

  const String clientId = String(HIDROSMART_DEVICE_CODE) + "-" + String(bootId);
  const String statusTopic = deviceTopic(STATUS_SUFFIX);
  const String offlinePayload = statusPayload("OFFLINE");
  bool connected = false;

  if (std::strlen(HIDROSMART_MQTT_USERNAME) > 0) {
    connected = mqttClient.connect(
      clientId.c_str(),
      HIDROSMART_MQTT_USERNAME,
      HIDROSMART_MQTT_PASSWORD,
      statusTopic.c_str(),
      1,
      true,
      offlinePayload.c_str()
    );
  } else {
    connected = mqttClient.connect(
      clientId.c_str(),
      statusTopic.c_str(),
      1,
      true,
      offlinePayload.c_str()
    );
  }

  if (!connected) {
    Serial.print("[MQTT] Error de conexión, estado: ");
    Serial.println(mqttClient.state());
    return false;
  }

  const String onlinePayload = statusPayload("ONLINE");
  const bool published = mqttClient.publish(statusTopic.c_str(), onlinePayload.c_str(), true);

  Serial.print("[MQTT] Conectado a ");
  Serial.print(HIDROSMART_MQTT_HOST);
  Serial.print(':');
  Serial.println(HIDROSMART_MQTT_PORT);
  return published;
}

void publishTelemetry(unsigned long pulses, float flowRateLpm, float consumptionLiters, float intervalSeconds) {
  if (!mqttClient.connected()) {
    Serial.println("[MQTT] Broker desconectado; la lectura se omitió.");
    return;
  }

  const uint32_t currentSequence = ++sequence;
  const String messageId = String(HIDROSMART_DEVICE_CODE) + "-" + String(bootId) + "-" + String(currentSequence);
  const String timestamp = isoTimestamp();
  const String topic = deviceTopic(TELEMETRY_SUFFIX);
  char payload[512];

  snprintf(
    payload,
    sizeof(payload),
    "{\"mqttMessageId\":\"%s\",\"deviceId\":\"%s\",\"timestamp\":\"%s\","
    "\"flowRateLpm\":%.3f,\"consumptionLiters\":%.5f,\"totalLiters\":%.5f,"
    "\"pulses\":%lu,\"sampleIntervalSeconds\":%.3f,\"wifiRssiDbm\":%ld}",
    messageId.c_str(),
    HIDROSMART_DEVICE_CODE,
    timestamp.c_str(),
    flowRateLpm,
    consumptionLiters,
    totalLiters,
    pulses,
    intervalSeconds,
    static_cast<long>(WiFi.RSSI())
  );

  const bool published = mqttClient.publish(topic.c_str(), payload, 1, false);

  Serial.print("[MQTT] ");
  Serial.print(published ? "Telemetría enviada: " : "Error enviando telemetría: ");
  Serial.println(payload);
}
} // namespace

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("===============================");
  Serial.println("        HIDROSMART ESP32");
  Serial.println("===============================");

  bootId = esp_random();
  // Se conserva la configuración que ya estaba funcionando con el YF-S201.
  pinMode(HIDROSMART_FLOW_PIN, INPUT);
  attachInterrupt(digitalPinToInterrupt(HIDROSMART_FLOW_PIN), onPulse, FALLING);

  connectWifi();
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");

  mqttClient.setServer(HIDROSMART_MQTT_HOST, HIDROSMART_MQTT_PORT);
  mqttClient.setKeepAlive(HIDROSMART_MQTT_KEEPALIVE_SECONDS);
  mqttClient.setBufferSize(768);

  lastSampleAt = millis();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
    delay(50);
    return;
  }

  if (!mqttClient.connected()) {
    connectMqtt();
  }
  mqttClient.loop();

  const unsigned long now = millis();
  if (now - lastSampleAt < HIDROSMART_SAMPLE_INTERVAL_MS) {
    delay(2);
    return;
  }

  const float intervalSeconds = (now - lastSampleAt) / 1000.0f;
  lastSampleAt = now;

  noInterrupts();
  const unsigned long pulses = pulseCount;
  pulseCount = 0;
  interrupts();

  // Para el YF-S201: caudal (L/min) = pulsos/segundo / 7.5.
  const float pulsesPerSecond = pulses / intervalSeconds;
  const float flowRateLpm = pulsesPerSecond / HIDROSMART_FLOW_FACTOR;
  const float consumptionLiters = flowRateLpm * intervalSeconds / 60.0f;
  totalLiters += consumptionLiters;

  Serial.print("Pulsos: ");
  Serial.print(pulses);
  Serial.print(" | Caudal: ");
  Serial.print(flowRateLpm, 3);
  Serial.print(" L/min | Consumo intervalo: ");
  Serial.print(consumptionLiters, 5);
  Serial.print(" L | Total: ");
  Serial.print(totalLiters, 5);
  Serial.println(" L");

  publishTelemetry(pulses, flowRateLpm, consumptionLiters, intervalSeconds);
}
