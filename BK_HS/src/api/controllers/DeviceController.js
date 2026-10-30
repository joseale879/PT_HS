const { randomUUID } = require("node:crypto");
const {
  DeviceResponse,
  effectiveConnectivityStatus,
} = require("../../core/application/dtos/responses/DeviceResponse");
const {
  RegisterDeviceRequest,
} = require("../../core/application/dtos/requests/RegisterDeviceRequest");
const {
  UpdateDeviceRequest,
} = require("../../core/application/dtos/requests/UpdateDeviceRequest");
const {
  UpdateDeviceConfigRequest,
} = require("../../core/application/dtos/requests/UpdateDeviceConfigRequest");
const {
  UpdateDeviceStatusRequest,
} = require("../../core/application/dtos/requests/UpdateDeviceStatusRequest");
const {
  UpdateDeviceProvisioningRequest,
} = require("../../core/application/dtos/requests/UpdateDeviceProvisioningRequest");
const {
  DeactivateDeviceRequest,
} = require("../../core/application/dtos/requests/DeactivateDeviceRequest");
const { paginate } = require("../../shared/http");

class DeviceController {
  constructor({
    registerDevice,
    linkDeviceToHome,
    listUserDevices,
    getDevice,
    getDeviceByHardware,
    claimDeviceHardware,
    getLatestDeviceTelemetry,
    listDeviceTelemetry,
    updateDevice,
    updateDeviceConfig,
    updateDeviceStatus,
    updateDeviceProvisioning,
    deactivateDevice,
    unlinkDeviceFromHome,
    deleteDevice,
    deviceCommandPublisher,
    deviceCommandsTopic,
  }) {
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
    this.deleteDevice = deleteDevice;
    this.deviceCommandPublisher = deviceCommandPublisher;
    this.deviceCommandsTopic = deviceCommandsTopic;
  }

  async register(req, res) {
    const input = RegisterDeviceRequest.fromRequest(req.body);
    const device = await this.registerDevice.execute({
      userId: req.user.id,
      ...input,
    });

    res.status(201).json({ data: DeviceResponse.fromEntity(device) });
  }

  async link(req, res) {
    const device = await this.linkDeviceToHome.execute({
      userId: req.user.id,
      homeId: req.body?.homeId,
      code: req.body?.code,
      hardwareId: req.body?.hardwareId,
    });

    if (
      device?.code &&
      this.deviceCommandPublisher &&
      this.deviceCommandsTopic
    ) {
      try {
        await this.deviceCommandPublisher.publish(
          this.deviceCommandsTopic(device.code),
          { command: "confirm_link", reason: "device_linked" },
          { qos: 1, retain: false },
        );
      } catch (error) {
        // La vinculacion en BD no se revierte si el ESP32 esta temporalmente
        // fuera de linea; el sincronizador MQTT lo corregira al volver ONLINE.
        console.warn(
          "[MQTT] No se pudo confirmar la vinculacion:",
          error.message,
        );
      }
    }
    res.status(200).json({ data: DeviceResponse.fromEntity(device) });
  }

  async list(req, res) {
    const devices = await this.listUserDevices.execute({
      userId: req.user.id,
      homeId: req.query.homeId || null,
    });
    const result = paginate(devices.map(DeviceResponse.fromEntity), req.query, {
      sortFields: ["name", "code", "status", "createdAt"],
    });
    res.json({ data: result.items, pagination: result.pagination });
  }

  async get(req, res) {
    const device = await this.getDevice.execute({
      userId: req.user.id,
      deviceId: req.params.deviceId,
    });
    res.json({ data: DeviceResponse.fromEntity(device) });
  }

  async getByHardware(req, res) {
    const device = await this.getDeviceByHardware.execute({
      userId: req.user.id,
      hardwareId: req.params.hardwareId,
    });
    res.json({ data: DeviceResponse.fromEntity(device) });
  }

  async claimHardware(req, res) {
    const device = await this.claimDeviceHardware.execute({
      userId: req.user.id,
      deviceId: req.params.deviceId,
      hardwareId: req.body?.hardwareId,
    });
    res.json({ data: DeviceResponse.fromEntity(device) });
  }

  async status(req, res) {
    const device = await this.getDevice.execute({
      userId: req.user.id,
      deviceId: req.params.deviceId,
    });
    res.json({
      data: {
        deviceId: device.id,
        status: device.status,
        connectivityStatus: effectiveConnectivityStatus(device),
        firmwareVersion: device.firmwareVersion,
        lastConnectionAt: device.lastConnectionAt,
        lastIp: device.lastIp,
        wifiSsid: device.wifiSsid,
        wifiRssiDbm: device.wifiRssiDbm,
        signalQuality: device.signalQuality,
        batteryLevel: device.batteryLevel,
        measurementEnabled: device.measurementEnabled,
        measurementUpdatedAt: device.measurementUpdatedAt,
        hardwareId: device.hardwareId,
        provisioningStatus: device.provisioningStatus,
        provisioningError: device.provisioningError,
        provisioningUpdatedAt: device.provisioningUpdatedAt,
        provisionedAt: device.provisionedAt,
      },
    });
  }

