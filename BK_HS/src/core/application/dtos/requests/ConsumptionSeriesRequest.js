class ConsumptionSeriesRequest {
  constructor({ homeId, from, to, groupBy = 'daily' }) {
    this.homeId = homeId;
    this.from = from;
    this.to = to;
    this.groupBy = groupBy;
  }

  static fromRequest(query = {}) {
    return new ConsumptionSeriesRequest({
      homeId: query.homeId,
      from: query.from,
      to: query.to,
      groupBy: query.groupBy || 'daily'
    });
  }
}

module.exports = { ConsumptionSeriesRequest };
