import { useEffect, useState } from "react";
import "./page-shell.css";
import TreeCatalogModal from "./components/TreeCatalogModal";
import type { TreeCatalogEntry } from "./treeCatalog";
import useTreeCatalog from "./useTreeCatalog";

const TOUR_STEPS = [
  {
    target: "picker",
    title: "Choose a tree",
    description: "Use the arrow buttons or tap the tree name to open the catalog and select a different tree.",
  },
  {
    target: "viewer",
    title: "Preview the selected tree",
    description: "Use the viewer to rotate and inspect your selected tree before launching AR.",
  },
  {
    target: "viewer",
    title: "Open AR from the viewer",
    description:
      "When ready, tap the AR button at the bottom right of the viewer to enter the AR view.",
  },
] as const;

export default function SingleModelApp() {
  const [index, setIndex] = useState(0);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [isTourActive, setIsTourActive] = useState(() => new URLSearchParams(window.location.search).get("tour") === "1");
  
  // Tree data is loaded from WordPress first, then falls back to the local
  // catalog so the page still works during API issues or handoff testing.
  const { trees, loading, error, usingFallback } = useTreeCatalog();
  const currentTour = TOUR_STEPS[tourStep];
  const isFinalTourStep = tourStep === TOUR_STEPS.length - 1;

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

  const closeTour = () => {
    setIsTourActive(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("tour");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  };

  return (
    <>
      <div className="page-shell">
        <div className="page-panel page-panel--wide">
          <button className="page-back-button" type="button" onClick={() => (window.location.href = "./index.html")}>
            Back
          </button>

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

          <div className={`viewer-card${isTourActive && currentTour.target === "viewer" ? " is-tour-highlight" : ""}`}>
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

          <div className={`model-picker${isTourActive && currentTour.target === "picker" ? " is-tour-highlight" : ""}`}>
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

          {isTourActive ? (
            <>
              <div className="tour-backdrop" aria-hidden="true" />
              <div
                className={`tour-overlay${tourStep >= 1 ? " tour-overlay--top" : ""}`}
                role="dialog"
                aria-modal="true"
                aria-label="Single model mode tour guide"
              >
                <div className="tour-overlay-panel">
                  <div className="tour-overlay-step">
                    Step {tourStep + 1} of {TOUR_STEPS.length}
                  </div>
                  <h2 className="tour-overlay-title">{currentTour.title}</h2>
                  <p className="tour-overlay-copy">{currentTour.description}</p>

                  <div className="tour-overlay-actions">
                    <button
                      className="tour-overlay-button"
                      type="button"
                      onClick={() => setTourStep((step) => Math.max(step - 1, 0))}
                      disabled={tourStep === 0}
                    >
                      Previous
                    </button>
                    <button
                      className="tour-overlay-button tour-overlay-button--primary"
                      type="button"
                      onClick={() => {
                        if (!isFinalTourStep) {
                          setTourStep((step) => Math.min(step + 1, TOUR_STEPS.length - 1));
                          return;
                        }
                        closeTour();
                      }}
                    >
                      {isFinalTourStep ? "Finish Tour" : "Next"}
                    </button>
                    <button className="tour-overlay-link" type="button" onClick={closeTour}>
                      Skip Tour
                    </button>
                  </div>
                </div>
              </div>
            </>
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
