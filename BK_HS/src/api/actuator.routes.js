const router = require('express').Router();
const { asyncHandler } = require('../shared/http');
const { authenticate } = require('./middleware/auth');
const { createRequirePermission } = require('./middleware/requirePermission');
const {
  SendActuatorCommand,
  ListActuatorStates,
  GetActuatorStates,
  ListActuatorCommands
} = require('../core/application/use-cases/actuator/ActuatorOperations');
const { PostgresActuatorRepository } = require('../core/infrastructure/repositories/postgres/PostgresActuatorRepository');
const { MqttPublisher } = require('../core/infrastructure/services/mqtt/MqttPublisher');
const { mqttClient } = require('../core/infrastructure/services/mqtt/mqttClientSingleton');
const { PostgresPermissionChecker } = require('../core/infrastructure/security/PostgresPermissionChecker');
const { ActuatorController } = require('./controllers/ActuatorController');

const repository = new PostgresActuatorRepository();
const publisher = new MqttPublisher({ mqttClient });
const controller = new ActuatorController({
  sendActuatorCommand: new SendActuatorCommand({ repository, publisher }),
  listActuatorStates: new ListActuatorStates({ repository }),
  getActuatorStates: new GetActuatorStates({ repository }),
  listActuatorCommands: new ListActuatorCommands({ repository })
});
const requireActuatorManagement = createRequirePermission({
  permissionChecker: new PostgresPermissionChecker()
})('actuators.manage');

router.use(authenticate);
router.get('/states', asyncHandler((req, res) => controller.states(req, res)));
router.get('/commands', asyncHandler((req, res) => controller.commands(req, res)));
router.post('/:deviceId/:actuator/commands', requireActuatorManagement, asyncHandler((req, res) => controller.command(req, res)));
router.get('/:deviceId/status', asyncHandler((req, res) => controller.deviceStates(req, res)));

module.exports = router;
