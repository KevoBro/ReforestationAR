import { createRoot } from 'react-dom/client'
import App from './App.tsx'

// This is the landing page entry point that lets users choose which AR mode to open.
createRoot(document.getElementById('root')!).render(
  <App />,
)
