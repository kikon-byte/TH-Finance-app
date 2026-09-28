import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { RegistersProvider } from './context/RegistersContext'
import { AccountingProvider } from './context/AccountingContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RegistersProvider>
      <AccountingProvider>
        <App />
      </AccountingProvider>
    </RegistersProvider>
  </React.StrictMode>,
)
