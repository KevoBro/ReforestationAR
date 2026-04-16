import { useState } from "react";
import "./page-shell.css";

type MarkerModel = {
  id: string;
  name: string;
  description: string;
};

const MODELS: MarkerModel[] = [
  {
    id: "elm",
    name: "Elm Tree",
    description: "Launch the AR.js camera page with the elm model and use the Hiro marker to anchor the plant.",
  },
  {
    id: "shrub",
    name: "Shrub",
    description: "Launch the AR.js camera page with the shrub model and use the Hiro marker to anchor the plant.",
  },
];

export default function MarkerLauncherApp() {
  const [index, setIndex] = useState(0);
  const current = MODELS[index];

  const nextModel = () => setIndex((value) => (value + 1) % MODELS.length);
  const previousModel = () => setIndex((value) => (value - 1 + MODELS.length) % MODELS.length);

  const openMarkerExperience = () => {
    window.location.href = `./marker-ar.html?model=${current.id}`;
  };

  return (
    <div className="page-shell">
      <div className="page-panel page-panel--narrow">
        <a className="back-link" href="./index.html">
          Back To Mode Selector
        </a>

        <div className="page-intro">
          <div className="page-eyebrow">Marker-Based AR</div>
          <h1 className="page-title">Choose a plant to place on marker.</h1>
          <p className="page-copy">
           
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-card-eyebrow">Selected Plant</div>
          <div className="feature-card-title">{current.name}</div>
          <div className="feature-card-copy">{current.description}</div>
        </div>

        <div className="model-picker">
          <button className="picker-arrow" onClick={previousModel} aria-label="Previous marker plant">
            {"<"}
          </button>
          <div className="picker-label">{current.name}</div>
          <button className="picker-arrow" onClick={nextModel} aria-label="Next marker plant">
            {">"}
          </button>
        </div>

        <button className="page-action-button" onClick={openMarkerExperience}>
          Open Marker AR Camera
        </button>

        <div className="page-note">The button above opens the live camera view and expects the Hiro marker to be visible. Make sure the camera is pointed at the Hiro Marker.</div>
      </div>
    </div>
  );
}
