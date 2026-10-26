#include <Arduino.h>
#include <ArduinoJson.h>
#include <NimBLEDevice.h>
#include <Preferences.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <cstring>
#include <esp_system.h>
#include <string>
#include <time.h>

#if __has_include("../provisioning/config.h")
#include "../provisioning/config.h"
#else
// Permite compilar desde un clon limpio; la configuración local sigue
// teniendo prioridad cuando provisioning/config.h existe.
#include "../provisioning/config.example.h"
#endif

#ifndef HIDROSMART_FIRMWARE_VERSION
#define HIDROSMART_FIRMWARE_VERSION "1.1.0"
#endif

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
constexpr char NVS_NAMESPACE[] = "hidrosmart";
constexpr char NVS_NETWORKS_KEY[] = "networks";
constexpr char NVS_MQTT_HOST_KEY[] = "mqttHost";
constexpr char NVS_MQTT_PORT_KEY[] = "mqttPort";
constexpr char NVS_DEVICE_CODE_KEY[] = "deviceCode";
constexpr char BLE_SERVICE_UUID[] = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
constexpr char BLE_CONFIG_CHAR_UUID[] = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
constexpr char BLE_STATUS_CHAR_UUID[] = "beb5483e-36e1-4688-b7f5-ea07361b26a9";
constexpr uint8_t MAX_WIFI_NETWORKS = 5;
constexpr unsigned long WIFI_TIMEOUT_MS = 15000UL;
constexpr unsigned long WIFI_RETRY_INTERVAL_MS = 10000UL;
constexpr unsigned long MQTT_RETRY_INTERVAL_MS = 5000UL;

struct WifiCredential {
  String ssid;
  String password;
  String mqttHost;
  uint16_t mqttPort;
};

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
Preferences preferences;
NimBLECharacteristic* configCharacteristic = nullptr;
NimBLECharacteristic* statusCharacteristic = nullptr;

WifiCredential knownNetworks[MAX_WIFI_NETWORKS];
uint8_t knownNetworkCount = 0;
String hardwareId;
String deviceCode;
String connectedSsid;
String mqttHost;
uint16_t mqttPort = HIDROSMART_MQTT_PORT;

volatile uint32_t pulseCount = 0;
uint32_t sequence = 0;
uint32_t bootId = 0;
float totalLiters = 0.0f;
unsigned long lastSampleAt = 0;
unsigned long lastWifiAttemptAt = 0;
unsigned long lastMqttAttemptAt = 0;
bool provisioningActive = false;

bool isConfiguredText(const char* value) {
  return value != nullptr && std::strlen(value) > 0 && std::strncmp(value, "CAMBIA_", 7) != 0;
}

bool isSafeDeviceCode(const String& value) {
  if (value.isEmpty() || value.length() > 100) return false;

  for (size_t index = 0; index < value.length(); index++) {
    const char character = value[index];
    const bool alphanumeric =
      (character >= 'A' && character <= 'Z') ||
      (character >= 'a' && character <= 'z') ||
      (character >= '0' && character <= '9');
    if (!alphanumeric && character != '-' && character != '_') return false;
  }
  return true;
}

String getHardwareId() {
  const uint64_t chipId = ESP.getEfuseMac();
  char id[20];
  snprintf(id, sizeof(id), "HS-%012llX", static_cast<unsigned long long>(chipId & 0xFFFFFFFFFFFFULL));
  return String(id);
}

String deviceTopic(const char* suffix) {
  return String("hidrosmart/devices/") + deviceCode + suffix;
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
  const String ip = WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : "";
  const String activeSsid = WiFi.status() == WL_CONNECTED && connectedSsid.isEmpty()
    ? WiFi.SSID()
    : connectedSsid;
  const char* provisioningState = std::strcmp(status, "ONLINE") == 0
    ? "complete"
    : (WiFi.status() == WL_CONNECTED ? "wifi_connected" : "waiting_for_wifi");
  JsonDocument document;
  document["deviceId"] = deviceCode;
  document["hardwareId"] = hardwareId;
  document["status"] = status;
  document["provisioningState"] = provisioningState;
  document["timestamp"] = timestamp;
  document["firmwareVersion"] = HIDROSMART_FIRMWARE_VERSION;
  document["lastIp"] = ip;
  if (!activeSsid.isEmpty()) document["ssid"] = activeSsid;
  document["wifiRssiDbm"] = WiFi.RSSI();

  String serialized;
  serializeJson(document, serialized);
  return serialized;
}

