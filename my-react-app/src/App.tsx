import { useState } from "react";
import "./opening-page.css";
import "./page-shell.css";

type FeatureMode = "marker-based" | "single-model" | "multi-model";

const FEATURES: Array<{
  id: FeatureMode;
  label: string;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}> = [
  {
    id: "marker-based",
    label: "Marker-Based",
    title: "Marker-Based AR.js",
    description:
      "Launch the marker workflow on its own page, choose a plant, and then open the camera view that uses the Hiro marker.",
    href: "./marker-based.html",
    actionLabel: "Open Marker-Based Page",
  },
  {
    id: "single-model",
    label: "Single Model",
    title: "Single Model Viewer",
    description:
      "Open the standalone model-viewer page for one plant at a time, with native AR handoff where the device supports it.",
    href: "./single-model.html",
    actionLabel: "Open Single Model Page",
  },
  {
    id: "multi-model",
    label: "Multi-Model",
    title: "Needle Multi-Model Garden",
    description:
      "Open the original Needle Engine experience where you can add multiple plants to the scene and reposition them.",
    href: "./multi-model.html",
    actionLabel: "Open Multi-Model Page",
  },
];

export default function App() {
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [mode, setMode] = useState<FeatureMode>("multi-model");
  const current = FEATURES.find((feature) => feature.id === mode) ?? FEATURES[0];

  const openSelectedPage = () => {
    window.location.href = current.href;
  };

  if (!showModeSelector) {
    return (
      <main className="opening-page">
        <section className="opening-card" aria-label="Rebuilding Augusta landing screen">
          <img className="opening-logo" src="/left.png" alt="Rebuilding Augusta logo" />
          <p className="opening-tagline">"Rebuilding Augusta One Tree at a Time"</p>

          <div className="opening-actions">
            <button className="opening-button" type="button">
              Start tour
            </button>
            <button className="opening-button" type="button" onClick={() => setShowModeSelector(true)}>
              Start planting
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-panel">
        <button className="page-back-button" type="button" onClick={() => setShowModeSelector(false)}>
          Back
        </button>

        <div className="page-intro">
          <div className="page-eyebrow">Reforestation AR Modes</div>
          <h1 className="page-title">Choose the AR experience you want to open.</h1>
          <p className="page-copy">
            Each mode now has its own page so the interface stays lighter and the Needle App Clip flow can remain
            isolated.
          </p>
        </div>

        <div className="toggle-strip" role="tablist" aria-label="AR feature selector">
          {FEATURES.map((feature) => (
            <button
              key={feature.id}
              className={`toggle-chip${feature.id === current.id ? " is-active" : ""}`}
              onClick={() => setMode(feature.id)}
              role="tab"
              aria-selected={feature.id === current.id}
            >
              {feature.label}
            </button>
          ))}
        </div>

        <div className="feature-card">
          <div className="feature-card-eyebrow">Current Selection</div>
          <div className="feature-card-title">{current.title}</div>
          <div className="feature-card-copy">{current.description}</div>
        </div>

        <button className="page-action-button" onClick={openSelectedPage}>
          {current.actionLabel}
        </button>
      </div>
    </div>
  );
}
