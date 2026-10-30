# Firmware ESP32

## Dispositivo lógico

La placa puede seleccionar uno de cuatro códigos lógicos preasignados:
`HS-7A3F91C8D2E4`, `HS-B6E04D79A153`, `HS-2C8A5F01E7B9` y
`HS-141F47470968`. Publica telemetría en el ID activo y acepta comandos para
cualquiera de los cuatro. El `hardwareId` físico se obtiene del eFuse y sigue
siendo independiente del código lógico activo.

La ACL del token de Flespi debe permitir publicar `telemetry` y `status` para
el ID activo y suscribirse a `commands` para los cuatro IDs. El backend usa su
propio token.

Firmware Arduino/PlatformIO del sensor HidroSmart. Lee un caudalímetro,
conserva redes Wi-Fi en NVS, se aprovisiona por BLE y publica telemetría MQTT.

## Preparación

1. Copia `provisioning/config.example.h` como `provisioning/config.h`.
2. Define Wi-Fi, host MQTT de red estable, código lógico y parámetros del
   sensor. `config.h` está ignorado por Git.
3. Instala PlatformIO y ejecuta:

```powershell
Set-Location firmware
pio run
pio run -t upload --upload-port COM6
pio device monitor --baud 115200
```

Si `COM6` está ocupado, cierra el monitor serie, Arduino IDE o cualquier
programa que esté usando el puerto y vuelve a cargar.

## Comportamiento BLE

- La placa obtiene un `hardwareId` estable desde el eFuse.
- Si no pertenece a un hogar, anuncia `HidroSmart-XXXXXX` por BLE incluso con
  Wi-Fi ya guardado.
- Cuando recibe Wi-Fi por BLE, guarda la red en NVS y trata de conectar MQTT.
- `confirm_link` persiste la asociación, cierra las conexiones GATT activas y
  detiene BLE; conserva la red guardada.
- `unlink` conserva Wi-Fi, borra solo la asociación y reactiva BLE.
- Mantener BOOT aproximadamente cinco segundos habilita BLE manualmente.

El servicio BLE no usa pairing ni PIN. Mientras el equipo no esté asociado,
mantén el acceso físico al dispositivo bajo control. La asociación confirmada
detiene el anuncio BLE; BOOT permite recuperación física local.

## Telemetría

El intervalo predeterminado es cinco segundos (`HIDROSMART_SAMPLE_INTERVAL_MS`).
Cada mensaje contiene un `mqttMessageId` único por arranque y secuencia para
permitir deduplicación en el backend. Consulta el
[contrato MQTT](mqtt/contract.md) y el [flujo IoT general](../docs/iot.md).

## Configuración MQTT

La configuración del `.env` y el envío del host por BLE están en
[`docs/mqtt-esp32-red-local.md`](../docs/mqtt-esp32-red-local.md); el ciclo de
vinculación está en [`docs/dispositivos-iot.md`](../docs/dispositivos-iot.md).

El host debe ser visible desde la Wi-Fi del ESP32; no uses `localhost` ni
`mosquitto`, pues solo funcionan dentro del equipo o la red Docker. Para la red
local usa un nombre DNS/mDNS estable o una reserva DHCP gestionada.

El broker Mosquitto integrado sirve solo para desarrollo sin TLS. Para Flespi,
compila con `pio run -e esp32dev-flespi`; ese perfil activa TLS y fija
`mqtt.flespi.io:8883`, incluso si el ESP32 conserva un broker local antiguo en
NVS. Configura un token ACL exclusivo de esta placa en
`HIDROSMART_MQTT_USERNAME`. Flespi acepta el token como usuario y deja la
contraseña vacía. El firmware valida el
certificado contra el ancla pública GlobalSign Root CA R6 de
[`provisioning/flespi_root_ca.h`](provisioning/flespi_root_ca.h); no usa
`setInsecure`. La conexión TLS espera la sincronización NTP para validar las
fechas del certificado.

Construye un firmware por dispositivo con token y ACL distintos. No subas
`config.h` ni distribuyas el mismo binario con credenciales compartidas. El
token del backend debe ser distinto y tener permisos limitados a los topics
que el backend necesita.

## Hardware de referencia

- Placa: ESP32 Dev Module.
- Caudalímetro: YF-S201.
- Pin de pulsos predeterminado: GPIO 27.
- Factor de flujo predeterminado: `7.5`.

Calibra el factor con una medición real antes de usar datos de consumo para
decisiones o cobro.
