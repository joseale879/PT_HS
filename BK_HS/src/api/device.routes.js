const router = require('express').Router();
const { asyncHandler } = require('../shared/http');
const { authenticate } = require('./middleware/auth');
const { createRequirePermission } = require('./middleware/requirePermission');
const { RegisterDevice } = require('../core/application/use-cases/device/RegisterDevice');
const { LinkDeviceToHome } = require('../core/application/use-cases/device/LinkDeviceToHome');
const { ListUserDevices } = require('../core/application/use-cases/device/ListUserDevices');
const { GetDevice } = require('../core/application/use-cases/device/GetDevice');
const { GetDeviceByHardware } = require('../core/application/use-cases/device/GetDeviceByHardware');
const { ClaimDeviceHardware } = require('../core/application/use-cases/device/ClaimDeviceHardware');
const { GetLatestDeviceTelemetry } = require('../core/application/use-cases/device/GetLatestDeviceTelemetry');
const { ListDeviceTelemetry } = require('../core/application/use-cases/device/ListDeviceTelemetry');
const { UpdateDevice } = require('../core/application/use-cases/device/UpdateDevice');
const { UpdateDeviceConfig } = require('../core/application/use-cases/device/UpdateDeviceConfig');
const { UpdateDeviceStatus } = require('../core/application/use-cases/device/UpdateDeviceStatus');
const { UpdateDeviceProvisioning } = require('../core/application/use-cases/device/UpdateDeviceProvisioning');
const { UnlinkDeviceFromHome } = require('../core/application/use-cases/device/UnlinkDeviceFromHome');
const { DeactivateDevice } = require('../core/application/use-cases/device/DeactivateDevice');
const { PostgresDeviceRepository } = require('../core/infrastructure/repositories/postgres/PostgresDeviceRepository');
const { DeviceController } = require('./controllers/DeviceController');
const { PostgresPermissionChecker } = require('../core/infrastructure/security/PostgresPermissionChecker');

const deviceRepository = new PostgresDeviceRepository();
const updateDeviceStatus = new UpdateDeviceStatus({ deviceRepository });
const deviceController = new DeviceController({
  registerDevice: new RegisterDevice({ deviceRepository }),
  linkDeviceToHome: new LinkDeviceToHome({ deviceRepository }),
  listUserDevices: new ListUserDevices({ deviceRepository }),
  getDevice: new GetDevice({ deviceRepository }),
  getDeviceByHardware: new GetDeviceByHardware({ deviceRepository }),
  claimDeviceHardware: new ClaimDeviceHardware({ deviceRepository }),
  getLatestDeviceTelemetry: new GetLatestDeviceTelemetry({ deviceRepository }),
  listDeviceTelemetry: new ListDeviceTelemetry({ deviceRepository }),
  updateDevice: new UpdateDevice({ deviceRepository }),
  updateDeviceConfig: new UpdateDeviceConfig({ deviceRepository }),
  updateDeviceStatus,
  updateDeviceProvisioning: new UpdateDeviceProvisioning({ deviceRepository }),
  deactivateDevice: new DeactivateDevice({ updateDeviceStatus }),
  unlinkDeviceFromHome: new UnlinkDeviceFromHome({ deviceRepository })
});
const requirePermission = createRequirePermission({
  permissionChecker: new PostgresPermissionChecker()
});

router.use(authenticate);
router.post('/', requirePermission('devices.manage'), asyncHandler((req, res) => deviceController.register(req, res)));
router.post('/link', requirePermission('devices.manage'), asyncHandler((req, res) => deviceController.link(req, res)));
router.get('/', asyncHandler((req, res) => deviceController.list(req, res)));
router.get('/hardware/:hardwareId', asyncHandler((req, res) => deviceController.getByHardware(req, res)));
router.get('/:deviceId/status', asyncHandler((req, res) => deviceController.status(req, res)));
router.get('/:deviceId/telemetry', asyncHandler((req, res) => deviceController.telemetry(req, res)));
router.get('/:deviceId/telemetry/latest', asyncHandler((req, res) => deviceController.latestTelemetry(req, res)));
router.put('/:deviceId', requirePermission('devices.manage'), asyncHandler((req, res) => deviceController.update(req, res)));
router.put('/:deviceId/config', requirePermission('devices.manage'), asyncHandler((req, res) => deviceController.updateConfig(req, res)));
router.patch('/:deviceId/status', requirePermission('devices.manage'), asyncHandler((req, res) => deviceController.updateStatus(req, res)));
router.patch('/:deviceId/provisioning', requirePermission('devices.manage'), asyncHandler((req, res) => deviceController.updateProvisioning(req, res)));
router.post('/:deviceId/claim-hardware', requirePermission('devices.manage'), asyncHandler((req, res) => deviceController.claimHardware(req, res)));
router.post('/:deviceId/deactivate', requirePermission('devices.manage'), asyncHandler((req, res) => deviceController.deactivate(req, res)));
router.delete('/:deviceId/home/:homeId', requirePermission('devices.manage'), asyncHandler((req, res) => deviceController.unlink(req, res)));
router.get('/:deviceId', asyncHandler((req, res) => deviceController.get(req, res)));

module.exports = router;
