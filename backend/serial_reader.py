"""Read posture telemetry from an ESP8266 over USB serial.

The ESP8266 is expected to emit one CSV line per reading:

    kalAngle0,kalAngle1,kalAngle2,kalAngle3,binary

Example:

    12.34,-3.21,0.55,89.90,1

Install the only dependency with:

    python -m pip install -r backend/requirements.txt
"""

from __future__ import annotations

import argparse
import json
import sys
import threading
import time
from typing import Callable, Optional, Sequence, TypedDict

import serial
from serial.tools import list_ports


BAUD_RATE = 115200
RECONNECT_DELAY_SECONDS = 2.0
class Reading(TypedDict):
    neckX: float
    neckY: float
    lumbarX: float
    lumbarY: float
    binary: int


ReadingCallback = Callable[[Reading], None]
StatusCallback = Callable[[str, Optional[str]], None]


def parse_reading(line: str) -> Reading:
    """Parse one telemetry line, raising ValueError if it is malformed."""
    # ESP8266 CSV order: lumbar_x, lumbar_y, neck_x, neck_y, binary (confirmed from live serial data, NOT neck-first as originally assumed).
    fields = [field.strip() for field in line.strip().split(",")]
    if len(fields) != 5:
        raise ValueError(f"expected 5 comma-separated fields, received {len(fields)}")

    try:
        # Map raw indexes to named fields exactly once at the serial boundary.
        lumbar_x, lumbar_y, neck_x, neck_y = (float(value) for value in fields[:4])
        binary = int(fields[4])
    except ValueError as exc:
        raise ValueError("angles must be floats and binary must be an integer") from exc

    if binary not in (0, 1):
        raise ValueError("binary must be 0 or 1")

    return {"neckX": neck_x, "neckY": neck_y, "lumbarX": lumbar_x, "lumbarY": lumbar_y, "binary": binary}


def available_ports() -> Sequence[str]:
    """Return currently available serial device names."""
    return [port.device for port in list_ports.comports()]


def choose_port() -> str:
    """Show detected ports and ask the user to choose one."""
    ports = list(available_ports())
    if not ports:
        raise RuntimeError("No serial ports detected. Connect the ESP8266 and try again.")

    print("Available serial ports:")
    for index, port in enumerate(ports, start=1):
        print(f"  {index}. {port}")

    if len(ports) == 1:
        answer = input(f"Select a port [1] (or type its name): ").strip()
        if not answer:
            return ports[0]
    else:
        answer = input("Select a port number (or type its name): ").strip()

    if answer.isdigit() and 1 <= int(answer) <= len(ports):
        return ports[int(answer) - 1]
    if answer:
        return answer
    raise ValueError("A serial port selection is required")


def print_reading(reading: Reading) -> None:
    """Default callback: print a human-readable reading."""
    status = "GOOD" if reading["binary"] == 1 else "BAD"
    angles = (reading["neckX"], reading["neckY"], reading["lumbarX"], reading["lumbarY"])
    formatted_angles = ", ".join(f"{angle:.2f}" for angle in angles)
    print(f"angles=[{formatted_angles}]  posture={status} ({reading['binary']})", flush=True)


def emit_json_reading(reading: Reading) -> None:
    """Machine-readable callback used by the Electron desktop process."""
    print(json.dumps({
        "type": "telemetry",
        "neckX": reading["neckX"],
        "neckY": reading["neckY"],
        "lumbarX": reading["lumbarX"],
        "lumbarY": reading["lumbarY"],
        "binary": reading["binary"],
    }), flush=True)


def emit_json_status(state: str, error: Optional[str] = None) -> None:
    """Emit connection state without mixing it into telemetry parsing."""
    event = {"type": "status", "state": state, "listening": state == "connected"}
    if error:
        event["error"] = error
    print(json.dumps(event), flush=True)


class SerialPostureReader:
    """Continuously read posture data and reconnect after serial failures."""

    def __init__(
        self,
        port: str,
        on_reading: ReadingCallback = print_reading,
        on_status: Optional[StatusCallback] = None,
        baud_rate: int = BAUD_RATE,
        reconnect_delay: float = RECONNECT_DELAY_SECONDS,
    ) -> None:
        self.port = port
        self.on_reading = on_reading
        self.on_status = on_status
        self.baud_rate = baud_rate
        self.reconnect_delay = reconnect_delay
        self._running = True

    def listen_for_stop(self) -> None:
        """Accept a stop command from the Electron parent process."""
        try:
            for command in sys.stdin:
                if command.strip().lower() in {"stop", "quit", "exit"}:
                    self.stop()
                    return
        except (OSError, ValueError):
            self.stop()

    def stop(self) -> None:
        """Request that the read loop stop after its current operation."""
        self._running = False

    def run(self) -> None:
        """Open the port, read forever, and retry until stopped with Ctrl+C."""
        while self._running:
            connection: Optional[serial.Serial] = None
            try:
                print(f"Connecting to {self.port} at {self.baud_rate} baud...")
                connection = serial.Serial(self.port, self.baud_rate, timeout=1)
                print(f"Connected to {self.port}. Waiting for posture readings...")
                if self.on_status:
                    self.on_status("connected", None)

                while self._running:
                    raw_line = connection.readline()
                    if not raw_line:
                        continue
                    try:
                        line = raw_line.decode("utf-8", errors="replace")
                        reading = parse_reading(line)
                    except ValueError as exc:
                        print(f"Ignoring malformed line: {exc}: {raw_line!r}")
                        continue
                    self.on_reading(reading)
            except (serial.SerialException, OSError) as exc:
                if self._running:
                    if self.on_status:
                        self.on_status("disconnected", str(exc))
                    print(f"Serial connection lost ({exc}). Retrying in {self.reconnect_delay:g}s...")
                    time.sleep(self.reconnect_delay)
            finally:
                if connection is not None and connection.is_open:
                    connection.close()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Read ESP8266 posture CSV data over serial.")
    parser.add_argument(
        "port",
        nargs="?",
        help="serial port, for example COM5 or /dev/ttyUSB0; omit to choose interactively",
    )
    parser.add_argument(
        "--port",
        dest="port_option",
        help="serial port (alternative to the positional port argument)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="emit JSON events for integration with another process",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="print detected serial ports as a JSON array and exit",
    )
    return parser


def main() -> None:
    reader: Optional[SerialPostureReader] = None
    try:
        args = build_parser().parse_args()
        if args.port and args.port_option and args.port != args.port_option:
            raise SystemExit("Specify the port either positionally or with --port, not both.")
        if args.list:
            print(json.dumps(list(available_ports())), flush=True)
            return
        port = args.port_option or args.port or choose_port()
        reader = SerialPostureReader(
            port=port,
            on_reading=emit_json_reading if args.json else print_reading,
            on_status=emit_json_status if args.json else None,
        )
        if args.json:
            threading.Thread(target=reader.listen_for_stop, daemon=True).start()
        reader.run()
    except KeyboardInterrupt:
        print("\nStopping serial reader...")
        if reader is not None:
            reader.stop()


if __name__ == "__main__":
    main()
