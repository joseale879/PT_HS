DELETE FROM user_account.role_permission rp
USING user_account.permission p
WHERE rp.permission_id = p.permission_id
  AND p.name IN (
      'users.manage', 'roles.manage', 'homes.manage', 'devices.manage',
      'consumption.read', 'reports.read', 'alerts.manage', 'tickets.manage',
      'audit.read', 'mfa.manage', 'credentials.manage'
  );

DELETE FROM user_account.permission
WHERE name IN (
    'users.manage', 'roles.manage', 'homes.manage', 'devices.manage',
    'consumption.read', 'reports.read', 'alerts.manage', 'tickets.manage',
    'audit.read', 'mfa.manage', 'credentials.manage'
);
