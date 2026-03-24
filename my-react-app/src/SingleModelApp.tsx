import { useState } from "react";
import "./page-shell.css";

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

export default function SingleModelApp() {
  const [index, setIndex] = useState(0);
  const current = MODELS[index];

  const nextModel = () => setIndex((value) => (value + 1) % MODELS.length);
  const previousModel = () => setIndex((value) => (value - 1 + MODELS.length) % MODELS.length);

  return (
    <div className="page-shell">
      <div className="page-panel page-panel--wide">
        <a className="back-link" href="./index.html">
          Back To Mode Selector
        </a>

        <div className="page-intro">
          <div className="page-eyebrow">Single Model AR</div>
          <h1 className="page-title">Preview one plant at a time.</h1>
          <p className="page-copy">
            Use the viewer controls to inspect the current plant, then launch the built-in AR handoff on supported
            devices.
          </p>
        </div>

        <div className="viewer-card">
          <model-viewer
            key={current.id}
            className="single-model-viewer"
            src={current.glb}
            ios-src={current.usdz}
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            tone-mapping="neutral"
            shadow-intensity="1"
            alt={`${current.name} 3D model`}
          />
        </div>

        <div className="model-picker">
          <button className="picker-arrow" onClick={previousModel} aria-label="Previous tree species">
            {"<"}
          </button>
          <div className="picker-label">{current.name}</div>
          <button className="picker-arrow" onClick={nextModel} aria-label="Next tree species">
            {">"}
          </button>
        </div>

        <div className="page-note">Open the AR control inside the viewer when you want to place the selected plant in space.</div>
      </div>
    </div>
  );
}
