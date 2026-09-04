class GetGoal {
  constructor({ repository }) { this.repository = repository; }
  execute({ userId, goalId }) { if (!userId) throw this.bad('El usuario autenticado es obligatorio'); if (!/^[0-9a-f-]{36}$/i.test(goalId)) throw this.bad('goalId no es válido'); return this.repository.findById({ userId, goalId }); }
  bad(m) { const e = new Error(m); e.status = 400; return e; }
}
module.exports = { GetGoal };
