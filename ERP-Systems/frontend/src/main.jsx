
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./App.css";
import App from "./App.jsx";
import { SalesProvider } from "./context/SalesContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SalesProvider>
      <App />
    </SalesProvider>
  </StrictMode>
);
