-- Permite que PostgreSQL valide el FK compuesto de sensor_reading
-- contra home.home_device durante la ingesta IoT.
GRANT REFERENCES ON home.home_device TO hidro_smart_ingest;