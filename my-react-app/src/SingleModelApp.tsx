import { useState } from "react";
import "./page-shell.css";
import TreeCatalogModal from "./components/TreeCatalogModal";
import { TREE_CATALOG, type TreeCatalogEntry } from "./treeCatalog";

export default function SingleModelApp() {
  const [index, setIndex] = useState(0);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const current = TREE_CATALOG[index];

  const nextModel = () => setIndex((value) => (value + 1) % TREE_CATALOG.length);
  const previousModel = () => setIndex((value) => (value - 1 + TREE_CATALOG.length) % TREE_CATALOG.length);

  const handleSelectTree = (tree: TreeCatalogEntry) => {
    const nextIndex = TREE_CATALOG.findIndex((entry) => entry.id === tree.id);
    if (nextIndex >= 0) {
      setIndex(nextIndex);
    }
    setIsCatalogOpen(false);
  };

  return (
    <>
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
              src={current.singleGlb}
              ios-src={current.singleUsdz}
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
            <button
              type="button"
              className="picker-label picker-label--catalog"
              aria-haspopup="dialog"
              aria-label={`Open tree catalog for ${current.name}`}
              onClick={() => setIsCatalogOpen(true)}
            >
              {current.name}
            </button>
            <button className="picker-arrow" onClick={nextModel} aria-label="Next tree species">
              {">"}
            </button>
          </div>

          <div className="tree-summary-card">
            <div className="feature-card-eyebrow">Tree Details</div>
            <div className="feature-card-title">{current.name}</div>
            <div className="feature-card-copy">{current.description}</div>

            <div className="tree-summary-grid">
              <div className="tree-summary-item">
                <span className="tree-summary-label">Species</span>
                <span className="tree-summary-value">{current.species}</span>
              </div>
              <div className="tree-summary-item">
                <span className="tree-summary-label">Model Age</span>
                <span className="tree-summary-value">{current.modelAge}</span>
              </div>
              <div className="tree-summary-item">
                <span className="tree-summary-label">Height Range</span>
                <span className="tree-summary-value">{current.heightRange}</span>
              </div>
              <div className="tree-summary-item">
                <span className="tree-summary-label">Preferred Soil</span>
                <span className="tree-summary-value">{current.soilConditions}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isCatalogOpen ? (
        <TreeCatalogModal
          trees={TREE_CATALOG}
          selectedId={current.id}
          title="Select A Tree"
          onClose={() => setIsCatalogOpen(false)}
          onSelect={handleSelectTree}
        />
      ) : null}
    </>
  );
}
