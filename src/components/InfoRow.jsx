import React from "react";

export function InfoRow({ label, value }) {
  return (
    <div>
      <strong>{label}:</strong> {value || "-"}
    </div>
  );
}
