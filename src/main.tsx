import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './app/AuthProvider'
import { ToastProvider } from './shared/ui/Toast'
import { isFirebaseConfigured } from './shared/firebase/firebase'
import SetupScreen from './app/SetupScreen'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isFirebaseConfigured ? (
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    ) : (
      <SetupScreen />
    )}
  </StrictMode>,
)
