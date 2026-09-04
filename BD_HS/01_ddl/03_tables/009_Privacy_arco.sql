-- ============================================================
-- DOMINIO 9: PRIVACIDAD Y ARCO (privacy)
-- ============================================================

-- 46. user_consent — Consentimientos firmados por el usuario
SET search_path TO privacy, user_account, home, device, consumption, alert_rate, analytics_support, audit, preference, public;

CREATE TABLE user_consent (
    consent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id UUID NOT NULL REFERENCES user_account(user_account_id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL CHECK (
        type IN (
            'policy_privacy',
            'terms_of_use',
            'marketing',
            'sensitive_data',
            'share_data'
        )
    ),
    document_version VARCHAR(20) NOT NULL,
    accepted BOOLEAN NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    source_ip VARCHAR(50) NULL,
    user_agent TEXT NULL,

    CONSTRAINT ck_user_consent_version CHECK (char_length(document_version) >= 1),
    CONSTRAINT uq_user_consent_type_version UNIQUE (user_account_id, type, document_version)
);

-- 47. arco_request — Solicitudes ARCO (Acceso, Rectificación, Cancelación, Oposición, Portabilidad)
CREATE TABLE arco_request (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_account_id UUID NOT NULL REFERENCES user_account(user_account_id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('access', 'rectification', 'cancellation', 'opposition', 'portability')),
    description TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Received' CHECK (status IN ('Received', 'In_progress', 'Resolved', 'Rejected')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deadline_at TIMESTAMPTZ NOT NULL,
    answered_at TIMESTAMPTZ NULL,
    answer TEXT NULL,
    answered_by UUID NULL REFERENCES user_account(user_account_id),
    attachment_document TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,

    CONSTRAINT ck_arco_request_deadline CHECK (deadline_at >= requested_at),
    CONSTRAINT ck_arco_request_answer CHECK (
        status NOT IN ('Resolved', 'Rejected') OR answered_at IS NOT NULL
    ),
    CONSTRAINT ck_arco_request_answered_by CHECK (
        status NOT IN ('Resolved', 'Rejected') OR answered_by IS NOT NULL
    )
);
