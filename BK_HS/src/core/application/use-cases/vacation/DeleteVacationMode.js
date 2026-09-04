class DeleteVacationMode { constructor({repository}){this.repository=repository;} execute({userId,homeId}){if(!userId||!/^[0-9a-f-]{36}$/i.test(homeId))throw this.bad('Datos de hogar inválidos');return this.repository.delete({userId,homeId});} bad(m){const e=new Error(m);e.status=400;return e;} }
module.exports={DeleteVacationMode};
