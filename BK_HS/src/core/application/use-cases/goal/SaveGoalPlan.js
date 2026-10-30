const { CreateGoal } = require('./CreateGoal');

class SaveGoalPlan extends CreateGoal {
  async execute(input) {
    this.validatePlan(input);
    return this.repository.savePlan({
      ...input,
      targetM3: Number(input.targetM3),
      monthlyTargetM3: Number(input.monthlyTargetM3),
      targetBudget: input.targetBudget == null ? null : Number(input.targetBudget),
    });
  }

  validatePlan(input) {
    this.validate({ ...input, userId: input.userId, homeId: input.homeId });
    if (!['daily', 'weekly', 'monthly'].includes(input.type)) {
      throw this.bad('type debe ser daily, weekly o monthly');
    }
    if (
      !Number.isFinite(Number(input.monthlyTargetM3)) ||
      Number(input.monthlyTargetM3) < 0
    ) {
      throw this.bad('monthlyTargetM3 debe ser mayor o igual que cero');
    }
    if (!this.date(input.monthStart) || !this.date(input.monthEnd)) {
      throw this.bad('El mes debe usar fechas YYYY-MM-DD');
    }
    if (
      input.monthEnd < input.monthStart ||
      input.periodStart < input.monthStart ||
      input.periodStart > input.monthEnd ||
      input.periodEnd > input.monthEnd
    ) {
      throw this.bad('El periodo debe estar dentro del mes actual');
    }
  }
}

module.exports = { SaveGoalPlan };
