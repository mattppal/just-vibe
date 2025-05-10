import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { getCsrfToken } from "./lib/queryClient";

// Note: We're using Google Fonts for the Geist font family

// Initialize CSRF token in the background
setTimeout(() => {
  getCsrfToken().catch(error => {
    console.warn('Initial CSRF token fetch failed. Will retry on first API call:', error);
  });
}, 1000); // Delay by 1 second to prioritize initial page render

createRoot(document.getElementById("root")!).render(<App />);
