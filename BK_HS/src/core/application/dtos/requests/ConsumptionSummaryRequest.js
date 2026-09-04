class ConsumptionSummaryRequest {
  constructor({ homeId, from, to }) {
    this.homeId = homeId;
    this.from = from;
    this.to = to;
  }

  static fromRequest(query = {}) {
    return new ConsumptionSummaryRequest({
      homeId: query.homeId,
      from: query.from,
      to: query.to
    });
  }
}

module.exports = { ConsumptionSummaryRequest };
