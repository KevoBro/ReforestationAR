import { useState } from "react";
import "./App.css";
import type { TreeSpecies } from "./ar/needleScene";

import treeElmGLB from "./assets/ElmTree.glb?url";
import shrubGLB from "./assets/treeShrub.glb?url";

const SPECIES: TreeSpecies[] = [
  { id: "elm", name: "Elm Tree", glb: treeElmGLB },
  { id: "shrub", name: "Shrub", glb: shrubGLB },
];

export default function MultiModelApp() {
  const [index, setIndex] = useState(0);
  const current = SPECIES[index];

  const nextSpecies = () => setIndex((value) => (value + 1) % SPECIES.length);
  const previousSpecies = () => setIndex((value) => (value - 1 + SPECIES.length) % SPECIES.length);

  const addTree = () => {
    window.dispatchEvent(new CustomEvent<TreeSpecies>("garden:add-tree", { detail: current }));
  };

  return (
    <div className="app-root">
      <div className="ui-overlay">
        <div className="scene-card">
          <div className="scene-eyebrow">Tree Garden Prototype</div>
          <div className="scene-title">Add a tree, then drag it to reposition it.</div>
        </div>

        <div className="model-controls">
          <button className="arrow-button" onClick={previousSpecies} aria-label="Previous tree species">
            {"<"}
          </button>
          <div className="model-label">{current.name}</div>
          <button className="arrow-button" onClick={nextSpecies} aria-label="Next tree species">
            {">"}
          </button>
        </div>

        <button className="plant-button" onClick={addTree}>
          Add {current.name}
        </button>

        <div id="needle-ar-button-slot" className="needle-ar-button-slot" />
      </div>
    </div>
  );
}
