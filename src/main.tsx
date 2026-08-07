import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "../app/page";
import "../app/globals.css";
import "../app/typography-fixes.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>,
);
