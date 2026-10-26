const { DeviceResponse } = require('../../core/application/dtos/responses/DeviceResponse');
const { RegisterDeviceRequest } = require('../../core/application/dtos/requests/RegisterDeviceRequest');
const { UpdateDeviceRequest } = require('../../core/application/dtos/requests/UpdateDeviceRequest');
const { UpdateDeviceConfigRequest } = require('../../core/application/dtos/requests/UpdateDeviceConfigRequest');
const { UpdateDeviceStatusRequest } = require('../../core/application/dtos/requests/UpdateDeviceStatusRequest');
const { UpdateDeviceProvisioningRequest } = require('../../core/application/dtos/requests/UpdateDeviceProvisioningRequest');
const { DeactivateDeviceRequest } = require('../../core/application/dtos/requests/DeactivateDeviceRequest');
const { paginate } = require('../../shared/http');

class DeviceController {
  constructor({ registerDevice, linkDeviceToHome, listUserDevices, getDevice, getDeviceByHardware, claimDeviceHardware, getLatestDeviceTelemetry, listDeviceTelemetry, updateDevice, updateDeviceConfig, updateDeviceStatus, updateDeviceProvisioning, deactivateDevice, unlinkDeviceFromHome }) {
    this.registerDevice = registerDevice;
    this.linkDeviceToHome = linkDeviceToHome;
    this.listUserDevices = listUserDevices;
    this.getDevice = getDevice;
    this.getDeviceByHardware = getDeviceByHardware;
    this.claimDeviceHardware = claimDeviceHardware;
    this.getLatestDeviceTelemetry = getLatestDeviceTelemetry;
    this.listDeviceTelemetry = listDeviceTelemetry;
    this.updateDevice = updateDevice;
    this.updateDeviceConfig = updateDeviceConfig;
    this.updateDeviceStatus = updateDeviceStatus;
    this.updateDeviceProvisioning = updateDeviceProvisioning;
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

  async link(req, res) {
    const device = await this.linkDeviceToHome.execute({
      userId: req.user.id,
      homeId: req.body?.homeId,
      code: req.body?.code
    });
    res.status(200).json({ data: DeviceResponse.fromEntity(device) });
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

  async getByHardware(req, res) {
    const device = await this.getDeviceByHardware.execute({
      userId: req.user.id,
      hardwareId: req.params.hardwareId
    });
    res.json({ data: DeviceResponse.fromEntity(device) });
  }

  async claimHardware(req, res) {
    const device = await this.claimDeviceHardware.execute({
      userId: req.user.id,
      deviceId: req.params.deviceId,
      hardwareId: req.body?.hardwareId
    });
    res.json({ data: DeviceResponse.fromEntity(device) });
  }

  async status(req, res) {
    const device = await this.getDevice.execute({ userId: req.user.id, deviceId: req.params.deviceId });
    res.json({
      data: {
        deviceId: device.id,
        status: device.status,
        connectivityStatus: device.connectivityStatus,
        firmwareVersion: device.firmwareVersion,
        lastConnectionAt: device.lastConnectionAt,
        lastIp: device.lastIp,
        wifiSsid: device.wifiSsid,
        wifiRssiDbm: device.wifiRssiDbm,
        signalQuality: device.signalQuality,
        batteryLevel: device.batteryLevel,
        hardwareId: device.hardwareId,
        provisioningStatus: device.provisioningStatus,
        provisioningError: device.provisioningError,
        provisioningUpdatedAt: device.provisioningUpdatedAt,
        provisionedAt: device.provisionedAt
      }
    });
  }

  async latestTelemetry(req, res) {
    const telemetry = await this.getLatestDeviceTelemetry.execute({
      userId: req.user.id,
      deviceId: req.params.deviceId
    });
    res.json({ data: telemetry });
  }

  async telemetry(req, res) {
    const result = await this.listDeviceTelemetry.execute({
      userId: req.user.id,
      deviceId: req.params.deviceId,
      page: req.query.page,
      pageSize: req.query.pageSize,
      from: req.query.from,
      to: req.query.to,
      sort: req.query.sort || 'measuredAt',
      order: req.query.order || 'desc'
    });
    res.json({ data: result.items, pagination: result.pagination });
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

  async updateProvisioning(req, res) {
    const input = UpdateDeviceProvisioningRequest.fromRequest(req.body);
    const device = await this.updateDeviceProvisioning.execute({
      userId: req.user.id,
      deviceId: req.params.deviceId,
      ...input
    });
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
