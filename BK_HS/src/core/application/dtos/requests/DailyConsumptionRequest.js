class DailyConsumptionRequest {
  constructor({ homeId, date }) { this.homeId = homeId; this.date = date; }
  static fromRequest(query = {}) { return new DailyConsumptionRequest({ homeId: query.homeId, date: query.date }); }
}
module.exports = { DailyConsumptionRequest };
