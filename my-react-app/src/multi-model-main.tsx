import "@needle-tools/engine";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./ar/needleScene";
import MultiModelApp from "./MultiModelApp.tsx";

createRoot(document.getElementById("root")!).render(<MultiModelApp />);
