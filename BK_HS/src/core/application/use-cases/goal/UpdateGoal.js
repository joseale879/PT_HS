const { CreateGoal } = require('./CreateGoal');

class UpdateGoal extends CreateGoal {
  async execute(input) {
    if (!this.uuid(input.goalId)) throw this.bad('goalId no es valido');
    if (!input.userId) throw this.bad('El usuario autenticado es obligatorio');

    const current = await this.repository.findById({ userId: input.userId, goalId: input.goalId });
    const allowedFields = ['type', 'targetM3', 'targetBudget', 'periodStart', 'periodEnd', 'achieved'];
    const changes = Object.fromEntries(
      allowedFields
        .filter((field) => input[field] !== undefined)
        .map((field) => [field, input[field]])
    );
    const merged = { ...current, ...changes, userId: input.userId, goalId: input.goalId };

    this.validate(merged);
    return this.repository.update({
      ...merged,
      targetM3: Number(merged.targetM3),
      targetBudget: merged.targetBudget == null ? null : Number(merged.targetBudget)
    });
  }
}

module.exports = { UpdateGoal };
