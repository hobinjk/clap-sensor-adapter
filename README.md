Clap Sensor
===========

This add-on provides an adapter which adds a Clap Sensor device to the Mozilla
IoT Gateway

Installation
------------

```shell
sudo apt install sox

cd ~/mozilla-iot/gateway/src/addons
git clone https://github.com/hobinjk/clap-sensor-adapter
cd clap-sensor-adapter
npm install
sudo systemctl restart mozilla-iot-gateway.service
```

Now navigate to the Add-ons Settings page, enable the Clap Sensor add-on, and
add the Clap Sensor device.
