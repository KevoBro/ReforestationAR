import { useEffect, useState  } from "react";
import { Context } from "@needle-tools/engine";
import { NeedleXRSession } from "@needle-tools/engine";
import "./App.css";
import "./ar/TreePlacement"; // Import the AR placement logic
import { createFallbackNeedleContext, initializeNeedleScene, startNeedleARSession } from "./ar/needleScene";

  import treeElmGLB from "./assets/tree_elm.glb?url";
  import treeElmUSDZ from "./assets/tree_elm.usdz?url";
  import shrubGLB from "./assets/treeShrub.glb?url";
  import shrubUSDZ from "./assets/treeShrub.usdz?url";

  type TreeModel = {
    id: string;
    name: string;
    glb: string;
    usdz: string;
  };

  type TreePlacementDebug = {
    status: string;
    selectedUrl: string;
    ghostReady: boolean;
    ghostVisible: boolean;
    canPlace: boolean;
    mode: "hit" | "fallback" | "none";
    message: string;
  };

  const MODELS: TreeModel[] = [
    { id: "elm", name: "Elm Tree", glb: treeElmGLB, usdz: treeElmUSDZ },
    { id: "shrub", name: "Shrub", glb: shrubGLB, usdz: shrubUSDZ },
  ];

  export default function App() {
    const [index, setIndex] = useState(0);
    const [arSupported, setArSupported] = useState<boolean | null>(null);
    const [appClipUrl, setAppClipUrl] = useState<string>("");
    const [debug, setDebug] = useState<TreePlacementDebug>({
      status: "idle",
      selectedUrl: "",
      ghostReady: false,
      ghostVisible: false,
      canPlace: false,
      mode: "none",
      message: "Waiting for TreePlacement startup..."
    });
    const [debugHistory, setDebugHistory] = useState<string[]>([]);

    const current = MODELS[index];

    useEffect(() => {
      const checkSupport = async () => {
        try {
          const canAR = await NeedleXRSession.isARSupported();
          setArSupported(!!canAR);
        } catch {
          setArSupported(false);
        }
      };
      checkSupport();
    }, []);

    useEffect(() => {
      const url = window.location.href;
      const encoded = encodeURIComponent(url);
      setAppClipUrl(`https://appclip.needle.tools/ar?url=${encoded}`);
    }, []);

    useEffect(() => {
      (window as unknown as { __selectedTreeUrl?: string }).__selectedTreeUrl = current.glb;
      window.dispatchEvent(new CustomEvent("select-tree", { detail: current.glb }));
    }, [current.glb]);

    useEffect(() => {
      const onDebug = (event: Event) => {
        const detail = (event as CustomEvent<Partial<TreePlacementDebug>>).detail ?? {};
        setDebug((prev) => ({
          ...prev,
          ...detail
        }));
        const line = [
          detail.status ?? "update",
          detail.mode ? `mode=${detail.mode}` : "",
          detail.message ?? ""
        ].filter(Boolean).join(" | ");
        setDebugHistory((prev) => [line, ...prev].slice(0, 8));
      };

      window.addEventListener("tree-placement-debug", onDebug as EventListener);
      return () => {
        window.removeEventListener("tree-placement-debug", onDebug as EventListener);
      };
    }, []);

    useEffect(() => {
      let cancelled = false;

      const boot = async () => {
        await customElements.whenDefined("needle-engine");
        const host = document.getElementById("ar-container") as (HTMLElement & {
          getContext?: () => Promise<unknown>;
        }) | null;

        if (!host) {
          window.dispatchEvent(new CustomEvent("tree-placement-debug", {
            detail: {
              status: "error",
              message: "AR container host element was not found."
            }
          }));
          return;
        }

        if (!host.getContext) {
          window.dispatchEvent(new CustomEvent("tree-placement-debug", {
            detail: {
              status: "init",
              message: "needle-engine host does not expose getContext(). Falling back to manual Context."
            }
          }));

          try {
            const context = await createFallbackNeedleContext(host);
            if (cancelled) return;
            initializeNeedleScene(context);
          } catch (error) {
            console.warn("Failed to create fallback Needle context", error);
            window.dispatchEvent(new CustomEvent("tree-placement-debug", {
              detail: {
                status: "error",
                message: "Failed to create fallback Needle context."
              }
            }));
          }
          return;
        }

        try {
          const context = await host.getContext();
          if (cancelled) return;
          initializeNeedleScene(context as Context);
        } catch (error) {
          console.warn("Failed to boot Needle scene", error);
          window.dispatchEvent(new CustomEvent("tree-placement-debug", {
            detail: {
              status: "error",
              message: "Failed to boot Needle scene context."
            }
          }));
        }
      };

      void boot();

      return () => {
        cancelled = true;
      };
    }, []);

    const nextModel = () => setIndex((i) => (i + 1) % MODELS.length);
    const prevModel = () => setIndex((i) => (i - 1 + MODELS.length) % MODELS.length);

    const openMarkerFallback = () => {
      window.location.href = `/marker-ar.html?model=${current.id}`;
    };

    const confirmPlacement = () => {
      window.dispatchEvent(new CustomEvent("confirm-placement"));
    };

  return (
    <div className="app-root">
      <needle-engine id="ar-container" className="ar-container" src="[]" keep-alive="true" camera-controls="false">
        <div className="ui-overlay">
          <div className="debug-panel">
            <div className="debug-line"><strong>Status:</strong> {debug.status}</div>
            <div className="debug-line"><strong>Mode:</strong> {debug.mode}</div>
            <div className="debug-line"><strong>Ghost:</strong> {debug.ghostReady ? "ready" : "not-ready"} / {debug.ghostVisible ? "visible" : "hidden"}</div>
            <div className="debug-line"><strong>Can Place:</strong> {debug.canPlace ? "yes" : "no"}</div>
            <div className="debug-line"><strong>Model:</strong> {current.id} ({current.name})</div>
            <div className="debug-line"><strong>URL:</strong> {debug.selectedUrl || current.glb}</div>
            <div className="debug-line"><strong>Note:</strong> {debug.message}</div>
            <div className="debug-history">
              {debugHistory.map((entry, index) => (
                <div className="debug-line" key={`${entry}-${index}`}>{entry}</div>
              ))}
            </div>
          </div>

          <div className="model-controls">
            <button onClick={prevModel} aria-label="Previous tree">{"<"}</button>
            <div className="model-label">{current.name}</div>
            <button onClick={nextModel} aria-label="Next tree">{">"}</button>
          </div>

          <a className="app-clip-link" href={appClipUrl}>
            Open AR (App Clip)
          </a>

          <button onClick={confirmPlacement}>
            Place Tree
          </button>

          {arSupported === false && (
            <button onClick={openMarkerFallback}>
              Use Camera Marker AR Instead
            </button>
          )}

          <button onClick={()=>{
            startNeedleARSession();
          }}>
            Begin AR (WebXR)
          </button>
        </div>
      </needle-engine>
    </div>
  );

  }
