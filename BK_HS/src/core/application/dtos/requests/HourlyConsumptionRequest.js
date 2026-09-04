class HourlyConsumptionRequest {
  constructor({ homeId }) { this.homeId = homeId; }
  static fromRequest(query = {}) { return new HourlyConsumptionRequest({ homeId: query.homeId }); }
}
module.exports = { HourlyConsumptionRequest };
