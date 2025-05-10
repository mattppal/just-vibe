import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Note: We've reverted to using Google Fonts as the Geist package is designed for Next.js

createRoot(document.getElementById("root")!).render(<App />);
