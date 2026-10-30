const { paginate } = require('../../shared/http');

class GoalController {
  constructor(dependencies) {
    Object.assign(this, dependencies);
  }

  async create(req, res) {
    const { homeId, type, targetM3, targetBudget, periodStart, periodEnd } = req.body || {};
    const goal = await this.createGoal.execute({
      userId: req.user.id,
      homeId,
      type,
      targetM3,
      targetBudget,
      periodStart,
      periodEnd,
    });
    res.status(201).json({ data: goal });
  }

  async savePlan(req, res) {
    const {
      homeId,
      type,
      targetM3,
      targetBudget,
      periodStart,
      periodEnd,
      monthlyTargetM3,
      monthStart,
      monthEnd,
    } = req.body || {};
    const result = await this.saveGoalPlan.execute({
      userId: req.user.id,
      homeId,
      type,
      targetM3,
      targetBudget,
      periodStart,
      periodEnd,
      monthlyTargetM3,
      monthStart,
      monthEnd,
    });
    res.json({ data: result });
  }

  async list(req, res) {
    const result = paginate(
      await this.listGoals.execute({ userId: req.user.id, homeId: req.query.homeId }),
      req.query,
      {
        sortFields: ['name', 'targetConsumption', 'createdAt'],
        filter: (goal) => !req.query.status || goal.status === req.query.status,
      }
    );
    res.json({ data: result.items, pagination: result.pagination });
  }

  async get(req, res) {
    res.json({
      data: await this.getGoal.execute({ userId: req.user.id, goalId: req.params.goalId }),
    });
  }

  async update(req, res) {
    const { type, targetM3, targetBudget, periodStart, periodEnd, achieved } = req.body || {};
    const goal = await this.updateGoal.execute({
      userId: req.user.id,
      goalId: req.params.goalId,
      type,
      targetM3,
      targetBudget,
      periodStart,
      periodEnd,
      achieved,
    });
    res.json({ data: goal });
  }

  async remove(req, res) {
    await this.deleteGoal.execute({ userId: req.user.id, goalId: req.params.goalId });
    res.status(204).send();
  }

  async progress(req, res) {
    res.json({
      data: await this.getGoalProgress.execute({
        userId: req.user.id,
        goalId: req.params.goalId,
      }),
    });
  }
}

module.exports = { GoalController };
