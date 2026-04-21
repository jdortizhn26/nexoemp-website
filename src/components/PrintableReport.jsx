import { useEffect } from "react";
import { createPortal } from "react-dom";

export function PrintableReport({ sale, branches, onClose }) {
  const branch = branches.find(b => b.id === sale.branchId);

  // Portal: rendereamos fuera de #root y ocultamos el root en impresión
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
  const pr = (n) => `L ${Number(n).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;
  const td = { border: "1px solid #ddd", padding: "6px 10px", fontSize: 12 };
  const th = { ...td, background: "#f5f5f5", fontWeight: 700 };

  return createPortal(
    <div style={{ background: "#fff", minHeight: "100vh", fontFamily: "Arial,sans-serif", color: "#000" }}>
      <style>{`@media print { .no-print-bar { display: none !important; } #print-report table { page-break-inside: avoid; } @page { margin: 1.5cm; } }`}</style>

      {/* Toolbar */}
      <div className="no-print-bar" style={{ background: "#f5f5f5", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0369a1" }}>
        <h2 style={{ margin: 0, fontSize: 16, color: "#1a0000" }}>🖨️ Cuadre del Día</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => window.print()}
            style={{ background: "#0369a1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Imprimir / Guardar PDF</button>
          <button onClick={() => { document.getElementById("root").style.display = ""; onClose(); }}
            style={{ background: "none", border: "1px solid #ddd", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12 }}>Cerrar</button>
        </div>
      </div>

      <div id="print-report" style={{ padding: "28px 36px", maxWidth: 780, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20, borderBottom: "2px solid #0369a1", paddingBottom: 12 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, color: "#0369a1" }}>🦐 LA MAR</h1>
          <p style={{ margin: 0, fontSize: 13 }}><strong>Sucursal:</strong> {branch?.name || sale.branchId}</p>
          <p style={{ margin: 0, fontSize: 13 }}>
            <strong>Fecha:</strong> {sale.date} &nbsp;|&nbsp; <strong>Generado:</strong> {new Date(sale.submittedAt).toLocaleString("es-HN")}
          </p>
        </div>

        {/* Summary */}
        <h3 style={{ fontSize: 13, margin: "0 0 8px", color: "#0369a1" }}>RESUMEN</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
          <thead><tr>{["CONCEPTO", "MONTO"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {[
              ["VENTA TOTAL", sale.totalSales, "#006600"],
              ["GASTOS", sale.totalExpenses, "#cc0000"],
              ["VENTA A DEPOSITAR", sale.toDeposit, "#003399"],
              ["TOTAL DEPOSITADO", sale.totalDeposited, "#003399"],
              ["DIFERENCIA", sale.difference, Math.abs(sale.difference) < 0.01 ? "#006600" : "#cc0000"],
            ].map(([lbl, val, col]) => (
              <tr key={lbl}>
                <td style={td}><strong>{lbl}</strong></td>
                <td style={{ ...td, textAlign: "right", color: col, fontWeight: 700 }}>{pr(val)}</td>
              </tr>
            ))}
            <tr>
              <td style={{ ...td, background: "#f0fff0" }}><strong>ESTADO</strong></td>
              <td style={{ ...td, background: "#f0fff0", textAlign: "right", fontWeight: 900, color: Math.abs(sale.difference) < 0.01 ? "#006600" : "#cc0000" }}>
                {Math.abs(sale.difference) < 0.01 ? "✓ CUADRA" : "⚠ NO CUADRA"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Productos */}
        <h3 style={{ fontSize: 13, margin: "20px 0 8px", color: "#0369a1" }}>DETALLE DE VENTAS</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
          <thead><tr>{["Producto", "Categoría", "Cant.", "P. Unit.", "Total"].map((h, i) => <th key={h} style={{ ...th, textAlign: i > 1 ? "right" : "left" }}>{h}</th>)}</tr></thead>
          <tbody>
            {sale.items.map((it, i) => (
              <tr key={i}>
                <td style={td}>{it.productName}</td>
                <td style={td}>{it.category}</td>
                <td style={{ ...td, textAlign: "right" }}>{it.qty}</td>
                <td style={{ ...td, textAlign: "right" }}>{pr(it.unitPrice)}</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{pr(it.total)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} style={{ ...td, textAlign: "right", fontWeight: 700 }}>TOTAL</td>
              <td style={{ ...td, textAlign: "right", fontWeight: 900, color: "#006600" }}>{pr(sale.totalSales)}</td>
            </tr>
          </tbody>
        </table>

        {/* Gastos */}
        {sale.expenses?.length > 0 && (
          <>
            <h3 style={{ fontSize: 13, margin: "20px 0 8px", color: "#0369a1" }}>GASTOS DEL DÍA</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
              <thead><tr>{["Descripción", "Tipo", "Monto"].map((h, i) => <th key={h} style={{ ...th, textAlign: i === 2 ? "right" : "left" }}>{h}</th>)}</tr></thead>
              <tbody>
                {sale.expenses.map((e, i) => (
                  <tr key={i}>
                    <td style={td}>{e.description}</td>
                    <td style={td}>{e.type}</td>
                    <td style={{ ...td, textAlign: "right" }}>{pr(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Depósitos */}
        {sale.deposits?.length > 0 && (
          <>
            <h3 style={{ fontSize: 13, margin: "20px 0 8px", color: "#0369a1" }}>DEPÓSITOS</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
              <thead><tr>{["Banco / Cuenta", "Tipo", "Monto"].map((h, i) => <th key={h} style={{ ...th, textAlign: i === 2 ? "right" : "left" }}>{h}</th>)}</tr></thead>
              <tbody>
                {sale.deposits.map((d, i) => (
                  <tr key={i}>
                    <td style={td}>{d.bank}</td>
                    <td style={td}>{d.type}</td>
                    <td style={{ ...td, textAlign: "right" }}>{pr(d.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <p style={{ textAlign: "center", fontSize: 10, color: "#999", marginTop: 40, borderTop: "1px solid #eee", paddingTop: 10 }}>
          La Mar — Sistema de Control Operacional — {new Date().toLocaleDateString("es-HN")} {new Date().toLocaleTimeString("es-HN")}
        </p>
      </div>
    </div>,
    portalEl
  );
}
