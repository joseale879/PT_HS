-- Consentimientos y solicitudes ARCO conservan evidencia; no se borran desde la aplicacion.
REVOKE UPDATE, DELETE ON privacy.user_consent FROM hidro_smart_app;
REVOKE DELETE ON privacy.arco_request FROM hidro_smart_app;