import React from "react";

export function EnvDebug() {
  const apiUrl = import.meta.env.VITE_API_URL || "(not set)";
  const mode = import.meta.env.MODE || "development";
  const ga = import.meta.env.VITE_GA_MEASUREMENT_ID || "(none)";

  return (
    <div style={{ marginTop: 8, fontSize: 12 }} className="env-debug muted">
      <div>Environment: <strong>{mode}</strong></div>
      <div>VITE_API_URL: <code style={{ fontSize: 12 }}>{apiUrl}</code></div>
      <div>GA: <code style={{ fontSize: 12 }}>{ga}</code></div>
    </div>
  );
}

export default EnvDebug;
