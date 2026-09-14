#include <Arduino.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <esp_system.h>
#include <time.h>
#include "config.h"

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
volatile uint32_t pulseCount = 0;
uint32_t sequence = 0;
uint32_t bootId = 0;
unsigned long lastSampleAt = 0;

void IRAM_ATTR onPulse() { pulseCount++; }

String isoTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo, 10)) return "";
  char value[25];
  strftime(value, sizeof(value), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(value);
}

void connectWifi() {
  WiFi.begin(HIDROSMART_WIFI_SSID, HIDROSMART_WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) delay(250);
}

void connectMqtt() {
  while (!mqttClient.connected()) {
    String clientId = String(HIDROSMART_DEVICE_CODE) + "-" + String(bootId);
    if (mqttClient.connect(clientId.c_str(), HIDROSMART_MQTT_USERNAME, HIDROSMART_MQTT_PASSWORD)) break;
    delay(1000);
  }
}

void publishTelemetry() {
  const uint32_t pulses = pulseCount;
  pulseCount = 0;
  const float liters = pulses * HIDROSMART_PULSE_LITERS;
  const uint32_t currentSequence = ++sequence;
  String messageId = String(HIDROSMART_DEVICE_CODE) + "-" + String(bootId) + "-" + String(currentSequence);
  String payload = String("{\"mqttMessageId\":\"") + messageId +
    "\",\"deviceId\":\"" + HIDROSMART_DEVICE_CODE +
    "\",\"timestamp\":\"" + isoTimestamp() +
    "\",\"flowRateLpm\":0,\"consumptionLiters\":" + String(liters, 3) +
    ",\"totalLiters\":0,\"pulses\":" + String(pulses) +
    ",\"sampleIntervalSeconds\":1,\"wifiRssiDbm\":" + String(WiFi.RSSI()) + "}";
  String topic = String("hidrosmart/devices/") + HIDROSMART_DEVICE_CODE + "/telemetry";
  mqttClient.publish(topic.c_str(), payload.c_str(), false);
}

void setup() {
  Serial.begin(115200);
  bootId = esp_random();
  pinMode(HIDROSMART_FLOW_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(HIDROSMART_FLOW_PIN), onPulse, RISING);
  connectWifi();
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  mqttClient.setServer(HIDROSMART_MQTT_HOST, HIDROSMART_MQTT_PORT);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWifi();
  if (!mqttClient.connected()) connectMqtt();
  mqttClient.loop();
  if (millis() - lastSampleAt >= 1000) {
    lastSampleAt = millis();
    publishTelemetry();
  }
}
