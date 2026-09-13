// ------------------------- IMPORTS -------------------------
import { useEffect, useMemo, useState } from 'react'
import { card } from '../../posturesync/Shared'
import { getDeviceConnection, UNSUPPORTED_SERIAL_MESSAGE } from '../../../hooks/usePostureTelemetry'

// ------------------------- STORAGE CONFIGURATION -------------------------
const storageKey = 'ispa-serial-settings'

// ------------------------- DEVICE CONNECTION PAGE -------------------------
export default function DeviceConnectionPage({ telemetryStatus }) {
  const connection = useMemo(() => getDeviceConnection(), [])
  const browserMode = connection.browser
  const [port, setPort] = useState(() => JSON.parse(localStorage.getItem(storageKey) || '{}').port || '')
  const [ports, setPorts] = useState([])
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [testing, setTesting] = useState(false)
  const [actionError, setActionError] = useState('')

  const refreshPorts = async () => {
    const result = await connection.listPorts()
    if (result?.error) setActionError(result.error)
    setPorts(result?.ports || [])
    return result?.ports || []
  }

  useEffect(() => { refreshPorts() }, [])
  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify({ port })) }, [port])
  useEffect(() => {
    if (telemetryStatus?.connected === false || telemetryStatus?.listening === false) {
      setDisconnecting(false)
      setPort('')
      setPorts([])
      refreshPorts()
    }
  }, [telemetryStatus?.connected, telemetryStatus?.listening])

  const connect = async () => {
    setConnecting(true); setActionError('')
    let result
    if (browserMode) {
      result = await connection.connect()
    } else {
      const available = await refreshPorts()
      if (!port || !available.includes(port)) {
        setActionError('Select an available serial port before connecting.')
        setConnecting(false)
        return
      }
      result = await connection.connect(port)
    }
    if (!result?.ok) setActionError(result?.error || 'Unable to start the serial reader.')
    setConnecting(false)
  }

  const disconnect = async () => {
    setDisconnecting(true); setActionError('')
    await connection.disconnect()
    window.setTimeout(() => setDisconnecting(false), 3500)
  }

  const testNotification = async () => {
    setTesting(true); setActionError('')
    const result = await window.electronAPI?.testNotification?.()
    if (!result?.ok) setActionError(result?.error || 'Unable to show a native notification.')
    setTesting(false)
  }

  const connected = telemetryStatus?.connected ?? telemetryStatus?.listening === true
  const state = disconnecting ? 'Disconnecting' : connecting ? 'Connecting' : telemetryStatus?.error ? 'Error' : connected ? 'Connected' : 'Disconnected'
  const stateClass = state === 'Connected' ? 'text-emerald-300 bg-emerald-400/10' : state === 'Error' ? 'text-red-300 bg-red-400/10' : 'text-amber-300 bg-amber-300/10'

  return (
    <div className="tab-scroll mx-auto flex h-full min-h-0 max-w-2xl flex-col items-center justify-start overflow-y-auto">
      <div className="relative w-full">
        <div className="connection-heading flex-none">
          <p className="text-xs font-bold uppercase tracking-wider text-mauve">Serial Device Connection</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-navy">Connect your device</h1>
        </div>

        <section className={`${card} connection-card mt-4 w-full`}>
          <div className="flex items-start justify-between gap-4">
            <p className="min-w-0 text-sm text-slate">Connect directly to ESP over USB</p>
            <div className="flex shrink-0 items-center gap-2 text-sm font-semibold">
              <span className="text-slate">Connection status</span>
              <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${stateClass}`}>{state}</span>
            </div>
          </div>

          {(actionError || telemetryStatus?.error || (!connection.supported && UNSUPPORTED_SERIAL_MESSAGE)) && <p className="mb-5 rounded-xl bg-red-400/10 px-3 py-2 text-sm text-red-300">{actionError || telemetryStatus?.error || UNSUPPORTED_SERIAL_MESSAGE}</p>}

          <label className="mt-5 block text-xs font-semibold text-slate-400">
            Serial port
            <select value={port} onChange={(event) => setPort(event.target.value)} disabled={browserMode || connecting || disconnecting || testing} className="mt-2 w-full rounded-2xl border border-slate/30 bg-offwhite px-3 py-2.5 text-sm text-navy outline-none focus:border-mauve disabled:cursor-not-allowed disabled:opacity-70">
              <option value="">{browserMode ? 'Web Serial uses Browser Picker for Port Selection' : 'Select an available port'}</option>
              {ports.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <div className="mt-5 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            <button type="button" onClick={connect} disabled={!connection.supported || connecting || disconnecting || testing || connected} className="w-full bg-mauve px-5 py-3 text-sm font-bold text-offwhite transition hover:bg-navy disabled:opacity-50">{connecting ? 'Connecting…' : browserMode ? 'Choose & Connect' : 'Connect'}</button>
            <button type="button" onClick={disconnect} disabled={disconnecting || testing || !connected} className="w-full border border-mauve px-5 py-3 text-sm font-bold text-mauve transition hover:bg-mauve hover:text-offwhite disabled:opacity-50">{disconnecting ? 'Disconnecting…' : 'Disconnect'}</button>
            <button type="button" onClick={refreshPorts} disabled={!connection.supported || connecting || disconnecting || testing} className="w-full border border-slate/50 px-5 py-3 text-sm font-bold text-slate transition hover:bg-slate hover:text-offwhite disabled:opacity-50">{browserMode ? 'Refresh device' : 'Refresh ports'}</button>
          </div>
        </section>
      </div>
    </div>
  )
}
