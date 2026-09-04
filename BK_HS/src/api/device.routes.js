const router = require('express').Router();
const { asyncHandler } = require('../shared/http');
const { authenticate } = require('./middleware/auth');
const { createRequirePermission } = require('./middleware/requirePermission');
const { RegisterDevice } = require('../core/application/use-cases/device/RegisterDevice');
const { ListUserDevices } = require('../core/application/use-cases/device/ListUserDevices');
const { GetDevice } = require('../core/application/use-cases/device/GetDevice');
const { UpdateDevice } = require('../core/application/use-cases/device/UpdateDevice');
const { UpdateDeviceConfig } = require('../core/application/use-cases/device/UpdateDeviceConfig');
const { UpdateDeviceStatus } = require('../core/application/use-cases/device/UpdateDeviceStatus');
const { UnlinkDeviceFromHome } = require('../core/application/use-cases/device/UnlinkDeviceFromHome');
const { DeactivateDevice } = require('../core/application/use-cases/device/DeactivateDevice');
const { PostgresDeviceRepository } = require('../core/infrastructure/repositories/postgres/PostgresDeviceRepository');
const { DeviceController } = require('./controllers/DeviceController');
const { PostgresPermissionChecker } = require('../core/infrastructure/security/PostgresPermissionChecker');

const deviceRepository = new PostgresDeviceRepository();
const updateDeviceStatus = new UpdateDeviceStatus({ deviceRepository });
const deviceController = new DeviceController({
  registerDevice: new RegisterDevice({ deviceRepository }),
  listUserDevices: new ListUserDevices({ deviceRepository }),
  getDevice: new GetDevice({ deviceRepository }),
  updateDevice: new UpdateDevice({ deviceRepository }),
  updateDeviceConfig: new UpdateDeviceConfig({ deviceRepository }),
  updateDeviceStatus,
  deactivateDevice: new DeactivateDevice({ updateDeviceStatus }),
  unlinkDeviceFromHome: new UnlinkDeviceFromHome({ deviceRepository })
});
const requirePermission = createRequirePermission({
  permissionChecker: new PostgresPermissionChecker()
});

router.use(authenticate);
router.post('/', requirePermission('devices.manage'), asyncHandler((req, res) => deviceController.register(req, res)));
router.get('/', asyncHandler((req, res) => deviceController.list(req, res)));
router.get('/:deviceId/status', asyncHandler((req, res) => deviceController.status(req, res)));
router.put('/:deviceId', requirePermission('devices.manage'), asyncHandler((req, res) => deviceController.update(req, res)));
router.put('/:deviceId/config', requirePermission('devices.manage'), asyncHandler((req, res) => deviceController.updateConfig(req, res)));
router.patch('/:deviceId/status', requirePermission('devices.manage'), asyncHandler((req, res) => deviceController.updateStatus(req, res)));
router.post('/:deviceId/deactivate', requirePermission('devices.manage'), asyncHandler((req, res) => deviceController.deactivate(req, res)));
router.delete('/:deviceId/home/:homeId', requirePermission('devices.manage'), asyncHandler((req, res) => deviceController.unlink(req, res)));
router.get('/:deviceId', asyncHandler((req, res) => deviceController.get(req, res)));

module.exports = router;
