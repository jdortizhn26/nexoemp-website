import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const pr = (n) => `L ${Number(n).toLocaleString("es-HN",{minimumFractionDigits:2})}`;

export function PrintableReportSummary({ filtered, branches, totals, catRev, depositsByBank, expByDesc, depositsByMonthWeek, range, dateFrom, dateTo, branchFilter, onClose }) {
  const [sections, setSections] = useState({
    kpis: true, categories: true, deposits: true, expenses: true, depositDetail: false,
  });
  const [ready, setReady] = useState(false);

  const toggle = (key) => setSections(p => ({ ...p, [key]: !p[key] }));

  const brName = branchFilter === "all" ? "Todas las sucursales" : (branches.find(b => b.id === branchFilter)?.name || branchFilter);
  const periodLabel = range === "7d" ? "Últimos 7 días"
    : range === "30d" ? "Últimos 30 días"
    : range === "custom" ? `${dateFrom || "inicio"} → ${dateTo || "hoy"}`
    : "Todo el historial";

  const anySelected = Object.values(sections).some(v => v);

  // Config modal (no print yet)
  if (!ready) {
    const chk = (key, label) => (
      <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #16304a", cursor: "pointer" }}>
        <input type="checkbox" checked={sections[key]} onChange={() => toggle(key)}
          style={{ accentColor: "#0369a1", width: 16, height: 16 }} />
        <span style={{ color: "#d4e8f7", fontSize: 13 }}>{label}</span>
      </label>
    );

    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#0f1c30", border: "1px solid #1d3b5b", borderRadius: 16, padding: 28, width: 440, maxWidth: "90vw" }}>
          <h2 style={{ color: "#d4e8f7", fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>🖨️ Generar PDF de Reportes</h2>
          <div style={{ background: "#0f0a06", border: "1px solid #1d3b5b", borderRadius: 10, padding: 12, marginBottom: 16 }}>
            <p style={{ color: "#5d85aa", fontSize: 11, margin: "0 0 4px" }}>Período: <span style={{ color: "#d4e8f7" }}>{periodLabel}</span></p>
            <p style={{ color: "#5d85aa", fontSize: 11, margin: 0 }}>Sucursal: <span style={{ color: "#d4e8f7" }}>{brName}</span></p>
            <p style={{ color: "#5d85aa", fontSize: 11, margin: "4px 0 0" }}>Registros: <span style={{ color: "#d4e8f7" }}>{filtered.length} día(s)</span></p>
          </div>
          <p style={{ color: "#5d85aa", fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Incluir en el PDF:</p>
          {chk("kpis", "📊 KPIs (Ventas, Gastos, Utilidad, Depositado)")}
          {chk("categories", "🦐 Ventas por Categoría")}
          {chk("deposits", "🏦 Depósitos por Banco")}
          {chk("expenses", "💸 Top Gastos por Concepto")}
          {chk("depositDetail", "📋 Detalle depósitos (semana / mes)")}
          <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
            <button onClick={onClose}
              style={{ background: "none", border: "1px solid #1d3b5b", color: "#5d85aa", borderRadius: 9, padding: "9px 18px", cursor: "pointer", fontSize: 12 }}>Cancelar</button>
            <button onClick={() => setReady(true)} disabled={!anySelected}
              style={{ background: anySelected ? "#0369a1" : "#1d3b5b", color: anySelected ? "#fff" : "#3a5c7f", border: "none", borderRadius: 9, padding: "9px 20px", fontWeight: 700, fontSize: 12, cursor: anySelected ? "pointer" : "not-allowed" }}>
              🖨️ Generar PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Printable view — rendered via Portal
  return <PrintPortal sections={sections} setReady={setReady} onClose={onClose}
    totals={totals} catRev={catRev} depositsByBank={depositsByBank} expByDesc={expByDesc}
    depositsByMonthWeek={depositsByMonthWeek} periodLabel={periodLabel} brName={brName} filtered={filtered} />;
}

// ─── Portal component ──────────────────────────────────────────────────────
function PrintPortal({ sections, setReady, onClose, totals, catRev, depositsByBank, expByDesc, depositsByMonthWeek, periodLabel, brName, filtered }) {
  const totalDep = depositsByBank.reduce((a, d) => a + d.total, 0);
  const totalExp = expByDesc.reduce((a, e) => a + e.total, 0);
  const DL = { deposito: "Depósito", tarjeta: "Tarjeta", transferencia: "Transferencia", pedidos_ya: "Pedidos Ya" };

  // Create a div outside #root for the portal
  useEffect(() => {
    const el = document.getElementById("print-portal");
    if (el) el.style.display = "block";
    document.getElementById("root").style.display = "none";
    return () => {
      document.getElementById("root").style.display = "";
      if (el) el.style.display = "none";
    };
  }, []);

  // Ensure portal container exists
  useEffect(() => {
    if (!document.getElementById("print-portal")) {
      const div = document.createElement("div");
      div.id = "print-portal";
      document.body.appendChild(div);
    }
  }, []);

  const td = { border: "1px solid #ddd", padding: "6px 10px", fontSize: 11 };
  const th = { ...td, background: "#f5f5f5", fontWeight: 700 };

  const portalEl = document.getElementById("print-portal") || document.body;

  return createPortal(
    <div style={{ background: "#fff", minHeight: "100vh", fontFamily: "Arial,sans-serif", color: "#000" }}>
      {/* Toolbar — hidden on print */}
      <div className="no-print-bar" style={{ background: "#f5f5f5", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0369a1" }}>
        <h2 style={{ margin: 0, fontSize: 16, color: "#1a0000" }}>🖨️ Reporte Condensado</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { document.getElementById("root").style.display = ""; setReady(false); }}
            style={{ background: "none", border: "1px solid #ddd", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12 }}>← Opciones</button>
          <button onClick={() => window.print()}
            style={{ background: "#0369a1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Imprimir / Guardar PDF</button>
          <button onClick={() => { document.getElementById("root").style.display = ""; onClose(); }}
            style={{ background: "none", border: "1px solid #ddd", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12 }}>Cerrar</button>
        </div>
      </div>
      <style>{`@media print { .no-print-bar { display: none !important; } @page { margin: 1.5cm; } }`}</style>

      {/* Content */}
      <div style={{ padding: "24px 32px", maxWidth: 800, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20, borderBottom: "2px solid #0369a1", paddingBottom: 12 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, color: "#0369a1" }}>🦐 LA MAR</h1>
          <p style={{ margin: 0, fontSize: 14 }}><strong>Reporte Condensado</strong></p>
          <p style={{ margin: 0, fontSize: 12 }}>{periodLabel} &nbsp;|&nbsp; {brName}</p>
          <p style={{ margin: 0, fontSize: 11, color: "#666" }}>{filtered.length} día(s) de operación</p>
        </div>

        {/* KPIs */}
        {sections.kpis && (
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
            <thead><tr>{["INDICADOR", "MONTO"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {[
                ["VENTAS TOTALES", totals.sales, "#006600"],
                ["GASTOS TOTALES", totals.exp, "#cc0000"],
                ["UTILIDAD BRUTA", totals.sales - totals.exp, totals.sales - totals.exp >= 0 ? "#006600" : "#cc0000"],
                ["TOTAL DEPOSITADO", totals.dep, "#003399"],
                ["MARGEN", null, "#333"],
              ].map(([lbl, val, col]) => (
                <tr key={lbl}>
                  <td style={td}><strong>{lbl}</strong></td>
                  <td style={{ ...td, textAlign: "right", color: col, fontWeight: 700 }}>
                    {lbl === "MARGEN" ? `${totals.sales > 0 ? (((totals.sales - totals.exp) / totals.sales) * 100).toFixed(1) : 0}%` : pr(val)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Categories */}
        {sections.categories && catRev.length > 0 && (
          <>
            <h3 style={{ fontSize: 13, margin: "20px 0 8px", color: "#0369a1" }}>VENTAS POR CATEGORÍA</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
              <thead><tr>{["Categoría", "% Ventas", "Total"].map((h, i) => <th key={h} style={{ ...th, textAlign: i > 0 ? "right" : "left" }}>{h}</th>)}</tr></thead>
              <tbody>
                {catRev.map(([cat, rev]) => (
                  <tr key={cat}>
                    <td style={td}>{cat}</td>
                    <td style={{ ...td, textAlign: "right" }}>{totals.sales > 0 ? ((rev / totals.sales) * 100).toFixed(1) : 0}%</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{pr(rev)}</td>
                  </tr>
                ))}
                <tr><td style={{ ...td, fontWeight: 700 }}>TOTAL</td><td style={{ ...td, textAlign: "right" }}>100%</td><td style={{ ...td, textAlign: "right", fontWeight: 900, color: "#006600" }}>{pr(totals.sales)}</td></tr>
              </tbody>
            </table>
          </>
        )}

        {/* Deposits by bank */}
        {sections.deposits && depositsByBank.length > 0 && (
          <>
            <h3 style={{ fontSize: 13, margin: "20px 0 8px", color: "#0369a1" }}>DEPÓSITOS POR CUENTA BANCARIA</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
              <thead><tr>{["Cuenta / Banco", "Transacciones", "Tipo", "Total"].map((h, i) => <th key={h} style={{ ...th, textAlign: i > 0 ? "right" : "left" }}>{h}</th>)}</tr></thead>
              <tbody>
                {depositsByBank.map((d, i) => {
                  const mainType = Object.entries(d.types).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
                  return (
                    <tr key={i}>
                      <td style={td}>{d.bank}</td>
                      <td style={{ ...td, textAlign: "right" }}>{d.count}</td>
                      <td style={{ ...td, textAlign: "right" }}>{DL[mainType] || mainType}</td>
                      <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{pr(d.total)}</td>
                    </tr>
                  );
                })}
                <tr><td colSpan={3} style={{ ...td, fontWeight: 700 }}>TOTAL DEPOSITADO</td><td style={{ ...td, textAlign: "right", fontWeight: 900, color: "#003399" }}>{pr(totalDep)}</td></tr>
              </tbody>
            </table>
          </>
        )}

        {/* Expenses by concept */}
        {sections.expenses && expByDesc.length > 0 && (
          <>
            <h3 style={{ fontSize: 13, margin: "20px 0 8px", color: "#0369a1" }}>GASTOS POR CONCEPTO</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
              <thead><tr>{["Concepto", "Veces", "% Gastos", "Total"].map((h, i) => <th key={h} style={{ ...th, textAlign: i > 0 ? "right" : "left" }}>{h}</th>)}</tr></thead>
              <tbody>
                {expByDesc.map((e, i) => (
                  <tr key={i}>
                    <td style={td}>{e.desc}</td>
                    <td style={{ ...td, textAlign: "right" }}>{e.count}</td>
                    <td style={{ ...td, textAlign: "right" }}>{totalExp > 0 ? ((e.total / totalExp) * 100).toFixed(1) : 0}%</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{pr(e.total)}</td>
                  </tr>
                ))}
                <tr><td colSpan={3} style={{ ...td, fontWeight: 700 }}>TOTAL GASTOS</td><td style={{ ...td, textAlign: "right", fontWeight: 900, color: "#cc0000" }}>{pr(totalExp)}</td></tr>
              </tbody>
            </table>
          </>
        )}

        {/* Deposit detail by month/week */}
        {sections.depositDetail && depositsByMonthWeek.length > 0 && (
          <>
            <h3 style={{ fontSize: 13, margin: "20px 0 8px", color: "#0369a1" }}>DETALLE DEPÓSITOS POR SEMANA</h3>
            {depositsByMonthWeek.map(month => {
              const [y, m] = month.key.split("-");
              const monthName = new Date(Number(y), Number(m) - 1).toLocaleString("es-HN", { month: "long", year: "numeric" });
              return (
                <div key={month.key} style={{ marginBottom: 16 }}>
                  <p style={{ fontWeight: 800, fontSize: 12, margin: "12px 0 6px", textTransform: "capitalize", borderBottom: "1px solid #ccc", paddingBottom: 4 }}>
                    📅 {monthName} — {pr(month.total)}
                  </p>
                  {month.weeks.map(week => {
                    const wEnd = new Date(week.start + "T12:00:00"); wEnd.setDate(wEnd.getDate() + 6);
                    const wLabel = `${week.start.slice(5)} → ${wEnd.toISOString().split("T")[0].slice(5)}`;
                    return (
                      <div key={week.start} style={{ marginLeft: 10, marginBottom: 10 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, margin: "6px 0", color: "#555" }}>
                          Semana {wLabel} — Subtotal: {pr(week.total)}
                        </p>
                        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
                          <thead><tr>{["Fecha", "Sucursal", "Banco", "Tipo", "Ref", "Monto"].map((h, i) => (
                            <th key={h} style={{ ...th, fontSize: 10, textAlign: i >= 4 ? "right" : "left" }}>{h}</th>
                          ))}</tr></thead>
                          <tbody>
                            {week.lines.map((d, i) => (
                              <tr key={i}>
                                <td style={{ ...td, fontSize: 10 }}>{d.date}</td>
                                <td style={{ ...td, fontSize: 10 }}>{d.branch}</td>
                                <td style={{ ...td, fontSize: 10 }}>{d.bank}</td>
                                <td style={{ ...td, fontSize: 10 }}>{DL[d.type] || d.type}</td>
                                <td style={{ ...td, fontSize: 10, textAlign: "right" }}>{d.ref || "—"}</td>
                                <td style={{ ...td, fontSize: 10, textAlign: "right", fontWeight: 700 }}>{pr(d.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}

        <p style={{ textAlign: "center", fontSize: 10, color: "#999", marginTop: 24, borderTop: "1px solid #eee", paddingTop: 10 }}>
          La Mar — Reporte Condensado — Generado {new Date().toLocaleDateString("es-HN")} {new Date().toLocaleTimeString("es-HN")}
        </p>
      </div>
    </div>,
    portalEl
  );
}
