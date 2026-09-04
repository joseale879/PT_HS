class CreateGoal {
  constructor({ repository }) { this.repository = repository; }
  execute(input) { this.validate(input); return this.repository.create({ ...input, targetM3: Number(input.targetM3), targetBudget: input.targetBudget == null ? null : Number(input.targetBudget) }); }
  validate({ userId, homeId, type, targetM3, targetBudget, periodStart, periodEnd }) {
    if (!userId) throw this.bad('El usuario autenticado es obligatorio');
    if (!this.uuid(homeId)) throw this.bad('homeId no es válido');
    if (!['monthly', 'weekly', 'annual'].includes(type)) throw this.bad('type no es válido');
    if (!Number.isFinite(Number(targetM3)) || Number(targetM3) <= 0) throw this.bad('targetM3 debe ser mayor que cero');
    if (targetBudget != null && (!Number.isFinite(Number(targetBudget)) || Number(targetBudget) < 0)) throw this.bad('targetBudget no es válido');
    if (!this.date(periodStart) || (periodEnd != null && !this.date(periodEnd))) throw this.bad('El periodo debe usar YYYY-MM-DD');
    if (periodEnd != null && periodEnd < periodStart) throw this.bad('periodEnd no puede ser anterior a periodStart');
  }
  uuid(v) { return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v); }
  date(v) { return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)); }
  bad(m) { const e = new Error(m); e.status = 400; return e; }
}
module.exports = { CreateGoal };
