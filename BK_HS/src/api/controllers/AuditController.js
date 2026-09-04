class AuditController {
  constructor({ listAuditLogs }) { this.listAuditLogs = listAuditLogs; }

  async list(req, res) {
    const result = await this.listAuditLogs.execute({
      userId: req.user.id,
      action: req.query.action,
      tableName: req.query.tableName,
      from: req.query.from,
      to: req.query.to,
      page: req.query.page,
      pageSize: req.query.pageSize
    });
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(Number.parseInt(req.query.pageSize, 10) || 20, 1), 100);
    res.json({
      data: result.items,
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize)
      }
    });
  }
}

module.exports = { AuditController };
