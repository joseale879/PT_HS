class MonthlyConsumptionRequest {
  constructor({ homeId, year, month }) { this.homeId = homeId; this.year = year; this.month = month; }
  static fromRequest(query = {}) { return new MonthlyConsumptionRequest({ homeId: query.homeId, year: query.year, month: query.month }); }
}
module.exports = { MonthlyConsumptionRequest };
