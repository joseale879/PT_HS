const { randomUUID } = require('node:crypto');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const databaseUrl = process.env.INTEGRATION_ADMIN_DATABASE_URL;

const users = [
  {
    role: 'Administrator',
    email: process.env.INTEGRATION_ADMIN_EMAIL,
    password: process.env.INTEGRATION_ADMIN_PASSWORD,
    username: 'ci_administrator'
  },
  {
    role: 'Support',
    email: process.env.INTEGRATION_SUPPORT_EMAIL,
    password: process.env.INTEGRATION_SUPPORT_PASSWORD,
    username: 'ci_support'
  },
  {
    role: 'HomeUser',
    email: process.env.INTEGRATION_HOMEUSER_EMAIL,
    password: process.env.INTEGRATION_HOMEUSER_PASSWORD,
    username: 'ci_homeuser'
  },
  {
    role: 'Guest',
    email: process.env.INTEGRATION_GUEST_EMAIL,
    password: process.env.INTEGRATION_GUEST_PASSWORD,
    username: 'ci_guest'
  }
];

function requireConfiguration() {
  const missing = [];
  if (!databaseUrl) missing.push('INTEGRATION_ADMIN_DATABASE_URL');
  for (const user of users) {
    if (!user.email) missing.push(`INTEGRATION_${user.role.toUpperCase()}_EMAIL`);
    if (!user.password) missing.push(`INTEGRATION_${user.role.toUpperCase()}_PASSWORD`);
  }
  if (missing.length) {
    throw new Error(`Faltan variables para sembrar usuarios de integración: ${missing.join(', ')}`);
  }
}

async function seed() {
  requireConfiguration();
  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      const existing = await client.query(
        `SELECT user_account_id
           FROM user_account.user_account
          WHERE lower(email) = lower($1::varchar)
          FOR UPDATE`,
        [user.email]
      );
      const userId = existing.rows[0]?.user_account_id || randomUUID();

      if (existing.rowCount) {
        await client.query(
          `UPDATE user_account.user_account
              SET username = $2::varchar,
                  status = 'Active',
                  deleted_at = NULL,
                  suspension_reason = NULL,
                  suspended_at = NULL,
                  email_verified_at = COALESCE(email_verified_at, now()),
                  updated_at = now()
            WHERE user_account_id = $1::uuid`,
          [userId, user.username]
        );
      } else {
        await client.query(
          `INSERT INTO user_account.user_account(
             user_account_id, username, email, status, email_verified_at
           ) VALUES ($1::uuid, $2::varchar, $3::varchar, 'Active', now())`,
          [userId, user.username, user.email]
        );
      }

      await client.query(
        `INSERT INTO user_account.user_profile(user_account_id, full_name)
         VALUES ($1::uuid, $2::varchar)
         ON CONFLICT (user_account_id) DO UPDATE
           SET full_name = EXCLUDED.full_name`,
        [userId, `CI ${user.role}`]
      );
      await client.query(
        `INSERT INTO user_account.user_credential(user_account_id, password_hash, requires_change, changed_at)
         VALUES ($1::uuid, $2::text, FALSE, now())
         ON CONFLICT (user_account_id) DO UPDATE
           SET password_hash = EXCLUDED.password_hash,
               requires_change = FALSE,
               changed_at = now()`,
        [userId, passwordHash]
      );

      const role = await client.query(
        `SELECT role_id
           FROM user_account.role
          WHERE name = $1::varchar AND status = 'Active'`,
        [user.role]
      );
      if (!role.rowCount) throw new Error(`No existe el rol activo ${user.role}`);

      await client.query('DELETE FROM user_account.user_role WHERE user_account_id = $1::uuid', [userId]);
      await client.query(
        `INSERT INTO user_account.user_role(user_account_id, role_id)
         VALUES ($1::uuid, $2::uuid)`,
        [userId, role.rows[0].role_id]
      );
    }
    await client.query('COMMIT');
    console.log(`Usuarios de integración preparados: ${users.map(({ role }) => role).join(', ')}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