  async latestTelemetry(req, res) {
    const telemetry = await this.getLatestDeviceTelemetry.execute({
      userId: req.user.id,
      deviceId: req.params.deviceId,
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
      sort: req.query.sort || "measuredAt",
      order: req.query.order || "desc",
    });
    res.json({ data: result.items, pagination: result.pagination });
  }

  async setMeasurement(req, res) {
    if (typeof req.body?.enabled !== "boolean") {
      return res.status(400).json({ error: "enabled debe ser booleano" });
    }

    const device = await this.getDevice.execute({
      userId: req.user.id,
      deviceId: req.params.deviceId,
    });
    if (effectiveConnectivityStatus(device) !== "ONLINE") {
      return res.status(409).json({ error: "El dispositivo debe estar en línea para recibir la orden" });
    }
    if (!this.deviceCommandPublisher || !this.deviceCommandsTopic) {
      return res.status(503).json({ error: "El servicio de comandos MQTT no está disponible" });
    }

    const commandId = randomUUID();
    const acceptedAt = new Date().toISOString();
    await this.deviceCommandPublisher.publish(
      this.deviceCommandsTopic(device.code),
      {
        command: "set_measurement",
        enabled: req.body.enabled,
        commandId,
        timestamp: acceptedAt,
      },
      { qos: 1, retain: false },
    );

    return res.status(202).json({
      data: {
        deviceId: device.id,
        commandId,
        requestedMeasurementEnabled: req.body.enabled,
        acceptedAt,
      },
    });
  }

  async update(req, res) {
    const input = UpdateDeviceRequest.fromRequest(req.body);
    const device = await this.updateDevice.execute({
      userId: req.user.id,
      deviceId: req.params.deviceId,
      ...input,
    });
    res.json({ data: DeviceResponse.fromEntity(device) });
  }

  async updateConfig(req, res) {
    const input = UpdateDeviceConfigRequest.fromRequest(req.body);
    const device = await this.updateDeviceConfig.execute({
      userId: req.user.id,
      deviceId: req.params.deviceId,
      ...input,
    });
    res.json({ data: DeviceResponse.fromEntity(device) });
  }

  async updateStatus(req, res) {
    const input = UpdateDeviceStatusRequest.fromRequest(req.body);
    const device = await this.updateDeviceStatus.execute({
      userId: req.user.id,
      deviceId: req.params.deviceId,
      ...input,
    });
    res.json({ data: DeviceResponse.fromEntity(device) });
  }

  async updateProvisioning(req, res) {
    const input = UpdateDeviceProvisioningRequest.fromRequest(req.body);
    const device = await this.updateDeviceProvisioning.execute({
      userId: req.user.id,
      deviceId: req.params.deviceId,
      ...input,
    });
    res.json({ data: DeviceResponse.fromEntity(device) });
  }

  async unlink(req, res) {
    const unlinked = await this.unlinkDeviceFromHome.execute({
      userId: req.user.id,
      deviceId: req.params.deviceId,
      homeId: req.params.homeId,
    });

    let bleCommandPublished = false;
    if (
      unlinked?.deviceCode &&
      this.deviceCommandPublisher &&
      this.deviceCommandsTopic
    ) {
      try {
        await this.deviceCommandPublisher.publish(
          this.deviceCommandsTopic(unlinked.deviceCode),
          { command: "unlink", reason: "device_unlinked" },
          { qos: 1, retain: false },
        );
        bleCommandPublished = true;
      } catch (error) {
        // La desvinculaciÃ³n ya fue confirmada en BD. El ESP32 podrÃ¡ recibir
        // el comando en el siguiente intento de conexiÃ³n MQTT.
        console.warn(
          "[MQTT] No se pudo reactivar BLE tras desvincular:",
          error.message,
        );
      }
    }
    res.status(200).json({
      data: {
        unlinkedDeviceCodes: unlinked.deviceCodes || [unlinked.deviceCode],
        logicalGroup: unlinked.logicalGroup === true,
        bleCommandPublished,
      },
    });
  }

  async delete(req, res) {
    await this.deleteDevice.execute({
      userId: req.user.id,
      deviceId: req.params.deviceId,
    });
    res.status(204).send();
  }

  async deactivate(req, res) {
    const input = DeactivateDeviceRequest.fromRequest(req.body);
    const device = await this.deactivateDevice.execute({
      userId: req.user.id,
      deviceId: req.params.deviceId,
      ...input,
    });
    res.json({ data: DeviceResponse.fromEntity(device) });
  }
}

module.exports = { DeviceController };
