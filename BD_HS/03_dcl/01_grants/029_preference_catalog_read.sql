-- El backend necesita los catálogos activos para resolver idioma y moneda del usuario.
-- Son datos públicos de configuración; no conceden escritura ni acceso a preferencias ajenas.
GRANT SELECT ON preference.language, preference.currency TO hidro_smart_app;
