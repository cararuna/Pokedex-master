import React from "react";
import { createRoot } from "react-dom/client";
import Modal from "react-modal";
import App from "./App";

const container = document.getElementById("root");

if (!container) {
  throw new Error('Elemento #root não encontrado no index.html');
}

Modal.setAppElement(container);

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
