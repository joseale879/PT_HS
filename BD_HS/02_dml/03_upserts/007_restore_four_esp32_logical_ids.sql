-- Restore the four preassigned IDs as selectable aliases for one ESP32.
-- Keep the existing primary device's physical hardware claim and telemetry.
UPDATE device.device
   SET status = 'Active',
       suspension_reason = NULL,
       changed_at_status = now(),
       hardware_id = NULL,
       measurement_enabled = (
           SELECT primary_device.measurement_enabled
             FROM device.device primary_device
            WHERE primary_device.code = 'HS-7A3F91C8D2E4'
       ),
       measurement_updated_at = (
           SELECT primary_device.measurement_updated_at
             FROM device.device primary_device
            WHERE primary_device.code = 'HS-7A3F91C8D2E4'
       ),
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

INSERT INTO device.logical_device_group_member (device_id, group_key, is_primary)
SELECT d.device_id,
       'ESP32-HS-01',
       d.code = 'HS-7A3F91C8D2E4'
  FROM device.device d
 WHERE d.code IN (
       'HS-7A3F91C8D2E4',
       'HS-B6E04D79A153',
       'HS-2C8A5F01E7B9',
       'HS-141F47470968'
   )
ON CONFLICT (device_id) DO UPDATE
   SET group_key = EXCLUDED.group_key,
       is_primary = EXCLUDED.is_primary;

-- Reattach aliases only to the home already assigned to the primary code.
-- If there is no active primary assignment, normal linking can assign the group.
INSERT INTO home.home_device (home_id, device_id, status, suspended_at)
SELECT primary_link.home_id, member.device_id, 'Active', NULL
  FROM device.device primary_device
  JOIN home.home_device primary_link
    ON primary_link.device_id = primary_device.device_id
   AND primary_link.status = 'Active'
  JOIN device.logical_device_group_member member
    ON member.group_key = 'ESP32-HS-01'
  JOIN device.device active_member
    ON active_member.device_id = member.device_id
   AND active_member.status = 'Active'
 WHERE primary_device.code = 'HS-7A3F91C8D2E4'
ON CONFLICT (home_id, device_id) DO UPDATE
   SET status = 'Active', suspended_at = NULL;
