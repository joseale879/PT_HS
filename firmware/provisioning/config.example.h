#pragma once

#define HIDROSMART_WIFI_SSID "CAMBIA_WIFI_SSID"
#define HIDROSMART_WIFI_PASSWORD "CAMBIA_WIFI_PASSWORD"
#ifndef HIDROSMART_MQTT_USE_TLS
#define HIDROSMART_MQTT_USE_TLS 0
#endif
// The Flespi PlatformIO profile enables TLS and selects its public endpoint.
// The default profile remains for the isolated local Mosquitto broker.
#ifndef HIDROSMART_MQTT_HOST
#if HIDROSMART_MQTT_USE_TLS
#define HIDROSMART_MQTT_HOST "mqtt.flespi.io"
#else
// This DNS name must resolve to the local Mosquitto host from the ESP32 Wi-Fi.
#define HIDROSMART_MQTT_HOST "hidrosmart-broker.local"
#endif
#endif
#ifndef HIDROSMART_MQTT_PORT
#if HIDROSMART_MQTT_USE_TLS
#define HIDROSMART_MQTT_PORT 8883
#else
#define HIDROSMART_MQTT_PORT 1883
#endif
#endif
// Codigo logico unico de esta compilacion. Si se deja vacio, el firmware usa
// HS-7A3F91C8D2E4. El hardwareId fisico se detecta por separado desde eFuse.
// No reutilices el mismo codigo en dos placas.
#define HIDROSMART_DEVICE_CODE ""
// Use one dedicated Flespi ACL token per ESP32 as the MQTT username.
// Flespi does not require a password when the token is the username.
// Never commit config.h or distribute the same token to multiple devices.
#define HIDROSMART_MQTT_USERNAME ""
#define HIDROSMART_MQTT_PASSWORD ""
#define HIDROSMART_FIRMWARE_VERSION "1.1.0"
#define HIDROSMART_FLOW_PIN 27
#define HIDROSMART_FLOW_FACTOR 7.5f
#define HIDROSMART_SAMPLE_INTERVAL_MS 5000UL
#define HIDROSMART_MQTT_KEEPALIVE_SECONDS 30
