import { useState } from 'react'
import LiveDataPage from './components/tabs/LiveData/Page'
import PostureAlmanacPage from './components/tabs/PostureAlmanac/Page'
import DeviceConnectionPage from './components/tabs/DeviceConnection/Page'
import Sidebar from './components/dashboard/Sidebar'
import TopBar from './components/dashboard/TopBar'
import { ispaData } from './components/posturesync/data'
import ErrorBoundary from './components/posturesync/ErrorBoundary'
import { usePostureTelemetry } from './hooks/usePostureTelemetry'

const pages = { 'Live Posture': LiveDataPage, 'Posture Almanac': PostureAlmanacPage, 'Device Connection': DeviceConnectionPage }

export default function App() {
  const [activeTab, setActiveTab] = useState('Live Posture')
  const [darkMode, setDarkMode] = useState(true)
  const { telemetry, status, history, classification, goodPosture } = usePostureTelemetry()
  const Page = pages[activeTab]
  return <div className={`min-h-screen pb-20 lg:pb-0 ${darkMode ? 'theme-dark' : 'theme-light'}`}><Sidebar activeTab={activeTab} onNavigate={setActiveTab} connected={status.listening} /><main className="min-h-screen px-5 py-6 sm:px-8 lg:ml-60 lg:px-10"><div className="mx-auto max-w-6xl"><TopBar title={activeTab} darkMode={darkMode} onThemeChange={setDarkMode} /><div className="mt-6"><ErrorBoundary key={activeTab}><Page data={ispaData} telemetry={telemetry} telemetryStatus={status} history={history} classification={classification} goodPosture={goodPosture} /></ErrorBoundary></div></div></main></div>
}
