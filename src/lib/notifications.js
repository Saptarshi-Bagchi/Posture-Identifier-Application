const WEB_NOTIFICATION_EVENT = 'ispa-web-notification'

export const isElectron = () => typeof window !== 'undefined' && Boolean(window.electronAPI)

export async function requestNotificationPermission() {
  if (isElectron()) return true
  if (typeof window === 'undefined' || !window.isSecureContext) return false
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'default') await Notification.requestPermission()
  return Notification.permission === 'granted'
}

export async function sendNotification(title, body, type = 'break-reminder') {
  if (isElectron()) return window.electronAPI.sendNotification?.({ title, body, type })
  const entry = { type, title, body, timestamp: Date.now() }
  if (typeof Notification !== 'undefined' && window.isSecureContext && Notification.permission === 'granted') new Notification(title, { body, tag: `ispa-${type}` })
  window.dispatchEvent(new CustomEvent(WEB_NOTIFICATION_EVENT, { detail: entry }))
  return { ok: true, native: typeof Notification !== 'undefined' && Notification.permission === 'granted' }
}

export function subscribeToWebNotifications(callback) {
  if (typeof window === 'undefined') return () => {}
  const listener = (event) => callback(event.detail)
  window.addEventListener(WEB_NOTIFICATION_EVENT, listener)
  return () => window.removeEventListener(WEB_NOTIFICATION_EVENT, listener)
}
