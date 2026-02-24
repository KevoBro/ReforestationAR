import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { THREEx } from '@ar-js-org/ar.js-threejs'
import './App.css'

import treeElmGLB from './assets/tree_elm.glb?url'
import shrubGLB from './assets/treeShrub.glb?url'

type TreeModel = {
  name: string
  glb: string
}

const MODELS: TreeModel[] = [
  { name: 'Elm Tree', glb: treeElmGLB },
  { name: 'Shrub', glb: shrubGLB },
]

const CAMERA_PARAMS_URL = 'https://cdn.jsdelivr.net/npm/@ar-js-org/ar.js-threejs@0.3.2/data/camera_para.dat'
const MARKER_PATTERN_URL = 'https://cdn.jsdelivr.net/npm/@ar-js-org/ar.js-threejs@0.3.2/data/patt.hiro'

const disposeObject3D = (object: THREE.Object3D) => {
  object.traverse((child: THREE.Object3D) => {
    const mesh = child as THREE.Mesh
    if (!mesh.geometry) return
    mesh.geometry.dispose()

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material: THREE.Material) => material.dispose())
      return
    }

    mesh.material?.dispose()
  })
}

const applyModelTransform = (model: THREE.Object3D, totalScale: number) => {
  const centerX = Number(model.userData.centerX ?? 0)
  const centerZ = Number(model.userData.centerZ ?? 0)
  const minY = Number(model.userData.minY ?? 0)
  model.scale.setScalar(totalScale)
  model.position.set(-centerX * totalScale, -minY * totalScale, -centerZ * totalScale)
}

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const sourceElementRef = useRef<HTMLElement | null>(null)
  const markerRootRef = useRef<THREE.Group | null>(null)
  const currentModelRef = useRef<THREE.Object3D | null>(null)
  const loaderRef = useRef(new GLTFLoader())
  const loadRequestRef = useRef(0)

  const [index, setIndex] = useState(0)
  const [arError, setArError] = useState<string | null>(null)
  const [arReady, setArReady] = useState(false)
  const [cameraStarted, setCameraStarted] = useState(false)
  const [markerDetected, setMarkerDetected] = useState(false)
  const [scaleMultiplier, setScaleMultiplier] = useState(1)
  const markerVisibleRef = useRef(false)

  const current = MODELS[index]

  useEffect(() => {
    let stopped = false
    let rafId = 0
    let renderer: THREE.WebGLRenderer | null = null
    let resizeHandler: (() => void) | null = null
    let sourceElement: HTMLElement | null = null

    const initArScene = async () => {
      if (!mountRef.current) return

      try {
        if (!THREEx?.ArToolkitSource || !THREEx?.ArToolkitContext || !THREEx?.ArMarkerControls) {
          throw new Error('AR.js toolkit classes are unavailable.')
        }

        const scene = new THREE.Scene()
        const camera = new THREE.Camera()
        scene.add(camera)

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.setClearColor(0x000000, 0)
        mountRef.current.appendChild(renderer.domElement)

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.85)
        scene.add(ambientLight)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
        directionalLight.position.set(3, 5, 2)
        scene.add(directionalLight)

        const markerRoot = new THREE.Group()
        markerRootRef.current = markerRoot
        scene.add(markerRoot)

        const arSource = new THREEx.ArToolkitSource({
          sourceType: 'webcam',
          sourceWidth: window.innerWidth > window.innerHeight ? 640 : 480,
          sourceHeight: window.innerWidth > window.innerHeight ? 480 : 640,
        })
        const arContext = new THREEx.ArToolkitContext({
          cameraParametersUrl: CAMERA_PARAMS_URL,
          detectionMode: 'mono',
        })

        const onResize = () => {
          if (!renderer) return

          const viewportWidth = window.innerWidth
          const viewportHeight = window.innerHeight
          arSource.onResizeElement()

          if (sourceElement) {
            sourceElement.style.position = 'fixed'
            sourceElement.style.top = '0'
            sourceElement.style.left = '0'
            sourceElement.style.width = `${viewportWidth}px`
            sourceElement.style.height = `${viewportHeight}px`
            sourceElement.style.objectFit = 'cover'
            sourceElement.style.margin = '0'
            sourceElement.style.maxWidth = 'none'
            sourceElement.style.maxHeight = 'none'
            sourceElement.style.transform = 'none'
            sourceElement.style.zIndex = '0'
          }

          renderer.setSize(viewportWidth, viewportHeight, false)
          renderer.domElement.style.position = 'fixed'
          renderer.domElement.style.top = '0'
          renderer.domElement.style.left = '0'
          renderer.domElement.style.width = `${viewportWidth}px`
          renderer.domElement.style.height = `${viewportHeight}px`
          renderer.domElement.style.margin = '0'
          renderer.domElement.style.zIndex = '1'

          if (arContext.arController?.canvas) {
            const trackingCanvas = arContext.arController.canvas as HTMLElement
            trackingCanvas.style.position = 'fixed'
            trackingCanvas.style.top = '0'
            trackingCanvas.style.left = '0'
            trackingCanvas.style.width = `${viewportWidth}px`
            trackingCanvas.style.height = `${viewportHeight}px`
            trackingCanvas.style.opacity = '0'
            trackingCanvas.style.pointerEvents = 'none'
          }
        }

        arSource.init(
          () => {
            const createdSourceElement = arSource.domElement as HTMLElement
            sourceElement = createdSourceElement
            sourceElementRef.current = createdSourceElement
            createdSourceElement.classList.add('ar-video')
            createdSourceElement.setAttribute('autoplay', 'true')
            createdSourceElement.setAttribute('muted', 'true')
            createdSourceElement.setAttribute('playsinline', 'true')
            createdSourceElement.style.display = 'block'
            createdSourceElement.style.visibility = 'visible'
            createdSourceElement.style.opacity = '1'
            createdSourceElement.style.position = 'absolute'
            createdSourceElement.style.top = '0'
            createdSourceElement.style.left = '0'
            createdSourceElement.style.zIndex = '0'
            if (!mountRef.current?.contains(createdSourceElement)) {
              mountRef.current?.appendChild(createdSourceElement)
            }

            if (createdSourceElement instanceof HTMLVideoElement) {
              createdSourceElement.muted = true
              const tryPlay = () =>
                createdSourceElement
                  .play()
                  .then(() => {
                    setCameraStarted(true)
                    setArError(null)
                  })
                  .catch(() => {
                    setCameraStarted(false)
                  })
              createdSourceElement.addEventListener('loadeddata', tryPlay)
              tryPlay()
            }
            setTimeout(onResize, 300)
          },
          () => {
            setArError('Camera source failed to initialize.')
          },
        )
        resizeHandler = () => onResize()
        window.addEventListener('resize', resizeHandler)

        arContext.init(() => {
          camera.projectionMatrix.copy(arContext.getProjectionMatrix())
          if (arContext.arController) {
            arContext.arController.options.orientation =
              window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
          }
        })

        new THREEx.ArMarkerControls(arContext, markerRoot, {
          type: 'pattern',
          patternUrl: MARKER_PATTERN_URL,
        })

        setArReady(true)
        setArError(null)

        const render = () => {
          if (stopped || !renderer) return
          rafId = requestAnimationFrame(render)

          if (arSource.ready) {
            arContext.update(arSource.domElement)
          }
          const isVisible = Boolean(markerRoot.visible)
          if (markerVisibleRef.current !== isVisible) {
            markerVisibleRef.current = isVisible
            setMarkerDetected(isVisible)
          }
          renderer.render(scene, camera)
        }

        render()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to initialize AR camera.'
        setArError(message)
      }
    }

    initArScene()

    return () => {
      stopped = true
      setArReady(false)
      cancelAnimationFrame(rafId)
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler)
      }

      if (currentModelRef.current && markerRootRef.current) {
        markerRootRef.current.remove(currentModelRef.current)
        disposeObject3D(currentModelRef.current)
        currentModelRef.current = null
      }
      markerRootRef.current = null

      if (renderer) {
        renderer.dispose()
        renderer.domElement.remove()
      }
      if (sourceElement) {
        sourceElement.remove()
      }
      sourceElementRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!arReady || !markerRootRef.current) return

    const markerRoot = markerRootRef.current
    const requestId = ++loadRequestRef.current

    loaderRef.current.load(
      MODELS[index].glb,
      (gltf: { scene: THREE.Group }) => {
        if (!markerRootRef.current || requestId !== loadRequestRef.current) return

        if (currentModelRef.current) {
          markerRoot.remove(currentModelRef.current)
          disposeObject3D(currentModelRef.current)
        }

        const nextModel = gltf.scene
        const box = new THREE.Box3().setFromObject(nextModel)
        const size = new THREE.Vector3()
        const center = new THREE.Vector3()
        box.getSize(size)
        box.getCenter(center)

        const modelHeight = Math.max(size.y, 0.001)
        const targetHeight = 2.4
        const baseScale = targetHeight / modelHeight

        nextModel.userData.baseScale = baseScale
        nextModel.userData.centerX = center.x
        nextModel.userData.centerZ = center.z
        nextModel.userData.minY = box.min.y

        // Center model on marker and lift it so the base rests on marker plane.
        applyModelTransform(nextModel, baseScale * scaleMultiplier)
        nextModel.rotation.set(0, 0, 0)

        markerRoot.add(nextModel)
        currentModelRef.current = nextModel
      },
      undefined,
      () => {
        setArError(`Unable to load model: ${MODELS[index].name}`)
      },
    )
  }, [index, arReady, scaleMultiplier])

  useEffect(() => {
    const model = currentModelRef.current
    if (!model) return
    const baseScale = Number(model.userData.baseScale ?? 1)
    applyModelTransform(model, baseScale * scaleMultiplier)
  }, [scaleMultiplier])

  const nextModel = () => setIndex((i) => (i + 1) % MODELS.length)
  const prevModel = () => setIndex((i) => (i - 1 + MODELS.length) % MODELS.length)
  const startCamera = async () => {
    const sourceElement = sourceElementRef.current
    if (!(sourceElement instanceof HTMLVideoElement)) return
    try {
      await sourceElement.play()
      setCameraStarted(true)
      setArError(null)
    } catch {
      setArError('Tap Start Camera and allow camera access in Safari.')
    }
  }

  return (
    <div className="ar-app">
      <div ref={mountRef} className="ar-canvas" />

      <div className="overlay-panel safe-area">
        {!cameraStarted && (
          <button type="button" onClick={startCamera}>
            Start Camera
          </button>
        )}
        <div className="model-label">{current.name}</div>
        <div className="model-controls">
          <button type="button" onClick={prevModel}>
            ◀
          </button>
          <button type="button" onClick={nextModel}>
            ▶
          </button>
        </div>
        <div className="scale-control">
          <label htmlFor="scale-slider">Size: {scaleMultiplier.toFixed(1)}x</label>
          <input
            id="scale-slider"
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={scaleMultiplier}
            onChange={(event) => setScaleMultiplier(Number(event.target.value))}
          />
        </div>
        <p className="status-text">{markerDetected ? 'Marker detected' : 'Point camera at Hiro marker'}</p>
        {arError && <p className="status-text">AR unavailable: {arError}</p>}
      </div>
    </div>
  )
}
