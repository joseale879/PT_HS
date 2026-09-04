const { DeviceResponse } = require('../../core/application/dtos/responses/DeviceResponse');
const { RegisterDeviceRequest } = require('../../core/application/dtos/requests/RegisterDeviceRequest');
const { UpdateDeviceRequest } = require('../../core/application/dtos/requests/UpdateDeviceRequest');
const { UpdateDeviceConfigRequest } = require('../../core/application/dtos/requests/UpdateDeviceConfigRequest');
const { UpdateDeviceStatusRequest } = require('../../core/application/dtos/requests/UpdateDeviceStatusRequest');
const { DeactivateDeviceRequest } = require('../../core/application/dtos/requests/DeactivateDeviceRequest');
const { paginate } = require('../../shared/http');

class DeviceController {
  constructor({ registerDevice, listUserDevices, getDevice, updateDevice, updateDeviceConfig, updateDeviceStatus, deactivateDevice, unlinkDeviceFromHome }) {
    this.registerDevice = registerDevice;
    this.listUserDevices = listUserDevices;
    this.getDevice = getDevice;
    this.updateDevice = updateDevice;
    this.updateDeviceConfig = updateDeviceConfig;
    this.updateDeviceStatus = updateDeviceStatus;
    this.deactivateDevice = deactivateDevice;
    this.unlinkDeviceFromHome = unlinkDeviceFromHome;
  }

  async register(req, res) {
    const input = RegisterDeviceRequest.fromRequest(req.body);
    const device = await this.registerDevice.execute({
      userId: req.user.id,
      ...input
    });

    res.status(201).json({ data: DeviceResponse.fromEntity(device) });
  }

  async list(req, res) {
    const devices = await this.listUserDevices.execute({
      userId: req.user.id,
      homeId: req.query.homeId || null
    });
    const result = paginate(devices.map(DeviceResponse.fromEntity), req.query, { sortFields: ['name', 'code', 'status', 'createdAt'] });
    res.json({ data: result.items, pagination: result.pagination });
  }

  async get(req, res) {
    const device = await this.getDevice.execute({ userId: req.user.id, deviceId: req.params.deviceId });
    res.json({ data: DeviceResponse.fromEntity(device) });
  }

  async status(req, res) {
    const device = await this.getDevice.execute({ userId: req.user.id, deviceId: req.params.deviceId });
    res.json({
      data: {
        deviceId: device.id,
        status: device.status,
        firmwareVersion: device.firmwareVersion,
        lastConnectionAt: device.lastConnectionAt
      }
    });
  }

  async update(req, res) {
    const input = UpdateDeviceRequest.fromRequest(req.body);
    const device = await this.updateDevice.execute({ userId: req.user.id, deviceId: req.params.deviceId, ...input });
    res.json({ data: DeviceResponse.fromEntity(device) });
  }

  async updateConfig(req, res) {
    const input = UpdateDeviceConfigRequest.fromRequest(req.body);
    const device = await this.updateDeviceConfig.execute({ userId: req.user.id, deviceId: req.params.deviceId, ...input });
    res.json({ data: DeviceResponse.fromEntity(device) });
  }

  async updateStatus(req, res) {
    const input = UpdateDeviceStatusRequest.fromRequest(req.body);
    const device = await this.updateDeviceStatus.execute({ userId: req.user.id, deviceId: req.params.deviceId, ...input });
    res.json({ data: DeviceResponse.fromEntity(device) });
  }

  async unlink(req, res) {
    await this.unlinkDeviceFromHome.execute({
      userId: req.user.id,
      deviceId: req.params.deviceId,
      homeId: req.params.homeId
    });
    res.status(204).send();
  }

  async deactivate(req, res) {
    const input = DeactivateDeviceRequest.fromRequest(req.body);
    const device = await this.deactivateDevice.execute({
      userId: req.user.id,
      deviceId: req.params.deviceId,
      ...input
    });
    res.json({ data: DeviceResponse.fromEntity(device) });
  }
}

module.exports = { DeviceController };
