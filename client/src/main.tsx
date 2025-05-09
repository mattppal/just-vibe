import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Preload the Geist font for optimal loading performance
const preloadLink = document.createElement("link");
preloadLink.rel = "preload";
preloadLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
preloadLink.as = "style";
document.head.appendChild(preloadLink);

// Add the actual font stylesheet
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
document.head.appendChild(fontLink);

createRoot(document.getElementById("root")!).render(<App />);
