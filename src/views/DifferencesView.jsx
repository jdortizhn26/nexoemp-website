import { useState, useMemo } from "react";
import { L } from "../lib/helpers";
import { INGREDIENTS } from "../lib/catalog";
import { Card, KCard } from "../components/ui";
import { filterByScope, filterBranches } from "../lib/permissions";

export function DifferencesView({ data, userRole }) {
  // Scope: filtrar inventarios a las sucursales que puede ver este usuario
  const scopedInv = filterByScope(userRole, data?.inventory || [], "branchId");
  const scopedBranches = filterBranches(userRole, data?.branches || []);
  data = { ...data, inventory: scopedInv, branches: scopedBranches };
  const [branchFilter, setBranchFilter] = useState("all");
  const [range, setRange] = useState("7d");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const inventory = data?.inventory || [];
  const branches = data?.branches || [];

  // Filtrar inventarios por rango y sucursal
  const filtered = useMemo(() => {
    let inv = [...inventory];
    const now = new Date();
    if (range === "7d") { const c = new Date(now - 7 * 864e5).toISOString().split("T")[0]; inv = inv.filter(x => x.date >= c); }
    if (range === "30d") { const c = new Date(now - 30 * 864e5).toISOString().split("T")[0]; inv = inv.filter(x => x.date >= c); }
    if (range === "custom") {
      if (dateFrom) inv = inv.filter(x => x.date >= dateFrom);
      if (dateTo) inv = inv.filter(x => x.date <= dateTo);
    }
    if (branchFilter !== "all") inv = inv.filter(x => x.branchId === branchFilter);
    return inv;
  }, [inventory, range, branchFilter, dateFrom, dateTo]);

  // Agregar diferencias por ingrediente
  const byIngredient = useMemo(() => {
    const m = {};
    INGREDIENTS.forEach(ing => {
      m[ing.id] = { ing, opening: 0, received: 0, theoretical: 0, physical: 0, days: 0 };
    });
    filtered.forEach(inv => {
      inv.items.forEach(it => {
        if (!m[it.ingredientId]) return;
        const entry = m[it.ingredientId];
        const opening = Number(it.opening || 0);
        const received = Number(it.received || 0);
        const theoretical = Number(it.theoreticalUsed || 0);
        const physicalClose = Number(it.physicalClose || 0);
        const physicalUsed = opening + received - physicalClose; // consumo real

        entry.opening += opening;
        entry.received += received;
        entry.theoretical += theoretical;
        entry.physical += physicalUsed;
        entry.days += 1;
      });
    });
    return Object.values(m)
      .map(e => ({ ...e, diff: e.physical - e.theoretical, cost: (e.physical - e.theoretical) * e.ing.cost }))
      .filter(e => e.days > 0)
      .sort((a, b) => b.cost - a.cost);
  }, [filtered]);

  // KPIs
  const totalLoss = byIngredient.reduce((a, e) => a + (e.cost > 0 ? e.cost : 0), 0);
  const totalSavings = byIngredient.reduce((a, e) => a + (e.cost < 0 ? Math.abs(e.cost) : 0), 0);
  const netImpact = totalLoss - totalSavings;
  const criticalCount = byIngredient.filter(e => e.cost > 50).length;

  // Por sucursal (resumen)
  const bySucursal = useMemo(() => {
    const m = {};
    filtered.forEach(inv => {
      const br = branches.find(b => b.id === inv.branchId);
      const key = inv.branchId;
      if (!m[key]) m[key] = { name: br?.name || inv.branchId, loss: 0, days: 0 };
      inv.items.forEach(it => {
        const ing = INGREDIENTS.find(i => i.id === it.ingredientId);
        if (!ing) return;
        const physicalUsed = Number(it.opening || 0) + Number(it.received || 0) - Number(it.physicalClose || 0);
        const diff = physicalUsed - Number(it.theoreticalUsed || 0);
        if (diff > 0) m[key].loss += diff * ing.cost;
      });
      m[key].days += 1;
    });
    return Object.values(m).sort((a, b) => b.loss - a.loss);
  }, [filtered, branches]);

  const dinp = { background: "#1e0e06", border: "1px solid #1d3b5b", borderRadius: 7, padding: "6px 10px", color: "#d4e8f7", fontSize: 11, outline: "none" };

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header + filtros */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ color: "#d4e8f7", fontSize: 22, fontWeight: 800, margin: 0 }}>🔍 Diferencias de Inventario</h1>
          <p style={{ color: "#5d85aa", fontSize: 12, marginTop: 4 }}>Detecta mermas y robos comparando consumo físico vs teórico</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}
            style={{ background: "#16304a", border: "1px solid #1d3b5b", color: "#d4e8f7", borderRadius: 9, padding: "8px 12px", fontSize: 12 }}>
            <option value="all">Todas las sucursales</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <div style={{ display: "flex", background: "#16304a", border: "1px solid #1d3b5b", borderRadius: 9, overflow: "hidden" }}>
            {[["7d", "7 días"], ["30d", "30 días"], ["all", "Todo"], ["custom", "📅 Fechas"]].map(([r, lbl]) => (
              <button key={r} onClick={() => setRange(r)} style={{
                padding: "8px 14px", fontSize: 12, border: "none", cursor: "pointer",
                background: range === r ? "#0369a1" : "transparent", color: range === r ? "#fff" : "#5d85aa",
              }}>{lbl}</button>
            ))}
          </div>
          {range === "custom" && (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={dinp} />
              <span style={{ color: "#3a5c7f", fontSize: 11 }}>→</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={dinp} />
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KCard label="Merma estimada" val={L(totalLoss)} sub="consumo > teórico" col="#ef4444" icon="🔴" />
        <KCard label="Excedentes" val={L(totalSavings)} sub="sobró producto" col="#22c55e" icon="✓" />
        <KCard label="Impacto neto" val={L(netImpact)} sub={netImpact > 0 ? "pérdida" : "ganancia"} col={netImpact > 0 ? "#ef4444" : "#22c55e"} icon="📊" />
        <KCard label="Items críticos" val={criticalCount} sub="pérdida > L 50" col="#f97316" icon="⚠" />
      </div>

      {filtered.length === 0 ? (
        <Card><p style={{ color: "#3a5c7f", fontSize: 12, textAlign: "center", padding: 24 }}>Sin conteos de inventario en el período seleccionado</p></Card>
      ) : (
        <>
          {/* Por sucursal */}
          {branchFilter === "all" && bySucursal.length > 1 && (
            <Card>
              <h2 style={{ color: "#d4e8f7", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🏪 Merma por Sucursal</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr style={{ background: "#16304a" }}>
                  {["Sucursal", "Días contados", "Merma estimada"].map((h, i) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: i >= 1 ? "right" : "left", color: "#5d85aa", fontSize: 11, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {bySucursal.map((s, i) => (
                    <tr key={i} style={{ borderTop: "1px solid #16304a" }}>
                      <td style={{ padding: "10px 12px", color: "#b8d8ee", fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#8aafd2" }}>{s.days}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: s.loss > 0 ? "#ef4444" : "#22c55e", fontWeight: 800 }}>{L(s.loss)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* Tabla detallada por ingrediente */}
          <Card>
            <h2 style={{ color: "#d4e8f7", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📋 Detalle por Ingrediente</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr style={{ background: "#16304a" }}>
                {["Ingrediente", "Unidad", "Apertura", "+Recibido", "Consumo teórico", "Consumo físico", "Diferencia", "Costo"].map((h, i) => (
                  <th key={h} style={{ padding: "9px 10px", textAlign: i >= 2 ? "right" : "left", color: "#5d85aa", fontSize: 10, fontWeight: 600 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {byIngredient.map(e => {
                  const severity = e.cost > 50 ? "critical" : e.cost > 10 ? "warn" : e.cost > -10 ? "ok" : "saving";
                  const col = severity === "critical" ? "#ef4444" : severity === "warn" ? "#f97316" : severity === "ok" ? "#8aafd2" : "#22c55e";
                  const bgRow = severity === "critical" ? "#1a0505" : severity === "warn" ? "#1a1005" : "transparent";
                  return (
                    <tr key={e.ing.id} style={{ borderTop: "1px solid #16304a", background: bgRow }}>
                      <td style={{ padding: "8px 10px", color: "#b8d8ee", fontWeight: 600 }}>{e.ing.name}</td>
                      <td style={{ padding: "8px 10px", color: "#5d85aa" }}>{e.ing.unit}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right", color: "#5d85aa" }}>{e.opening.toFixed(1)}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right", color: "#22c55e" }}>{e.received.toFixed(1)}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right", color: "#8aafd2" }}>{e.theoretical.toFixed(2)}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right", color: "#d4e8f7", fontWeight: 600 }}>{e.physical.toFixed(2)}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right", color: col, fontWeight: 700 }}>
                        {e.diff >= 0 ? "+" : ""}{e.diff.toFixed(2)}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", color: col, fontWeight: 800 }}>
                        {e.cost >= 0 ? L(e.cost) : `(${L(Math.abs(e.cost))})`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop: 12, display: "flex", gap: 16, fontSize: 10, color: "#5d85aa", flexWrap: "wrap" }}>
              <span>🔴 Crítico: pérdida &gt; L 50</span>
              <span>🟠 Advertencia: pérdida L 10–50</span>
              <span>🟢 Normal o excedente</span>
              <span style={{ marginLeft: "auto" }}>💡 <strong>Consumo físico</strong> = Apertura + Recibido − Cierre contado</span>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
