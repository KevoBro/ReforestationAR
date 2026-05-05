import { useEffect, useState } from "react";
import "./page-shell.css";
import TreeCatalogModal from "./components/TreeCatalogModal";
import type { TreeCatalogEntry } from "./treeCatalog";
import useTreeCatalog from "./useTreeCatalog";

export default function SingleModelApp() {
  const [index, setIndex] = useState(0);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  // Tree data is loaded from WordPress first, then falls back to the local
  // catalog so the page still works during API issues or handoff testing.
  const { trees, loading, error, usingFallback } = useTreeCatalog();

  useEffect(() => {
    // Keep the selected index valid if the catalog changes size after load.
    if (trees.length === 0) {
      setIndex(0);
      setIsCatalogOpen(false);
      return;
    }
    if (index >= trees.length) {
      setIndex(0);
    }
  }, [index, trees.length]);

  const current = trees[index] ?? null;
  const isReady = !loading && current !== null;
  const hasMultipleTrees = trees.length > 1;

  const nextModel = () => {
    if (trees.length === 0) return;
    setIndex((value) => (value + 1) % trees.length);
  };

  const previousModel = () => {
    if (trees.length === 0) return;
    setIndex((value) => (value - 1 + trees.length) % trees.length);
  };

  const handleSelectTree = (tree: TreeCatalogEntry) => {
    const nextIndex = trees.findIndex((entry) => entry.id === tree.id);
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

          {loading ? <div className="page-note">Loading tree catalog from WordPress...</div> : null}
          {error ? (
            <div className="page-note page-note--warning">
              Live catalog unavailable. {error} {usingFallback ? "Using the local fallback catalog instead." : ""}
            </div>
          ) : null}

          <div className="viewer-card">
            {current ? (
              <model-viewer
                key={current.id}
                className="single-model-viewer"
                src={current.singleGlb}
                ios-src={current.singleUsdz}
                ar
                ar-scale="auto"
                ar-modes="scene-viewer webxr quick-look"
                camera-controls
                tone-mapping="neutral"
                shadow-intensity="1"
                // model-viewer handles the 3D preview, camera controls, and the
                // native AR handoff on supported Android and iOS devices.
                alt={`${current.name} 3D model`}
              />
            ) : (
              <div className="viewer-loading">Loading tree preview...</div>
            )}
          </div>

          <div className="model-picker">
            <button
              className="picker-arrow"
              onClick={previousModel}
              aria-label="Previous tree species"
              disabled={!isReady || !hasMultipleTrees}
            >
              {"<"}
            </button>
            <button
              type="button"
              className="picker-label picker-label--catalog"
              aria-haspopup="dialog"
              aria-label={current ? `Open tree catalog for ${current.name}` : "Tree catalog is loading"}
              onClick={() => setIsCatalogOpen(true)}
              disabled={!isReady}
            >
              {current?.name ?? "Loading Trees..."}
            </button>
            <button
              className="picker-arrow"
              onClick={nextModel}
              aria-label="Next tree species"
              disabled={!isReady || !hasMultipleTrees}
            >
              {">"}
            </button>
          </div>

          {current ? (
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
          ) : null}
        </div>
      </div>

      {isCatalogOpen && current ? (
        <TreeCatalogModal
          trees={trees}
          selectedId={current.id}
          title="Select A Tree"
          onClose={() => setIsCatalogOpen(false)}
          onSelect={handleSelectTree}
        />
      ) : null}
    </>
  );
}
