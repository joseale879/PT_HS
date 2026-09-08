const { paginate } = require('../../shared/http');
class AlertController {
  constructor({ getPendingAlerts, updateAlertStatus, createAlertRule, listAlertRules, updateAlertRule, deleteAlertRule, getThresholdConfiguration, saveThresholdConfiguration, deleteThresholdConfiguration, listAlertHistory }) {
    this.getPendingAlerts = getPendingAlerts;
    this.updateAlertStatus = updateAlertStatus;
    this.createAlertRule = createAlertRule;
    this.listAlertRules = listAlertRules;
    this.updateAlertRule = updateAlertRule;
    this.deleteAlertRule = deleteAlertRule;
    this.getThresholdConfiguration = getThresholdConfiguration;
    this.saveThresholdConfiguration = saveThresholdConfiguration;
    this.deleteThresholdConfiguration = deleteThresholdConfiguration;
    this.listAlertHistory = listAlertHistory;
  }

  async pendingByHome(req, res) {
    const result = await this.getPendingAlerts.execute({ userId: req.user.id, homeId: req.params.homeId });
    res.json({ data: result });
  }

  async updateStatus(req, res) {
    const result = await this.updateAlertStatus.execute({
      userId: req.user.id,
      alertId: req.params.alertId,
      status: req.body?.status
    });
    res.json({ data: result });
  }

  async createRule(req, res) { const { alertType, threshold, unit, active } = req.body || {}; const result = await this.createAlertRule.execute({ userId: req.user.id, homeId: req.params.homeId, alertType, threshold, unit, active }); res.status(201).json({ data: result }); }
  async listRules(req, res) { const result = await this.listAlertRules.execute({ userId: req.user.id, homeId: req.params.homeId }); res.json({ data: result }); }
  async history(req, res) { const result = await this.listAlertHistory.execute({ userId: req.user.id, homeId: req.params.homeId, status: req.query.status, from: req.query.from, to: req.query.to }); const page = paginate(result, req.query, { sortFields: ['generatedAt', 'status', 'detectedValue'] }); res.json({ data: page.items, pagination: page.pagination }); }
  async updateRule(req, res) { const { alertType, threshold, unit, active } = req.body || {}; const result = await this.updateAlertRule.execute({ userId: req.user.id, ruleId: req.params.ruleId, alertType, threshold, unit, active }); res.json({ data: result }); }
  async deleteRule(req, res) { await this.deleteAlertRule.execute({ userId: req.user.id, ruleId: req.params.ruleId }); res.status(204).send(); }
  async getThreshold(req, res) { const result = await this.getThresholdConfiguration.execute({ userId: req.user.id, homeId: req.params.homeId }); res.json({ data: result }); }
  async saveThreshold(req, res) { const { dailyLimit, monthlyLimit } = req.body || {}; const result = await this.saveThresholdConfiguration.execute({ userId: req.user.id, homeId: req.params.homeId, dailyLimit, monthlyLimit }); res.json({ data: result }); }
  async deleteThreshold(req, res) { await this.deleteThresholdConfiguration.execute({ userId: req.user.id, homeId: req.params.homeId }); res.status(204).send(); }
}

module.exports = { AlertController };