void IRAM_ATTR onPulse() {
  pulseCount++;
}

void saveNetworks() {
  JsonDocument document;
  JsonArray networks = document["networks"].to<JsonArray>();

  for (uint8_t index = 0; index < knownNetworkCount; index++) {
    JsonObject network = networks.add<JsonObject>();
    network["ssid"] = knownNetworks[index].ssid;
    network["password"] = knownNetworks[index].password;
    network["mqttHost"] = knownNetworks[index].mqttHost;
    network["mqttPort"] = knownNetworks[index].mqttPort;
  }

  String serialized;
  serializeJson(document, serialized);

  preferences.begin(NVS_NAMESPACE, false);
  preferences.putString(NVS_NETWORKS_KEY, serialized);
  preferences.end();
}

void saveNetwork(const String& ssid, const String& password, const String& brokerHost, uint16_t brokerPort) {
  for (uint8_t index = 0; index < knownNetworkCount; index++) {
    if (knownNetworks[index].ssid == ssid) {
      knownNetworks[index].password = password;
      knownNetworks[index].mqttHost = brokerHost;
      knownNetworks[index].mqttPort = brokerPort;
      saveNetworks();
      return;
    }
  }

  if (knownNetworkCount < MAX_WIFI_NETWORKS) {
    knownNetworks[knownNetworkCount] = {ssid, password, brokerHost, brokerPort};
    knownNetworkCount++;
  } else {
    for (uint8_t index = 1; index < MAX_WIFI_NETWORKS; index++) {
      knownNetworks[index - 1] = knownNetworks[index];
    }
    knownNetworks[MAX_WIFI_NETWORKS - 1] = {ssid, password, brokerHost, brokerPort};
  }

  saveNetworks();
}

void loadNetworks(const String& serialized) {
  knownNetworkCount = 0;
  if (serialized.isEmpty()) return;

  JsonDocument document;
  if (deserializeJson(document, serialized)) {
    Serial.println("[NVS] Redes guardadas invalidas; se ignoraran.");
    return;
  }

  JsonArray networks = document["networks"].as<JsonArray>();
  for (JsonObject network : networks) {
    if (knownNetworkCount >= MAX_WIFI_NETWORKS) break;
    const String ssid = network["ssid"] | "";
    if (ssid.isEmpty()) continue;
    knownNetworks[knownNetworkCount].ssid = ssid;
    knownNetworks[knownNetworkCount].password = network["password"] | "";
    knownNetworks[knownNetworkCount].mqttHost = network["mqttHost"] | mqttHost;
    knownNetworks[knownNetworkCount].mqttPort = network["mqttPort"] | static_cast<int>(mqttPort);
    if (knownNetworks[knownNetworkCount].mqttHost.isEmpty()) {
      knownNetworks[knownNetworkCount].mqttHost = HIDROSMART_MQTT_HOST;
    }
    if (knownNetworks[knownNetworkCount].mqttPort == 0) {
      knownNetworks[knownNetworkCount].mqttPort = HIDROSMART_MQTT_PORT;
    }
    knownNetworkCount++;
  }
}

