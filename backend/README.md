# ISPA MQTT bridge

Install the Python dependency before starting Electron:

```powershell
python -m pip install -r backend/requirements.txt
```

The embedded broker listens on `127.0.0.1:1883` by default. For an ESP32 on the LAN, set `MQTT_BIND_HOST` to the computer's LAN address and set a non-empty `MQTT_DEVICE_PASSWORD`. The ESP32 must use MQTT username `device` and that password.

Set `TESTING_MODE=1` to generate telemetry without hardware.
