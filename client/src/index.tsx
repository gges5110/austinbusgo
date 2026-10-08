import { App } from "app/App";
import React from "react";
import "./index.css";
import { createRoot } from "react-dom/client";
import { initAnalytics } from "shared/analytics";

initAnalytics();

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
