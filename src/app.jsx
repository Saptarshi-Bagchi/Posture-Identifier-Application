import { useEffect, useState } from 'react'
import DashboardPage from './components/tabs/Dashboard/Page'
import LiveMonitoringPage from './components/tabs/LiveMonitoring/Page'
import LaptopControlPage from './components/tabs/LaptopControl/Page'
import AnalyticsPage from './components/tabs/Analytics/Page'
import AlertsPage from './components/tabs/Alerts/Page'
import DeviceSettingsPage from './components/tabs/DeviceSettings/Page'
import PostureAlmanacPage from './components/tabs/PostureAlmanac/Page'
import LoginPage from './components/posturesync/LoginPage'
import Sidebar from './components/dashboard/Sidebar'
import TopBar from './components/dashboard/TopBar'
import { Icon } from './components/dashboard/Icon'
import { postureGuardMockData } from './components/posturesync/data'
import ErrorBoundary from './components/posturesync/ErrorBoundary'

const pages = {
  Dashboard: DashboardPage,
  'Live Monitoring': LiveMonitoringPage,
  'Laptop Control': LaptopControlPage,
  Analytics: AnalyticsPage,
  Alerts: AlertsPage,
  'Device & Settings': DeviceSettingsPage,
  'Posture Almanac': PostureAlmanacPage,
}

function TrayPopup() {
  const [monitoring, setMonitoring] = useState(true)
  const electronAPI = window.electronAPI
  useEffect(() => { let unsubscribe; electronAPI?.getMonitoringState().then(setMonitoring); unsubscribe = electronAPI?.onMonitoringStateChanged(setMonitoring); return () => unsubscribe?.() }, [electronAPI])
  async function toggleMonitoring() { if (electronAPI) { setMonitoring(await electronAPI.toggleMonitoring()); return } setMonitoring((value) => !value) }
  return <div className="min-h-screen bg-[#051f20] p-4 text-[#daf1de]"><div className="rounded-2xl border border-[#235347] bg-[#0b2b26] p-5 shadow-xl"><div className="flex items-center justify-between"><p className="text-sm font-bold">Posture<span className="text-[#8eb69b]">Guard</span></p><span className="text-[10px] font-bold text-emerald-300">{monitoring ? 'MONITORING' : 'PAUSED'}</span></div><div className="mt-5 rounded-xl bg-[#163832] p-5 text-center"><Icon name="check" size={30} /><p className="mt-2 text-sm font-bold">Excellent posture</p><p className="mt-1 text-xs text-[#8eb69b]">Score {postureGuardMockData.today.score}/100</p></div><button type="button" onClick={toggleMonitoring} className="mt-5 w-full rounded-xl border border-[#235347] px-3 py-2 text-xs font-bold">{monitoring ? 'Pause monitoring' : 'Resume monitoring'}</button><button type="button" onClick={() => electronAPI?.openDashboard()} className="mt-4 w-full text-xs font-bold text-[#8eb69b]">Open dashboard →</button></div></div>
}

function AppShell() {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [darkMode, setDarkMode] = useState(true)
  const Page = pages[activeTab]
  const pageTitle = activeTab === 'Dashboard' ? 'Good morning, Alex' : activeTab
  const themeClass = darkMode ? 'bg-brand-navy text-slate-100' : 'bg-slate-100 text-slate-900'
  return <div className={`min-h-screen ${themeClass} ${darkMode ? 'theme-dark' : 'theme-light'}`}><Sidebar device={postureGuardMockData.device} activeTab={activeTab} onNavigate={setActiveTab} /><main className="min-h-screen lg:ml-60"><div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8"><TopBar title={pageTitle} darkMode={darkMode} onThemeChange={setDarkMode} device={postureGuardMockData.device} /><div className="mt-6"><ErrorBoundary key={activeTab}><Page data={postureGuardMockData} onNavigate={setActiveTab} darkMode={darkMode} onThemeChange={setDarkMode} /></ErrorBoundary></div></div></main></div>
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(false)
  if (new URLSearchParams(window.location.search).get('view') === 'tray') return <TrayPopup />
  return authenticated ? <AppShell /> : <LoginPage onLogin={() => setAuthenticated(true)} />
}
