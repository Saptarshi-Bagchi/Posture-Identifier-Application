// ------------------------- IMPORTS -------------------------
import { useEffect, useMemo, useState } from 'react'
import { classifySensorPosture } from '../lib/postureDetection'
import { isElectron, sendNotification } from '../lib/notifications'

// ------------------------- DEVICE CONNECTION -------------------------
const BAUD_RATE = 115200
export const UNSUPPORTED_SERIAL_MESSAGE = 'Serial device connection requires a Chromium-based browser (Chrome/Edge) or the desktop app.'

function parseSerialReading(line) {
  const fields = line.trim().split(',').map((field) => field.trim())
  if (fields.length !== 5) return null
  const [lumbarX, lumbarY, neckX, neckY, binary] = fields.map(Number)
  if (![lumbarX, lumbarY, neckX, neckY].every(Number.isFinite) || ![0, 1].includes(binary)) return null
  return { neckX, neckY, lumbarX, lumbarY, binary, received_at: Date.now() }
}

const webSerial = {
  port: null,
  reader: null,
  reading: false,
  buffer: '',
  status: { state: 'disconnected', listening: false, connected: false, port: '', error: null },
  dataSubscribers: new Set(),
  statusSubscribers: new Set(),
  setStatus(next) {
    this.status = { ...this.status, ...next }
    this.statusSubscribers.forEach((subscriber) => subscriber(this.status))
  },
  async readLoop() {
    while (this.port?.readable && this.reading) {
      this.reader = this.port.readable.getReader()
      const decoder = new TextDecoder()
      try {
        while (this.reading) {
          const { value, done } = await this.reader.read()
          if (done) break
          this.buffer += decoder.decode(value, { stream: true })
          const lines = this.buffer.split(/\r?\n/)
          this.buffer = lines.pop() || ''
          lines.map(parseSerialReading).filter(Boolean).forEach((reading) => this.dataSubscribers.forEach((subscriber) => subscriber(reading)))
        }
      } catch (error) {
        if (this.reading) this.setStatus({ state: 'error', listening: false, connected: false, error: error.message })
      } finally {
        this.reader.releaseLock()
        this.reader = null
      }
    }
  },
  async connect() {
    if (!navigator.serial) return { ok: false, error: UNSUPPORTED_SERIAL_MESSAGE }
    if (this.port) await this.disconnect()
    try {
      this.port = await navigator.serial.requestPort()
      await this.port.open({ baudRate: BAUD_RATE })
      this.reading = true
      this.setStatus({ state: 'connected', listening: true, connected: true, port: 'Web Serial device', error: null })
      this.readLoop()
      return { ok: true }
    } catch (error) {
      this.port = null
      this.setStatus({ state: 'error', listening: false, connected: false, error: error.message || 'Unable to open the serial device.' })
      return { ok: false, error: error.message || 'Unable to open the serial device.' }
    }
  },
  async disconnect() {
    this.reading = false
    await this.reader?.cancel().catch(() => {})
    if (this.port?.opened) await this.port.close().catch(() => {})
    this.port = null
    this.buffer = ''
    this.setStatus({ state: 'disconnected', listening: false, connected: false, port: '', error: null })
  },
}

export function getDeviceConnection() {
  if (window.electronAPI) {
    const api = window.electronAPI
    return {
      getStatus: () => api.getTelemetryStatus?.() || Promise.resolve({ state: 'disconnected', listening: false, connected: false }),
      listPorts: () => api.listSerialPorts?.() || Promise.resolve({ ports: [], error: 'Desktop serial APIs are unavailable.' }),
      connect: (port) => api.configureSerial?.({ port }) || Promise.resolve({ ok: false, error: 'Desktop serial APIs are unavailable.' }),
      disconnect: () => api.disconnectSerial?.() || Promise.resolve(false),
      onData: (callback) => api.onPostureData?.(callback),
      onStatus: (callback) => api.onSerialStatus?.(callback),
      browser: false,
      supported: true,
    }
  }
  const supported = typeof navigator !== 'undefined' && 'serial' in navigator
  return {
    getStatus: () => Promise.resolve({ ...webSerial.status, error: supported ? webSerial.status.error : UNSUPPORTED_SERIAL_MESSAGE }),
    listPorts: () => Promise.resolve(supported ? { ports: webSerial.port ? ['Web Serial device'] : [] } : { ports: [], error: UNSUPPORTED_SERIAL_MESSAGE }),
    connect: () => webSerial.connect(),
    disconnect: () => webSerial.disconnect(),
    onData: (callback) => { webSerial.dataSubscribers.add(callback); return () => webSerial.dataSubscribers.delete(callback) },
    onStatus: (callback) => { webSerial.statusSubscribers.add(callback); return () => webSerial.statusSubscribers.delete(callback) },
    browser: true,
    supported,
  }
}

// ------------------------- TELEMETRY CONFIGURATION -------------------------
const axes = ['neck_x', 'neck_y', 'lumbar_x', 'lumbar_y']
export const MAX_HISTORY_POINTS = 80

// ------------------------- TELEMETRY HOOK -------------------------
export function usePostureTelemetry() {
  const [telemetry, setTelemetry] = useState(null)
  const [status, setStatus] = useState({ listening: false, port: '', error: null })
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (isElectron() || !status.connected) return undefined
    const phases = [
      [20 * 60 * 1000, 'sit-stand', 'Time to stand', 'You have been sitting for 20 minutes — stand up for a bit.'],
      [8 * 60 * 1000, 'stand-walk', 'Time to walk', 'You have been standing for 8 minutes — take a 2-minute walk.'],
      [2 * 60 * 1000, 'walk-sit', 'Time to sit', 'Your 2-minute walk is complete — settle back in with good posture.'],
    ]
    let phase = 0
    let timer
    const schedule = () => {
      const [delay, type, title, body] = phases[phase]
      timer = window.setTimeout(async () => {
        await sendNotification(title, body, type)
        phase = (phase + 1) % phases.length
        schedule()
      }, delay)
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [status.connected])

  useEffect(() => {
    const connection = getDeviceConnection()
    connection.getStatus().then(setStatus)
    const removeTelemetry = connection.onData((next) => {
      const values = [next?.neckX, next?.neckY, next?.lumbarX, next?.lumbarY]
      if (values.some((value) => !Number.isFinite(value))) return
      const telemetry = { neck_x: next.neckX, neck_y: next.neckY, lumbar_x: next.lumbarX, lumbar_y: next.lumbarY, good_posture: next.binary === 1, received_at: next.received_at || Date.now() }
      setTelemetry((previous) => ({ ...previous, ...telemetry }))
      const receivedAt = Date.now()
      const timestamp = telemetry.received_at || receivedAt
      const point = { time: new Date(timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }), timestamp, receivedAt, ...Object.fromEntries(axes.map((axis) => [axis, telemetry[axis]])) }
      setHistory((items) => [...items, point].slice(-MAX_HISTORY_POINTS))
    })
    const removeStatus = connection.onStatus((next) => {
      setStatus(next)
      if (next?.connected === false || next?.listening === false) {
        setTelemetry(null)
        setHistory([])
      }
    })
    return () => { removeTelemetry?.(); removeStatus?.() }
  }, [])

  const classification = useMemo(() => telemetry ? classifySensorPosture(telemetry) : null, [telemetry])
  const goodPosture = telemetry?.good_posture ?? (classification?.tone === 'good' ? true : classification?.tone === 'poor' ? false : null)
  return { telemetry, status, history, classification, goodPosture }
}
