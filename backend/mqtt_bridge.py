import asyncio
import json
import os
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


def broker_config(host, username, password):
    port = int(os.getenv("MQTT_PORT", "1883"))
    config = {"listeners": {"default": {"type": "tcp", "bind": f"{host}:{port}"}}}
    if is_loopback(host):
        config["plugins"] = {"amqtt.plugins.authentication.AnonymousAuthPlugin": {"allow_anonymous": True}}
        return config, None
    if not password:
        raise RuntimeError("MQTT_DEVICE_PASSWORD is required when MQTT_BIND_HOST is not loopback")
    from passlib.hash import sha512_crypt

    password_file = Path(tempfile.gettempdir()) / "ispa-mqtt-passwords"
    password_file.write_text(f"{username}:{sha512_crypt.hash(password)}\n", encoding="utf-8")
    config["plugins"] = {"amqtt.plugins.authentication.FileAuthPlugin": {"password_file": str(password_file)}}
    return config, password_file


class Bridge:
    def __init__(self, host, port, username, password, topic):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.topic = topic
        self.client = MQTTClient(client_id="ispa-desktop")
        self.stop = asyncio.Event()

    async def start_client(self):
        credentials = f"{quote(self.username, safe='')}:{quote(self.password, safe='')}@" if self.password else ""
        await self.client.connect(f"mqtt://{credentials}{self.host}:{self.port}/")
        await self.client.subscribe([(self.topic, QOS_0)])

    async def forward_messages(self):
        while not self.stop.is_set():
            message = await self.client.deliver_message(timeout_duration=1)
            if message is None:
                continue
            try:
                raw = message.publish_packet.payload.data.decode("utf-8").strip()
                try:
                    payload = json.loads(raw)
                    values = [float(payload[key]) for key in ("neck_x", "neck_y", "lumbar_x", "lumbar_y")]
                    timestamp = payload.get("timestamp", datetime.now(timezone.utc).isoformat())
                    device_id = str(payload.get("device_id") or message.publish_packet.variable_header.topic_name.split("/")[1])
                    good_posture = payload.get("good_posture")
                except json.JSONDecodeError:
                    values = [float(value.strip()) for value in raw.split(",")]
                    if len(values) != 4:
                        raise ValueError("CSV telemetry requires four floats")
                    timestamp = datetime.now(timezone.utc).isoformat()
                    device_id = message.publish_packet.variable_header.topic_name.split("/")[1]
                    good_posture = None
            except (IndexError, KeyError, TypeError, ValueError, UnicodeDecodeError):
                emit({"type": "payload_error", "error": "Malformed telemetry payload"})
                continue
            emit({"type": "telemetry", "device_id": device_id, "neck_x": values[0], "neck_y": values[1], "lumbar_x": values[2], "lumbar_y": values[3], "good_posture": good_posture if isinstance(good_posture, bool) else None, "timestamp": timestamp, "received_at": datetime.now(timezone.utc).isoformat()})

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

    async def shutdown(self):
        self.stop.set()
        await self.client.disconnect()


async def main():
    host = os.getenv("MQTT_BIND_HOST", "127.0.0.1")
    port = int(os.getenv("MQTT_PORT", "1883"))
    topic = os.getenv("MQTT_TELEMETRY_TOPIC", "posture/sensor_data")
    username = os.getenv("MQTT_DEVICE_USERNAME", "device")
    config, password_file = broker_config(host, username, os.getenv("MQTT_DEVICE_PASSWORD"))
    broker = Broker(config)
    bridge = Bridge(host, port, username, os.getenv("MQTT_DEVICE_PASSWORD", ""), topic)
    await broker.start()
    await bridge.start_client()
    emit({"type": "status", "listening": True, "host": host, "port": port, "topic": topic})
    tasks = [asyncio.create_task(bridge.forward_messages()), asyncio.create_task(bridge.commands())]
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
