# 🧘 ISPA

**Incorrect Posture Determination via Spine Alignment**

ISPA is an Electron desktop dashboard for an ESP8266 posture sensor. It reads four live angle readings and a posture flag over USB serial, classifies posture, and displays real-time readings and graphs.

The application uses a direct USB serial connection from the sensor to the
desktop app.

## ✨ Features

* 📊 **Live Posture** — posture classification, sensor angles, and rolling charts.
* 📖 **Posture Almanac** — posture reference images and descriptions.
* 🔌 **Serial Connection** — connect directly to an ESP8266 by COM port.
* 🖥️ **System Tray** — open, pause, or quit ISPA.

## 🏗️ Architecture

```text
ESP8266 → USB serial → Python serial reader → Electron IPC → React
```

* `backend/serial_reader.py` — serial connection, CSV parsing, and reconnect handling.
* `desktop-app/electron/main.js` — Electron process and IPC.
* `desktop-app/electron/preload.js` — secure renderer API.
* `src/hooks/usePostureTelemetry.js` — telemetry state and history.
* `src/config/postureRules.js` — posture classification rules.

No broker or cloud service is required to run ISPA.

## 📋 Requirements

* Node.js **18+**
* npm
* Python **3.9+**
* ESP8266 posture sensor connected over USB

## 🚀 Installation

From the repository root:

```powershell
npm install
python -m pip install -r backend/requirements.txt
```

### ▶️ Run

Development:

```powershell
npm run dev:desktop
```

Production:

```powershell
npm start
```

Build only:

```powershell
npm run build
```

## 🔌 Serial Configuration

Open **Device Connection**, enter the serial port (for example `COM5` or `/dev/ttyUSB0`), and select **Connect**. The reader uses **115200 baud** and reconnects automatically if the ESP8266 is unplugged and reconnected.

The standalone reader can also be run directly. Omitting the port lists available ports and lets you choose one:

```powershell
python backend/serial_reader.py
python backend/serial_reader.py --port COM5
```

The ESP8266 must emit one line per reading in this exact format:

```text
kalAngle0,kalAngle1,kalAngle2,kalAngle3,binary
```

Example:

```text
12.34,-3.21,0.55,89.90,1
```

The fields are mapped at the serial-reader boundary as follows:

| CSV field | Application field | Meaning |
| --- | --- | --- |
| `kalAngle0` / `value0` | `lumbarX` | Lumbar X angle |
| `kalAngle1` / `value1` | `lumbarY` | Lumbar Y angle |
| `kalAngle2` / `value2` | `neckX` | Neck X angle |
| `kalAngle3` / `value3` | `neckY` | Neck Y angle |
| `binary` / `value4` | `binary` | `1` = good posture, `0` = bad posture |

The four angle fields are floats. The `binary` field is an integer. The
Python reader converts the raw CSV values to named fields once, then sends
JSON telemetry to Electron over its local process pipe.

## 🔔 Notifications

While a serial connection is active, ISPA can show native desktop
notifications for movement breaks and bad posture. The notification history
and break timer are displayed in the in-app notification panel. The **Test
Notification** button on **Device Connection** can be used to check native
notification support without waiting for the break timer.

## 🧠 Posture Classification

The frontend classifies posture using the four angles:

* 🟢 **≤ 10°** — Good Posture
* 🟡 **> 10°** — Directional/lumbar warnings
* 🔴 **> 20°** — Poor Posture

Rules can be modified in:

```text
src/config/postureRules.js
```

## 🔧 Troubleshooting

If no data appears:

* Confirm the ESP8266 is connected and the selected COM port is correct.
* Close any other serial monitor using the port.
* Confirm the device is sending newline-terminated CSV at 115200 baud.
* Reconnect the USB cable; the reader retries automatically.

## 📜 License

Educational and prototype use.
