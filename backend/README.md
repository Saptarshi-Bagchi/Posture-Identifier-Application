# ISPA MQTT bridge

Install the Python dependency before starting Electron:

```powershell
python -m pip install -r backend/requirements.txt
```

The embedded broker listens on `127.0.0.1:1883` by default. For an ESP32 on the LAN, bind to the computer's LAN address and set a non-empty password. The ESP32 must use the configured MQTT username and password.
