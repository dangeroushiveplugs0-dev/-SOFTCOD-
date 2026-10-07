import React from "react";
import { createRoot } from "react-dom/client";
import { RigWorkspace as App } from "./ui/RigWorkspace";
import "./ui/styles.css";
import "./ui/rig.css";

createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
