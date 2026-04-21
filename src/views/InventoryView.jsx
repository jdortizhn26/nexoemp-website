import { useState, useMemo } from "react";
import { L, today } from "../lib/helpers";
import { INGREDIENTS } from "../lib/catalog";
import { Card } from "../components/ui";
import { PrintableRequisition } from "../components/PrintableRequisition";

export function InventoryView({ data, userRole, receiveTransfer, saveInventory, saveRequisition }) {
  const isAdmin = userRole?.role === "admin";
  const defaultBranch = isAdmin ? (data?.branches?.[0]?.id || "") : (userRole?.branchId || "");
  const [branchId, setBranchId] = useState(defaultBranch);
  const [tab, setTab] = useState("receive");
  const [flash, setFlash] = useState("");
  const [countDate, setCountDate] = useState(today());
  const [countItems, setCountItems] = useState({}); // { ingredientId: physicalClose }
  const [reqItems, setReqItems] = useState({}); // { ingredientId: qty solicitada }
  const [reqNotes, setReqNotes] = useState("");
  const [showReqPdf, setShowReqPdf] = useState(false);

  const branch = data?.branches?.find(b => b.id === branchId);
  const transfers = data?.transfers || [];
  const inventory = data?.inventory || [];

  // ── Envíos pendientes para esta sucursal ──
  const pendingTransfers = useMemo(() =>
    transfers.filter(t => t.branchId === branchId && t.status === "pendiente"),
    [transfers, branchId]
  );

  // ── Histórico de inventarios de la sucursal ──
  const branchInventory = useMemo(() =>
    inventory.filter(i => i.branchId === branchId).sort((a, b) => b.date.localeCompare(a.date)),
    [inventory, branchId]
  );

  // ── Estado actual (último cierre) ──
  const lastInv = branchInventory[0];
  const currentStock = useMemo(() => {
    const stock = {};
    INGREDIENTS.forEach(ing => { stock[ing.id] = 0; });
    if (lastInv) {
      lastInv.items.forEach(it => { stock[it.ingredientId] = Number(it.physicalClose || 0); });
    }
    // Sumar envíos recibidos después del último cierre
    transfers
      .filter(t => t.branchId === branchId && t.status === "recibido")
      .filter(t => !lastInv || (t.receivedAt || "") > (lastInv.closedAt || ""))
      .forEach(t => {
        t.items.forEach(it => {
          stock[it.ingredientId] = (stock[it.ingredientId] || 0) + Number(it.qty || 0);
        });
      });
    return stock;
  }, [lastInv, transfers, branchId]);

  // ── Consumo teórico del día según ventas × recetas ──
  const theoreticalUse = useMemo(() => {
    const use = {};
    INGREDIENTS.forEach(ing => { use[ing.id] = 0; });
    const salesToday = (data?.sales || []).filter(s => s.branchId === branchId && s.date === countDate);
    const recipes = data?.recipes || {};
    salesToday.forEach(sale => {
      sale.items.forEach(item => {
        const recipe = recipes[item.productId];
        if (!recipe?.ingredients) return;
        recipe.ingredients.forEach(ri => {
          // ri puede tener name o ingredientId; matcheamos por name contra INGREDIENTS
          const ing = INGREDIENTS.find(i => i.id === ri.ingredientId || i.name === ri.name);
          if (ing) use[ing.id] = (use[ing.id] || 0) + Number(ri.qty || 0) * Number(item.qty || 0);
        });
      });
    });
    return use;
  }, [data?.sales, data?.recipes, branchId, countDate]);

  // ── Recibir envío ──
  const handleReceive = async (transferId) => {
    try {
      await receiveTransfer(transferId);
      setFlash("✓ Envío recibido — el stock ya está en tu inventario");
      setTimeout(() => setFlash(""), 3000);
    } catch (err) {
      alert("Error al recibir: " + err.message);
    }
  };

  // ── Guardar conteo diario ──
  const handleSaveCount = async () => {
    if (!branchId) return alert("Selecciona una sucursal");
    const items = INGREDIENTS.map(ing => ({
      ingredientId: ing.id,
      opening: Number(lastInv?.items?.find(x => x.ingredientId === ing.id)?.physicalClose || 0),
      received: (() => {
        // recibido entre último cierre y ahora
        const recv = transfers
          .filter(t => t.branchId === branchId && t.status === "recibido")
          .filter(t => !lastInv || (t.receivedAt || "") > (lastInv.closedAt || ""))
          .reduce((a, t) => a + Number(t.items.find(x => x.ingredientId === ing.id)?.qty || 0), 0);
        return recv;
      })(),
      theoreticalUsed: Number(theoreticalUse[ing.id] || 0),
      physicalClose: countItems[ing.id] !== undefined ? Number(countItems[ing.id]) : Number(currentStock[ing.id] || 0),
    }));
    const inv = {
      id: `${branchId}-${countDate}`,
      branchId, date: countDate, items,
      closedAt: new Date().toISOString(),
    };
    try {
      await saveInventory(inv);
      setCountItems({});
      setFlash("✓ Inventario del día guardado");
      setTimeout(() => setFlash(""), 3000);
    } catch (err) {
      alert("Error al guardar: " + err.message);
    }
  };

  const inp = (s = {}) => ({ background: "#11233a", border: "1px solid #1d3b5b", borderRadius: 8, padding: "8px 10px", color: "#d4e8f7", fontSize: 12, outline: "none", ...s });

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ color: "#d4e8f7", fontSize: 22, fontWeight: 800, margin: 0 }}>📦 Inventario</h1>
          <p style={{ color: "#5d85aa", fontSize: 12, marginTop: 4 }}>Sucursal: {branch?.name || "—"}</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {flash && <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 700 }}>{flash}</span>}
          {isAdmin && (
            <select value={branchId} onChange={e => setBranchId(e.target.value)}
              style={{ background: "#16304a", border: "1px solid #1d3b5b", color: "#d4e8f7", borderRadius: 9, padding: "8px 12px", fontSize: 12 }}>
              {data.branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          {pendingTransfers.length > 0 && tab !== "receive" && (
            <div style={{ background: "#451a03", color: "#fbbf24", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
              ⚠ {pendingTransfers.length} envío(s) por recibir
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #1d3b5b" }}>
        {[
          ["receive", `📥 Recibir envíos ${pendingTransfers.length > 0 ? `(${pendingTransfers.length})` : ""}`],
          ["count", "📋 Conteo del día"],
          ["stock", "📊 Stock actual"],
          ["requisition", "📝 Requisición"],
          ["history", "🕒 Histórico"],
        ].map(([t, lbl]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "10px 20px", fontSize: 12, fontWeight: tab === t ? 700 : 400, border: "none",
            borderBottom: tab === t ? "2px solid #0369a1" : "2px solid transparent",
            background: "none", cursor: "pointer", color: tab === t ? "#d4e8f7" : "#5d85aa",
          }}>{lbl}</button>
        ))}
      </div>

      {/* TAB: RECIBIR ENVÍOS */}
      {tab === "receive" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pendingTransfers.length === 0
            ? <Card><p style={{ color: "#3a5c7f", fontSize: 12, textAlign: "center", padding: 24 }}>✓ No hay envíos pendientes de recibir</p></Card>
            : pendingTransfers.map(t => (
              <Card key={t.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <p style={{ color: "#d4e8f7", fontWeight: 700, fontSize: 14, margin: "0 0 4px" }}>🚚 Envío del {t.date}</p>
                    <p style={{ color: "#5d85aa", fontSize: 11, margin: 0 }}>{t.items.length} ingrediente(s) — creado {new Date(t.createdAt).toLocaleString("es-HN")}</p>
                  </div>
                  <button onClick={() => handleReceive(t.id)}
                    style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                    ✓ Recibir / Confirmar
                  </button>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead><tr style={{ background: "#16304a" }}>
                    {["Ingrediente", "Unidad", "Cantidad"].map((h, i) => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: i >= 2 ? "right" : "left", color: "#5d85aa", fontSize: 11, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {t.items.map((it, i) => {
                      const ing = INGREDIENTS.find(x => x.id === it.ingredientId);
                      return (
                        <tr key={i} style={{ borderTop: "1px solid #16304a" }}>
                          <td style={{ padding: "7px 12px", color: "#b8d8ee" }}>{ing?.name || it.ingredientId}</td>
                          <td style={{ padding: "7px 12px", color: "#5d85aa" }}>{ing?.unit || "—"}</td>
                          <td style={{ padding: "7px 12px", textAlign: "right", color: "#22c55e", fontWeight: 700 }}>{it.qty}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            ))
          }
        </div>
      )}

      {/* TAB: CONTEO DEL DÍA */}
      {tab === "count" && (
        <Card>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
            <label style={{ color: "#5d85aa", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Fecha del conteo:</label>
            <input type="date" value={countDate} onChange={e => setCountDate(e.target.value)} style={inp()} />
            <button onClick={handleSaveCount}
              style={{ background: "#0369a1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", fontSize: 12, fontWeight: 700, marginLeft: "auto" }}>
              💾 Guardar Conteo
            </button>
          </div>
          <p style={{ color: "#5d85aa", fontSize: 11, marginBottom: 12 }}>
            Ingresa la cantidad <strong style={{ color: "#d4e8f7" }}>físicamente contada</strong> al cierre del día. El sistema calculará el consumo teórico según las ventas y recetas.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ background: "#16304a" }}>
              {["Ingrediente", "Unidad", "Esperado", "Conteo físico"].map((h, i) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: i >= 2 ? "right" : "left", color: "#5d85aa", fontSize: 11, fontWeight: 600 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {INGREDIENTS.map(ing => {
                const expected = (currentStock[ing.id] || 0) - (theoreticalUse[ing.id] || 0);
                const current = countItems[ing.id] !== undefined ? countItems[ing.id] : expected;
                return (
                  <tr key={ing.id} style={{ borderTop: "1px solid #16304a" }}>
                    <td style={{ padding: "8px 12px", color: "#b8d8ee" }}>{ing.name}</td>
                    <td style={{ padding: "8px 12px", color: "#5d85aa" }}>{ing.unit}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", color: "#8aafd2" }}>{expected.toFixed(2)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}>
                      <input type="number" step="0.01" value={current}
                        onChange={e => setCountItems(p => ({ ...p, [ing.id]: e.target.value }))}
                        style={{ ...inp(), width: 80, textAlign: "right", background: countItems[ing.id] !== undefined ? "#16304a" : "#11233a", borderColor: countItems[ing.id] !== undefined ? "#0369a1" : "#1d3b5b" }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* TAB: STOCK ACTUAL */}
      {tab === "stock" && (
        <Card>
          <h2 style={{ color: "#d4e8f7", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>📊 Stock Actual</h2>
          <p style={{ color: "#5d85aa", fontSize: 11, marginBottom: 14 }}>
            Último cierre: {lastInv ? lastInv.date : "—"} + envíos recibidos después
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ background: "#16304a" }}>
              {["Ingrediente", "Unidad", "Stock", "Valor"].map((h, i) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: i >= 2 ? "right" : "left", color: "#5d85aa", fontSize: 11, fontWeight: 600 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {INGREDIENTS.map(ing => {
                const qty = currentStock[ing.id] || 0;
                return (
                  <tr key={ing.id} style={{ borderTop: "1px solid #16304a" }}>
                    <td style={{ padding: "8px 12px", color: "#b8d8ee" }}>{ing.name}</td>
                    <td style={{ padding: "8px 12px", color: "#5d85aa" }}>{ing.unit}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: qty <= 0 ? "#ef4444" : qty < 3 ? "#f97316" : "#22c55e" }}>{qty.toFixed(2)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", color: "#a78bfa" }}>{L(qty * ing.cost)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* TAB: REQUISICIÓN */}
      {tab === "requisition" && (() => {
        const reqList = INGREDIENTS
          .map(ing => ({ ...ing, currentStock: Number(currentStock[ing.id] || 0), qty: Number(reqItems[ing.id] || 0) }))
          .filter(x => x.qty > 0);
        const totalItems = reqList.length;
        const totalCost = reqList.reduce((a, x) => a + x.qty * x.cost, 0);
        return (
          <>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h2 style={{ color: "#d4e8f7", fontSize: 14, fontWeight: 700, margin: 0 }}>📝 Nueva Requisición de Inventario</h2>
                  <p style={{ color: "#5d85aa", fontSize: 11, margin: "4px 0 0" }}>Ingresá la cantidad que necesitás de cada ingrediente. Generá un PDF para enviar al admin.</p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: "#8aafd2", fontSize: 11 }}>
                    {totalItems > 0 ? <>📦 <strong>{totalItems}</strong> ítem(s) · <strong>{L(totalCost)}</strong></> : "Sin items agregados"}
                  </span>
                  <button onClick={() => setReqItems({})} disabled={totalItems === 0}
                    style={{ background: "none", border: "1px solid #1d3b5b", color: totalItems ? "#5d85aa" : "#1d3b5b", borderRadius: 8, padding: "7px 14px", cursor: totalItems ? "pointer" : "not-allowed", fontSize: 11 }}>
                    Limpiar
                  </button>
                  <button onClick={async () => {
                    if (!branchId) return alert("Selecciona una sucursal");
                    try {
                      await saveRequisition({
                        branchId, branchName: branch?.name || branchId,
                        items: reqList.map(x => ({ ingredientId: x.id, name: x.name, unit: x.unit, qty: x.qty, cost: x.cost, currentStock: x.currentStock })),
                        notes: reqNotes,
                        totalCost,
                        createdBy: userRole?.role === "admin" ? "admin" : (userRole?.branchId || "encargado"),
                      });
                      setReqItems({}); setReqNotes("");
                      setFlash("✓ Requisición enviada al admin");
                      setTimeout(() => setFlash(""), 4000);
                    } catch (err) { alert("Error: " + err.message); }
                  }} disabled={totalItems === 0}
                    style={{ background: totalItems ? "#22c55e" : "#1d3b5b", color: totalItems ? "#fff" : "#3a5c7f", border: "none", borderRadius: 8, padding: "8px 14px", cursor: totalItems ? "pointer" : "not-allowed", fontSize: 11, fontWeight: 700 }}>
                    💾 Enviar al Admin
                  </button>
                  <button onClick={() => setShowReqPdf(true)} disabled={totalItems === 0}
                    style={{ background: totalItems ? "#0369a1" : "#1d3b5b", color: totalItems ? "#fff" : "#3a5c7f", border: "none", borderRadius: 8, padding: "8px 16px", cursor: totalItems ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 700 }}>
                    🖨️ Generar PDF
                  </button>
                </div>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr style={{ background: "#16304a" }}>
                  {["Ingrediente", "Unidad", "Stock actual", "Costo unit.", "Solicitar", "Subtotal"].map((h, i) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: i >= 2 ? "right" : "left", color: "#5d85aa", fontSize: 11, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {INGREDIENTS.map(ing => {
                    const stock = Number(currentStock[ing.id] || 0);
                    const qty = Number(reqItems[ing.id] || 0);
                    const isLow = stock <= 0;
                    return (
                      <tr key={ing.id} style={{ borderTop: "1px solid #16304a", background: isLow ? "#1a0505" : "transparent" }}>
                        <td style={{ padding: "8px 12px", color: "#b8d8ee", fontWeight: 600 }}>{ing.name}</td>
                        <td style={{ padding: "8px 12px", color: "#5d85aa" }}>{ing.unit}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: isLow ? "#ef4444" : stock < 3 ? "#f97316" : "#22c55e", fontWeight: 700 }}>{stock.toFixed(2)}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: "#8aafd2" }}>{L(ing.cost)}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right" }}>
                          <input type="number" min="0" step="0.5" value={reqItems[ing.id] || ""}
                            onChange={e => setReqItems(p => ({ ...p, [ing.id]: e.target.value }))}
                            placeholder="0"
                            style={{ ...inp(), width: 80, textAlign: "right", background: qty > 0 ? "#16304a" : "#11233a", borderColor: qty > 0 ? "#0369a1" : "#1d3b5b" }} />
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: qty > 0 ? "#a78bfa" : "#1d3b5b", fontWeight: 700 }}>
                          {qty > 0 ? L(qty * ing.cost) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>

            <Card>
              <label style={{ color: "#5d85aa", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Observaciones (opcional)</label>
              <textarea value={reqNotes} onChange={e => setReqNotes(e.target.value)}
                placeholder="Ej: Urgente para este fin de semana, entregar antes del mediodía..."
                style={{ ...inp(), width: "100%", height: 70, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
            </Card>

            {showReqPdf && (
              <PrintableRequisition
                items={reqList}
                branch={branch}
                date={today()}
                notes={reqNotes}
                onClose={() => setShowReqPdf(false)}
              />
            )}
          </>
        );
      })()}

      {/* TAB: HISTÓRICO */}
      {tab === "history" && (
        <Card>
          <h2 style={{ color: "#d4e8f7", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🕒 Histórico de Conteos</h2>
          {branchInventory.length === 0
            ? <p style={{ color: "#3a5c7f", fontSize: 12, textAlign: "center", padding: 16 }}>Sin conteos registrados aún</p>
            : <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ background: "#16304a" }}>
                {["Fecha", "Items contados", "Cerrado"].map((h, i) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: i >= 1 ? "right" : "left", color: "#5d85aa", fontSize: 11, fontWeight: 600 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {branchInventory.map(inv => (
                  <tr key={inv.id} style={{ borderTop: "1px solid #16304a" }}>
                    <td style={{ padding: "10px 12px", color: "#b8d8ee" }}>{inv.date}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#8aafd2" }}>{inv.items.length}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#5d85aa", fontSize: 11 }}>
                      {inv.closedAt ? new Date(inv.closedAt).toLocaleString("es-HN") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </Card>
      )}
    </div>
  );
}
