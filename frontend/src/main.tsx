import React, { Component, type ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[CRITICAL UI ERROR]', error, errorInfo)
  }

  handleReset = () => {
    localStorage.removeItem('farmassist_user')
    localStorage.removeItem('farmassist_token')
    localStorage.removeItem('farmassist_role')
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6f4ee', fontFamily: 'Inter, sans-serif', padding: '24px', textAlign: 'center' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', maxWidth: '440px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e3ded5' }}>
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>🌾</div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f4d2f', marginBottom: '8px' }}>FarmAssist AI</h2>
            <p style={{ fontSize: '13px', color: '#68776b', marginBottom: '24px', lineHeight: '1.5' }}>
              A UI rendering issue occurred. Click the button below to safely reload the application.
            </p>
            <button
              onClick={this.handleReset}
              style={{ width: '100%', padding: '12px', backgroundColor: '#1f4d2f', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
            >
              🔄 Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

