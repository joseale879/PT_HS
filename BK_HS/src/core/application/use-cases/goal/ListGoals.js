class ListGoals {
  constructor({ repository }) { this.repository = repository; }
  execute({ userId, homeId }) { if (!userId) throw this.bad('El usuario autenticado es obligatorio'); if (homeId && !/^[0-9a-f-]{36}$/i.test(homeId)) throw this.bad('homeId no es válido'); return this.repository.list({ userId, homeId }); }
  bad(m) { const e = new Error(m); e.status = 400; return e; }
}
module.exports = { ListGoals };
