-- ============================================================
-- DOMINIO 3: HOGARES Y MIEMBROS (home)
-- ============================================================

-- 18. home — Datos del hogar
SET search_path TO home, user_account, device, preference, consumption, alert_rate, analytics_support, audit, privacy, public;

CREATE TABLE home (
    home_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    tier SMALLINT NULL CHECK (tier BETWEEN 1 AND 6),
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended')),
    suspension_reason VARCHAR(255) NULL,
    changed_at_status TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,
    deleted_at TIMESTAMPTZ NULL,

    CONSTRAINT ck_home_name_length CHECK (char_length(name) >= 3),
    CONSTRAINT ck_home_suspension CHECK (
        status = 'Active' OR suspension_reason IS NOT NULL
    )
);

-- 19. home_user — Miembros del hogar (Owner, Member, Guest)
CREATE TABLE home_user (
    home_user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL REFERENCES home(home_id) ON DELETE CASCADE,
    user_account_id UUID NOT NULL REFERENCES user_account(user_account_id) ON DELETE CASCADE,
    home_role VARCHAR(20) NOT NULL DEFAULT 'Member' CHECK (home_role IN ('Owner', 'Member', 'Guest')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    added_by UUID NULL REFERENCES user_account(user_account_id),

    CONSTRAINT uq_home_user UNIQUE (home_id, user_account_id)
);

-- 20. home_user_function — Funciones especiales asignadas a miembros
CREATE TABLE home_user_function (
    function_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_user_id UUID NOT NULL REFERENCES home_user(home_user_id) ON DELETE CASCADE,
    function VARCHAR(50) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_by UUID NULL REFERENCES user_account(user_account_id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_home_user_function UNIQUE (home_user_id, function)
);

-- 21. home_device — Relación N:N entre hogares y dispositivos
CREATE TABLE home_device (
    home_device_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL REFERENCES home(home_id) ON DELETE CASCADE,
    device_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Maintenance')),
    installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    suspended_at TIMESTAMPTZ NULL,

    CONSTRAINT uq_home_device UNIQUE (home_id, device_id),
    CONSTRAINT ck_home_device_suspension CHECK (
        status <> 'Suspended' OR suspended_at IS NOT NULL
    )
);

-- 22. home_member_request — Solicitudes de invitación a hogares
CREATE TABLE home_member_request (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL REFERENCES home(home_id) ON DELETE CASCADE,
    user_account_id UUID NOT NULL REFERENCES user_account(user_account_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    answered_at TIMESTAMPTZ NULL,
    answered_by UUID NULL REFERENCES user_account(user_account_id),

    CONSTRAINT ck_home_member_request_answer CHECK (
        status = 'Pending' OR answered_at IS NOT NULL
    )
);

-- 23. vacation_mode — Configuración del modo vacaciones por hogar
CREATE TABLE vacation_mode (
    vacation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL REFERENCES home(home_id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    started_at DATE NOT NULL,
    ended_at DATE NOT NULL,
    daily_target_consumption DECIMAL(10,2) NULL,
    notify_on_return BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,

    CONSTRAINT ck_vacation_mode_dates CHECK (ended_at >= started_at),
    CONSTRAINT ck_vacation_mode_consumption CHECK (
        daily_target_consumption IS NULL OR daily_target_consumption >= 0
    )
);

-- 24. saving_goal — Metas de ahorro (consumo objetivo en m³ y presupuesto en COP)
CREATE TABLE saving_goal (
    goal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    home_id UUID NOT NULL REFERENCES home(home_id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('monthly', 'weekly', 'annual')),
    target_m3 DECIMAL(10,4) NOT NULL CHECK (target_m3 > 0),
    target_budget DECIMAL(12,2) NULL CHECK (target_budget >= 0),
    period_start DATE NOT NULL,
    period_end DATE NULL,
    achieved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,

    CONSTRAINT ck_saving_goal_period CHECK (period_end IS NULL OR period_end >= period_start)
);
