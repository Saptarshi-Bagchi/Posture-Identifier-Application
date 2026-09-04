// ------------------------- IMPORTS -------------------------
import { useEffect, useState } from 'react'
import LiveDataPage from './components/tabs/LiveData/Page'
import PostureAlmanacPage from './components/tabs/PostureAlmanac/Page'
import DeviceConnectionPage from './components/tabs/DeviceConnection/Page'
import SettingsPage from './components/tabs/Settings/Page'
import HomePage from './components/tabs/Home/Page'
import CalibratePage from './components/tabs/Calibrate/Page'
import Sidebar from './components/dashboard/Sidebar'
import { ispaData } from './components/posturesync/data'
import ErrorBoundary from './components/posturesync/ErrorBoundary'
import { usePostureTelemetry } from './hooks/usePostureTelemetry'

// ------------------------- PAGE CONFIGURATION -------------------------
const pages = { Home: HomePage, 'Live Posture': LiveDataPage, 'Device Connection': DeviceConnectionPage, 'Posture Almanac': PostureAlmanacPage, Settings: SettingsPage, Calibrate: CalibratePage }

// ------------------------- APPLICATION COMPONENT -------------------------
export default function App() {
  const [activeTab, setActiveTab] = useState('Home')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('ispa-theme') !== 'light')
  const { telemetry, status, history, classification, goodPosture } = usePostureTelemetry()
  const Page = pages[activeTab]
  useEffect(() => {
    localStorage.setItem('ispa-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])
  return <div className={`flex h-screen min-h-0 flex-col overflow-hidden transition-colors duration-300 ease-in-out ${darkMode ? 'theme-dark' : 'theme-light'}`}><Sidebar activeTab={activeTab} onNavigate={setActiveTab} serialStatus={status} darkMode={darkMode} onThemeChange={setDarkMode} /><main className="content-scale flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background px-4 pb-4 pt-4 transition-colors duration-300 ease-in-out sm:px-6 lg:px-10 lg:pb-6"><div className="tab-viewport mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col"><div className="min-h-0 flex-1 overflow-hidden"><ErrorBoundary key={activeTab}><Page data={ispaData} telemetry={telemetry} history={history} classification={classification} goodPosture={goodPosture} telemetryStatus={status} darkMode={darkMode} onNavigate={setActiveTab} /></ErrorBoundary></div></div></main></div>
}
