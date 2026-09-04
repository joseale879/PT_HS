-- ============================================================
-- DOMINIO 1: USUARIOS Y AUTENTICACIÓN (user_account)
-- ============================================================

-- 1. user_account — Datos principales de la cuenta
SET search_path TO user_account, preference, home, device, consumption, alert_rate, analytics_support, audit, privacy, public;

CREATE TABLE user_account (
    user_account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Blocked')),
    suspension_reason VARCHAR(255) NULL,
    suspended_by UUID NULL REFERENCES user_account(user_account_id),
    suspended_at TIMESTAMPTZ NULL,
    last_access_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,
    deleted_at TIMESTAMPTZ NULL,

    CONSTRAINT ck_user_account_username_length CHECK (char_length(username) >= 4),
    CONSTRAINT ck_user_account_email_format CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$'),
    CONSTRAINT ck_user_account_suspension CHECK (
        status = 'Active' OR suspended_at IS NOT NULL
    )
);

-- 2. user_profile — Datos personales del usuario
CREATE TABLE user_profile (
    user_account_id UUID PRIMARY KEY REFERENCES user_account(user_account_id) ON DELETE CASCADE,
    full_name VARCHAR(200) NOT NULL,
    document_type VARCHAR(20) NULL CHECK (document_type IN ('CC', 'CE')),
    document_number VARCHAR(50) NULL UNIQUE,
    phone VARCHAR(20) NULL,
    city VARCHAR(100) NULL
);

-- 3. role — Catálogo de roles
CREATE TABLE role (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,

    CONSTRAINT ck_role_name_length CHECK (char_length(name) >= 3)
);

-- 4. permission — Catálogo de permisos
CREATE TABLE permission (
    permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'functional' CHECK (type IN ('functional', 'data')),
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,

    CONSTRAINT ck_permission_name_length CHECK (char_length(name) >= 3)
);

-- 5. user_role — Asignación de roles a usuarios
CREATE TABLE user_role (
    user_account_id UUID NOT NULL REFERENCES user_account(user_account_id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES role(role_id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    assigned_by UUID NULL REFERENCES user_account(user_account_id),

    PRIMARY KEY (user_account_id, role_id)
);

-- 6. role_permission — Asignación de permisos a roles
CREATE TABLE role_permission (
    role_id UUID NOT NULL REFERENCES role(role_id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permission(permission_id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (role_id, permission_id)
);

-- 7. user_credential — Hash y salt de contraseñas (bcrypt)
CREATE TABLE user_credential (
    credential_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id UUID NOT NULL UNIQUE REFERENCES user_account(user_account_id) ON DELETE CASCADE,
    salt TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    password_hash TEXT NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    policy_id UUID NULL,
    requires_change BOOLEAN NOT NULL DEFAULT FALSE
);

-- 8. password_policy — Políticas de seguridad para contraseñas
CREATE TABLE password_policy (
    policy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    min_length INTEGER NOT NULL DEFAULT 8 CHECK (min_length >= 6),
    requires_uppercase BOOLEAN NOT NULL DEFAULT TRUE,
    requires_lowercase BOOLEAN NOT NULL DEFAULT TRUE,
    requires_number BOOLEAN NOT NULL DEFAULT TRUE,
    requires_symbol BOOLEAN NOT NULL DEFAULT TRUE,
    expiration_days INTEGER NOT NULL DEFAULT 90 CHECK (expiration_days >= 0),
    lockout_attempts INTEGER NOT NULL DEFAULT 5 CHECK (lockout_attempts > 0),
    lockout_minutes INTEGER NOT NULL DEFAULT 30 CHECK (lockout_minutes > 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL
);

-- 9. login_attempt — Registro de intentos fallidos
CREATE TABLE login_attempt (
    attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id UUID NOT NULL REFERENCES user_account(user_account_id) ON DELETE CASCADE,
    failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
    blocked_until TIMESTAMPTZ NULL,
    last_attempt_at TIMESTAMPTZ NULL,
    source_ip VARCHAR(50) NULL
);

-- 10. password_reset_token — Tokens para recuperación de contraseña
CREATE TABLE password_reset_token (
    reset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id UUID NOT NULL REFERENCES user_account(user_account_id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    used_at TIMESTAMPTZ NULL,

    CONSTRAINT ck_password_reset_token_expires CHECK (expires_at > created_at),
    CONSTRAINT ck_password_reset_token_used CHECK (used = FALSE OR used_at IS NOT NULL)
);

-- 11. token — Almacenamiento de tokens JWT (Access / Refresh)
CREATE TABLE token (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id UUID NOT NULL REFERENCES user_account(user_account_id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('access', 'refresh')),
    token_hash TEXT NOT NULL UNIQUE,
    parent_id UUID NULL REFERENCES token(token_id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Revoked', 'Expired')),
    source_ip VARCHAR(50) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ NULL,

    CONSTRAINT ck_token_expires_at CHECK (expires_at > created_at),
    CONSTRAINT ck_token_revoked CHECK (status <> 'Revoked' OR revoked_at IS NOT NULL)
);

-- 12. session — Sesiones activas de los usuarios
CREATE TABLE session (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id UUID NOT NULL REFERENCES user_account(user_account_id) ON DELETE CASCADE,
    token_id UUID NULL REFERENCES token(token_id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Closed', 'Expired')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ NULL,
    source_ip VARCHAR(50) NULL,
    user_agent TEXT NULL,

    CONSTRAINT ck_session_dates CHECK (ended_at IS NULL OR ended_at >= started_at),
    CONSTRAINT ck_session_closed CHECK (status = 'Active' OR ended_at IS NOT NULL)
);

-- 13. user_mfa — Autenticación de dos factores (2FA)
CREATE TABLE user_mfa (
    mfa_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id UUID NOT NULL UNIQUE REFERENCES user_account(user_account_id) ON DELETE CASCADE,
    method VARCHAR(10) NOT NULL DEFAULT 'TOTP' CHECK (method IN ('TOTP', 'SMS', 'Email')),
    secret_totp TEXT NULL,
    backup_codes JSONB NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,

    CONSTRAINT ck_user_mfa_totp CHECK (method <> 'TOTP' OR secret_totp IS NOT NULL)
);
