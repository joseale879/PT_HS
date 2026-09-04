UPDATE user_account.user_credential uc
   SET policy_id = pp.policy_id
  FROM user_account.password_policy pp
 WHERE uc.policy_id IS NULL
   AND pp.active = TRUE
   AND pp.name = 'Default';

ALTER ROLE hidro_smart_app SET timezone TO 'America/Bogota';
