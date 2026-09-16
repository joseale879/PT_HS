DELETE FROM user_account.role_permission
WHERE permission_id = (SELECT permission_id FROM user_account.permission WHERE name = 'actuators.manage');
DELETE FROM user_account.permission WHERE name = 'actuators.manage';
