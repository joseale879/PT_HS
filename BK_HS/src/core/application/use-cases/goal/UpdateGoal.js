const { CreateGoal } = require('./CreateGoal');
class UpdateGoal extends CreateGoal {
  execute(input) { if (!this.uuid(input.goalId)) throw this.bad('goalId no es válido'); this.validate({ ...input, userId: input.userId, homeId: input.homeId, type: input.type, targetM3: input.targetM3, periodStart: input.periodStart }); return this.repository.update(input); }
}
module.exports = { UpdateGoal };
