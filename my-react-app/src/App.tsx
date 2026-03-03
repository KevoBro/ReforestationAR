import { useEffect, useRef, useState } from 'react'
import './App.css'
import { NeedleEngine } from '@needle-tools/engine';
import * as THREE from 'three';

// 3D models (standard AR)
import treeElmGLB from './assets/tree_elm.glb?url'
import treeElmUSDZ from './assets/tree_elm.usdz?url'
import shrubGLB from './assets/treeShrub.glb?url'
import shrubUSDZ from './assets/treeShrub.usdz?url'

// Marker AR page (served separately)
// public/marker-ar.html will be opened when fallback is needed

// Register model-viewer web component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any
    }
  }
}

type TreeModel = {
  id: string
  name: string
  glb: string
  usdz: string
}

const MODELS: TreeModel[] = [
  { id: 'elm', name: 'Elm Tree', glb: treeElmGLB, usdz: treeElmUSDZ },
  { id: 'shrub', name: 'Shrub', glb: shrubGLB, usdz: shrubUSDZ },
]

export default function App() {
  const viewerRef = useRef<any>(null)
  const [index, setIndex] = useState(0)
  const [arSupported, setArSupported] = useState<boolean | null>(null)

  const current = MODELS[index]

  // Detect AR support (Quick Look / Scene Viewer / WebXR)
  useEffect(() => {
    const checkSupport = async () => {
      if (!viewerRef.current) return
      try {
        const canAR = await viewerRef.current.canActivateAR
        setArSupported(!!canAR)
      } catch {
        setArSupported(false)
      }
    }
    checkSupport()
  }, [])

  const nextModel = () => setIndex((i) => (i + 1) % MODELS.length)
  const prevModel = () => setIndex((i) => (i - 1 + MODELS.length) % MODELS.length)

  // Marker fallback (opens separate AR.js page)
  const openMarkerFallback = () => {
  window.location.href = `/marker-ar.html?model=${current.id}`
}

  return (
    <div className="safe-area" style={{ width: '100dvw', height: '100dvh', overflow: 'hidden' }}>
      <model-viewer
        ref={viewerRef}
        src={current.glb}
        ios-src={current.usdz}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        tone-mapping="neutral"
        shadow-intensity="1"
        style={{ width: '90%', height: '80%' }}
      />
      


      <div >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
          {/* Model label */}
          <div className="model-label">
            {current.name}
          </div>

          {/* Toggle buttons */}
          <div className="model-controls">
            <button onClick={prevModel}>◀</button>
            <button onClick={nextModel}>▶</button>
          </div>
        </div>
        {/* Fallback marker AR button */}
        {arSupported === false && (
          
        <></>  
        )}
        <button className="fallback-btn" onClick={openMarkerFallback}>
            Use Camera Marker AR Instead
          </button>
      </div>

    </div>
  )
}
