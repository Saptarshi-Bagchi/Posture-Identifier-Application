import { useEffect, useState } from 'react'
import DashboardPage from './components/tabs/Dashboard/Page'
import LiveMonitoringPage from './components/tabs/LiveMonitoring/Page'
import LiveDataPage from './components/tabs/LiveData/Page'
import AnalyticsPage from './components/tabs/Analytics/Page'
import AlertsPage from './components/tabs/Alerts/Page'
import DeviceSettingsPage from './components/tabs/DeviceSettings/Page'
import PostureAlmanacPage from './components/tabs/PostureAlmanac/Page'
import ConnectDevicePage from './components/tabs/ConnectDevice/Page'
import ProfilePage from './components/tabs/Profile/Page'
import LoginPage from './components/posturesync/LoginPage'
import Sidebar from './components/dashboard/Sidebar'
import TopBar from './components/dashboard/TopBar'
import { ispaData } from './components/posturesync/data'
import ErrorBoundary from './components/posturesync/ErrorBoundary'
import { usePostureTelemetry } from './hooks/usePostureTelemetry'

const pages = { Dashboard: DashboardPage, 'Connect ESP32': ConnectDevicePage, 'Live Monitoring': LiveMonitoringPage, 'Live Data': LiveDataPage, Analytics: AnalyticsPage, Alerts: AlertsPage, 'Device & Settings': DeviceSettingsPage, 'Posture Almanac': PostureAlmanacPage, Profile: ProfilePage }

function AppShell({ initialName = '' }) {
  const [profileName, setProfileName] = useState(initialName)
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [darkMode, setDarkMode] = useState(true)
  const { data: telemetryData, packet, status, displayPosture } = usePostureTelemetry(ispaData)
  const device = { ...telemetryData.device, connected: Boolean(packet), bluetooth: packet ? telemetryData.device.bluetooth : 'Waiting for telemetry' }
  const sessionData = { ...telemetryData, user: { ...telemetryData.user, name: profileName }, device }
  const Page = pages[activeTab]
  return <div className={`min-h-screen ${darkMode ? 'theme-dark' : 'theme-light'}`}><Sidebar device={device} activeTab={activeTab} onNavigate={setActiveTab} user={sessionData.user} /><main className="min-h-screen lg:ml-60"><div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8"><TopBar title={activeTab} darkMode={darkMode} onThemeChange={setDarkMode} /><div className="mt-6"><ErrorBoundary key={activeTab}><Page data={sessionData} device={device} telemetry={packet} telemetryStatus={status} detectedPosture={displayPosture} onNavigate={setActiveTab} onProfileNameChange={setProfileName} darkMode={darkMode} onThemeChange={setDarkMode} /></ErrorBoundary></div></div></main></div>
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [profileName, setProfileName] = useState('')
  useEffect(() => { if (new URLSearchParams(window.location.search).get('view') === 'tray') window.electronAPI?.openDashboard?.() }, [])
  return authenticated ? <AppShell initialName={profileName} /> : <LoginPage onLogin={(name) => { setProfileName(name); setAuthenticated(true) }} />
}
