# I-SPA serial reader

Install the Python dependency:

```powershell
python -m pip install -r backend/requirements.txt
```

Run the reader without a port to list available devices and choose one:

```powershell
python backend/serial_reader.py
```

Or provide a port directly:

```powershell
python backend/serial_reader.py --port COM5
```

The reader expects newline-terminated CSV at 115200 baud:

```text
kalAngle0,kalAngle1,kalAngle2,kalAngle3,binary
```
