// ------------------------- IMPORTS -------------------------
import { Component } from 'react'

// ------------------------- ERROR BOUNDARY -------------------------
export default class ErrorBoundary extends Component {
  state = { hasError: false, message: '' }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown renderer error' }
  }

  componentDidCatch(error, info) {
    console.error('ISPA tab error', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return <section className="rounded-2xl border border-red-400/40 bg-red-400/10 p-6 text-red-100"><p className="text-xs font-bold uppercase tracking-wider text-red-300">Tab failed to render</p><h2 className="mt-2 text-xl font-bold">ISPA encountered a renderer error.</h2><p className="mt-2 text-sm text-red-200">{this.state.message}</p><button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-red-400 px-4 py-2.5 text-xs font-bold text-slate-950">Reload app</button></section>
  }
}
