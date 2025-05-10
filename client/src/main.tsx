import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Note: We're using Geist fonts via CSS import in index.html instead of the JS package

createRoot(document.getElementById("root")!).render(<App />);
