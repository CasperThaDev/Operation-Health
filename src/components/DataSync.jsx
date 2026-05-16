import React, { useRef } from "react";
import { S } from "./UI";

export function DataSync() {
  const fileInputRef = useRef(null);

  const exportData = () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("v5_")) {
        data[key] = JSON.parse(localStorage.getItem(key));
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ksa_os_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        Object.entries(data).forEach(([key, value]) => {
          if (key.startsWith("v5_")) {
            localStorage.setItem(key, JSON.stringify(value));
          }
        });
        window.location.reload();
      } catch (err) {
        alert("Failed to import data. Please ensure the file is a valid JSON backup.");
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (window.confirm("Are you sure you want to delete ALL application data? This cannot be undone.")) {
      if (window.confirm("FINAL WARNING: Proceed with data deletion?")) {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key.startsWith("v5_")) {
            localStorage.removeItem(key);
          }
        }
        window.location.reload();
      }
    }
  };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button onClick={exportData} style={S.btn("#4488ff")}>EXPORT BACKUP</button>
      <button onClick={() => fileInputRef.current.click()} style={S.btn("#ffcc00")}>IMPORT BACKUP</button>
      <button onClick={clearAllData} style={S.btn("#ff2244")}>CLEAR ALL DATA</button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".json"
        onChange={importData}
      />
    </div>
  );
}
