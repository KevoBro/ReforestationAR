import { useEffect, useState } from "react";
import "./App.css";
import "./ar/TreePlacement"; // Import the AR placement logic
import "./ar/ARScene"; // Import the AR scene setup

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

const MODELS: TreeModel[] = [
  { id: "elm", name: "Elm Tree", glb: treeElmGLB, usdz: treeElmUSDZ },
  { id: "shrub", name: "Shrub", glb: shrubGLB, usdz: shrubUSDZ },
];

export default function App() {
  const [index, setIndex] = useState(0);
  const [arSupported, setArSupported] = useState<boolean | null>(null);

  const current = MODELS[index];

  useEffect(() => {
    const checkSupport = async () => {
      const xr = navigator.xr;
      if (!xr) {
        setArSupported(false);
        return;
      }
      try {
        const canAR = await xr.isSessionSupported("immersive-ar");
        setArSupported(!!canAR);
      } catch {
        setArSupported(false);
      }
    };
    checkSupport();
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("select-tree", { detail: current.glb }));
  }, [current.glb]);

  const nextModel = () => setIndex((i) => (i + 1) % MODELS.length);
  const prevModel = () => setIndex((i) => (i - 1 + MODELS.length) % MODELS.length);

  const openMarkerFallback = () => {
    window.location.href = `/marker-ar.html?model=${current.id}`;
  };

  const confirmPlacement = () => {
    window.dispatchEvent(new CustomEvent("confirm-placement"));
  };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1em" }}>
        <div className="model-label">{current.name}</div>

        <div className="model-controls">
          <button onClick={prevModel}>{"<"}</button>
          <button onClick={nextModel}>{">"}</button>
        </div>

        <div className="model-controls">
          <button onClick={confirmPlacement}>Place Tree</button>
        </div>
      </div>

      {arSupported === false && (
        <button className="fallback-btn" onClick={openMarkerFallback}>
          Use Camera Marker AR Instead
        </button>
      )}

      <div className="ar-session">
          <button onClick={confirmPlacement}>Begin AR</button>
        </div>

    </div>
  );
}
