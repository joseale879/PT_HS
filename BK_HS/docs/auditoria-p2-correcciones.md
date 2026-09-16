# AuditorÃ­a P2 â€” correcciones aplicadas

Fecha de revisiÃ³n: 2026-09-13.

Este documento registra el cierre de los faltantes P2 del informe recibido.
Las afirmaciones se separan entre lo que estÃ¡ versionado y lo que todavÃ­a
necesita una prueba fÃ­sica o una decisiÃ³n de producto.

## 53. Firmware ESP32

Estado: implementado como base reproducible.

- Existe `firmware/` con `provisioning`, `wifi`, `mqtt`, `sensors`,
  `actuators`, `ota`, `storage`, `src` y `tests`.
- `platformio.ini` fija ESP32/Arduino y PubSubClient.
- `src/main.cpp` conecta Wi-Fi, sincroniza tiempo, cuenta pulsos del YF-S201,
  publica telemetrÃ­a cada segundo y genera `mqttMessageId` compatible con la
  deduplicaciÃ³n del backend.
- `provisioning/config.h` queda fuera de Git; los secretos se completan desde
  `config.example.h` en cada equipo.
- `mqtt/contract.md` documenta topics y payload.

Pendiente fuera de este cierre: calibraciÃ³n del sensor concreto, pruebas sobre
la placa fÃ­sica, OTA real, actuadores reales y endurecimiento MQTT para
producciÃ³n (TLS, ACL y credenciales por dispositivo).

## 54. Referencia al proyecto mÃ³vil

Estado: corregido.

El cliente mÃ³vil sÃ­ estÃ¡ incluido en `FT_HS/frontend`. La documentaciÃ³n raÃ­z ya
no lo presenta como una carpeta ausente; se mantiene como cliente mÃ³vil
independiente del frontend web.

## 55. DocumentaciÃ³n desactualizada

Estado: corregido en los documentos operativos.

- La referencia vigente de Liquibase es **217 changesets** aplicados.
- MQTT ya persiste lecturas vÃ¡lidas en PostgreSQL mediante funciÃ³n SQL
  protegida, mÃ©tricas, timestamps separados e idempotencia por
  `mqttMessageId`.
- React Router del frontend estÃ¡ alineado en `7.18.3`; el estado actual y sus
  lÃ­mites estÃ¡n documentados en `FT_HS/docs/`.
- La autorizaciÃ³n efectiva sigue siendo backend + PostgreSQL/RLS; el frontend
  solo oculta o muestra opciones segÃºn permisos recibidos.
- El avatar/foto de perfil ya está conectado: `user_profile.avatar_data_url` se
  persiste mediante `/api/v1/users/me`, se valida por tipo y tamaño, y se devuelve
  en `/api/v1/users/me` y en la sesión del frontend. El teléfono también quedó
  ampliado a 60 caracteres en BD y backend.

## 56. ValidaciÃ³n completa

Estado: implementado.

- CI: `.github/workflows/validate.yml` ejecuta instalaciÃ³n limpia, Docker,
  `liquibase validate/update`, backend, frontend y prueba MQTT real contra
  PostgreSQL.
- Local: `scripts/validate-all.ps1` ejecuta el mismo flujo sin destruir el
  volumen local y toma las URLs de integraciÃ³n desde `.env` sin mostrarlas.
- La prueba `BK_HS/tests/integration/mqtt-postgres.test.js` publica dos veces
  el mismo mensaje QoS 1 y verifica que PostgreSQL conserve una sola fila.

## ComprobaciÃ³n

Desde la raÃ­z `PT_HS`:

```powershell
.\scripts\validate-all.ps1
```

Para CI se usan credenciales efÃ­meras definidas en el workflow. Para hardware
real todavÃ­a se debe ejecutar la prueba con una placa ESP32 configurada y un
sensor conectado.
