CREATE UNIQUE INDEX uq_user_account_username_lower
    ON user_account.user_account (LOWER(username));

CREATE UNIQUE INDEX uq_user_account_email_lower
    ON user_account.user_account (LOWER(email));

CREATE UNIQUE INDEX uq_login_attempt_user_account
    ON user_account.login_attempt (user_account_id);
