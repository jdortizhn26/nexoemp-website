// ─── UTILS ───────────────────────────────────────────────────────────────────
// Helpers compartidos por toda la app.
// Extraído de App.jsx en refactor v2.1 — sin cambios de comportamiento.

export const L = (n) => `L ${Number(n).toLocaleString("es-HN",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
export const today = () => new Date().toISOString().split("T")[0];
export const uid = () => String(Date.now() + Math.random());
