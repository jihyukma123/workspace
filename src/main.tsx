import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyPrimaryColorToDocument, getStoredPrimaryColor } from "@/lib/primary-color";

applyPrimaryColorToDocument(getStoredPrimaryColor());

createRoot(document.getElementById("root")!).render(<App />);
