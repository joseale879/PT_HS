REVOKE ALL ON FUNCTION consumption.fn_get_consumption_series(UUID, DATE, DATE, VARCHAR) FROM hidro_smart_app;
GRANT EXECUTE ON FUNCTION consumption.fn_get_consumption_series(UUID, DATE, DATE, VARCHAR) TO PUBLIC;
