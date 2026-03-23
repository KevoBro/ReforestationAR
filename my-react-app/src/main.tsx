import "@needle-tools/engine"
import { createRoot } from 'react-dom/client'
import './index.css'
import './ar/needleScene'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <App />,
)
