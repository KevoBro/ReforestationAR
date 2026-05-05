import { useEffect, useState } from "react";
import "./App.css";
import "./tree-catalog.css";
import type { TreeSpecies } from "./ar/needleScene";
import TreeCatalogModal from "./components/TreeCatalogModal";
import type { TreeCatalogEntry } from "./treeCatalog";
import useTreeCatalog from "./useTreeCatalog";
import catalogIcon from "./assets/catalogIcon.png";

// Needle only needs a small subset of fields when we dispatch an add-tree event.
const getTreeSpecies = (tree: TreeCatalogEntry): TreeSpecies => ({
  id: tree.id,
  name: tree.name,
  glb: tree.singleGlb,
});

const TOUR_STEPS = [
  {
    target: "ar-slot",
    title: "Enter AR with Needle Go",
    description:
      "Tap the Enter AR button at the bottom to launch the experience. Once loaded, point your camera at your planting area and press the add button.",
  },
] as const;

export default function MultiModelApp() {
  const [index, setIndex] = useState(0);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [detailsTreeId, setDetailsTreeId] = useState<string | null>(null);
  const [isTourActive, setIsTourActive] = useState(() => new URLSearchParams(window.location.search).get("tour") === "1");
  
    // The AR page can still run if WordPress is unavailable by falling back to
  // the local catalog entries defined in treeCatalog.ts.
  const { trees, loading, error, usingFallback } = useTreeCatalog();
  const currentTour = TOUR_STEPS[0];

  useEffect(() => {
    // Reset modal state when a fresh catalog load temporarily removes entries.
    if (trees.length === 0) {
      setIndex(0);
      setIsCatalogOpen(false);
      setDetailsTreeId(null);
      return;
    }
    if (index >= trees.length) {
      setIndex(0);
    }
  }, [index, trees.length]);

  const current = trees[index] ?? null;
  const detailsTree = trees.find((tree) => tree.id === detailsTreeId) ?? null;
  const isReady = !loading && current !== null;
  const hasMultipleTrees = trees.length > 1;

  const nextSpecies = () => {
    if (trees.length === 0) return;
    setIndex((value) => (value + 1) % trees.length);
  };

  const previousSpecies = () => {
    if (trees.length === 0) return;
    setIndex((value) => (value - 1 + trees.length) % trees.length);
  };

  // Needle listens for this custom event inside needleScene.ts and places the
  // requested model into the active AR scene.
  const addTree = () => {
    if (!current) return;
    window.dispatchEvent(new CustomEvent<TreeSpecies>("garden:add-tree", { detail: getTreeSpecies(current) }));
  };

  const handleSelectTree = (tree: TreeCatalogEntry) => {
    const nextIndex = trees.findIndex((entry) => entry.id === tree.id);
    if (nextIndex >= 0) {
      setIndex(nextIndex);
    }
    setDetailsTreeId(null);
    setIsCatalogOpen(false);
  };

  const closeCatalog = () => {
    setIsCatalogOpen(false);
    setDetailsTreeId(null);
  };

  const closeTour = () => {
    setIsTourActive(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("tour");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  };

  return (
    <>
      <div className="app-root">
        <div className={`ui-overlay${isTourActive ? " ui-overlay--tour" : ""}`}>
          <button className="page-back-button" type="button" onClick={() => (window.location.href = "./index.html")}>
            Back
          </button>
          <div className={`scene-card${isTourActive ? " is-tour-muted" : ""}`}>
            <div className="scene-eyebrow">Tree Garden</div>
            <div className="scene-title">
              {loading ? "Loading tree catalog..." : "Add a tree, then drag it to reposition it."}
            </div>
            {loading ? <div className="scene-status">Fetching live tree data from WordPress.</div> : null}
            {error ? (
              <div className="scene-status scene-status--warning">
                Live catalog unavailable. {error} {usingFallback ? "Using the local fallback catalog instead." : ""}
              </div>
            ) : null}
          </div>

          <div className={`model-controls${isTourActive ? " is-tour-muted" : ""}`}>
            <button
              className="arrow-button"
              onClick={previousSpecies}
              aria-label="Previous tree species"
              disabled={!isReady || !hasMultipleTrees}
            >
              {"<"}
            </button>
            <button
              type="button"
              className="model-label model-label--catalog"
              aria-haspopup="dialog"
              aria-label={current ? `Open tree catalog for ${current.name}` : "Tree catalog is loading"}
              onClick={() => setIsCatalogOpen(true)}
              disabled={!isReady}
            >
              <span className="model-label-text">{current?.name ?? "Loading Trees..."}</span>
              <img className="catalogIcon" src={catalogIcon} alt="catalog icon" />
            </button>
            <button
              className="arrow-button"
              onClick={nextSpecies}
              aria-label="Next tree species"
              disabled={!isReady || !hasMultipleTrees}
            >
              {">"}
            </button>
          </div>

          <button
            className={`plant-button${isTourActive ? " is-tour-muted" : ""}`}
            onClick={addTree}
            disabled={!isReady}
          >
            {current ? `Add ${current.name}` : "Loading Catalog..."}
          </button>

          <div
            id="needle-ar-button-slot"
            className={`needle-ar-button-slot${isTourActive ? " needle-ar-button-slot--tour-highlight" : ""}`}
          />
        </div>

        {isTourActive ? (
          <>
            <div className="tour-backdrop" aria-hidden="true" />
            <div
              className="tour-overlay tour-overlay--top"
              role="dialog"
              aria-modal="true"
              aria-label="Multi-model mode tour guide"
            >
              <div className="tour-overlay-screen-arrow" aria-hidden="true">
                ↓ Enter AR below
              </div>
              <div className="tour-overlay-panel">
                <div className="tour-overlay-step">
                  AR Step
                </div>
                <h2 className="tour-overlay-title">{currentTour.title}</h2>
                <p className="tour-overlay-copy">{currentTour.description}</p>

                <div className="tour-overlay-actions">
                  <button className="tour-overlay-button tour-overlay-button--primary" type="button" onClick={closeTour}>
                    Got It
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

      {isCatalogOpen && current ? (
        <TreeCatalogModal
          trees={trees}
          selectedId={current.id}
          title="Select A Tree"
          showInfoButton
          onClose={closeCatalog}
          onOpenDetails={(tree) => setDetailsTreeId(tree.id)}
          onSelect={handleSelectTree}
        />
      ) : null}

      {isCatalogOpen && detailsTree ? (
        <div className="catalog-backdrop catalog-backdrop--details" role="presentation" onClick={() => setDetailsTreeId(null)}>
          <div
            className="tree-details-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={`${detailsTree.name} details`}
            // Stop clicks inside the sheet from closing the overlay underneath it.
            onClick={(event) => event.stopPropagation()}
          >
            <div className="tree-details-header">
              <div>
                <div className="tree-details-eyebrow">Tree Information</div>
                <div className="tree-details-title">{detailsTree.name}</div>
              </div>
              <button type="button" className="tree-details-close" onClick={() => setDetailsTreeId(null)}>
                Close
              </button>
            </div>

            <div className="tree-details-body">
              <img className="tree-details-preview" src={detailsTree.previewImage} alt="" aria-hidden="true" />
              <div className="tree-details-copy">{detailsTree.description}</div>

              <div className="tree-details-grid">
                <div className="tree-detail-item">
                  <span className="tree-detail-label">Species</span>
                  <span className="tree-detail-value">{detailsTree.species}</span>
                </div>
                <div className="tree-detail-item">
                  <span className="tree-detail-label">Model Age</span>
                  <span className="tree-detail-value">{detailsTree.modelAge}</span>
                </div>
                <div className="tree-detail-item">
                  <span className="tree-detail-label">Height Range</span>
                  <span className="tree-detail-value">{detailsTree.heightRange}</span>
                </div>
                <div className="tree-detail-item">
                  <span className="tree-detail-label">Preferred Soil</span>
                  <span className="tree-detail-value">{detailsTree.soilConditions}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
