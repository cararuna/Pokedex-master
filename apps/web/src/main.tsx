import React from "react";
import { createRoot } from "react-dom/client";
import "@pokedex/design-system/styles.css";
import App from "./App";

const container = document.getElementById("root");

if (!container) {
  throw new Error('Elemento #root não encontrado no index.html');
}

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
