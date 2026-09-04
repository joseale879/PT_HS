const { GetGoal } = require('./GetGoal');
class GetGoalProgress extends GetGoal {
  async execute(input) { await super.execute(input); return this.repository.progress(input); }
}
module.exports = { GetGoalProgress };