void loadConfiguration() {
  preferences.begin(NVS_NAMESPACE, true);
  const String serializedNetworks = preferences.getString(NVS_NETWORKS_KEY, "");
  mqttHost = preferences.getString(NVS_MQTT_HOST_KEY, "");
  mqttPort = preferences.getUShort(NVS_MQTT_PORT_KEY, HIDROSMART_MQTT_PORT);
  deviceCode = preferences.getString(NVS_DEVICE_CODE_KEY, "");
  preferences.end();

  loadNetworks(serializedNetworks);

  if (deviceCode.isEmpty() && isConfiguredText(HIDROSMART_DEVICE_CODE)) {
    deviceCode = HIDROSMART_DEVICE_CODE;
  }
  if (deviceCode.isEmpty()) deviceCode = hardwareId;

  if (mqttHost.isEmpty()) mqttHost = HIDROSMART_MQTT_HOST;
  if (mqttPort == 0) mqttPort = HIDROSMART_MQTT_PORT;

  // Compatibilidad de migracion: una red definida en config.h se prueba una vez
  // y solo se guarda en NVS desde connectKnownWifi cuando conecta correctamente.
  if (knownNetworkCount == 0 && isConfiguredText(HIDROSMART_WIFI_SSID)) {
    knownNetworks[0] = {
      HIDROSMART_WIFI_SSID,
      HIDROSMART_WIFI_PASSWORD,
      mqttHost,
      mqttPort
    };
    knownNetworkCount = 1;
  }
}

void saveMqttConfiguration(const String& host, uint16_t port) {
  mqttHost = host;
  mqttPort = port;

  preferences.begin(NVS_NAMESPACE, false);
  preferences.putString(NVS_MQTT_HOST_KEY, mqttHost);
  preferences.putUShort(NVS_MQTT_PORT_KEY, mqttPort);
  preferences.putString(NVS_DEVICE_CODE_KEY, deviceCode);
  preferences.end();
}

bool connectToWifi(const String& ssid, const String& password, unsigned long timeoutMs) {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.disconnect(false, false);
  connectedSsid = "";
  delay(200);
  WiFi.begin(ssid.c_str(), password.c_str());

  Serial.print("[WIFI] Probando red: ");
  Serial.println(ssid);

  const unsigned long startedAt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < timeoutMs) {
    delay(250);
  }

  if (WiFi.status() != WL_CONNECTED) return false;

  Serial.print("[WIFI] Conectado. IP: ");
  Serial.println(WiFi.localIP());
  Serial.print("[WIFI] RSSI: ");
  Serial.println(WiFi.RSSI());
  connectedSsid = ssid;
  return true;
}

bool connectKnownWifi() {
  for (uint8_t index = 0; index < knownNetworkCount; index++) {
    if (connectToWifi(knownNetworks[index].ssid, knownNetworks[index].password, WIFI_TIMEOUT_MS)) {
      mqttHost = knownNetworks[index].mqttHost.isEmpty() ? String(HIDROSMART_MQTT_HOST) : knownNetworks[index].mqttHost;
      mqttPort = knownNetworks[index].mqttPort == 0 ? HIDROSMART_MQTT_PORT : knownNetworks[index].mqttPort;
      saveNetwork(knownNetworks[index].ssid, knownNetworks[index].password, mqttHost, mqttPort);
      saveMqttConfiguration(mqttHost, mqttPort);
      return true;
    }
  }
  return false;
}

void setBleStatus(const char* state, bool shouldNotify) {
  if (!statusCharacteristic) return;

  JsonDocument document;
  if (state != nullptr && std::strlen(state) > 0) document["state"] = state;
  document["hardwareId"] = hardwareId;
  document["deviceCode"] = deviceCode;
  document["firmwareVersion"] = HIDROSMART_FIRMWARE_VERSION;
  document["savedNetworks"] = knownNetworkCount;
  const bool wifiConnected = WiFi.status() == WL_CONNECTED;
  document["wifiConnected"] = wifiConnected;
  document["mqttConnected"] = mqttClient.connected();
  const String activeSsid = wifiConnected && connectedSsid.isEmpty() ? WiFi.SSID() : connectedSsid;
  if (!activeSsid.isEmpty()) document["ssid"] = activeSsid;
  if (wifiConnected) {
    document["ip"] = WiFi.localIP().toString();
    document["rssi"] = WiFi.RSSI();
  }

  String serialized;
  serializeJson(document, serialized);
  statusCharacteristic->setValue(serialized.c_str());
  if (shouldNotify) statusCharacteristic->notify();
  Serial.print("[BLE] Estado: ");
  Serial.println(serialized);
}

