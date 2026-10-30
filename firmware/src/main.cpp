#include <Arduino.h>
#include <ArduinoJson.h>
#include <NimBLEDevice.h>
#include <Preferences.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
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

#ifndef HIDROSMART_MQTT_USE_TLS
#define HIDROSMART_MQTT_USE_TLS 0
#endif

#if HIDROSMART_MQTT_USE_TLS
// The secure firmware profile is pinned to Flespi so a device token cannot be
// sent to a broker selected through stale NVS or BLE provisioning data.
#undef HIDROSMART_MQTT_HOST
#define HIDROSMART_MQTT_HOST "mqtt.flespi.io"
#undef HIDROSMART_MQTT_PORT
#define HIDROSMART_MQTT_PORT 8883
#include "flespi_root_ca.h"
#endif

namespace {
constexpr char TELEMETRY_SUFFIX[] = "/telemetry";
constexpr char STATUS_SUFFIX[] = "/status";
constexpr char COMMANDS_SUFFIX[] = "/commands";
constexpr char NVS_NAMESPACE[] = "hidrosmart";
constexpr char NVS_NETWORKS_KEY[] = "networks";
constexpr char NVS_MQTT_HOST_KEY[] = "mqttHost";
constexpr char NVS_MQTT_PORT_KEY[] = "mqttPort";
constexpr char NVS_DEVICE_CODE_KEY[] = "deviceCode";
constexpr char NVS_BLE_LOCKED_KEY[] = "bleLocked";
constexpr char NVS_LINKED_HOME_KEY[] = "linkedHome";
constexpr char NVS_TOTAL_LITERS_KEY[] = "totalLiters";
constexpr char NVS_MEASUREMENT_ENABLED_KEY[] = "measurementOn";
constexpr char PRIMARY_LOGICAL_DEVICE_CODE[] = "HS-7A3F91C8D2E4";
constexpr const char* LOGICAL_DEVICE_CODES[] = {
  "HS-7A3F91C8D2E4",
  "HS-B6E04D79A153",
  "HS-2C8A5F01E7B9",
  "HS-141F47470968",
};
constexpr size_t LOGICAL_DEVICE_COUNT = sizeof(LOGICAL_DEVICE_CODES) / sizeof(LOGICAL_DEVICE_CODES[0]);
constexpr char BLE_SERVICE_UUID[] = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
constexpr char BLE_CONFIG_CHAR_UUID[] = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
constexpr char BLE_STATUS_CHAR_UUID[] = "beb5483e-36e1-4688-b7f5-ea07361b26a9";
constexpr uint8_t MAX_WIFI_NETWORKS = 5;
constexpr unsigned long WIFI_TIMEOUT_MS = 15000UL;
constexpr unsigned long WIFI_RETRY_INTERVAL_MS = 10000UL;
constexpr unsigned long MQTT_RETRY_INTERVAL_MS = 5000UL;
constexpr unsigned long NTP_WARNING_INTERVAL_MS = 30000UL;
constexpr unsigned long NTP_SYNC_RETRY_INTERVAL_MS = 30000UL;
constexpr time_t MIN_VALID_EPOCH = 1735689600;
constexpr unsigned long TOTAL_SAVE_INTERVAL_MS = 300000UL;
constexpr float TOTAL_SAVE_MIN_DELTA_LITERS = 1.0f;
constexpr uint8_t CONFIG_BUTTON_PIN = 0;
constexpr size_t BLE_PAYLOAD_MAX = 768;

struct WifiCredential {
  String ssid;
  String password;
  String mqttHost;
  uint16_t mqttPort;
};

WiFiClient wifiClient;
WiFiClientSecure secureWifiClient;
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
uint32_t pendingTelemetrySequence = 0;
uint32_t bootId = 0;
float totalLiters = 0.0f;
float lastPersistedTotalLiters = 0.0f;
uint32_t pendingPulses = 0;
float pendingFlowLiters = 0.0f;
float pendingConsumptionLiters = 0.0f;
float pendingSampleSeconds = 0.0f;
String pendingTelemetryTimestamp;
unsigned long lastSampleAt = 0;
unsigned long lastTotalSaveAt = 0;
unsigned long lastWifiAttemptAt = 0;
unsigned long lastMqttAttemptAt = 0;
unsigned long lastNtpWarningAt = 0;
unsigned long lastNtpAttemptAt = 0;
bool ntpAttemptMade = false;
bool bleInitialized = false;
bool bleAdvertising = false;
volatile bool bleClientConnected = false;
char pendingBlePayload[BLE_PAYLOAD_MAX] = {};
volatile bool pendingBlePayloadReady = false;
portMUX_TYPE blePayloadMux = portMUX_INITIALIZER_UNLOCKED;
bool bleLocked = false;
bool linkedToHome = false;
bool measurementEnabled = true;
int8_t activeKnownNetworkIndex = -1;
bool configButtonPressed = false;
bool configButtonHandled = false;
unsigned long configButtonStartedAt = 0;

void startProvisioningBLE();
void stopProvisioningBLE();
void notifyStatus(const char* state);
void saveBleLock(bool locked);
void saveLinkedToHome(bool linked);
void saveMeasurementEnabled(bool enabled);
void setMeasurementEnabled(bool enabled);
bool publishPendingTelemetry();
void applyBlePolicy();

bool takePendingBlePayload(String& payload) {
  char copiedPayload[BLE_PAYLOAD_MAX] = {};
  bool hasPayload = false;

  portENTER_CRITICAL(&blePayloadMux);
  if (pendingBlePayloadReady) {
    std::strncpy(copiedPayload, pendingBlePayload, BLE_PAYLOAD_MAX - 1);
    copiedPayload[BLE_PAYLOAD_MAX - 1] = '\0';
    pendingBlePayload[0] = '\0';
    pendingBlePayloadReady = false;
    hasPayload = true;
  }
  portEXIT_CRITICAL(&blePayloadMux);

  if (hasPayload) payload = String(copiedPayload);
  return hasPayload;
}

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

bool isLogicalDeviceCode(const String& value) {
  for (size_t index = 0; index < LOGICAL_DEVICE_COUNT; index++) {
    if (value.equalsIgnoreCase(LOGICAL_DEVICE_CODES[index])) return true;
  }
  return false;
}

String getHardwareId() {
  const uint64_t chipId = ESP.getEfuseMac();
  char id[20];
  snprintf(id, sizeof(id), "HS-%012llX", static_cast<unsigned long long>(chipId & 0xFFFFFFFFFFFFULL));
  return String(id);
}

String deviceTopic(const char* logicalCode, const char* suffix) {
  return String("hidrosmart/devices/") + logicalCode + suffix;
}

const char* activeLogicalDeviceCode() {
  return deviceCode.isEmpty() ? PRIMARY_LOGICAL_DEVICE_CODE : deviceCode.c_str();
}

String isoTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo, 10)) return "";

  char value[25];
  strftime(value, sizeof(value), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(value);
}

