-- La ingesta MQTT debe entrar por la funcion SECURITY DEFINER.
-- El rol tecnico no necesita insertar filas arbitrariamente en la tabla.
REVOKE INSERT ON TABLE consumption.sensor_reading FROM hidro_smart_ingest;
