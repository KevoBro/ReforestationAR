import { useEffect, useState } from "react";
import "./App.css";
import { initializeGardenScene, setGardenARButtonSlot, type TreeSpecies } from "./ar/needleScene";

import treeElmGLB from "./assets/tree_elm.glb?url";
import shrubGLB from "./assets/treeShrub.glb?url";

const SPECIES: TreeSpecies[] = [
  { id: "elm", name: "Elm Tree", glb: treeElmGLB },
  { id: "shrub", name: "Shrub", glb: shrubGLB },
];

export default function App() {
  const [index, setIndex] = useState(0);
  const current = SPECIES[index];

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const host = document.getElementById("garden-scene");
      const buttonSlot = document.getElementById("garden-ar-button-slot");
      if (!host) return;

      try {
        await initializeGardenScene(host);
        if (!cancelled) {
          setGardenARButtonSlot(buttonSlot);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("Failed to initialize garden scene", error);
        }
      }
    };

    void boot();

    return () => {
      cancelled = true;
    };
  }, []);

  const nextSpecies = () => setIndex((value) => (value + 1) % SPECIES.length);
  const previousSpecies = () => setIndex((value) => (value - 1 + SPECIES.length) % SPECIES.length);

  const addTree = () => {
    window.dispatchEvent(new CustomEvent<TreeSpecies>("garden:add-tree", { detail: current }));
  };

  return (
    <div className="app-root">
      <div id="garden-scene" className="scene-host">
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

          <div id="garden-ar-button-slot" className="app-clip-button-slot" />

          <div className="app-clip-note">
            Open AR from the Needle button below. On iPhone, it should forward into the App Clip flow automatically.
          </div>
        </div>
      </div>
    </div>
  );
}