void notifyStatus(const char* state) {
  setBleStatus(state, true);
}

bool connectMqtt() {
  if (WiFi.status() != WL_CONNECTED || mqttHost.isEmpty()) return false;

  mqttClient.setServer(mqttHost.c_str(), mqttPort);
  const String clientId = deviceCode + "-" + String(bootId);
  const String statusTopic = deviceTopic(STATUS_SUFFIX);
  const String offlinePayload = statusPayload("OFFLINE");
  bool connected = false;

  if (std::strlen(HIDROSMART_MQTT_USERNAME) > 0) {
    connected = mqttClient.connect(
      clientId.c_str(), HIDROSMART_MQTT_USERNAME, HIDROSMART_MQTT_PASSWORD,
      statusTopic.c_str(), 1, true, offlinePayload.c_str()
    );
  } else {
    connected = mqttClient.connect(
      clientId.c_str(), statusTopic.c_str(), 1, true, offlinePayload.c_str()
    );
  }

  if (!connected) {
    Serial.print("[MQTT] Error de conexion, estado: ");
    Serial.println(mqttClient.state());
    return false;
  }

  const String onlinePayload = statusPayload("ONLINE");
  const bool published = mqttClient.publish(statusTopic.c_str(), onlinePayload.c_str(), true);
  Serial.print("[MQTT] Conectado a ");
  Serial.print(mqttHost);
  Serial.print(':');
  Serial.println(mqttPort);
  return published;
}

void publishTelemetry(unsigned long pulses, float flowRateLpm, float consumptionLiters, float intervalSeconds) {
  if (!mqttClient.connected()) {
    Serial.println("[MQTT] Broker desconectado; la lectura se omitio.");
    return;
  }

  const uint32_t currentSequence = ++sequence;
  const String messageId = deviceCode + "-" + String(bootId) + "-" + String(currentSequence);
  const String timestamp = isoTimestamp();
  const String topic = deviceTopic(TELEMETRY_SUFFIX);
  char payload[512];

  snprintf(
    payload,
    sizeof(payload),
    "{\"mqttMessageId\":\"%s\",\"deviceId\":\"%s\",\"hardwareId\":\"%s\",\"timestamp\":\"%s\","
    "\"flowRateLpm\":%.3f,\"consumptionLiters\":%.5f,\"totalLiters\":%.5f,"
    "\"pulses\":%lu,\"sampleIntervalSeconds\":%.3f,\"wifiRssiDbm\":%ld,\"signalQuality\":%ld}",
    messageId.c_str(), deviceCode.c_str(), hardwareId.c_str(), timestamp.c_str(), flowRateLpm,
    consumptionLiters, totalLiters, pulses, intervalSeconds, static_cast<long>(WiFi.RSSI()),
    static_cast<long>(WiFi.RSSI())
  );

  const bool published = mqttClient.publish(topic.c_str(), payload, false);
  Serial.print("[MQTT] ");
  Serial.print(published ? "Telemetria enviada: " : "Error enviando telemetria: ");
  Serial.println(payload);
}

