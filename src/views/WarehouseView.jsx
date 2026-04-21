import { useState, useMemo } from "react";
import { L } from "../lib/helpers";
import { INGREDIENTS } from "../lib/catalog";
import { Card } from "../components/ui";

const PROJECTION_DAYS = 14; // Ventana para calcular consumo promedio

export function WarehouseView({ data, saveWarehouse, createTransfer, updateRequisitionStatus, approveRequisition }) {
  const [tab, setTab] = useState("stock");
  const [search, setSearch] = useState("");
  const [editQty, setEditQty] = useState({});
  const [transferBranch, setTransferBranch] = useState(data.branches[0]?.id || "");
  const [transferItems, setTransferItems] = useState({});
  const [flash, setFlash] = useState("");
  const [reviewReq, setReviewReq] = useState(null); // {req, items:{ingredientId:qty}}

  const warehouse = data.warehouse || {};
  const transfers = data.transfers || [];
  const requisitions = data.requisitions || [];
  const pendingReqs = requisitions.filter(r => r.status === "pendiente");

  // ─── PROYECCIÓN DE STOCK ────────────────────────────────────────────────
  // Consumo teórico diario promedio basado en ventas últimos N días × recetas
  const projection = useMemo(() => {
    const recipes = data.recipes || {};
    const cutoff = new Date(Date.now() - PROJECTION_DAYS * 864e5).toISOString().split("T")[0];
    const recentSales = (data.sales || []).filter(s => s.date >= cutoff);

    // Consumo total de cada ingrediente en la ventana
    const totalUsed = {};
    INGREDIENTS.forEach(ing => { totalUsed[ing.id] = 0; });
    recentSales.forEach(sale => {
      (sale.items || []).forEach(item => {
        const r = recipes[item.productId];
        if (!r?.ingredients) return;
        r.ingredients.forEach(ri => {
          const ing = INGREDIENTS.find(i => i.id === ri.ingredientId || i.name === ri.name);
          if (ing) totalUsed[ing.id] += Number(ri.qty || 0) * Number(item.qty || 0);
        });
      });
    });

    // Cantidad de días únicos con ventas (para promedio más realista)
    const uniqueDays = new Set(recentSales.map(s => s.date)).size || 1;

    return INGREDIENTS.map(ing => {
      const stock = Number(warehouse[ing.id]?.stock || 0);
      const totalConsumed = totalUsed[ing.id];
      const avgDaily = totalConsumed / uniqueDays;
      const daysLeft = avgDaily > 0 ? stock / avgDaily : Infinity;
      const emptyDate = isFinite(daysLeft) && avgDaily > 0
        ? new Date(Date.now() + daysLeft * 864e5).toISOString().split("T")[0]
        : null;
      return { ing, stock, totalConsumed, avgDaily, daysLeft, emptyDate };
    }).sort((a, b) => a.daysLeft - b.daysLeft); // críticos primero
  }, [data.sales, data.recipes, warehouse]);

  const critical = projection.filter(p => p.daysLeft < 3 && p.avgDaily > 0);
  const warning = projection.filter(p => p.daysLeft >= 3 && p.daysLeft < 7 && p.avgDaily > 0);
  const withData = projection.filter(p => p.avgDaily > 0);
  const noData = projection.filter(p => p.avgDaily === 0);

  // Stock list with search
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return INGREDIENTS.filter(i => !q || i.name.toLowerCase().includes(q));
  }, [search]);

  const inp = (s = {}) => ({ background: "#11233a", border: "1px solid #1d3b5b", borderRadius: 8, padding: "8px 10px", color: "#d4e8f7", fontSize: 12, outline: "none", ...s });

  // Save stock changes
  const handleSaveStock = async () => {
    if (Object.keys(editQty).length === 0) return;
    const updated = { ...warehouse };
    Object.entries(editQty).forEach(([id, qty]) => {
      updated[id] = { ...(updated[id] || {}), stock: Number(qty), minStock: updated[id]?.minStock || 0 };
    });
    await saveWarehouse(updated, warehouse);
    setEditQty({});
    setFlash("✓ Stock actualizado");
    setTimeout(() => setFlash(""), 3000);
  };

  // Create transfer
  const handleTransfer = async () => {
    const items = Object.entries(transferItems)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([id, qty]) => ({ ingredientId: id, qty: Number(qty) }));
    if (items.length === 0) return alert("Agrega al menos un ingrediente al envío");
    if (!transferBranch) return alert("Selecciona una sucursal");
    await createTransfer({ branchId: transferBranch, items });
    setTransferItems({});
    setFlash("✓ Envío creado — pendiente de recepción");
    setTimeout(() => setFlash(""), 4000);
  };

  const pendingTransfers = transfers.filter(t => t.status === "pendiente");
  const recentTransfers = transfers.slice(0, 20);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ color: "#d4e8f7", fontSize: 22, fontWeight: 800, margin: 0 }}>🏭 Bodega Central</h1>
        {flash && <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 700 }}>{flash}</span>}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #1d3b5b", gap: 0 }}>
        {[
          ["stock", "📦 Stock"],
          ["projection", `📊 Proyección${critical.length > 0 ? ` 🔴${critical.length}` : ""}`],
          ["requisitions", `📝 Requisiciones${pendingReqs.length > 0 ? ` (${pendingReqs.length})` : ""}`],
          ["transfer", "🚚 Enviar a Sucursal"],
          ["history", "📋 Historial"],
        ].map(([t, lbl]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "10px 20px", fontSize: 12, fontWeight: tab === t ? 700 : 400, border: "none",
            borderBottom: tab === t ? "2px solid #0369a1" : "2px solid transparent",
            background: "none", cursor: "pointer", color: tab === t ? "#d4e8f7" : "#5d85aa",
          }}>{lbl}</button>
        ))}
      </div>

      {/* TAB: STOCK */}
      {tab === "stock" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input placeholder="🔍 Buscar ingrediente..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inp(), flex: 1, maxWidth: 300 }} />
            {Object.keys(editQty).length > 0 && (
              <button onClick={handleSaveStock} style={{ background: "#0369a1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                💾 Guardar ({Object.keys(editQty).length} cambios)
              </button>
            )}
          </div>

          <Card>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ background: "#16304a" }}>
                {["Ingrediente", "Unidad", "Stock Actual", "Mín.", "Costo Unit.", "Valor Total", "Estado"].map((h, i) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: i >= 2 ? "right" : "left", color: "#5d85aa", fontSize: 11, fontWeight: 600 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map(ing => {
                  const w = warehouse[ing.id] || { stock: 0, minStock: 0 };
                  const stock = editQty[ing.id] !== undefined ? Number(editQty[ing.id]) : w.stock;
                  const isLow = stock <= w.minStock && w.minStock > 0;
                  const isOut = stock <= 0;
                  return (
                    <tr key={ing.id} style={{ borderTop: "1px solid #16304a", background: isOut ? "#1a0505" : isLow ? "#1a1005" : "transparent" }}>
                      <td style={{ padding: "10px 12px", color: "#b8d8ee", fontWeight: 600 }}>{ing.name}</td>
                      <td style={{ padding: "10px 12px", color: "#5d85aa" }}>{ing.unit}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        <input type="number" value={editQty[ing.id] !== undefined ? editQty[ing.id] : w.stock}
                          onChange={e => setEditQty(p => ({ ...p, [ing.id]: e.target.value }))}
                          style={{ ...inp(), width: 70, textAlign: "right", background: editQty[ing.id] !== undefined ? "#16304a" : "#11233a", borderColor: editQty[ing.id] !== undefined ? "#0369a1" : "#1d3b5b" }} />
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#3a5c7f" }}>{w.minStock}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#8aafd2" }}>{L(ing.cost)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#a78bfa", fontWeight: 700 }}>{L(stock * ing.cost)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        <span style={{
                          background: isOut ? "#450a0a" : isLow ? "#451a03" : "#064e3b",
                          color: isOut ? "#ef4444" : isLow ? "#fbbf24" : "#22c55e",
                          padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700,
                        }}>{isOut ? "SIN STOCK" : isLow ? "BAJO" : "OK"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* TAB: PROYECCIÓN */}
      {tab === "projection" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#0c1828", border: "1px solid #1d3b5b", borderRadius: 12, padding: 14, fontSize: 12, color: "#5d85aa" }}>
            💡 Proyección calculada con el <strong style={{ color: "#d4e8f7" }}>consumo promedio de los últimos {PROJECTION_DAYS} días</strong> según ventas × recetas cargadas. Los ingredientes sin recetas asociadas aparecen al final como "sin datos".
          </div>

          {withData.length === 0 && (
            <Card>
              <p style={{ color: "#3a5c7f", fontSize: 12, textAlign: "center", padding: 24 }}>
                No hay datos de consumo. Cargá recetas en "Recetas & Costos" y registrá ventas para ver la proyección.
              </p>
            </Card>
          )}

          {/* KPIs */}
          {withData.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <div style={{ background: "#1a0505", border: "1px solid #450a0a", borderRadius: 12, padding: 14 }}>
                <p style={{ color: "#ef4444", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 6px" }}>🔴 Crítico (&lt; 3 días)</p>
                <p style={{ color: "#fca5a5", fontSize: 22, fontWeight: 800, margin: 0 }}>{critical.length}</p>
                <p style={{ color: "#5d85aa", fontSize: 10, margin: "4px 0 0" }}>requieren reposición urgente</p>
              </div>
              <div style={{ background: "#1a1005", border: "1px solid #92400e", borderRadius: 12, padding: 14 }}>
                <p style={{ color: "#fbbf24", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 6px" }}>🟡 Bajo (3–7 días)</p>
                <p style={{ color: "#fde68a", fontSize: 22, fontWeight: 800, margin: 0 }}>{warning.length}</p>
                <p style={{ color: "#5d85aa", fontSize: 10, margin: "4px 0 0" }}>planificar compra pronto</p>
              </div>
              <div style={{ background: "#05170c", border: "1px solid #064e3b", borderRadius: 12, padding: 14 }}>
                <p style={{ color: "#22c55e", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 6px" }}>🟢 Cobertura OK (&gt; 7 días)</p>
                <p style={{ color: "#86efac", fontSize: 22, fontWeight: 800, margin: 0 }}>{withData.length - critical.length - warning.length}</p>
                <p style={{ color: "#5d85aa", fontSize: 10, margin: "4px 0 0" }}>stock suficiente</p>
              </div>
            </div>
          )}

          {/* Tabla */}
          <Card>
            <h2 style={{ color: "#d4e8f7", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🔮 Proyección por Ingrediente</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr style={{ background: "#16304a" }}>
                {["Ingrediente", "Unidad", "Stock actual", `Consumo / ${PROJECTION_DAYS}d`, "Prom. diario", "Días restantes", "Se agota"].map((h, i) => (
                  <th key={h} style={{ padding: "9px 10px", textAlign: i >= 2 ? "right" : "left", color: "#5d85aa", fontSize: 10, fontWeight: 600 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {withData.map(p => {
                  const col = p.daysLeft < 3 ? "#ef4444" : p.daysLeft < 7 ? "#fbbf24" : "#22c55e";
                  const bgRow = p.daysLeft < 3 ? "#1a0505" : p.daysLeft < 7 ? "#1a1005" : "transparent";
                  return (
                    <tr key={p.ing.id} style={{ borderTop: "1px solid #16304a", background: bgRow }}>
                      <td style={{ padding: "7px 10px", color: "#b8d8ee", fontWeight: 600 }}>{p.ing.name}</td>
                      <td style={{ padding: "7px 10px", color: "#5d85aa" }}>{p.ing.unit}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", color: p.stock > 0 ? "#d4e8f7" : "#ef4444", fontWeight: 700 }}>{p.stock.toFixed(2)}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", color: "#8aafd2" }}>{p.totalConsumed.toFixed(2)}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", color: "#8aafd2" }}>{p.avgDaily.toFixed(2)}</td>
                      <td style={{ padding: "7px 10px", textAlign: "right", color: col, fontWeight: 800 }}>
                        {isFinite(p.daysLeft) ? `${p.daysLeft.toFixed(1)} d` : "—"}
                      </td>
                      <td style={{ padding: "7px 10px", textAlign: "right", color: "#5d85aa", fontSize: 10 }}>{p.emptyDate || "—"}</td>
                    </tr>
                  );
                })}
                {noData.length > 0 && (
                  <>
                    <tr><td colSpan={7} style={{ padding: "10px", background: "#0f0a06", color: "#3a5c7f", fontSize: 11, fontStyle: "italic", textAlign: "center" }}>
                      ↓ Sin datos de consumo (ingredientes sin receta asociada o sin ventas) ↓
                    </td></tr>
                    {noData.map(p => (
                      <tr key={p.ing.id} style={{ borderTop: "1px solid #16304a", opacity: 0.5 }}>
                        <td style={{ padding: "7px 10px", color: "#5d85aa" }}>{p.ing.name}</td>
                        <td style={{ padding: "7px 10px", color: "#3a5c7f" }}>{p.ing.unit}</td>
                        <td style={{ padding: "7px 10px", textAlign: "right", color: "#5d85aa" }}>{p.stock.toFixed(2)}</td>
                        <td style={{ padding: "7px 10px", textAlign: "right", color: "#1d3b5b" }}>—</td>
                        <td style={{ padding: "7px 10px", textAlign: "right", color: "#1d3b5b" }}>—</td>
                        <td style={{ padding: "7px 10px", textAlign: "right", color: "#1d3b5b" }}>—</td>
                        <td style={{ padding: "7px 10px", textAlign: "right", color: "#1d3b5b" }}>—</td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* TAB: REQUISICIONES */}
      {tab === "requisitions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pendingReqs.length > 0 && (
            <div style={{ background: "#451a03", border: "1px solid #92400e", borderRadius: 10, padding: 12 }}>
              <p style={{ color: "#fbbf24", fontSize: 12, fontWeight: 700, margin: 0 }}>
                ⚠ {pendingReqs.length} requisición(es) pendiente(s) de aprobación
              </p>
            </div>
          )}
          {requisitions.length === 0
            ? <Card><p style={{ color: "#3a5c7f", fontSize: 12, textAlign: "center", padding: 24 }}>Sin requisiciones todavía. Las sucursales pueden generar desde Inventario → Requisición</p></Card>
            : requisitions.map(req => {
              const statusCol = req.status === "pendiente" ? "#fbbf24" : req.status === "aprobada" ? "#60a5fa" : req.status === "entregada" ? "#22c55e" : "#ef4444";
              const statusBg = req.status === "pendiente" ? "#451a03" : req.status === "aprobada" ? "#1e3a8a" : req.status === "entregada" ? "#064e3b" : "#450a0a";
              return (
                <Card key={req.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <p style={{ color: "#d4e8f7", fontWeight: 700, fontSize: 14, margin: "0 0 2px" }}>📝 {req.branchName}</p>
                      <p style={{ color: "#5d85aa", fontSize: 11, margin: "0 0 2px" }}>
                        Creada: {new Date(req.createdAt).toLocaleString("es-HN")}
                      </p>
                      <p style={{ color: "#5d85aa", fontSize: 11, margin: 0 }}>
                        {req.items?.length || 0} ingrediente(s) · Total: <strong style={{ color: "#a78bfa" }}>{L(req.totalCost || 0)}</strong>
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ background: statusBg, color: statusCol, padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
                        {req.status}
                      </span>
                      {req.status === "pendiente" && (
                        <>
                          <button onClick={() => updateRequisitionStatus(req.id, "rechazada")}
                            style={{ background: "none", border: "1px solid #450a0a", color: "#ef4444", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 11 }}>
                            Rechazar
                          </button>
                          <button onClick={() => {
                            const initItems = {};
                            (req.items || []).forEach(it => { initItems[it.ingredientId] = String(it.qty); });
                            setReviewReq({ req, items: initItems });
                          }}
                            style={{ background: "#60a5fa", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                            ✎ Revisar y Enviar
                          </button>
                        </>
                      )}
                      {req.status === "aprobada" && (
                        <span style={{ color: "#5d85aa", fontSize: 10, fontStyle: "italic" }}>
                          Esperando recepción en sucursal
                        </span>
                      )}
                    </div>
                  </div>

                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead><tr style={{ background: "#16304a" }}>
                      {["Ingrediente", "Unidad", "Stock sucursal", "Solicitado", "Costo"].map((h, i) => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: i >= 2 ? "right" : "left", color: "#5d85aa", fontSize: 10, fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {req.items?.map((it, i) => (
                        <tr key={i} style={{ borderTop: "1px solid #16304a" }}>
                          <td style={{ padding: "7px 10px", color: "#b8d8ee" }}>{it.name}</td>
                          <td style={{ padding: "7px 10px", color: "#5d85aa" }}>{it.unit}</td>
                          <td style={{ padding: "7px 10px", textAlign: "right", color: it.currentStock <= 0 ? "#ef4444" : "#8aafd2" }}>{Number(it.currentStock || 0).toFixed(2)}</td>
                          <td style={{ padding: "7px 10px", textAlign: "right", color: "#fbbf24", fontWeight: 700 }}>{it.qty}</td>
                          <td style={{ padding: "7px 10px", textAlign: "right", color: "#a78bfa" }}>{L(it.qty * it.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {req.notes && (
                    <div style={{ marginTop: 10, padding: "8px 12px", background: "#0f0a06", border: "1px solid #1d3b5b", borderRadius: 8, fontSize: 11, color: "#8aafd2" }}>
                      📌 <strong style={{ color: "#d4e8f7" }}>Observaciones:</strong> {req.notes}
                    </div>
                  )}
                </Card>
              );
            })
          }
        </div>
      )}

      {/* TAB: ENVIAR A SUCURSAL */}
      {tab === "transfer" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
              <label style={{ color: "#5d85aa", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Sucursal destino:</label>
              <select value={transferBranch} onChange={e => setTransferBranch(e.target.value)}
                style={{ ...inp(), flex: 1, maxWidth: 300 }}>
                {data.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ background: "#16304a" }}>
                {["Ingrediente", "Unidad", "Stock Bodega", "Cantidad a Enviar"].map((h, i) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: i >= 2 ? "right" : "left", color: "#5d85aa", fontSize: 11, fontWeight: 600 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {INGREDIENTS.map(ing => {
                  const w = warehouse[ing.id] || { stock: 0 };
                  return (
                    <tr key={ing.id} style={{ borderTop: "1px solid #16304a" }}>
                      <td style={{ padding: "8px 12px", color: "#b8d8ee" }}>{ing.name}</td>
                      <td style={{ padding: "8px 12px", color: "#5d85aa" }}>{ing.unit}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: w.stock > 0 ? "#22c55e" : "#ef4444" }}>{w.stock}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>
                        <input type="number" min="0" value={transferItems[ing.id] || ""}
                          placeholder="0"
                          onChange={e => setTransferItems(p => ({ ...p, [ing.id]: e.target.value }))}
                          style={{ ...inp(), width: 80, textAlign: "right" }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={handleTransfer} style={{ background: "#0369a1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                🚚 Crear Envío
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB: HISTORIAL */}
      {tab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Envíos */}
          <Card>
            <h2 style={{ color: "#d4e8f7", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🚚 Envíos a Sucursales</h2>
            {pendingTransfers.length > 0 && (
              <div style={{ background: "#451a03", border: "1px solid #92400e", borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <p style={{ color: "#fbbf24", fontSize: 12, fontWeight: 700, margin: "0 0 4px" }}>⏳ {pendingTransfers.length} envío(s) pendiente(s) de recepción</p>
                <p style={{ color: "#92400e", fontSize: 11, margin: 0 }}>La sucursal debe confirmar la recepción</p>
              </div>
            )}
            {recentTransfers.length === 0
              ? <p style={{ color: "#3a5c7f", fontSize: 12, textAlign: "center", padding: 16 }}>Sin envíos registrados</p>
              : <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr style={{ background: "#16304a" }}>
                  {["Fecha", "Sucursal", "Items", "Estado"].map((h, i) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: i >= 2 ? "right" : "left", color: "#5d85aa", fontSize: 11, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {recentTransfers.map((t, i) => {
                    const br = data.branches.find(b => b.id === t.branchId);
                    return (
                      <tr key={i} style={{ borderTop: "1px solid #16304a" }}>
                        <td style={{ padding: "10px 12px", color: "#8aafd2" }}>{t.date}</td>
                        <td style={{ padding: "10px 12px", color: "#b8d8ee" }}>{br?.name || t.branchId}</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", color: "#8aafd2" }}>{t.items.length} ingredientes</td>
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>
                          <span style={{
                            background: t.status === "recibido" ? "#064e3b" : "#451a03",
                            color: t.status === "recibido" ? "#22c55e" : "#fbbf24",
                            padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700,
                          }}>{t.status === "recibido" ? "✓ Recibido" : "⏳ Pendiente"}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            }
          </Card>

          {/* Ledger de movimientos */}
          <Card>
            <h2 style={{ color: "#d4e8f7", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📜 Libro de Movimientos</h2>
            <p style={{ color: "#5d85aa", fontSize: 11, marginBottom: 12 }}>
              Registro completo de todos los cambios de stock: ajustes manuales, salidas por envío, etc.
            </p>
            {!(data.movements || []).length
              ? <p style={{ color: "#3a5c7f", fontSize: 12, textAlign: "center", padding: 16 }}>Sin movimientos registrados todavía</p>
              : <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead><tr style={{ background: "#16304a" }}>
                  {["Fecha", "Tipo", "Descripción", "Items"].map((h, i) => (
                    <th key={h} style={{ padding: "9px 10px", textAlign: i >= 3 ? "right" : "left", color: "#5d85aa", fontSize: 10, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {(data.movements || []).slice(0, 100).map(m => {
                    const typeCol = m.type === "salida" ? "#f97316" : m.type === "ajuste" ? "#60a5fa" : "#22c55e";
                    const typeBg = m.type === "salida" ? "#451a03" : m.type === "ajuste" ? "#1e3a8a" : "#064e3b";
                    return (
                      <tr key={m.id} style={{ borderTop: "1px solid #16304a" }}>
                        <td style={{ padding: "8px 10px", color: "#5d85aa", fontSize: 10 }}>
                          {new Date(m.createdAt).toLocaleString("es-HN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <span style={{ background: typeBg, color: typeCol, padding: "2px 8px", borderRadius: 5, fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>{m.type}</span>
                        </td>
                        <td style={{ padding: "8px 10px", color: "#b8d8ee" }}>{m.description}</td>
                        <td style={{ padding: "8px 10px", textAlign: "right", color: "#8aafd2", fontSize: 10 }}>
                          {(m.items || []).slice(0, 3).map(it => {
                            const ing = INGREDIENTS.find(i => i.id === it.ingredientId);
                            return `${ing?.name || it.ingredientId}: ${it.diff > 0 ? "+" : ""}${it.diff}`;
                          }).join(" · ")}
                          {(m.items || []).length > 3 && ` +${(m.items || []).length - 3} más`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            }
          </Card>
        </div>
      )}

      {/* MODAL: Revisar requisición antes de enviar */}
      {reviewReq && (() => {
        const origItems = reviewReq.req.items || [];
        // ingredientes ya agregados (de la req + cualquier extra que el admin agregue)
        const rows = INGREDIENTS.map(ing => {
          const orig = origItems.find(o => o.ingredientId === ing.id);
          const finalQty = reviewReq.items[ing.id];
          return {
            ing,
            origQty: orig ? Number(orig.qty) : 0,
            finalQty: finalQty !== undefined ? Number(finalQty) : 0,
            available: Number(warehouse[ing.id]?.stock || 0),
            isInOriginal: !!orig,
          };
        });
        const willSend = rows.filter(r => r.finalQty > 0);
        const totalCost = willSend.reduce((a, r) => a + r.finalQty * r.ing.cost, 0);
        const anyShortage = willSend.some(r => r.finalQty > r.available);

        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ background: "#0f1c30", border: "1px solid #1d3b5b", borderRadius: 16, padding: 24, width: 900, maxWidth: "95vw", maxHeight: "92vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 style={{ color: "#d4e8f7", fontSize: 16, fontWeight: 800, margin: 0 }}>✎ Revisar Requisición — {reviewReq.req.branchName}</h2>
                <button onClick={() => setReviewReq(null)}
                  style={{ background: "none", border: "none", color: "#5d85aa", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
              </div>

              <div style={{ background: "#0f0a06", border: "1px solid #1d3b5b", borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 11, color: "#5d85aa" }}>
                💡 Podés <strong style={{ color: "#fbbf24" }}>modificar las cantidades</strong> según tu criterio y disponibilidad. Podés también <strong style={{ color: "#fbbf24" }}>agregar ingredientes</strong> que no pidió la sucursal o <strong style={{ color: "#fbbf24" }}>poner 0</strong> para no enviar alguno.
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead><tr style={{ background: "#16304a" }}>
                  {["Ingrediente", "Unidad", "Pedido orig.", "Bodega disp.", "A enviar", "Costo"].map((h, i) => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: i >= 2 ? "right" : "left", color: "#5d85aa", fontSize: 10, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {rows.map(r => {
                    const shortage = r.finalQty > r.available;
                    const highlight = r.isInOriginal || r.finalQty > 0;
                    return (
                      <tr key={r.ing.id} style={{ borderTop: "1px solid #16304a", background: shortage ? "#1a0505" : highlight ? "#0c1828" : "transparent", opacity: highlight ? 1 : 0.5 }}>
                        <td style={{ padding: "6px 10px", color: "#b8d8ee", fontWeight: r.isInOriginal ? 700 : 400 }}>
                          {r.isInOriginal && <span style={{ color: "#fbbf24", marginRight: 4 }}>★</span>}
                          {r.ing.name}
                        </td>
                        <td style={{ padding: "6px 10px", color: "#5d85aa" }}>{r.ing.unit}</td>
                        <td style={{ padding: "6px 10px", textAlign: "right", color: r.origQty > 0 ? "#8aafd2" : "#1d3b5b" }}>{r.origQty || "—"}</td>
                        <td style={{ padding: "6px 10px", textAlign: "right", color: r.available > 0 ? "#22c55e" : "#ef4444" }}>{r.available}</td>
                        <td style={{ padding: "6px 10px", textAlign: "right" }}>
                          <input type="number" min="0" step="0.5"
                            value={reviewReq.items[r.ing.id] || ""}
                            onChange={e => setReviewReq(p => ({ ...p, items: { ...p.items, [r.ing.id]: e.target.value } }))}
                            placeholder="0"
                            style={{
                              background: shortage ? "#450a0a" : r.finalQty > 0 ? "#16304a" : "#11233a",
                              border: `1px solid ${shortage ? "#ef4444" : r.finalQty > 0 ? "#0369a1" : "#1d3b5b"}`,
                              borderRadius: 7, padding: "5px 8px", color: "#d4e8f7", fontSize: 11, outline: "none", width: 70, textAlign: "right",
                            }} />
                        </td>
                        <td style={{ padding: "6px 10px", textAlign: "right", color: r.finalQty > 0 ? "#a78bfa" : "#1d3b5b", fontWeight: 600 }}>
                          {r.finalQty > 0 ? L(r.finalQty * r.ing.cost) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid #1d3b5b", background: "#0f1c30" }}>
                    <td colSpan={5} style={{ padding: "10px", color: "#d4e8f7", fontWeight: 700, textAlign: "right" }}>TOTAL A ENVIAR ({willSend.length} ingredientes)</td>
                    <td style={{ padding: "10px", textAlign: "right", color: "#a78bfa", fontWeight: 800, fontSize: 13 }}>{L(totalCost)}</td>
                  </tr>
                </tfoot>
              </table>

              {anyShortage && (
                <div style={{ background: "#450a0a", border: "1px solid #ef4444", borderRadius: 8, padding: 10, marginTop: 12, color: "#fca5a5", fontSize: 11 }}>
                  ⚠ Hay cantidades que superan el stock disponible en bodega. Ajustá antes de continuar.
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
                <button onClick={() => setReviewReq(null)}
                  style={{ background: "none", border: "1px solid #1d3b5b", color: "#5d85aa", borderRadius: 9, padding: "9px 18px", cursor: "pointer", fontSize: 12 }}>Cancelar</button>
                <button onClick={async () => {
                  try {
                    const customItems = willSend.map(r => ({ ingredientId: r.ing.id, qty: r.finalQty }));
                    await approveRequisition(reviewReq.req.id, customItems);
                    setReviewReq(null);
                    setFlash("✓ Requisición aprobada — envío creado y descontado de bodega");
                    setTimeout(() => setFlash(""), 4000);
                  } catch (err) {
                    alert("No se pudo aprobar:\n\n" + err.message);
                  }
                }} disabled={willSend.length === 0 || anyShortage}
                  style={{
                    background: willSend.length > 0 && !anyShortage ? "#22c55e" : "#1d3b5b",
                    color: willSend.length > 0 && !anyShortage ? "#fff" : "#3a5c7f",
                    border: "none", borderRadius: 9, padding: "9px 22px", fontWeight: 700, fontSize: 12,
                    cursor: willSend.length > 0 && !anyShortage ? "pointer" : "not-allowed",
                  }}>
                  ✓ Aprobar y Enviar ({willSend.length} ítem{willSend.length !== 1 ? "s" : ""})
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