String statusPayload(const char* logicalCode, const char* status) {
  const String timestamp = isoTimestamp();
  const String ip = WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : "";
  const String activeSsid = WiFi.status() == WL_CONNECTED && connectedSsid.isEmpty()
    ? WiFi.SSID()
    : connectedSsid;
  // Este campo viaja por MQTT y debe usar exactamente los estados que valida
  // el backend. Los estados detallados del proceso BLE siguen viajando por la
  // caracteristica BLE de estado.
  const bool wifiConnected = WiFi.status() == WL_CONNECTED;
  const bool mqttConnected = mqttClient.connected();
  const char* provisioningState = linkedToHome && std::strcmp(status, "ONLINE") == 0
    ? "COMPLETE"
    : (mqttConnected
      ? "MQTT_CONNECTED"
      : (wifiConnected ? "WIFI_CONNECTED" : (bleAdvertising ? "BLE_READY" : "PENDING")));
  JsonDocument document;
  document["deviceId"] = logicalCode;
  document["hardwareId"] = hardwareId;
  document["status"] = status;
  document["provisioningState"] = provisioningState;
  document["timestamp"] = timestamp;
  document["firmwareVersion"] = HIDROSMART_FIRMWARE_VERSION;
  document["lastIp"] = ip;
  document["linkedToHome"] = linkedToHome;
  document["measurementEnabled"] = measurementEnabled;
  document["bleLocked"] = bleLocked;
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

void loadLegacyNetworks() {
  preferences.begin(NVS_NAMESPACE, true);
  const uint8_t legacyCount = preferences.getUChar("netCount", 0);

  for (uint8_t index = 0; index < legacyCount && index < MAX_WIFI_NETWORKS; index++) {
    const String suffix = String(index);
    const String ssid = preferences.getString((String("ssid") + suffix).c_str(), "");
    if (ssid.isEmpty()) continue;

    knownNetworks[knownNetworkCount].ssid = ssid;
    knownNetworks[knownNetworkCount].password = preferences.getString((String("pass") + suffix).c_str(), "");
    knownNetworks[knownNetworkCount].mqttHost = preferences.getString((String("host") + suffix).c_str(), mqttHost);
    knownNetworks[knownNetworkCount].mqttPort = preferences.getUShort(
      (String("port") + suffix).c_str(),
      mqttPort
    );
    if (knownNetworks[knownNetworkCount].mqttHost.isEmpty()) {
      knownNetworks[knownNetworkCount].mqttHost = HIDROSMART_MQTT_HOST;
    }
    if (knownNetworks[knownNetworkCount].mqttPort == 0) {
      knownNetworks[knownNetworkCount].mqttPort = HIDROSMART_MQTT_PORT;
    }
    knownNetworkCount++;
  }

  preferences.end();
}

void loadConfiguration() {
  preferences.begin(NVS_NAMESPACE, true);
  const String serializedNetworks = preferences.getString(NVS_NETWORKS_KEY, "");
  mqttHost = preferences.getString(NVS_MQTT_HOST_KEY, "");
  mqttPort = preferences.getUShort(NVS_MQTT_PORT_KEY, HIDROSMART_MQTT_PORT);
  deviceCode = preferences.getString(NVS_DEVICE_CODE_KEY, "");
  bleLocked = preferences.getBool(NVS_BLE_LOCKED_KEY, false);
  linkedToHome = preferences.getBool(NVS_LINKED_HOME_KEY, false);
  measurementEnabled = preferences.getBool(NVS_MEASUREMENT_ENABLED_KEY, true);
  totalLiters = preferences.isKey(NVS_TOTAL_LITERS_KEY)
    ? preferences.getFloat(NVS_TOTAL_LITERS_KEY, 0.0f)
    : 0.0f;
  preferences.end();

  loadNetworks(serializedNetworks);
  if (knownNetworkCount == 0) {
    loadLegacyNetworks();
    if (knownNetworkCount > 0) {
      saveNetworks();
      Serial.println("[NVS] Redes antiguas migradas al formato actual.");
    }
  }

  if (deviceCode.isEmpty() && isConfiguredText(HIDROSMART_DEVICE_CODE) &&
      isLogicalDeviceCode(HIDROSMART_DEVICE_CODE)) {
    deviceCode = HIDROSMART_DEVICE_CODE;
  }
  if (!isLogicalDeviceCode(deviceCode)) deviceCode = PRIMARY_LOGICAL_DEVICE_CODE;

  if (mqttHost.isEmpty()) mqttHost = HIDROSMART_MQTT_HOST;
  if (mqttPort == 0) mqttPort = HIDROSMART_MQTT_PORT;

  lastPersistedTotalLiters = totalLiters;

  // La asociacion es la autoridad para BLE. Un ESP32 sin hogar nunca debe
  // quedar bloqueado y debe poder volver a vincularse por Bluetooth.
  if (!linkedToHome && bleLocked) {
    bleLocked = false;
    saveBleLock(false);
  }

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

void saveBleLock(bool locked) {
  bleLocked = locked;
  preferences.begin(NVS_NAMESPACE, false);
  preferences.putBool(NVS_BLE_LOCKED_KEY, bleLocked);
  preferences.end();
}

void saveLinkedToHome(bool linked) {
  linkedToHome = linked;
  preferences.begin(NVS_NAMESPACE, false);
  preferences.putBool(NVS_LINKED_HOME_KEY, linkedToHome);
  preferences.end();
}

void saveMeasurementEnabled(bool enabled) {
  preferences.begin(NVS_NAMESPACE, false);
  preferences.putBool(NVS_MEASUREMENT_ENABLED_KEY, enabled);
  preferences.end();
}

void saveTotalLiters() {
  preferences.begin(NVS_NAMESPACE, false);
  preferences.putFloat(NVS_TOTAL_LITERS_KEY, totalLiters);
  preferences.end();
  lastPersistedTotalLiters = totalLiters;
  lastTotalSaveAt = millis();
}

void setMeasurementEnabled(bool enabled) {
  if (measurementEnabled == enabled) return;

  if (pendingSampleSeconds > 0.0f && !publishPendingTelemetry()) {
    Serial.println("[MEASUREMENT] Cambio rechazado: telemetria pendiente no enviada.");
    return;
  }

  if (!enabled) {
    // Keep pulses available for leak detection while excluding them from the
    // household metered total.
    saveTotalLiters();
    measurementEnabled = false;
    saveMeasurementEnabled(false);
    Serial.println("[MEASUREMENT] Conteo pausado; vigilancia de flujo activa.");
    return;
  }

  measurementEnabled = true;
  saveMeasurementEnabled(true);
  Serial.println("[MEASUREMENT] Conteo normal reanudado por comando remoto.");
}

bool synchronizeSystemTime() {
#if HIDROSMART_MQTT_USE_TLS
  if (time(nullptr) >= MIN_VALID_EPOCH) return true;

  Serial.println("[NTP] Solicitando hora a servidores publicos...");
  configTime(0, 0, "time.cloudflare.com", "pool.ntp.org", "time.google.com");

  struct tm timeInfo = {};
  if (getLocalTime(&timeInfo, 12000) && time(nullptr) >= MIN_VALID_EPOCH) {
    char timestamp[24] = {};
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", &timeInfo);
    Serial.print("[NTP] Hora sincronizada: ");
    Serial.println(timestamp);
    return true;
  }

  Serial.println("[NTP] Sin respuesta. Verifica Internet, DNS y que la red permita UDP/123.");
  return false;
#else
  return true;
#endif
}

bool ensureSystemTime() {
#if HIDROSMART_MQTT_USE_TLS
  if (time(nullptr) >= MIN_VALID_EPOCH) return true;

  const unsigned long now = millis();
  if (ntpAttemptMade && now - lastNtpAttemptAt < NTP_SYNC_RETRY_INTERVAL_MS) {
    return false;
  }

  ntpAttemptMade = true;
  lastNtpAttemptAt = now;
  return synchronizeSystemTime();
#else
  return true;
#endif
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
  activeKnownNetworkIndex = -1;
  for (uint8_t index = 0; index < knownNetworkCount; index++) {
    if (connectToWifi(knownNetworks[index].ssid, knownNetworks[index].password, WIFI_TIMEOUT_MS)) {
#if HIDROSMART_MQTT_USE_TLS
      mqttHost = HIDROSMART_MQTT_HOST;
      mqttPort = HIDROSMART_MQTT_PORT;
#else
      mqttHost = knownNetworks[index].mqttHost.isEmpty() ? String(HIDROSMART_MQTT_HOST) : knownNetworks[index].mqttHost;
      mqttPort = knownNetworks[index].mqttPort == 0 ? HIDROSMART_MQTT_PORT : knownNetworks[index].mqttPort;
#endif
#if HIDROSMART_MQTT_USE_TLS
      ensureSystemTime();
#endif
      saveNetwork(knownNetworks[index].ssid, knownNetworks[index].password, mqttHost, mqttPort);
      saveMqttConfiguration(mqttHost, mqttPort);
      activeKnownNetworkIndex = static_cast<int8_t>(index);
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
  const bool mqttConnected = mqttClient.connected();
  document["wifiConnected"] = wifiConnected;
  document["mqttConnected"] = mqttConnected;
  document["bleEnabled"] = bleAdvertising;
  document["linkedToHome"] = linkedToHome;
  document["measurementEnabled"] = measurementEnabled;
  document["bleLocked"] = bleLocked;
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

void handleMqttCommand(char* topic, uint8_t* payload, unsigned int length) {
  bool knownLogicalTopic = false;
  for (size_t index = 0; index < LOGICAL_DEVICE_COUNT; index++) {
    if (String(topic) == deviceTopic(LOGICAL_DEVICE_CODES[index], COMMANDS_SUFFIX)) {
      knownLogicalTopic = true;
      break;
    }
  }
  if (!knownLogicalTopic) return;

  String serialized;
  serialized.reserve(length + 1);
  for (unsigned int index = 0; index < length; index++) {
    serialized += static_cast<char>(payload[index]);
  }

  JsonDocument document;
  if (deserializeJson(document, serialized)) return;

  String command = document["command"] | "";
  command.toLowerCase();

  if (command == "set_measurement") {
    JsonVariantConst enabledValue = document["enabled"];
    if (!enabledValue.is<bool>()) {
      Serial.println("[MQTT] Comando set_measurement rechazado: falta enabled booleano.");
      return;
    }

    setMeasurementEnabled(enabledValue.as<bool>());
    notifyStatus(measurementEnabled ? "measurement_enabled" : "measurement_paused");
    const String statusTopic = deviceTopic(activeLogicalDeviceCode(), STATUS_SUFFIX);
    const String currentStatus = statusPayload(activeLogicalDeviceCode(), "ONLINE");
    if (mqttClient.connected()) {
      mqttClient.publish(statusTopic.c_str(), currentStatus.c_str(), true);
    }
    return;
  }

  if (command == "enable_ble") {
    saveBleLock(false);
    startProvisioningBLE();
    notifyStatus("ble_enabled");
    return;
  }

  if (command == "confirm_link") {
    saveLinkedToHome(true);
    saveBleLock(true);
    applyBlePolicy();
    notifyStatus("provisioning_complete");
    return;
  }

  if (command == "unlink") {
    saveLinkedToHome(false);
    saveBleLock(false);
    applyBlePolicy();
    notifyStatus("ble_enabled");
    return;
  }

  if (command == "disable_ble") {
    if (!linkedToHome) {
      notifyStatus("ble_disable_rejected");
      return;
    }
    saveBleLock(true);
    applyBlePolicy();
    notifyStatus("ble_disabled");
  }
}

bool connectMqtt() {
  if (WiFi.status() != WL_CONNECTED || mqttHost.isEmpty()) return false;
#if HIDROSMART_MQTT_USE_TLS
  if (mqttHost != HIDROSMART_MQTT_HOST || mqttPort != HIDROSMART_MQTT_PORT) {
    Serial.println("[MQTT] El perfil TLS solo permite mqtt.flespi.io:8883.");
    return false;
  }
  if (!ensureSystemTime()) {
    const unsigned long now = millis();
    if (lastNtpWarningAt == 0 || now - lastNtpWarningAt >= NTP_WARNING_INTERVAL_MS) {
      Serial.println("[NTP] Aun no hay hora valida; MQTT/TLS espera sincronizacion. Se requiere Internet, DNS y UDP/123.");
      lastNtpWarningAt = now;
    }
    return false;
  }
#endif

  const String clientId = String("HidroSmart-") + hardwareId + "-" + String(bootId);
  const char* activeCode = activeLogicalDeviceCode();
  const String statusTopic = deviceTopic(activeCode, STATUS_SUFFIX);
  const String offlinePayload = statusPayload(activeCode, "OFFLINE");
  auto attemptConnect = [&]() -> bool {
    mqttClient.disconnect();
#if HIDROSMART_MQTT_USE_TLS
    if (std::strlen(HIDROSMART_MQTT_USERNAME) == 0) {
      Serial.println("[MQTT] TLS requiere un token Flespi por dispositivo en config.h.");
      return false;
    }
    secureWifiClient.setCACert(HIDROSMART_FLESPI_ROOT_CA);
    mqttClient.setClient(secureWifiClient);
#else
    mqttClient.setClient(wifiClient);
#endif
    mqttClient.setServer(mqttHost.c_str(), mqttPort);
    mqttClient.setCallback(handleMqttCommand);
    Serial.print("[MQTT] Intentando conectar a ");
    Serial.print(mqttHost);
    Serial.print(':');
    Serial.println(mqttPort);

    if (std::strlen(HIDROSMART_MQTT_USERNAME) > 0) {
      const char* mqttPassword = std::strlen(HIDROSMART_MQTT_PASSWORD) > 0
        ? HIDROSMART_MQTT_PASSWORD
        : nullptr;
      return mqttClient.connect(clientId.c_str(), HIDROSMART_MQTT_USERNAME,
        mqttPassword, statusTopic.c_str(), 1, true, offlinePayload.c_str());
    }
    return mqttClient.connect(
      clientId.c_str(), statusTopic.c_str(), 1, true, offlinePayload.c_str()
    );
  };

  if (!attemptConnect()) {
    Serial.print("[MQTT] Error de conexion, estado: ");
    Serial.println(mqttClient.state());

    const String fallbackHost = String(HIDROSMART_MQTT_HOST);
    const uint16_t fallbackPort = HIDROSMART_MQTT_PORT;
    if (
      isConfiguredText(HIDROSMART_MQTT_HOST) &&
      (fallbackHost != mqttHost || fallbackPort != mqttPort)
    ) {
      const String previousHost = mqttHost;
      const uint16_t previousPort = mqttPort;
      mqttHost = fallbackHost;
      mqttPort = fallbackPort;
      Serial.println("[MQTT] Probando broker definido en firmware.");

      if (!attemptConnect()) {
        Serial.print("[MQTT] Error de conexion con fallback, estado: ");
        Serial.println(mqttClient.state());
        mqttHost = previousHost;
        mqttPort = previousPort;
        return false;
      }

      saveMqttConfiguration(mqttHost, mqttPort);
      if (activeKnownNetworkIndex >= 0 && activeKnownNetworkIndex < static_cast<int8_t>(knownNetworkCount)) {
        knownNetworks[activeKnownNetworkIndex].mqttHost = mqttHost;
        knownNetworks[activeKnownNetworkIndex].mqttPort = mqttPort;
        saveNetworks();
      }
    } else {
      return false;
    }
  }

  bool allSubscribed = true;
  for (size_t index = 0; index < LOGICAL_DEVICE_COUNT; index++) {
    const char* logicalCode = LOGICAL_DEVICE_CODES[index];
    const String commandsTopic = deviceTopic(logicalCode, COMMANDS_SUFFIX);
    allSubscribed = mqttClient.subscribe(commandsTopic.c_str(), 1) && allSubscribed;
  }
  const String currentStatusTopic = deviceTopic(activeLogicalDeviceCode(), STATUS_SUFFIX);
  const String onlinePayload = statusPayload(activeLogicalDeviceCode(), "ONLINE");
  const bool allPublished = mqttClient.publish(
    currentStatusTopic.c_str(), onlinePayload.c_str(), true
  );
  Serial.print("[MQTT] Conectado a ");
  Serial.print(mqttHost);
  Serial.print(':');
  Serial.println(mqttPort);
  if (!allSubscribed) Serial.println("[MQTT] No se pudo suscribir a todos los canales de comandos");
  if (!allPublished) Serial.println("[MQTT] No se pudo publicar el estado del ID logico activo");
  return allPublished && allSubscribed;
}

bool publishTelemetry(uint32_t pulses, float flowRateLpm, float consumptionLiters, float intervalSeconds) {
  if (!mqttClient.connected()) {
    Serial.println("[MQTT] Broker desconectado; la lectura queda pendiente.");
    return false;
  }

  if (pendingTelemetrySequence == 0) {
    pendingTelemetrySequence = ++sequence;
    pendingTelemetryTimestamp = isoTimestamp();
  }
  const uint32_t currentSequence = pendingTelemetrySequence;
  const String timestamp = pendingTelemetryTimestamp;
  char payload[512];
  const char* logicalCode = activeLogicalDeviceCode();
  const String messageId = String(logicalCode) + "-" + String(bootId) + "-" + String(currentSequence);
  const String topic = deviceTopic(logicalCode, TELEMETRY_SUFFIX);
  snprintf(
    payload,
    sizeof(payload),
    "{\"mqttMessageId\":\"%s\",\"deviceId\":\"%s\",\"hardwareId\":\"%s\",\"timestamp\":\"%s\","
    "\"flowRateLpm\":%.3f,\"consumptionLiters\":%.5f,\"totalLiters\":%.5f,"
    "\"pulses\":%lu,\"sampleIntervalSeconds\":%.3f,\"measurementEnabled\":%s,\"wifiRssiDbm\":%ld,\"signalQuality\":%ld}",
    messageId.c_str(), logicalCode, hardwareId.c_str(), timestamp.c_str(), flowRateLpm,
    consumptionLiters, totalLiters, pulses, intervalSeconds, measurementEnabled ? "true" : "false", static_cast<long>(WiFi.RSSI()),
    static_cast<long>(WiFi.RSSI())
  );

  const bool allPublished = mqttClient.publish(topic.c_str(), payload, false);
  Serial.print("[MQTT] ");
  Serial.print(allPublished ? "Telemetria enviada: " : "Error enviando telemetria: ");
  Serial.print(logicalCode);
  Serial.print(" | ");
  Serial.println(payload);
  if (allPublished) {
    pendingTelemetrySequence = 0;
    pendingTelemetryTimestamp = "";
  }
  return allPublished;
}

bool publishPendingTelemetry() {
  if (pendingSampleSeconds <= 0.0f) return true;
  const float pendingFlowRateLpm = pendingFlowLiters / (pendingSampleSeconds / 60.0f);
  if (!publishTelemetry(pendingPulses, pendingFlowRateLpm, pendingConsumptionLiters, pendingSampleSeconds)) {
    return false;
  }
  pendingPulses = 0;
  pendingFlowLiters = 0.0f;
  pendingConsumptionLiters = 0.0f;
  pendingSampleSeconds = 0.0f;
  return true;
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
  String requestedDeviceCode = document["deviceCode"] | deviceCode;

  if (ssid.isEmpty() || ssid.length() > 32) {
    notifyStatus("invalid_ssid");
    return;
  }
  if (password.length() > 63 || newMqttHost.length() > 253 || requestedPort < 1 || requestedPort > 65535) {
    notifyStatus("invalid_configuration");
    return;
  }
#if HIDROSMART_MQTT_USE_TLS
  if (newMqttHost != HIDROSMART_MQTT_HOST || requestedPort != HIDROSMART_MQTT_PORT) {
    notifyStatus("mqtt_unreachable");
    return;
  }
#endif
  if (!isSafeDeviceCode(requestedDeviceCode) || !isLogicalDeviceCode(requestedDeviceCode)) {
    notifyStatus("invalid_device_code");
    return;
  }
  for (size_t index = 0; index < LOGICAL_DEVICE_COUNT; index++) {
    if (requestedDeviceCode.equalsIgnoreCase(LOGICAL_DEVICE_CODES[index])) {
      requestedDeviceCode = LOGICAL_DEVICE_CODES[index];
      break;
    }
  }

  const String previousDeviceCode = deviceCode;
  String effectivePassword = password;
  String savedPassword;
  bool hasSavedNetwork = false;
  for (uint8_t index = 0; index < knownNetworkCount; index++) {
    if (knownNetworks[index].ssid == ssid) {
      savedPassword = knownNetworks[index].password;
      hasSavedNetwork = true;
      break;
    }
  }

  // The app intentionally leaves this field empty when it has no new Wi-Fi
  // password to send. Reuse the password already stored on the ESP32 for that
  // SSID instead of trying to join a secured network with an empty password.
  if (effectivePassword.isEmpty() && hasSavedNetwork) {
    effectivePassword = savedPassword;
    Serial.println("[WIFI] Se conserva la contrasena guardada para esta red.");
  }

  const bool wifiAlreadyOnRequestedNetwork = WiFi.status() == WL_CONNECTED &&
    (connectedSsid == ssid || WiFi.SSID() == ssid);
  const bool passwordUnchanged = password.isEmpty() ||
    (hasSavedNetwork && password == savedPassword);
  const bool keepCurrentWifiConnection = wifiAlreadyOnRequestedNetwork && passwordUnchanged;
  if (mqttClient.connected() && previousDeviceCode != requestedDeviceCode) {
    const String previousStatusTopic = deviceTopic(previousDeviceCode.c_str(), STATUS_SUFFIX);
    const String offlinePayload = statusPayload(previousDeviceCode.c_str(), "OFFLINE");
    mqttClient.publish(previousStatusTopic.c_str(), offlinePayload.c_str(), true);
    mqttClient.disconnect();
  }
  deviceCode = requestedDeviceCode;
  notifyStatus("configuration_received");
  notifyStatus("wifi_connecting");
  if (keepCurrentWifiConnection) {
    connectedSsid = ssid;
    Serial.println("[WIFI] La placa ya esta en esa red; se conserva la conexion.");
  } else if (!connectToWifi(ssid, effectivePassword, WIFI_TIMEOUT_MS)) {
    notifyStatus("wifi_failed");
    deviceCode = previousDeviceCode;
    return;
  }

  mqttHost = newMqttHost;
  mqttPort = static_cast<uint16_t>(requestedPort);
  saveNetwork(ssid, effectivePassword, mqttHost, mqttPort);
  saveMqttConfiguration(mqttHost, mqttPort);
  notifyStatus("wifi_connected");

  if (connectMqtt()) {
    if (linkedToHome) {
      saveBleLock(true);
      applyBlePolicy();
      notifyStatus("provisioning_complete");
    } else {
      // La red ya quedo guardada, pero el backend aun debe confirmar que el
      // equipo pertenece a un hogar. Mientras tanto BLE permanece disponible.
      notifyStatus("waiting_link_confirmation");
    }
  } else {
    notifyStatus("mqtt_unreachable");
  }
}

class ProvisioningCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* characteristic, NimBLEConnInfo&) override {
    const std::string value = characteristic->getValue();
    if (value.empty()) return;

    // No bloquear el callback GATT: conectar Wi-Fi y MQTT puede tardar varios
    // segundos y el navegador necesita recibir primero la respuesta del write.
    portENTER_CRITICAL(&blePayloadMux);
    std::strncpy(pendingBlePayload, value.c_str(), BLE_PAYLOAD_MAX - 1);
    pendingBlePayload[BLE_PAYLOAD_MAX - 1] = '\0';
    pendingBlePayloadReady = true;
    portEXIT_CRITICAL(&blePayloadMux);
  }
};

class ProvisioningServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* server, NimBLEConnInfo& connInfo) override {
    // Un intervalo corto y un timeout amplio evitan que Windows descarte el
    // enlace mientras descubre el servicio y sus caracteristicas GATT.
    server->updateConnParams(connInfo.getConnHandle(), 12, 24, 0, 200);
    bleClientConnected = true;
    Serial.println("[BLE] Cliente conectado; GATT listo.");
  }

  void onDisconnect(NimBLEServer*, NimBLEConnInfo&, int reason) override {
    bleClientConnected = false;
    // NimBLE detiene el advertising al aceptar una conexion. Si el usuario
    // cancela el selector BLE o la conexion falla, debe volver a descubrirse
    // sin reiniciar el ESP32. Un equipo vinculado y bloqueado permanece fuera
    // de BLE hasta que el backend confirme el desvinculo o se use BOOT.
    if (!linkedToHome || !bleLocked) {
      NimBLEDevice::startAdvertising();
      bleAdvertising = true;
      setBleStatus("ready", false);
      Serial.print("[BLE] Cliente desconectado (razon ");
      Serial.print(reason);
      Serial.println("); advertising reiniciado.");
    }
  }
};

void startProvisioningBLE() {
  const String bleName = String("HidroSmart-") + hardwareId.substring(hardwareId.length() - 6);
  if (!bleInitialized) {
    NimBLEDevice::init(bleName.c_str());
    // Mantiene el enlace de provisionamiento estable durante el escaneo y la
    // lectura/escritura GATT, especialmente cuando el ESP32 esta junto a un
    // router Wi-Fi activo.
    NimBLEDevice::setPower(9);

    NimBLEServer* server = NimBLEDevice::createServer();
    server->setCallbacks(new ProvisioningServerCallbacks());
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
    configCharacteristic->setValue("");
    statusCharacteristic->setValue("{}");

    NimBLEAdvertising* advertising = NimBLEDevice::getAdvertising();
    // El nombre y el UUID de servicio no caben juntos en el anuncio BLE
    // principal. El nombre se entrega en la respuesta de escaneo para que
    // Chrome/Edge pueda descubrir el ESP32 sin truncar el anuncio.
    advertising->enableScanResponse(true);
    advertising->addServiceUUID(BLE_SERVICE_UUID);
    advertising->setName(bleName.c_str());
    bleInitialized = true;
  }

  if (!bleAdvertising) {
    // Inicia el GATT despues de registrar todos los atributos. En NimBLE
    // 2.x service->start() ya no registra el servicio; debe arrancar el
    // servidor antes de publicar el anuncio.
    NimBLEServer* server = NimBLEDevice::getServer();
    if (server != nullptr && !server->start()) {
      Serial.println("[BLE] No se pudo iniciar el servidor GATT");
      return;
    }
    NimBLEDevice::startAdvertising();
    bleAdvertising = true;
    // El estado ready debe reflejar que el anuncio BLE ya esta activo.
    setBleStatus("ready", false);
    Serial.print("[BLE] Provisionamiento activo: ");
    Serial.println(bleName);
  }
}

void stopProvisioningBLE() {
  if (!bleInitialized) return;

  // Al confirmar la vinculacion, cerrar clientes GATT activos ademas de
  // detener el anuncio para que la ventana de provisionamiento quede cerrada.
  NimBLEServer* server = NimBLEDevice::getServer();
  if (server != nullptr) {
    for (const uint16_t connHandle : server->getPeerDevices()) {
      server->disconnect(connHandle);
    }
  }

  NimBLEDevice::getAdvertising()->stop();
  bleAdvertising = false;
  bleClientConnected = false;
  Serial.println("[BLE] Provisionamiento detenido: dispositivo asociado");
}

void applyBlePolicy() {
  // Sin hogar asociado, BLE debe poder descubrirse para vincular el equipo.
  if (!linkedToHome) {
    if (bleLocked) saveBleLock(false);
    if (!bleAdvertising) startProvisioningBLE();
    return;
  }

  // La vinculacion confirmada cierra el provisionamiento BLE hasta que el
  // backend confirme el desvinculo. BOOT permite una recuperacion fisica.
  if (!bleLocked) {
    if (!bleAdvertising) startProvisioningBLE();
    return;
  }

  stopProvisioningBLE();
}

void checkConfigurationButton() {
  const bool pressed = digitalRead(CONFIG_BUTTON_PIN) == LOW;

  if (pressed && !configButtonPressed) {
    configButtonPressed = true;
    configButtonHandled = false;
    configButtonStartedAt = millis();
  }

  if (pressed && !configButtonHandled && millis() - configButtonStartedAt >= 5000UL) {
    configButtonHandled = true;
    saveBleLock(false);
    startProvisioningBLE();
    notifyStatus("ble_enabled");
    Serial.println("[BLE] Configuracion manual activada con BOOT");
  }

  if (!pressed) {
    configButtonPressed = false;
    configButtonHandled = false;
  }
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
  pinMode(CONFIG_BUTTON_PIN, INPUT_PULLUP);

  mqttClient.setKeepAlive(HIDROSMART_MQTT_KEEPALIVE_SECONDS);
  mqttClient.setBufferSize(768);

  // Anuncia BLE antes de intentar redes NVS. Cada red puede tardar hasta 15 s;
  // el dispositivo queda descubrible mientras prueba Wi-Fi y el broker.
  applyBlePolicy();

  if (connectKnownWifi()) {
    if (!connectMqtt()) {
      Serial.println("[MQTT] Mosquitto no disponible; se activa Bluetooth para corregir la configuracion.");
    }
  } else {
    Serial.println("[WIFI] No hay redes guardadas disponibles.");
  }

  applyBlePolicy();

  lastSampleAt = millis();
  lastTotalSaveAt = millis();
}

void loop() {
  const unsigned long now = millis();

  checkConfigurationButton();

  String blePayload;
  if (takePendingBlePayload(blePayload)) {
    handleProvisioningPayload(blePayload);
  }

  if (WiFi.status() != WL_CONNECTED) {
    if (now - lastWifiAttemptAt >= WIFI_RETRY_INTERVAL_MS) {
      lastWifiAttemptAt = now;
      connectKnownWifi();
    }
  } else {
    if (!mqttClient.connected() && now - lastMqttAttemptAt >= MQTT_RETRY_INTERVAL_MS) {
      lastMqttAttemptAt = now;
      connectMqtt();
    }
    mqttClient.loop();
  }

  if (now - lastSampleAt < HIDROSMART_SAMPLE_INTERVAL_MS) {
    delay(10);
    return;
  }

  const float intervalSeconds = (now - lastSampleAt) / 1000.0f;
  lastSampleAt = now;

  noInterrupts();
  const uint32_t pulses = pulseCount;
  pulseCount = 0;
  interrupts();

  // YF-S201: caudal (L/min) = pulsos/segundo / 7.5.
  const float pulsesPerSecond = pulses / intervalSeconds;
  const float flowRateLpm = pulsesPerSecond / HIDROSMART_FLOW_FACTOR;
  const float consumptionLiters = flowRateLpm * intervalSeconds / 60.0f;
  const float meteredConsumptionLiters = measurementEnabled ? consumptionLiters : 0.0f;
  if (measurementEnabled) totalLiters += consumptionLiters;
  pendingPulses += pulses;
  pendingFlowLiters += consumptionLiters;
  pendingConsumptionLiters += meteredConsumptionLiters;
  pendingSampleSeconds += intervalSeconds;

  if (measurementEnabled && ((now - lastTotalSaveAt >= TOTAL_SAVE_INTERVAL_MS) ||
      (totalLiters - lastPersistedTotalLiters >= TOTAL_SAVE_MIN_DELTA_LITERS))) {
    saveTotalLiters();
  }

  Serial.print("Pulsos: ");
  Serial.print(pulses);
  Serial.print(" | Caudal: ");
  Serial.print(flowRateLpm, 3);
  Serial.print(" L/min | Consumo contabilizado: ");
  Serial.print(meteredConsumptionLiters, 5);
  Serial.print(" L | Total: ");
  Serial.print(totalLiters, 5);
  Serial.println(" L");

  // La telemetria conserva el periodo de 5 segundos aunque el navegador siga
  // conectado por BLE. BLE y MQTT pueden trabajar en paralelo; pausar MQTT
  // aqui dejaba lecturas acumuladas y rompia la sincronizacion con el frontend.
  if (mqttClient.connected() && !publishPendingTelemetry()) {
    // PubSubClient may report a stale socket as connected. Keep the reading
    // pending and force a fresh session so the normal retry path can recover.
    Serial.println("[MQTT] Publicacion fallida; cierro la sesion para reintentar.");
    mqttClient.disconnect();
  }
}