void handleProvisioningPayload(const String& serialized) {
  JsonDocument document;
  if (deserializeJson(document, serialized)) {
    notifyStatus("invalid_json");
    return;
  }

  const String ssid = document["ssid"] | "";
  const String password = document["password"] | "";
  const String newMqttHost = document["mqttHost"] | mqttHost;
  const int requestedPort = document["mqttPort"] | static_cast<int>(mqttPort);
  const String requestedDeviceCode = document["deviceCode"] | deviceCode;

  if (ssid.isEmpty() || ssid.length() > 32) {
    notifyStatus("invalid_ssid");
    return;
  }
  if (password.length() > 63 || newMqttHost.length() > 253 || requestedPort < 1 || requestedPort > 65535) {
    notifyStatus("invalid_configuration");
    return;
  }
  if (!isSafeDeviceCode(requestedDeviceCode)) {
    notifyStatus("invalid_device_code");
    return;
  }

  deviceCode = requestedDeviceCode;
  notifyStatus("configuration_received");
  notifyStatus("wifi_connecting");
  if (!connectToWifi(ssid, password, WIFI_TIMEOUT_MS)) {
    notifyStatus("wifi_failed");
    return;
  }

  mqttHost = newMqttHost;
  mqttPort = static_cast<uint16_t>(requestedPort);
  saveNetwork(ssid, password, mqttHost, mqttPort);
  saveMqttConfiguration(mqttHost, mqttPort);
  notifyStatus("wifi_connected");

  if (connectMqtt()) {
    notifyStatus("provisioning_complete");
  } else {
    notifyStatus("mqtt_unreachable");
  }
}

class ProvisioningCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* characteristic, NimBLEConnInfo&) override {
    const std::string value = characteristic->getValue();
    if (value.empty()) return;
    handleProvisioningPayload(String(value.c_str()));
  }
};

void startProvisioningBLE() {
  if (provisioningActive) return;
  provisioningActive = true;

  const String bleName = String("HidroSmart-") + hardwareId.substring(hardwareId.length() - 6);
  NimBLEDevice::init(bleName.c_str());

  NimBLEServer* server = NimBLEDevice::createServer();
  NimBLEService* service = server->createService(BLE_SERVICE_UUID);
  configCharacteristic = service->createCharacteristic(
    BLE_CONFIG_CHAR_UUID,
    NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::WRITE
  );
  configCharacteristic->setCallbacks(new ProvisioningCallbacks());
  statusCharacteristic = service->createCharacteristic(
    BLE_STATUS_CHAR_UUID,
    NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY
  );
  service->start();

  // Deja la identidad disponible para una lectura inmediata al conectar.
  setBleStatus("ready", false);

  NimBLEAdvertising* advertising = NimBLEDevice::getAdvertising();
  advertising->addServiceUUID(BLE_SERVICE_UUID);
  advertising->setName(bleName.c_str());
  NimBLEDevice::startAdvertising();

  Serial.print("[BLE] Provisionamiento activo: ");
  Serial.println(bleName);
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
  hardwareId = getHardwareId();
  loadConfiguration();

  Serial.print("[DEVICE] Hardware ID: ");
  Serial.println(hardwareId);
  Serial.print("[DEVICE] Device code: ");
  Serial.println(deviceCode);

  pinMode(HIDROSMART_FLOW_PIN, INPUT);
  attachInterrupt(digitalPinToInterrupt(HIDROSMART_FLOW_PIN), onPulse, FALLING);

  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  mqttClient.setKeepAlive(HIDROSMART_MQTT_KEEPALIVE_SECONDS);
  mqttClient.setBufferSize(768);

  if (connectKnownWifi()) {
    if (!connectMqtt()) {
      Serial.println("[MQTT] Mosquitto no disponible; se activa Bluetooth para corregir la configuracion.");
      startProvisioningBLE();
    }
  } else {
    Serial.println("[WIFI] No hay redes guardadas disponibles.");
    startProvisioningBLE();
  }

  lastSampleAt = millis();
}

void loop() {
  const unsigned long now = millis();

  if (WiFi.status() != WL_CONNECTED) {
    if (now - lastWifiAttemptAt >= WIFI_RETRY_INTERVAL_MS) {
      lastWifiAttemptAt = now;
      if (!connectKnownWifi() && knownNetworkCount > 0) startProvisioningBLE();
    }
    delay(50);
    return;
  }

  if (!mqttClient.connected() && now - lastMqttAttemptAt >= MQTT_RETRY_INTERVAL_MS) {
    lastMqttAttemptAt = now;
    if (!connectMqtt()) startProvisioningBLE();
  }
  mqttClient.loop();

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

  // YF-S201: caudal (L/min) = pulsos/segundo / 7.5.
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
