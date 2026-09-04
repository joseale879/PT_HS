INSERT INTO user_account.password_policy (
    name,
    description,
    min_length,
    requires_uppercase,
    requires_lowercase,
    requires_number,
    requires_symbol,
    expiration_days,
    lockout_attempts,
    lockout_minutes,
    active
)
SELECT
    'Default',
    'Política predeterminada de seguridad para nuevas credenciales.',
    8, TRUE, TRUE, TRUE, TRUE, 90, 5, 15, TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM user_account.password_policy WHERE name = 'Default'
);
