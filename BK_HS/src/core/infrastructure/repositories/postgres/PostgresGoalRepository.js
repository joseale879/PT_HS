const { withTransaction } = require('../../../../infrastructure/db');

class PostgresGoalRepository {
  map(row) {
    return {
      goalId: row.goal_id,
      homeId: row.home_id,
      type: row.type,
      targetM3: Number(row.target_m3),
      targetBudget: row.target_budget == null ? null : Number(row.target_budget),
      periodStart: row.period_start,
      periodEnd: row.period_end,
      achieved: row.achieved,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  fields() {
    return 'goal_id, home_id, type, target_m3, target_budget, period_start, period_end, achieved, created_at, updated_at';
  }

  async create({ userId, homeId, type, targetM3, targetBudget, periodStart, periodEnd }) {
    const query = await withTransaction(userId, (client) =>
      client.query(
        `INSERT INTO home.saving_goal(home_id,type,target_m3,target_budget,period_start,period_end)
         VALUES($1,$2,$3,$4,$5,$6) RETURNING ${this.fields()}`,
        [homeId, type, targetM3, targetBudget, periodStart, periodEnd]
      )
    );
    return this.map(query.rows[0]);
  }

  async savePlan({
    userId,
    homeId,
    type,
    targetM3,
    targetBudget,
    periodStart,
    periodEnd,
    monthlyTargetM3,
    monthStart,
    monthEnd,
  }) {
    return withTransaction(userId, async (client) => {
      const findMonthlyGoal = async () => {
        const result = await client.query(
          `SELECT ${this.fields()}
             FROM home.saving_goal
            WHERE home_id = $1
              AND type = 'monthly'
              AND period_start >= $2
              AND period_start <= $3
            ORDER BY period_start DESC, created_at DESC
            LIMIT 1
            FOR UPDATE`,
          [homeId, monthStart, monthEnd]
        );
        return result.rows[0] || null;
      };

      const savePeriod = async ({
        goalType,
        goalTargetM3,
        goalTargetBudget,
        goalPeriodStart,
        goalPeriodEnd,
      }) => {
        const current = await findMonthlyGoalForType(goalType);
        const values = [
          homeId,
          goalType,
          goalTargetM3,
          goalTargetBudget,
          goalPeriodStart,
          goalPeriodEnd,
        ];
        const result = current
          ? await client.query(
              `UPDATE home.saving_goal
                  SET target_m3 = $2,
                      target_budget = $3,
                      period_start = $4,
                      period_end = $5,
                      updated_at = clock_timestamp()
                WHERE goal_id = $1
                RETURNING ${this.fields()}`,
              [current.goal_id, ...values.slice(2)]
            )
          : await client.query(
              `INSERT INTO home.saving_goal(home_id,type,target_m3,target_budget,period_start,period_end,updated_at)
               VALUES($1,$2,$3,$4,$5,$6,clock_timestamp())
               RETURNING ${this.fields()}`,
              values
            );
        return this.map(result.rows[0]);
      };

      const findMonthlyGoalForType = async (goalType) => {
        const result = await client.query(
          `SELECT ${this.fields()}
             FROM home.saving_goal
            WHERE home_id = $1
              AND type = $2
              AND period_start >= $3
              AND period_start <= $4
            ORDER BY period_start DESC, created_at DESC
            LIMIT 1
            FOR UPDATE`,
          [homeId, goalType, monthStart, monthEnd]
        );
        return result.rows[0] || null;
      };

      let budgetGoal = null;
      let goal;
      if (type === 'monthly') {
        goal = await savePeriod({
          goalType: 'monthly',
          goalTargetM3: targetM3,
          goalTargetBudget: targetBudget,
          goalPeriodStart: periodStart,
          goalPeriodEnd: periodEnd,
        });
        budgetGoal = goal;
      } else {
        if (targetBudget != null) {
          budgetGoal = await savePeriod({
            goalType: 'monthly',
            goalTargetM3: monthlyTargetM3,
            goalTargetBudget: targetBudget,
            goalPeriodStart: periodStart,
            goalPeriodEnd: monthEnd,
          });
        } else {
          const currentMonthlyGoal = await findMonthlyGoal();
          if (currentMonthlyGoal?.target_budget != null) {
            const result = await client.query(
              `UPDATE home.saving_goal
                  SET target_budget = NULL, updated_at = clock_timestamp()
                WHERE goal_id = $1
                RETURNING ${this.fields()}`,
              [currentMonthlyGoal.goal_id]
            );
            budgetGoal = this.map(result.rows[0]);
          }
        }

        goal = await savePeriod({
          goalType: type,
          goalTargetM3: targetM3,
          goalTargetBudget: null,
          goalPeriodStart: periodStart,
          goalPeriodEnd: periodEnd,
        });
      }

      return { goal, budgetGoal };
    });
  }

  async list({ userId, homeId }) {
    const query = await withTransaction(userId, (client) =>
      client.query(
        `SELECT ${this.fields()} FROM home.saving_goal ${homeId ? 'WHERE home_id=$1' : ''}
         ORDER BY updated_at DESC NULLS LAST, created_at DESC`,
        homeId ? [homeId] : []
      )
    );
    return query.rows.map((row) => this.map(row));
  }

  async findById({ userId, goalId }) {
    const query = await withTransaction(userId, (client) =>
      client.query(`SELECT ${this.fields()} FROM home.saving_goal WHERE goal_id=$1`, [goalId])
    );
    if (!query.rows[0]) {
      const error = new Error('Meta no encontrada');
      error.status = 404;
      throw error;
    }
    return this.map(query.rows[0]);
  }

  async update({
    userId,
    goalId,
    type,
    targetM3,
    targetBudget,
    periodStart,
    periodEnd,
    achieved,
  }) {
    const query = await withTransaction(userId, (client) =>
      client.query(
        `UPDATE home.saving_goal
            SET type=$2, target_m3=$3, target_budget=$4, period_start=$5, period_end=$6,
                achieved=COALESCE($7,achieved), updated_at=now()
          WHERE goal_id=$1
          RETURNING ${this.fields()}`,
        [goalId, type, targetM3, targetBudget, periodStart, periodEnd, achieved ?? null]
      )
    );
    if (!query.rows[0]) {
      const error = new Error('Meta no encontrada');
      error.status = 404;
      throw error;
    }
    return this.map(query.rows[0]);
  }

  async delete({ userId, goalId }) {
    const query = await withTransaction(userId, (client) =>
      client.query('DELETE FROM home.saving_goal WHERE goal_id=$1 RETURNING goal_id', [goalId])
    );
    if (!query.rows[0]) {
      const error = new Error('Meta no encontrada');
      error.status = 404;
      throw error;
    }
  }

  async progress({ userId, goalId }) {
    const query = await withTransaction(userId, (client) =>
      client.query(
        'SELECT analytics_support.fn_get_goal_progress($1::uuid) AS progress',
        [goalId]
      )
    );
    if (query.rows[0]?.progress == null) {
      const error = new Error('Meta no encontrada');
      error.status = 404;
      throw error;
    }
    return { goalId, progress: Number(query.rows[0].progress) };
  }
}

module.exports = { PostgresGoalRepository };
