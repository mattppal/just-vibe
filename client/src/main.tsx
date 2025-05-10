import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

// Add the Geist fonts class to the document root
document.documentElement.classList.add(GeistSans.variable);
document.documentElement.classList.add(GeistMono.variable);

createRoot(document.getElementById("root")!).render(<App />);
