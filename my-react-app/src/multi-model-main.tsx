import "@needle-tools/engine";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./ar/needleScene";
import MultiModelApp from "./MultiModelApp.tsx";

// Importing needleScene registers the multi-model AR scene before the React UI mounts.
createRoot(document.getElementById("root")!).render(<MultiModelApp />);
