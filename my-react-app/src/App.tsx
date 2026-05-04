import { useState } from "react";
import "./opening-page.css";
import "./page-shell.css";

type FeatureMode = "single-model" | "multi-model";
type TourTarget = "mode-toggle" | "selection-card" | "open-button";

const FEATURES: Array<{
  id: FeatureMode;
  label: string;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}> = [
  {
    id: "single-model",
    label: "Single Model",
    title: "Single Model Viewer",
    description:
      "Open the model-viewer page to view one plant at a time. Compatible with iPhone 6S and later. Recommended for best performance on lower-end devices",
    href: "./single-model.html",
    actionLabel: "Open Single Model Page",
  },
  {
    id: "multi-model",
    label: "Multi-Model",
    title: "Needle Multi-Model Garden",
    description:
      "Opens to the Needle Engine experience where you can add multiple plants to the scene and reposition them. Recommended for higher-end devices (iPhone 12 and later).",
    href: "./multi-model.html",
    actionLabel: "Open Multi-Model Page",
  },
];

const TOUR_STEPS: Array<{
  target: TourTarget;
  title: string;
  description: string;
  requiresModeSelection?: boolean;
}> = [
  {
    target: "mode-toggle",
    title: "Choose an AR mode",
    description: "Use these modes to switch between Single Model and Multi-Model experiences.",
  },
  {
    target: "selection-card",
    title: "Review what this mode does",
    description:
      "This section explains the selected mode so you can decide what fits your device and planting setup best.",
  },
  {
    target: "mode-toggle",
    title: "Select your desired mode",
    description:
      "Now choose the mode you want to use today. Tap one of the modes above to confirm your selection.",
    requiresModeSelection: true,
  },
  {
    target: "open-button",
    title: "Continue to the mode guide",
    description:
      "Great. Next, tap the green button to open your selected mode. The guided tour will continue on that page.",
  },
];

export default function App() {
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [hasSelectedModeInTour, setHasSelectedModeInTour] = useState(false);
  const [mode, setMode] = useState<FeatureMode>("single-model");
  const current = FEATURES.find((feature) => feature.id === mode) ?? FEATURES[0];
  const currentTour = TOUR_STEPS[tourStep];
  const isFinalTourStep = tourStep === TOUR_STEPS.length - 1;
  const isNextDisabled = currentTour.requiresModeSelection && !hasSelectedModeInTour;

  const openSelectedPage = (continueTour: boolean) => {
    const separator = current.href.includes("?") ? "&" : "?";
    const destination = continueTour ? `${current.href}${separator}tour=1` : current.href;
    window.location.href = destination;
  };

  const stopTour = () => {
    setIsTourActive(false);
    setTourStep(0);
    setHasSelectedModeInTour(false);
  };

  const startPlanting = () => {
    stopTour();
    setShowModeSelector(true);
  };

  const startTour = () => {
    setIsTourActive(true);
    setTourStep(0);
    setHasSelectedModeInTour(false);
    setShowModeSelector(true);
  };

  const onOpenSelectedPage = () => {
    if (isTourActive) {
      if (!isFinalTourStep) {
        setTourStep(TOUR_STEPS.length - 1);
        return;
      }
      openSelectedPage(true);
      return;
    }

    openSelectedPage(false);
  };

  const onTourNext = () => {
    if (isNextDisabled) return;
    setTourStep((step) => Math.min(step + 1, TOUR_STEPS.length - 1));
  };

  const onTourPrevious = () => {
    setTourStep((step) => Math.max(step - 1, 0));
  };

  if (!showModeSelector) {
    return (
      <main className="opening-page">
        <section className="opening-card" aria-label="Rebuilding Augusta landing screen">
          <img className="opening-logo" src="/left.png" alt="Rebuilding Augusta logo" />
          <p className="opening-tagline">"Rebuilding Augusta One Tree at a Time"</p>

          <div className="opening-actions">
            <button className="opening-button" type="button" onClick={startTour}>
              Start Touring
            </button>
            <button className="opening-button" type="button" onClick={startPlanting}>
              Start Planting
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-panel">
        <button
          className="page-back-button"
          type="button"
          onClick={() => {
            stopTour();
            setShowModeSelector(false);
          }}
        >
          Back
        </button>

        <div className="page-intro">
          <div className="page-eyebrow">Reforestation AR Modes</div>
          <h1 className="page-title">Choose the AR experience you want to open.</h1>
          <p className="page-copy"></p>
        </div>

        <div
          className={`toggle-strip${isTourActive && currentTour.target === "mode-toggle" ? " is-tour-highlight" : ""}`}
          role="tablist"
          aria-label="AR feature selector"
        >
          {FEATURES.map((feature) => (
            <button
              key={feature.id}
              className={`toggle-chip${feature.id === current.id ? " is-active" : ""}`}
              onClick={() => {
                setMode(feature.id);
                if (isTourActive) {
                  setHasSelectedModeInTour(true);
                }
              }}
              role="tab"
              aria-selected={feature.id === current.id}
            >
              {feature.label}
            </button>
          ))}
        </div>

        <div
          className={`feature-card${isTourActive && currentTour.target === "selection-card" ? " is-tour-highlight" : ""}`}
        >
          <div className="feature-card-eyebrow">Current Selection</div>
          <div className="feature-card-title">{current.title}</div>
          <div className="feature-card-copy">{current.description}</div>
        </div>

        <button
          className={`page-action-button${isTourActive && currentTour.target === "open-button" ? " is-tour-highlight" : ""}`}
          onClick={onOpenSelectedPage}
        >
          {current.actionLabel}
        </button>

        {isTourActive ? (
          <>
            <div className="tour-backdrop" aria-hidden="true" />
            <div
              className={`tour-overlay${tourStep >= 1 ? " tour-overlay--top" : ""}`}
              role="dialog"
              aria-modal="true"
              aria-label="Mode selection tour guide"
            >
              <div className="tour-overlay-panel">
                <div className="tour-overlay-step">
                  Step {tourStep + 1} of {TOUR_STEPS.length}
                </div>
                <h2 className="tour-overlay-title">{currentTour.title}</h2>
                <p className="tour-overlay-copy">{currentTour.description}</p>

                <div className="tour-overlay-actions">
                  <button className="tour-overlay-button" type="button" onClick={onTourPrevious} disabled={tourStep === 0}>
                    Previous
                  </button>
                  {!isFinalTourStep ? (
                    <button
                      className="tour-overlay-button tour-overlay-button--primary"
                      type="button"
                      onClick={onTourNext}
                      disabled={Boolean(isNextDisabled)}
                    >
                      Next
                    </button>
                  ) : null}
                  <button className="tour-overlay-link" type="button" onClick={stopTour}>
                    Skip Tour
                  </button>
                </div>
                {isFinalTourStep ? (
                  <p className="tour-overlay-hint">Use the highlighted green button below to continue.</p>
                ) : null}
                {isNextDisabled ? (
                  <p className="tour-overlay-hint">Select a mode chip above to continue.</p>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
