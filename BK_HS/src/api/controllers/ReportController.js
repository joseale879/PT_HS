const { ConsumptionSummaryRequest } = require('../../core/application/dtos/requests/ConsumptionSummaryRequest');
const { buildConsumptionExcel, buildConsumptionPdf } = require('../../shared/report-formatters');

class ReportController {
  constructor({ generateConsumptionReport, listGeneratedReports, getGeneratedReport, reportRepository, reportStorage }) {
    this.generateConsumptionReport = generateConsumptionReport;
    this.listGeneratedReports = listGeneratedReports;
    this.getGeneratedReport = getGeneratedReport;
    this.reportRepository = reportRepository;
    this.reportStorage = reportStorage;
  }

  async getReport(req) {
    const input = ConsumptionSummaryRequest.fromRequest(req.query);
    return this.generateConsumptionReport.execute({ userId: req.user.id, ...input });
  }

  async consumptionPdf(req, res) {
    return this.sendConsumptionReport(req, res, 'pdf');
  }

  async consumptionExcel(req, res) {
    return this.sendConsumptionReport(req, res, 'excel');
  }

  async sendConsumptionReport(req, res, type) {
    const report = await this.getReport(req);
    const buffer = type === 'pdf' ? buildConsumptionPdf(report) : buildConsumptionExcel(report);
    const record = await this.reportRepository.createGenerating({
      userId: req.user.id,
      homeId: report.homeId,
      type,
      category: reportCategory(report.from, report.to),
      periodStart: report.from,
      periodEnd: report.to
    });

    try {
      const storagePath = await this.reportStorage.write(record.reportId, type, buffer);
      await this.reportRepository.markReady({
        userId: req.user.id,
        reportId: record.reportId,
        storagePath,
        sizeBytes: buffer.length
      });
    } catch (error) {
      await this.reportRepository.markError({
        userId: req.user.id,
        reportId: record.reportId,
        errorMessage: error.message
      }).catch(() => null);
      throw error;
    }

    const filename = `hidro-smart-consumo-${report.from}-${report.to}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
    res.set({
      'Content-Type': type === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
      'X-Report-Id': record.reportId
    });
    res.send(buffer);
  }

  async history(req, res) {
    const result = await this.listGeneratedReports.execute({
      userId: req.user.id,
      homeId: req.query.homeId,
      page: req.query.page,
      pageSize: req.query.pageSize,
      type: req.query.type,
      status: req.query.status
    });
    res.json({ data: result.items, pagination: result.pagination });
  }

  async downloadStored(req, res) {
    const record = await this.getGeneratedReport.execute({
      userId: req.user.id,
      reportId: req.params.reportId
    });
    if (record.status !== 'Ready' || !record.storagePath) {
      const error = new Error('El reporte todavía no está disponible');
      error.status = 409;
      throw error;
    }

    const buffer = await this.reportStorage.read(record.storagePath);
    const extension = record.type === 'pdf' ? 'pdf' : 'xlsx';
    res.set({
      'Content-Type': record.type === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="hidro-smart-reporte-${record.reportId}.${extension}"`,
      'Cache-Control': 'no-store'
    });
    res.send(buffer);
  }
}

function reportCategory(from, to) {
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  const days = Math.floor((end - start) / 86400000) + 1;
  if (days <= 1) return 'daily_consumption';
  if (days <= 31) return 'monthly_consumption';
  return 'annual_consumption';
}

module.exports = { ReportController };
