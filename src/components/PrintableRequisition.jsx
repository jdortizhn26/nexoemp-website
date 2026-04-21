import { useEffect } from "react";
import { createPortal } from "react-dom";

const pr = (n) => `L ${Number(n).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;

export function PrintableRequisition({ items, branch, date, notes, onClose }) {
  // Portal: mueve fuera de #root para imprimir limpio
  useEffect(() => {
    let el = document.getElementById("print-portal");
    if (!el) {
      el = document.createElement("div");
      el.id = "print-portal";
      document.body.appendChild(el);
    }
    el.style.display = "block";
    document.getElementById("root").style.display = "none";
    return () => {
      document.getElementById("root").style.display = "";
      if (el) el.style.display = "none";
    };
  }, []);

  const portalEl = document.getElementById("print-portal") || document.body;
  const total = items.reduce((a, it) => a + it.qty * it.cost, 0);

  const td = { border: "1px solid #ddd", padding: "8px 12px", fontSize: 12 };
  const th = { ...td, background: "#f5f5f5", fontWeight: 700 };

  return createPortal(
    <div style={{ background: "#fff", minHeight: "100vh", fontFamily: "Arial,sans-serif", color: "#000" }}>
      <style>{`@media print { .no-print-bar { display: none !important; } @page { margin: 1.5cm; } }`}</style>

      {/* Toolbar */}
      <div className="no-print-bar" style={{ background: "#f5f5f5", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0369a1" }}>
        <h2 style={{ margin: 0, fontSize: 16, color: "#1a0000" }}>📝 Requisición de Inventario</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => window.print()}
            style={{ background: "#0369a1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Imprimir / Guardar PDF</button>
          <button onClick={() => { document.getElementById("root").style.display = ""; onClose(); }}
            style={{ background: "none", border: "1px solid #ddd", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12 }}>Cerrar</button>
        </div>
      </div>

      <div style={{ padding: "28px 40px", maxWidth: 800, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24, borderBottom: "2px solid #0369a1", paddingBottom: 14 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, color: "#0369a1" }}>🦐 LA MAR</h1>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>REQUISICIÓN DE INVENTARIO</p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#666" }}>Documento interno para solicitud de materia prima</p>
        </div>

        {/* Info */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20, fontSize: 12 }}>
          <tbody>
            <tr>
              <td style={{ ...td, background: "#f9f9f9", fontWeight: 700, width: "25%" }}>Sucursal solicitante</td>
              <td style={td}>{branch?.name || "—"}</td>
              <td style={{ ...td, background: "#f9f9f9", fontWeight: 700, width: "25%" }}>Fecha</td>
              <td style={td}>{date}</td>
            </tr>
            <tr>
              <td style={{ ...td, background: "#f9f9f9", fontWeight: 700 }}>Ubicación</td>
              <td style={td} colSpan={3}>{branch?.loc || "—"}</td>
            </tr>
            <tr>
              <td style={{ ...td, background: "#f9f9f9", fontWeight: 700 }}>N° Requisición</td>
              <td style={td} colSpan={3}>REQ-{branch?.id?.toUpperCase() || "X"}-{date.replace(/-/g, "")}</td>
            </tr>
          </tbody>
        </table>

        {/* Items requested */}
        <h3 style={{ fontSize: 13, margin: "20px 0 8px", color: "#0369a1" }}>ITEMS SOLICITADOS</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
          <thead><tr>
            {["#", "Ingrediente", "Unidad", "Stock actual", "Cantidad solicitada", "Costo unit.", "Subtotal"].map((h, i) => (
              <th key={h} style={{ ...th, textAlign: i >= 3 ? "right" : "left", fontSize: 11 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={7} style={{ ...td, textAlign: "center", color: "#999", padding: "20px" }}>Sin items solicitados</td></tr>
            ) : items.map((it, i) => (
              <tr key={i}>
                <td style={{ ...td, textAlign: "center", color: "#666" }}>{i + 1}</td>
                <td style={{ ...td, fontWeight: 600 }}>{it.name}</td>
                <td style={td}>{it.unit}</td>
                <td style={{ ...td, textAlign: "right" }}>{it.currentStock.toFixed(2)}</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 700, color: "#0369a1" }}>{it.qty}</td>
                <td style={{ ...td, textAlign: "right", color: "#666" }}>{pr(it.cost)}</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{pr(it.qty * it.cost)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={6} style={{ ...td, textAlign: "right", fontWeight: 700, background: "#f5f5f5" }}>TOTAL ESTIMADO</td>
              <td style={{ ...td, textAlign: "right", fontWeight: 900, background: "#f5f5f5", color: "#003399" }}>{pr(total)}</td>
            </tr>
          </tbody>
        </table>

        {/* Notes */}
        {notes && (
          <div style={{ marginTop: 18, marginBottom: 18 }}>
            <h3 style={{ fontSize: 13, margin: "0 0 6px", color: "#0369a1" }}>OBSERVACIONES</h3>
            <div style={{ border: "1px solid #ddd", padding: "10px 14px", fontSize: 11, background: "#fafafa", whiteSpace: "pre-wrap" }}>{notes}</div>
          </div>
        )}

        {/* Signatures */}
        <div style={{ marginTop: 50, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 30 }}>
          {["Solicita (Encargado)", "Aprueba (Admin)", "Entrega (Bodega)"].map(role => (
            <div key={role} style={{ textAlign: "center" }}>
              <div style={{ borderTop: "1px solid #000", paddingTop: 4, fontSize: 11, fontWeight: 700 }}>{role}</div>
              <div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>Nombre y firma</div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 10, color: "#999", marginTop: 40, borderTop: "1px solid #eee", paddingTop: 10 }}>
          La Mar — Requisición de Inventario — Generado {new Date().toLocaleDateString("es-HN")} {new Date().toLocaleTimeString("es-HN")}
        </p>
      </div>
    </div>,
    portalEl
  );
}
