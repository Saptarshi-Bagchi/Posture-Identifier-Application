import { useEffect, useRef, useState } from 'react'
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
  const tabContentRef = useRef(null)
  const { telemetry, status, history, classification, goodPosture } = usePostureTelemetry()
  const Page = pages[activeTab]
  useEffect(() => {
    if (tabContentRef.current) tabContentRef.current.scrollTop = 0
  }, [activeTab])
  const isScrollable = activeTab === 'Posture Almanac'
  return <div className={`flex h-screen overflow-hidden pb-20 transition-colors duration-300 ease-in-out lg:pb-0 ${darkMode ? 'theme-dark' : 'theme-light'}`}><Sidebar activeTab={activeTab} onNavigate={setActiveTab} serialStatus={status} /><main className="h-full min-w-0 flex-1 overflow-hidden px-5 py-6 transition-colors duration-300 ease-in-out sm:px-8 lg:px-10"><div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col"><TopBar title={activeTab} darkMode={darkMode} onThemeChange={setDarkMode} /><div ref={tabContentRef} className={`mt-6 min-h-0 flex-1 ${isScrollable ? 'almanac-scroll overflow-y-auto pr-2' : 'overflow-hidden'}`}><ErrorBoundary key={activeTab}><Page data={ispaData} telemetry={telemetry} history={history} classification={classification} goodPosture={goodPosture} telemetryStatus={status} /></ErrorBoundary></div></div></main></div>
}
