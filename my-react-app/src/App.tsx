import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import treeModel from './assets/tree_elm.glb?url'
import treeModelIOS from './assets/tree_elm.usdz?url'
import shrubModel from './assets/treeShrub.glb?url'

function App() {

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
    <model-viewer src={shrubModel} ios-src={treeModelIOS} ar ar-modes="webxr scene-viewer quick-look" camera-controls tone-mapping="neutral" poster="poster.webp" shadow-intensity="1"
     style={{ width: '100%', height: '100%' }}>
    
</model-viewer>

<div style={{
    position: 'absolute',
    bottom: '10%',
    left: '50%',
    transform: 'translate(-50%, 50%)',
    color: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: '10px',
    borderRadius: '5px',
    fontSize: '1.5rem',
  }}>
    Elm Tree
  </div>

        
    </div>
  )
}

export default App
