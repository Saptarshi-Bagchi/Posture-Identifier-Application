import asyncio
import json
import os
import signal
import sys
import tempfile
from urllib.parse import quote
from datetime import datetime, timezone
from pathlib import Path

from amqtt.broker import Broker
from amqtt.client import MQTTClient
from amqtt.mqtt.constants import QOS_0


def emit(payload):
    print(json.dumps(payload), flush=True)


def is_loopback(host):
    return host in {"127.0.0.1", "::1", "localhost"}


def broker_config(host, password):
    config = {"listeners": {"default": {"type": "tcp", "bind": f"{host}:1883"}}}
    if is_loopback(host):
        config["plugins"] = {"amqtt.plugins.authentication.AnonymousAuthPlugin": {"allow_anonymous": True}}
        return config, None
    if not password:
        raise RuntimeError("MQTT_DEVICE_PASSWORD is required when MQTT_BIND_HOST is not loopback")
    from passlib.hash import sha512_crypt

    password_file = Path(tempfile.gettempdir()) / "ispa-mqtt-passwords"
    password_file.write_text(f"device:{sha512_crypt.hash(password)}\n", encoding="utf-8")
    config["plugins"] = {"amqtt.plugins.authentication.FileAuthPlugin": {"password_file": str(password_file)}}
    return config, password_file


class Bridge:
    def __init__(self, host, password):
        self.host = host
        self.password = password
        self.client = MQTTClient(client_id="ispa-desktop")
        self.stop = asyncio.Event()

    async def start_client(self):
        credentials = f"device:{quote(self.password, safe='')}@" if self.password else ""
        await self.client.connect(f"mqtt://{credentials}{self.host}:1883/")
        await self.client.subscribe([("posture/+/telemetry", QOS_0)])

    async def forward_messages(self):
        while not self.stop.is_set():
            message = await self.client.deliver_message(timeout_duration=1)
            if message is None:
                continue
            try:
                payload = json.loads(message.publish_packet.payload.data.decode("utf-8"))
                device_id = str(payload["device_id"])
                posture_state = str(payload["posture_state"])
                angle = float(payload["angle"])
                timestamp = payload["timestamp"]
            except (KeyError, TypeError, ValueError, json.JSONDecodeError, UnicodeDecodeError):
                continue
            emit({"type": "telemetry", "device_id": device_id, "posture_state": posture_state, "angle": angle, "timestamp": timestamp, "received_at": datetime.now(timezone.utc).isoformat()})

    async def commands(self):
        while not self.stop.is_set():
            line = await asyncio.to_thread(sys.stdin.readline)
            if not line:
                self.stop.set()
                return
            try:
                command = json.loads(line)
                device_id = str(command["device_id"])
            except (KeyError, TypeError, json.JSONDecodeError):
                continue
            if command.get("type") == "close_lid" and device_id:
                await self.client.publish(f"posture/{device_id}/command", b"close_lid", qos=QOS_0)

    async def fake_telemetry(self):
        states = [("POSTURE_NEUTRAL_GOOD", 4.0), ("POSTURE_FORWARD_HEAD_TEXT_NECK", 17.0), ("POSTURE_NEUTRAL_GOOD", 6.0)]
        index = 0
        while not self.stop.is_set():
            posture_state, angle = states[index % len(states)]
            payload = {"device_id": "test-esp32", "posture_state": posture_state, "angle": angle, "timestamp": datetime.now(timezone.utc).isoformat()}
            await self.client.publish("posture/test-esp32/telemetry", json.dumps(payload).encode("utf-8"), qos=QOS_0)
            index += 1
            await asyncio.sleep(2)

    async def shutdown(self):
        self.stop.set()
        await self.client.disconnect()


async def main():
    host = os.getenv("MQTT_BIND_HOST", "127.0.0.1")
    config, password_file = broker_config(host, os.getenv("MQTT_DEVICE_PASSWORD"))
    broker = Broker(config)
    bridge = Bridge(host, os.getenv("MQTT_DEVICE_PASSWORD", ""))
    await broker.start()
    await bridge.start_client()
    emit({"type": "status", "listening": True, "host": host, "port": 1883})
    tasks = [asyncio.create_task(bridge.forward_messages()), asyncio.create_task(bridge.commands())]
    if os.getenv("TESTING_MODE", "").lower() in {"1", "true", "yes"}:
        tasks.append(asyncio.create_task(bridge.fake_telemetry()))
    try:
        await bridge.stop.wait()
    finally:
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        await bridge.shutdown()
        await broker.shutdown()
        if password_file:
            password_file.unlink(missing_ok=True)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
    except Exception as error:
        emit({"type": "status", "listening": False, "error": str(error)})
        raise
