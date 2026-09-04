-- ============================================================
-- DATOS INICIALES: ROLES
-- ============================================================
INSERT INTO user_account.role (role_id, name, description, status) VALUES
    (gen_random_uuid(), 'Administrator', 'Control total del sistema: usuarios, hogares, dispositivos, configuraciones globales', 'Active'),
    (gen_random_uuid(), 'Support', 'Gestión de dispositivos, tickets y soporte técnico', 'Active'),
    (gen_random_uuid(), 'HomeUser', 'Monitoreo de consumo, reportes y gestión de hogares propios', 'Active'),
    (gen_random_uuid(), 'Guest', 'Acceso de solo lectura a hogares invitados', 'Active');