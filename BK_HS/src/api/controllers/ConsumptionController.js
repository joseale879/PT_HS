const { ConsumptionSummaryRequest } = require('../../core/application/dtos/requests/ConsumptionSummaryRequest');
const { ConsumptionSummaryResponse } = require('../../core/application/dtos/responses/ConsumptionSummaryResponse');
const { DailyConsumptionRequest } = require('../../core/application/dtos/requests/DailyConsumptionRequest');
const { MonthlyConsumptionRequest } = require('../../core/application/dtos/requests/MonthlyConsumptionRequest');
const { HourlyConsumptionRequest } = require('../../core/application/dtos/requests/HourlyConsumptionRequest');

class ConsumptionController {
  constructor({ getConsumptionSummary, getDailyConsumption, getMonthlyConsumption, getHourlyConsumption, getPeriodCost }) {
    this.getConsumptionSummary = getConsumptionSummary;
    this.getDailyConsumption = getDailyConsumption;
    this.getMonthlyConsumption = getMonthlyConsumption;
    this.getHourlyConsumption = getHourlyConsumption;
    this.getPeriodCost = getPeriodCost;
  }

  async summary(req, res) {
    const input = ConsumptionSummaryRequest.fromRequest(req.query);
    const summary = await this.getConsumptionSummary.execute({ userId: req.user.id, ...input });
    res.json({ data: ConsumptionSummaryResponse.fromEntity(summary) });
  }

  async daily(req, res) {
    const result = await this.getDailyConsumption.execute({ userId: req.user.id, ...DailyConsumptionRequest.fromRequest(req.query) });
    res.json({ data: result });
  }

  async monthly(req, res) {
    const result = await this.getMonthlyConsumption.execute({ userId: req.user.id, ...MonthlyConsumptionRequest.fromRequest(req.query) });
    res.json({ data: result });
  }

  async hourly(req, res) {
    const result = await this.getHourlyConsumption.execute({ userId: req.user.id, ...HourlyConsumptionRequest.fromRequest(req.query) });
    res.json({ data: { homeId: req.query.homeId, points: result } });
  }

  async cost(req, res) {
    const result = await this.getPeriodCost.execute({
      userId: req.user.id,
      homeId: req.query.homeId,
      from: req.query.from,
      to: req.query.to
    });
    res.json({ data: result });
  }
}

module.exports = { ConsumptionController };
