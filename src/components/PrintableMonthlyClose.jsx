import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { INGREDIENTS } from "../lib/catalog";

const pr = (n) => `L ${Number(n).toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;

export function PrintableMonthlyClose({ data, month, branchId, onClose }) {
  const [ready, setReady] = useState(false);

  // Portal setup
  useEffect(() => {
    if (!ready) return;
    let el = document.getElementById("print-portal");
    if (!el) { el = document.createElement("div"); el.id = "print-portal"; document.body.appendChild(el); }
    el.style.display = "block";
    document.getElementById("root").style.display = "none";
    return () => {
      document.getElementById("root").style.display = "";
      if (el) el.style.display = "none";
    };
  }, [ready]);

  // Calcular todas las métricas del mes
  const report = useMemo(() => {
    const [year, m] = month.split("-");
    const prevDate = new Date(Number(year), Number(m) - 2, 1);
    const prevMonth = prevDate.toISOString().slice(0, 7);

    const monthSales = (data.sales || []).filter(s => s.date.startsWith(month) && (branchId === "all" || s.branchId === branchId));
    const prevSales = (data.sales || []).filter(s => s.date.startsWith(prevMonth) && (branchId === "all" || s.branchId === branchId));
    const branch = branchId === "all" ? null : data.branches.find(b => b.id === branchId);
    const branchName = branch?.name || "Todas las sucursales";

    const sum = (arr, fn) => arr.reduce((a, x) => a + fn(x), 0);

    // KPIs
    const sales = sum(monthSales, s => s.totalSales || 0);
    const expenses = sum(monthSales, s => s.totalExpenses || 0);
    const deposited = sum(monthSales, s => s.totalDeposited || 0);
    const utility = sales - expenses;

    const prevS = sum(prevSales, s => s.totalSales || 0);
    const salesGrowth = prevS > 0 ? ((sales - prevS) / prevS) * 100 : null;

    // Categorías
    const catMap = {};
    monthSales.forEach(s => (s.items || []).forEach(it => {
      catMap[it.category] = (catMap[it.category] || 0) + Number(it.total || 0);
    }));
    const categories = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

    // Top productos
    const prodMap = {};
    monthSales.forEach(s => (s.items || []).forEach(it => {
      if (!prodMap[it.productId]) prodMap[it.productId] = { name: it.productName, cat: it.category, qty: 0, rev: 0 };
      prodMap[it.productId].qty += Number(it.qty || 0);
      prodMap[it.productId].rev += Number(it.total || 0);
    }));
    const topProducts = Object.values(prodMap).sort((a, b) => b.rev - a.rev).slice(0, 15);

    // Costos y utilidad real (si recetas)
    const recipes = data.recipes || {};
    let cogs = 0, hasRecipes = false;
    monthSales.forEach(s => (s.items || []).forEach(it => {
      const r = recipes[it.productId];
      if (r?.ingredients?.length > 0) {
        hasRecipes = true;
        const unitCost = r.ingredients.reduce((a, i) => a + Number(i.qty || 0) * Number(i.costPerUnit || 0), 0);
        cogs += unitCost * Number(it.qty || 0);
      }
    }));
    const grossProfit = sales - cogs;
    const grossMargin = sales > 0 ? (grossProfit / sales) * 100 : 0;

    // Depósitos por banco
    const bankMap = {};
    monthSales.forEach(s => (s.deposits || []).forEach(d => {
      if (Number(d.amount) <= 0) return;
      const k = d.bank || "—";
      if (!bankMap[k]) bankMap[k] = { bank: k, total: 0, count: 0 };
      bankMap[k].total += Number(d.amount);
      bankMap[k].count += 1;
    }));
    const deposits = Object.values(bankMap).sort((a, b) => b.total - a.total);

    // Gastos por concepto
    const expMap = {};
    monthSales.forEach(s => (s.expenses || []).forEach(e => {
      if (Number(e.amount) <= 0) return;
      const k = e.description || "Sin descripción";
      if (!expMap[k]) expMap[k] = { desc: k, total: 0, count: 0 };
      expMap[k].total += Number(e.amount);
      expMap[k].count += 1;
    }));
    const expensesBy = Object.values(expMap).sort((a, b) => b.total - a.total).slice(0, 20);

    // Metas
    const goalMet = [];
    if (branchId === "all") {
      data.branches.forEach(b => {
        const goal = Number(b.goals?.[month] || 0);
        if (goal > 0) {
          const bs = monthSales.filter(s => s.branchId === b.id).reduce((a, s) => a + Number(s.totalSales || 0), 0);
          goalMet.push({ name: b.name, goal, sales: bs, pct: (bs / goal) * 100 });
        }
      });
    } else if (branch) {
      const goal = Number(branch.goals?.[month] || 0);
      if (goal > 0) goalMet.push({ name: branch.name, goal, sales, pct: (sales / goal) * 100 });
    }

    // Diferencias inventario del mes
    const monthInv = (data.inventory || []).filter(i => i.date.startsWith(month) && (branchId === "all" || i.branchId === branchId));
    let totalLoss = 0;
    monthInv.forEach(inv => {
      inv.items.forEach(it => {
        const ing = INGREDIENTS.find(x => x.id === it.ingredientId);
        if (!ing) return;
        const physicalUsed = Number(it.opening || 0) + Number(it.received || 0) - Number(it.physicalClose || 0);
        const diff = physicalUsed - Number(it.theoreticalUsed || 0);
        if (diff > 0) totalLoss += diff * ing.cost;
      });
    });

    return {
      month, prevMonth, branchName, days: monthSales.length, salesGrowth,
      sales, expenses, deposited, utility, cogs, grossProfit, grossMargin, hasRecipes,
      categories, topProducts, deposits, expensesBy, goalMet, totalLoss, monthInvDays: monthInv.length,
    };
  }, [data, month, branchId]);

  const monthLabel = useMemo(() => {
    const [y, m] = month.split("-");
    return new Date(Number(y), Number(m) - 1).toLocaleString("es-HN", { month: "long", year: "numeric" });
  }, [month]);

  const portalEl = document.getElementById("print-portal") || document.body;
  const td = { border: "1px solid #ddd", padding: "6px 10px", fontSize: 11 };
  const th = { ...td, background: "#f5f5f5", fontWeight: 700 };

  // Config previa
  if (!ready) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#0f1c30", border: "1px solid #1d3b5b", borderRadius: 16, padding: 28, width: 460, maxWidth: "90vw" }}>
          <h2 style={{ color: "#d4e8f7", fontSize: 16, fontWeight: 800, margin: "0 0 14px" }}>🖨️ Cierre Mensual</h2>
          <div style={{ background: "#0f0a06", border: "1px solid #1d3b5b", borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <p style={{ color: "#5d85aa", fontSize: 11, margin: "0 0 4px" }}>Período: <span style={{ color: "#d4e8f7", textTransform: "capitalize" }}>{monthLabel}</span></p>
            <p style={{ color: "#5d85aa", fontSize: 11, margin: "0 0 4px" }}>Alcance: <span style={{ color: "#d4e8f7" }}>{report.branchName}</span></p>
            <p style={{ color: "#5d85aa", fontSize: 11, margin: "0 0 4px" }}>Días con ventas: <span style={{ color: "#22c55e", fontWeight: 700 }}>{report.days}</span></p>
            <p style={{ color: "#5d85aa", fontSize: 11, margin: "0 0 4px" }}>Ventas del mes: <span style={{ color: "#22c55e", fontWeight: 700 }}>{pr(report.sales)}</span></p>
            <p style={{ color: "#5d85aa", fontSize: 11, margin: 0 }}>Utilidad operacional: <span style={{ color: report.utility >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{pr(report.utility)}</span></p>
          </div>
          <p style={{ color: "#8aafd2", fontSize: 11, marginBottom: 16, lineHeight: 1.5 }}>
            El PDF incluirá: KPIs ejecutivos, ventas por categoría, top productos, costos & utilidad (si hay recetas), depósitos por banco, gastos por concepto, cumplimiento de metas y diferencias de inventario del mes.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={onClose}
              style={{ background: "none", border: "1px solid #1d3b5b", color: "#5d85aa", borderRadius: 9, padding: "9px 18px", cursor: "pointer", fontSize: 12 }}>Cancelar</button>
            <button onClick={() => setReady(true)} disabled={report.days === 0}
              style={{ background: report.days > 0 ? "#0369a1" : "#1d3b5b", color: report.days > 0 ? "#fff" : "#3a5c7f", border: "none", borderRadius: 9, padding: "9px 20px", fontWeight: 700, fontSize: 12, cursor: report.days > 0 ? "pointer" : "not-allowed" }}>
              🖨️ Generar Cierre Mensual
            </button>
          </div>
        </div>
      </div>
    );
  }

  return createPortal(
    <div style={{ background: "#fff", minHeight: "100vh", fontFamily: "Arial,sans-serif", color: "#000" }}>
      <style>{`@media print { .no-print-bar { display: none !important; } @page { margin: 1.3cm; } .page-break { page-break-before: always; } }`}</style>

      <div className="no-print-bar" style={{ background: "#f5f5f5", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0369a1" }}>
        <h2 style={{ margin: 0, fontSize: 16, color: "#1a0000" }}>🖨️ Cierre Mensual — {monthLabel}</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setReady(false)} style={{ background: "none", border: "1px solid #ddd", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12 }}>← Opciones</button>
          <button onClick={() => window.print()} style={{ background: "#0369a1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>Imprimir / Guardar PDF</button>
          <button onClick={() => { document.getElementById("root").style.display = ""; onClose(); }} style={{ background: "none", border: "1px solid #ddd", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 12 }}>Cerrar</button>
        </div>
      </div>

      <div style={{ padding: "28px 36px", maxWidth: 820, margin: "0 auto" }}>

        {/* COVER */}
        <div style={{ textAlign: "center", paddingBottom: 20, borderBottom: "3px solid #0369a1", marginBottom: 24 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 26, color: "#0369a1" }}>🦐 LA MAR</h1>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>CIERRE MENSUAL</p>
          <p style={{ margin: "4px 0 0", fontSize: 13, textTransform: "capitalize" }}>{monthLabel}</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#666" }}>{report.branchName} · {report.days} días con ventas</p>
        </div>

        {/* RESUMEN EJECUTIVO */}
        <h3 style={{ fontSize: 14, margin: "0 0 10px", color: "#0369a1", borderBottom: "1px solid #eee", paddingBottom: 4 }}>📊 RESUMEN EJECUTIVO</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18 }}>
          <tbody>
            {[
              ["VENTAS TOTALES", pr(report.sales), "#006600"],
              ["GASTOS OPERACIONALES", pr(report.expenses), "#cc0000"],
              ["UTILIDAD OPERACIONAL", pr(report.utility), report.utility >= 0 ? "#006600" : "#cc0000"],
              ["TOTAL DEPOSITADO", pr(report.deposited), "#003399"],
              ...(report.hasRecipes ? [
                ["COSTO DE VENTAS (COGS)", pr(report.cogs), "#cc6600"],
                ["UTILIDAD BRUTA REAL", pr(report.grossProfit), report.grossProfit >= 0 ? "#006600" : "#cc0000"],
                ["MARGEN BRUTO REAL", `${report.grossMargin.toFixed(1)}%`, report.grossMargin >= 50 ? "#006600" : report.grossMargin >= 30 ? "#cc6600" : "#cc0000"],
              ] : []),
              ...(report.salesGrowth !== null ? [
                [`CRECIMIENTO vs ${report.prevMonth}`, `${report.salesGrowth >= 0 ? "+" : ""}${report.salesGrowth.toFixed(1)}%`, report.salesGrowth >= 0 ? "#006600" : "#cc0000"],
              ] : []),
            ].map(([lbl, val, col]) => (
              <tr key={lbl}>
                <td style={{ ...td, background: "#f9f9f9", fontWeight: 700, width: "55%" }}>{lbl}</td>
                <td style={{ ...td, textAlign: "right", color: col, fontWeight: 700, fontSize: 12 }}>{val}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* METAS */}
        {report.goalMet.length > 0 && (
          <>
            <h3 style={{ fontSize: 14, margin: "18px 0 10px", color: "#0369a1", borderBottom: "1px solid #eee", paddingBottom: 4 }}>🎯 CUMPLIMIENTO DE METAS</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18 }}>
              <thead><tr>{["Sucursal", "Meta", "Alcanzado", "% Cumplimiento"].map((h, i) => <th key={h} style={{ ...th, textAlign: i > 0 ? "right" : "left" }}>{h}</th>)}</tr></thead>
              <tbody>
                {report.goalMet.map((g, i) => (
                  <tr key={i}>
                    <td style={td}>{g.name}</td>
                    <td style={{ ...td, textAlign: "right" }}>{pr(g.goal)}</td>
                    <td style={{ ...td, textAlign: "right" }}>{pr(g.sales)}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 700, color: g.pct >= 100 ? "#006600" : g.pct >= 70 ? "#cc6600" : "#cc0000" }}>
                      {g.pct.toFixed(0)}% {g.pct >= 100 ? "🏆" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* VENTAS POR CATEGORÍA */}
        {report.categories.length > 0 && (
          <>
            <h3 style={{ fontSize: 14, margin: "18px 0 10px", color: "#0369a1", borderBottom: "1px solid #eee", paddingBottom: 4 }}>🦐 VENTAS POR CATEGORÍA</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18 }}>
              <thead><tr>{["Categoría", "% del total", "Monto"].map((h, i) => <th key={h} style={{ ...th, textAlign: i > 0 ? "right" : "left" }}>{h}</th>)}</tr></thead>
              <tbody>
                {report.categories.map(([cat, amt]) => (
                  <tr key={cat}>
                    <td style={td}>{cat}</td>
                    <td style={{ ...td, textAlign: "right" }}>{((amt / report.sales) * 100).toFixed(1)}%</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{pr(amt)}</td>
                  </tr>
                ))}
                <tr><td style={{ ...td, background: "#f5f5f5", fontWeight: 700 }}>TOTAL</td><td style={{ ...td, textAlign: "right", background: "#f5f5f5" }}>100%</td><td style={{ ...td, textAlign: "right", fontWeight: 900, background: "#f5f5f5", color: "#006600" }}>{pr(report.sales)}</td></tr>
              </tbody>
            </table>
          </>
        )}

        {/* TOP PRODUCTOS */}
        {report.topProducts.length > 0 && (
          <>
            <h3 style={{ fontSize: 14, margin: "18px 0 10px", color: "#0369a1", borderBottom: "1px solid #eee", paddingBottom: 4 }}>🏆 TOP 15 PRODUCTOS</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18 }}>
              <thead><tr>{["#", "Producto", "Cat.", "Vendido", "Ingresos"].map((h, i) => <th key={h} style={{ ...th, textAlign: i >= 3 ? "right" : "left" }}>{h}</th>)}</tr></thead>
              <tbody>
                {report.topProducts.map((p, i) => (
                  <tr key={i}>
                    <td style={{ ...td, textAlign: "center", color: "#666", width: 30 }}>{i + 1}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ ...td, fontSize: 10, color: "#666" }}>{p.cat}</td>
                    <td style={{ ...td, textAlign: "right" }}>{p.qty}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{pr(p.rev)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div className="page-break"></div>

        {/* DEPÓSITOS */}
        {report.deposits.length > 0 && (
          <>
            <h3 style={{ fontSize: 14, margin: "0 0 10px", color: "#0369a1", borderBottom: "1px solid #eee", paddingBottom: 4 }}>🏦 DEPÓSITOS POR CUENTA</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18 }}>
              <thead><tr>{["Cuenta / Banco", "Transacciones", "Total"].map((h, i) => <th key={h} style={{ ...th, textAlign: i > 0 ? "right" : "left" }}>{h}</th>)}</tr></thead>
              <tbody>
                {report.deposits.map((d, i) => (
                  <tr key={i}>
                    <td style={td}>{d.bank}</td>
                    <td style={{ ...td, textAlign: "right" }}>{d.count}</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 700, color: "#003399" }}>{pr(d.total)}</td>
                  </tr>
                ))}
                <tr><td colSpan={2} style={{ ...td, fontWeight: 700, background: "#f5f5f5" }}>TOTAL DEPOSITADO</td><td style={{ ...td, textAlign: "right", fontWeight: 900, background: "#f5f5f5", color: "#003399" }}>{pr(report.deposited)}</td></tr>
              </tbody>
            </table>
          </>
        )}

        {/* GASTOS */}
        {report.expensesBy.length > 0 && (
          <>
            <h3 style={{ fontSize: 14, margin: "18px 0 10px", color: "#0369a1", borderBottom: "1px solid #eee", paddingBottom: 4 }}>💸 GASTOS POR CONCEPTO (TOP 20)</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18 }}>
              <thead><tr>{["Concepto", "Veces", "% gastos", "Total"].map((h, i) => <th key={h} style={{ ...th, textAlign: i > 0 ? "right" : "left" }}>{h}</th>)}</tr></thead>
              <tbody>
                {report.expensesBy.map((e, i) => (
                  <tr key={i}>
                    <td style={td}>{e.desc}</td>
                    <td style={{ ...td, textAlign: "right" }}>{e.count}</td>
                    <td style={{ ...td, textAlign: "right" }}>{report.expenses > 0 ? ((e.total / report.expenses) * 100).toFixed(1) : 0}%</td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{pr(e.total)}</td>
                  </tr>
                ))}
                <tr><td colSpan={3} style={{ ...td, fontWeight: 700, background: "#f5f5f5" }}>TOTAL GASTOS</td><td style={{ ...td, textAlign: "right", fontWeight: 900, background: "#f5f5f5", color: "#cc0000" }}>{pr(report.expenses)}</td></tr>
              </tbody>
            </table>
          </>
        )}

        {/* INVENTARIO */}
        {report.monthInvDays > 0 && (
          <>
            <h3 style={{ fontSize: 14, margin: "18px 0 10px", color: "#0369a1", borderBottom: "1px solid #eee", paddingBottom: 4 }}>🔍 INVENTARIO</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18 }}>
              <tbody>
                <tr>
                  <td style={{ ...td, background: "#f9f9f9", fontWeight: 700, width: "55%" }}>Conteos realizados</td>
                  <td style={{ ...td, textAlign: "right" }}>{report.monthInvDays}</td>
                </tr>
                <tr>
                  <td style={{ ...td, background: "#f9f9f9", fontWeight: 700 }}>MERMA ESTIMADA (físico &gt; teórico)</td>
                  <td style={{ ...td, textAlign: "right", color: report.totalLoss > 0 ? "#cc0000" : "#006600", fontWeight: 700 }}>{pr(report.totalLoss)}</td>
                </tr>
                <tr>
                  <td style={{ ...td, background: "#f9f9f9", fontWeight: 700 }}>% sobre ventas</td>
                  <td style={{ ...td, textAlign: "right", color: report.totalLoss / report.sales > 0.03 ? "#cc0000" : "#006600" }}>
                    {report.sales > 0 ? `${((report.totalLoss / report.sales) * 100).toFixed(2)}%` : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {/* FIRMAS */}
        <div style={{ marginTop: 50, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
          {["Revisado por (Admin)", "Aprobado por (Dirección)"].map(role => (
            <div key={role} style={{ textAlign: "center" }}>
              <div style={{ borderTop: "1px solid #000", paddingTop: 4, fontSize: 11, fontWeight: 700 }}>{role}</div>
              <div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>Nombre y firma</div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 10, color: "#999", marginTop: 40, borderTop: "1px solid #eee", paddingTop: 10 }}>
          La Mar — Cierre Mensual — Generado {new Date().toLocaleDateString("es-HN")} {new Date().toLocaleTimeString("es-HN")}
        </p>
      </div>
    </div>,
    portalEl
  );
}
