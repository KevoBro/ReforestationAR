import { createRoot } from "react-dom/client";
import SingleModelApp from "./SingleModelApp.tsx";

// Separate entry point so the single-model viewer can run as its own page.
createRoot(document.getElementById("root")!).render(<SingleModelApp />);
