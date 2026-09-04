class ConsumptionSummaryResponse {
  static fromEntity(summary) {
    return {
      homeId: summary.homeId,
      period: { from: summary.from, to: summary.to },
      totalM3: summary.totalM3,
      totalLiters: summary.totalLiters,
      totalCost: summary.totalCost,
      readingCount: summary.readingCount
    };
  }
}

module.exports = { ConsumptionSummaryResponse };
