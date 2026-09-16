REVOKE ALL ON FUNCTION consumption.fn_get_consumption_series(UUID, DATE, DATE, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consumption.fn_get_consumption_series(UUID, DATE, DATE, VARCHAR) TO hidro_smart_app;
