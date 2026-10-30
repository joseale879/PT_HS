-- Restore the previous one-code configuration while preserving telemetry rows.
UPDATE home.home_device hd
   SET status = 'Suspended',
       suspended_at = COALESCE(hd.suspended_at, now())
  FROM device.device d
 WHERE hd.device_id = d.device_id
   AND d.code IN (
       'HS-B6E04D79A153',
       'HS-2C8A5F01E7B9',
       'HS-141F47470968'
   )
   AND hd.status = 'Active';

UPDATE device.device
   SET status = 'Suspended',
       suspension_reason = 'Retirado: HidroSmart vuelve a un unico dispositivo logico',
       changed_at_status = now(),
       hardware_id = NULL,
       connectivity_status = 'UNKNOWN',
       provisioning_status = 'PENDING',
       provisioning_error = NULL,
       provisioning_updated_at = now(),
       provisioned_at = NULL,
       firmware_version = NULL,
       last_connection_at = NULL,
       last_ip = NULL,
       wifi_ssid = NULL,
       wifi_rssi_dbm = NULL,
       signal_quality = NULL,
       battery_level = NULL,
       updated_at = now()
 WHERE code IN (
       'HS-B6E04D79A153',
       'HS-2C8A5F01E7B9',
       'HS-141F47470968'
   );

DELETE FROM device.logical_device_group_member
 WHERE group_key = 'ESP32-HS-01';
