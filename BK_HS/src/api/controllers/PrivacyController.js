class PrivacyController {
  constructor(dependencies) { Object.assign(this, dependencies); }

  async exportData(req, res) {
    const data = await this.exportDataUseCase.execute({ userId: req.user.id });
    res.setHeader('Content-Disposition', 'attachment; filename="hidro-smart-data-export.json"');
    res.json(data);
  }

  async listConsents(req, res) { res.json({ data: await this.listConsentsUseCase.execute({ userId: req.user.id }) }); }

  async createConsent(req, res) {
    const data = await this.createConsentUseCase.execute({ userId: req.user.id, type: req.body?.type, documentVersion: req.body?.documentVersion, accepted: req.body?.accepted, sourceIp: req.ip, userAgent: req.get('user-agent') });
    res.status(201).json({ data });
  }

  async createRequest(req, res) {
    const data = await this.createRequestUseCase.execute({ userId: req.user.id, type: req.body?.type, description: req.body?.description });
    res.status(201).json({ data });
  }

  async listRequests(req, res) {
    const result = await this.listRequestsUseCase.execute({ userId: req.user.id, status: req.query.status, type: req.query.type, page: req.query.page, pageSize: req.query.pageSize, managed: req.route.path.includes('/manage') });
    res.json({ data: result.items, pagination: result.pagination });
  }

  async getRequest(req, res) { res.json({ data: await this.getRequestUseCase.execute({ userId: req.user.id, requestId: req.params.requestId }) }); }

  async updateRequest(req, res) { res.json({ data: await this.updateRequestUseCase.execute({ userId: req.user.id, requestId: req.params.requestId, status: req.body?.status, answer: req.body?.answer }) }); }
}

module.exports = { PrivacyController };
