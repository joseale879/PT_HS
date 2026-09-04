GRANT CONNECT ON DATABASE hidro_smart TO hidro_smart_ingest;
GRANT USAGE ON SCHEMA consumption TO hidro_smart_ingest;
GRANT INSERT ON consumption.sensor_reading TO hidro_smart_ingest;
