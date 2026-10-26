const test = require('node:test');
const assert = require('node:assert/strict');
const { buildConsumptionExcel, buildConsumptionPdf } = require('../../src/shared/report-formatters');
const { GenerateConsumptionReport } = require('../../src/core/application/use-cases/report/GenerateConsumptionReport');

const report = {
  homeId: 'home-1',
  from: '2026-09-01',
  to: '2026-09-13',
  summary: { totalM3: 1.25, totalLiters: 1250, totalCost: null, readingCount: 4 }
};

test('buildConsumptionExcel genera un XLSX descargable', () => {
  const excel = buildConsumptionExcel(report);
  assert.equal(excel.subarray(0, 4).toString('hex'), '504b0304');
  assert.ok(excel.length > 500);
});

test('buildConsumptionPdf genera un PDF descargable', () => {
  const pdf = buildConsumptionPdf(report);
  assert.equal(pdf.subarray(0, 8).toString('ascii'), '%PDF-1.4');
  assert.match(pdf.toString('ascii'), /HidroSmart - Reporte de consumo/);
});

test('GenerateConsumptionReport conserva el usuario autenticado', async () => {
  const calls = [];
  const useCase = new GenerateConsumptionReport({
    consumptionRepository: {
      calculateSummary: async (input) => {
        calls.push(input);
        return { totalM3: 0, totalLiters: 0, totalCost: null, readingCount: 0 };
      }
    }
  });
  await useCase.execute({
    userId: 'user-1',
    homeId: '123e4567-e89b-12d3-a456-426614174000',
    from: '2026-09-01',
    to: '2026-09-13'
  });
  assert.deepEqual(calls, [{
    userId: 'user-1',
    homeId: '123e4567-e89b-12d3-a456-426614174000',
    from: '2026-09-01',
    to: '2026-09-13'
  }]);
});

test('GenerateConsumptionReport rechaza un periodo mayor a 366 días', async () => {
  const useCase = new GenerateConsumptionReport({ consumptionRepository: {} });
  await assert.rejects(
    async () => useCase.execute({
      userId: 'user-1',
      homeId: '123e4567-e89b-12d3-a456-426614174000',
      from: '2025-01-01',
      to: '2026-01-02'
    }),
    /periodo no puede superar 366 días/
  );
});
