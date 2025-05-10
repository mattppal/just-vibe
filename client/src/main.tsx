import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import Geist from the npm package instead of Google Fonts
import "geist/font/css/geist-sans.css";
import "geist/font/css/geist-mono.css";

createRoot(document.getElementById("root")!).render(<App />);
