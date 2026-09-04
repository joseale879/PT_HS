WITH permission_seed(name, description) AS (
    VALUES
        ('users.manage', 'Gestionar cuentas de usuario'),
        ('roles.manage', 'Gestionar roles y permisos'),
        ('homes.manage', 'Gestionar hogares propios'),
        ('devices.manage', 'Gestionar dispositivos'),
        ('consumption.read', 'Consultar consumo'),
        ('reports.read', 'Consultar reportes'),
        ('alerts.manage', 'Gestionar alertas'),
        ('tickets.manage', 'Gestionar tickets'),
        ('audit.read', 'Consultar auditoría autorizada'),
        ('mfa.manage', 'Gestionar MFA'),
        ('credentials.manage', 'Gestionar credenciales')
), inserted AS (
    INSERT INTO user_account.permission (name, description, type, status)
    SELECT name, description, 'functional', 'Active'
    FROM permission_seed
    ON CONFLICT (name) DO UPDATE
        SET description = EXCLUDED.description,
            status = 'Active'
    RETURNING permission_id, name
)
SELECT 1;

WITH role_permissions(role_name, permission_name) AS (
    VALUES
        ('Administrator', 'users.manage'),
        ('Administrator', 'roles.manage'),
        ('Administrator', 'homes.manage'),
        ('Administrator', 'devices.manage'),
        ('Administrator', 'consumption.read'),
        ('Administrator', 'reports.read'),
        ('Administrator', 'alerts.manage'),
        ('Administrator', 'tickets.manage'),
        ('Administrator', 'audit.read'),
        ('Administrator', 'mfa.manage'),
        ('Administrator', 'credentials.manage'),
        ('Support', 'devices.manage'),
        ('Support', 'consumption.read'),
        ('Support', 'alerts.manage'),
        ('Support', 'tickets.manage'),
        ('HomeUser', 'homes.manage'),
        ('HomeUser', 'consumption.read'),
        ('HomeUser', 'reports.read'),
        ('HomeUser', 'alerts.manage'),
        ('Guest', 'consumption.read'),
        ('Guest', 'reports.read')
)
INSERT INTO user_account.role_permission (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM role_permissions rp
JOIN user_account.role r ON r.name = rp.role_name
JOIN user_account.permission p ON p.name = rp.permission_name
ON CONFLICT DO NOTHING;
