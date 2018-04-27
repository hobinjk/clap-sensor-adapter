/**
 * example-plugin-adapter.js - Example adapter implemented as a plugin.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

let Adapter, Device, Property;
try {
  Adapter = require('../adapter');
  Device = require('../device');
  Property = require('../property');
} catch (e) {
  if (e.code !== 'MODULE_NOT_FOUND') {
    throw e;
  }

  const gwa = require('gateway-addon');
  Adapter = gwa.Adapter;
  Device = gwa.Device;
  Property = gwa.Property;
}

var clapDetector = require('clap-detector');
// Start clap detection
clapDetector.start();

class ActiveProperty extends Property {
  constructor(device, name, propertyDescription) {
    super(device, name, propertyDescription);
    this.unit = propertyDescription.unit;
    this.description = propertyDescription.description;
    this.setCachedValue(propertyDescription.value);
    this.device.notifyPropertyChanged(this);

    clapDetector.onClap(function() {
      console.log('clap!');
      this.value = !this.value;
      this.setCachedValue(this.value);

      this.device.notifyPropertyChanged(this);
    }.bind(this));
  }

  /**
   * @method setValue
   * @returns a promise which resolves to the updated value.
   *
   * @note it is possible that the updated value doesn't match
   * the value passed in.
   */
  setValue(value) {
    return new Promise((resolve, reject) => {
      super.setValue(value).then((updatedValue) => {
        resolve(updatedValue);
        this.device.notifyPropertyChanged(this);
      }).catch((err) => {
        reject(err);
      });
    });
  }
}

class ClapSensor extends Device {
  constructor(adapter, id, deviceDescription) {
    super(adapter, id);
    this.name = deviceDescription.name;
    this.type = deviceDescription.type;
    this.description = deviceDescription.description;
    for (var propertyName in deviceDescription.properties) {
      var propertyDescription = deviceDescription.properties[propertyName];
      var property = new ActiveProperty(this, propertyName,
                                         propertyDescription);
      this.properties.set(propertyName, property);
    }
  }
}

class ClapSensorAdapter extends Adapter {
  constructor(addonManager, packageName) {
    super(addonManager, 'ClapSensor', packageName);
    addonManager.addAdapter(this);
  }

  /**
   * For cleanup between tests.
   */
  clearState() {
    this.actions = {};

    for (let deviceId in this.devices) {
      this.removeDevice(deviceId);
    }
  }

  /**
   * Add a ExampleDevice to the ClapSensorAdapter
   *
   * @param {String} deviceId ID of the device to add.
   * @return {Promise} which resolves to the device added.
   */
  addDevice(deviceId, deviceDescription) {
    return new Promise((resolve, reject) => {
      if (deviceId in this.devices) {
        reject('Device: ' + deviceId + ' already exists.');
      } else {
        var device = new ClapSensor(this, deviceId, deviceDescription);
        this.handleDeviceAdded(device);
        resolve(device);
      }
    });
  }

  /**
   * Remove a ExampleDevice from the ClapSensorAdapter.
   *
   * @param {String} deviceId ID of the device to remove.
   * @return {Promise} which resolves to the device removed.
   */
  removeDevice(deviceId) {
    return new Promise((resolve, reject) => {
      var device = this.devices[deviceId];
      if (device) {
        this.handleDeviceRemoved(device);
        resolve(device);
      } else {
        reject('Device: ' + deviceId + ' not found.');
      }
    });
  }

  pairDevice(deviceId, deviceDescription) {
    this.pairDeviceId = deviceId;
    this.pairDeviceDescription = deviceDescription;
  }

  unpairDevice(deviceId) {
    this.unpairDeviceId = deviceId;
  }

  // eslint-disable-next-line no-unused-vars
  startPairing(timeoutSeconds) {
    console.log('ClapSensorAdapter:', this.name,
                'id', this.id, 'pairing started');
    if (this.pairDeviceId) {
      var deviceId = this.pairDeviceId;
      var deviceDescription = this.pairDeviceDescription;
      this.pairDeviceId = null;
      this.pairDeviceDescription = null;
      this.addDevice(deviceId, deviceDescription).then(() => {
        console.log('ClapSensorAdapter: device:', deviceId, 'was paired.');
      }).catch((err) => {
        console.error('ClapSensorAdapter: unpairing', deviceId, 'failed');
        console.error(err);
      });
    }
  }

  cancelPairing() {
    console.log('ClapSensorAdapter:', this.name, 'id', this.id,
                'pairing cancelled');
  }

  removeThing(device) {
    console.log('ClapSensorAdapter:', this.name, 'id', this.id,
                'removeThing(', device.id, ') started');
    if (this.unpairDeviceId) {
      var deviceId = this.unpairDeviceId;
      this.unpairDeviceId = null;
      this.removeDevice(deviceId).then(() => {
        console.log('ClapSensorAdapter: device:', deviceId, 'was unpaired.');
      }).catch((err) => {
        console.error('ClapSensorAdapter: unpairing', deviceId, 'failed');
        console.error(err);
      });
    }
  }

  cancelRemoveThing(device) {
    console.log('ClapSensorAdapter:', this.name, 'id', this.id,
                'cancelRemoveThing(', device.id, ')');
  }
}

function loadClapSensorAdapter(addonManager, manifest, _errorCallback) {
  var adapter = new ClapSensorAdapter(addonManager, manifest.name);
  var device = new ClapSensor(adapter, 'clap-sensor-0', {
    name: 'Clap Sensor',
    type: 'binarySensor',
    properties: {
      on: {
        name: 'on',
        type: 'boolean',
        value: false,
      },
    },
  });
  adapter.handleDeviceAdded(device);
}

module.exports = loadClapSensorAdapter;
