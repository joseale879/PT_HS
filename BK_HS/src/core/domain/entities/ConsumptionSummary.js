class ConsumptionSummary {
  constructor({ homeId, from, to, totalM3, totalLiters, totalCost, readingCount }) {
    this.homeId = homeId;
    this.from = from;
    this.to = to;
    this.totalM3 = Number(totalM3 || 0);
    this.totalLiters = Number(totalLiters || 0);
    this.totalCost = totalCost === null || totalCost === undefined ? null : Number(totalCost);
    this.readingCount = Number(readingCount || 0);
  }
}

module.exports = { ConsumptionSummary };
