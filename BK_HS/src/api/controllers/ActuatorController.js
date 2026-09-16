const { paginate } = require('../../shared/http');

class ActuatorController {
  constructor({ sendActuatorCommand, listActuatorStates, getActuatorStates, listActuatorCommands }) {
    this.sendActuatorCommand = sendActuatorCommand;
    this.listActuatorStates = listActuatorStates;
    this.getActuatorStates = getActuatorStates;
    this.listActuatorCommands = listActuatorCommands;
  }

  async command(req, res) {
    const data = await this.sendActuatorCommand.execute({
      userId: req.user.id,
      deviceId: req.params.deviceId,
      actuator: req.params.actuator,
      command: req.body?.command,
      correlationId: req.body?.correlationId
    });
    res.status(202).json({ data });
  }

  async states(req, res) {
    const data = await this.listActuatorStates.execute({
      userId: req.user.id,
      homeId: req.query.homeId
    });
    res.json({ data });
  }

  async deviceStates(req, res) {
    const data = await this.getActuatorStates.execute({
      userId: req.user.id,
      deviceId: req.params.deviceId
    });
    res.json({ data });
  }

  async commands(req, res) {
    const data = await this.listActuatorCommands.execute({
      userId: req.user.id,
      homeId: req.query.homeId,
      status: req.query.status
    });
    const result = paginate(data, req.query, {
      sortFields: ['actuator', 'command', 'status', 'requestedAt']
    });
    res.json({ data: result.items, pagination: result.pagination });
  }
}

module.exports = { ActuatorController };
