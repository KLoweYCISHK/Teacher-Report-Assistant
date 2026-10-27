import React from "react";
import ReactDOM from "react-dom/client";
import Home from "@/pages/Home";
import { isFirebaseConfigured } from "@/lib/firebase";
import "@/index.css";

function SetupNeeded() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-lg w-full bg-card border rounded-xl p-8 shadow-sm space-y-3">
        <h1 className="text-2xl font-extrabold">Teacher Report Assistant</h1>
        <p className="text-sm text-muted-foreground">
          Firebase isn't connected yet. Paste your Firebase web config into
          <code className="mx-1 px-1.5 py-0.5 rounded bg-muted text-foreground">src/firebase-config.js</code>
          and commit — the site redeploys automatically.
        </p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  isFirebaseConfigured ? <Home /> : <SetupNeeded />
);
