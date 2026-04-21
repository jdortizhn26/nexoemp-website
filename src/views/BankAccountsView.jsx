import { useState, useMemo } from "react";
import { BANKS, PENDING_BANK } from "../lib/catalog";
import { Card, KCard } from "../components/ui";

export function BankAccountsView({ data, saveBankAccount, deleteBankAccount, restoreBankAccount, embedded = false }) {
  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [flash, setFlash] = useState("");

  const fsAccounts = data?.bankAccounts || [];
  const baseIds = useMemo(() => new Set(BANKS), []);
  const fsById = useMemo(() => {
    const m = {};
    fsAccounts.forEach(a => { m[a.id] = a; });
    return m;
  }, [fsAccounts]);

  // Filas: bancos base + overrides + nuevos (con soft-delete)
  const allRows = useMemo(() => {
    const rows = [];
    BANKS.forEach(bankName => {
      const fs = fsById[bankName];
      rows.push({
        id: bankName,
        name: fs?.name || bankName,
        isPending: bankName === PENDING_BANK,
        isBase: true,
        isModified: !!fs && (fs.name !== bankName),
        isDeleted: !!fs?.deleted,
      });
    });
    fsAccounts.forEach(a => {
      if (!baseIds.has(a.id)) {
        rows.push({
          id: a.id,
          name: a.name || a.id,
          isPending: false,
          isBase: false,
          isModified: true,
          isDeleted: !!a.deleted,
        });
      }
    });
    return rows;
  }, [fsAccounts, fsById, baseIds]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allRows
      .filter(a => showDeleted || !a.isDeleted)
      .filter(a => !q || a.name.toLowerCase().includes(q));
  }, [allRows, search, showDeleted]);

  const totals = useMemo(() => {
    const active = allRows.filter(a => !a.isDeleted);
    return {
      total: active.length,
      base: active.filter(a => a.isBase).length,
      custom: active.filter(a => !a.isBase).length,
      deleted: allRows.filter(a => a.isDeleted).length,
    };
  }, [allRows]);

  // Cantidad de depósitos usando cada cuenta (histórico)
  const usageMap = useMemo(() => {
    const m = {};
    (data?.sales || []).forEach(s => (s.deposits || []).forEach(d => {
      const k = d.bank || "—";
      m[k] = (m[k] || 0) + 1;
    }));
    return m;
  }, [data?.sales]);

  const handleSaveEdit = async () => {
    if (!editing) return;
    if (!editing.name?.trim()) return alert("Nombre obligatorio");
    try {
      await saveBankAccount({
        id: editing.id,
        name: editing.name.trim(),
      });
      setEditing(null);
      setFlash("✓ Cuenta actualizada");
      setTimeout(() => setFlash(""), 3000);
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleCreate = async () => {
    if (!editing?.name?.trim()) return alert("Nombre obligatorio");
    const id = editing.name.trim();
    if (baseIds.has(id) || fsById[id]) return alert("Ya existe una cuenta con ese nombre");
    try {
      await saveBankAccount({
        id,
        name: id,
        custom: true,
      });
      setEditing(null);
      setCreating(false);
      setFlash("✓ Cuenta creada");
      setTimeout(() => setFlash(""), 3000);
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleDelete = async (a) => {
    if (a.isPending) return alert('No se puede eliminar "VENTA A DEPOSITAR" — es el medio de pago pendiente por procesar.');
    const uses = usageMap[a.id] || 0;
    const msg = uses > 0
      ? `"${a.name}" se usa en ${uses} depósito(s) histórico(s). Eliminarla solo la oculta de nuevas ventas; los registros históricos se preservan. ¿Continuar?`
      : `¿Eliminar "${a.name}"?`;
    if (!confirm(msg)) return;
    try {
      await deleteBankAccount(a.id);
      setFlash("✓ Cuenta eliminada");
      setTimeout(() => setFlash(""), 3000);
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleRestore = async (a) => {
    try {
      await restoreBankAccount(a.id);
      setFlash("✓ Cuenta restaurada");
      setTimeout(() => setFlash(""), 3000);
    } catch (err) { alert("Error: " + err.message); }
  };

  const startCreate = () => {
    setEditing({ id: "", name: "" });
    setCreating(true);
  };

  const inp = (s = {}) => ({ background: "#11233a", border: "1px solid #1d3b5b", borderRadius: 8, padding: "8px 10px", color: "#d4e8f7", fontSize: 12, outline: "none", width: "100%", boxSizing: "border-box", ...s });

  return (
    <div style={{ padding: embedded ? 0 : 24, display: "flex", flexDirection: "column", gap: 16 }}>
      {!embedded && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 style={{ color: "#d4e8f7", fontSize: 22, fontWeight: 800, margin: 0 }}>💳 Cuentas Bancarias & Medios de Pago</h1>
            <p style={{ color: "#5d85aa", fontSize: 12, marginTop: 4 }}>
              Agregá tarjetas, billeteras digitales u otras cuentas que verás al registrar depósitos
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {flash && <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 700 }}>{flash}</span>}
            <button onClick={startCreate}
              style={{ background: "#0369a1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              ➕ Nueva Cuenta / Medio
            </button>
          </div>
        </div>
      )}
      {embedded && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 4 }}>
          <p style={{ color: "#5d85aa", fontSize: 12, margin: 0 }}>
            Agregá tarjetas, billeteras digitales u otras cuentas que verás al registrar depósitos
          </p>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {flash && <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 700 }}>{flash}</span>}
            <button onClick={startCreate}
              style={{ background: "#0369a1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              ➕ Nueva Cuenta / Medio
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        <KCard label="Cuentas activas" val={totals.total} sub={`${totals.base} base + ${totals.custom} creadas`} col="#22c55e" icon="💳" />
        <KCard label="Creadas desde la UI" val={totals.custom} sub="tarjetas, billeteras, etc." col="#a78bfa" icon="➕" />
        <KCard label="Eliminadas" val={totals.deleted} sub="(soft-delete)" col="#5d85aa" icon="🗑" />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input placeholder="🔍 Buscar..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inp(), width: 300 }} />
        <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#5d85aa", fontSize: 11, cursor: "pointer" }}>
          <input type="checkbox" checked={showDeleted} onChange={e => setShowDeleted(e.target.checked)} style={{ accentColor: "#0369a1" }} />
          Ver eliminadas
        </label>
      </div>

      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ background: "#16304a" }}>
            {["Nombre / Cuenta", "Tipo", "Depósitos históricos", ""].map((h, i) => (
              <th key={h} style={{ padding: "10px 12px", textAlign: i >= 2 ? "right" : "left", color: "#5d85aa", fontSize: 11, fontWeight: 600 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#3a5c7f" }}>Sin cuentas</td></tr>
              : filtered.map(a => {
                const tagCol = a.isDeleted ? "#3a5c7f" : a.isPending ? "#fbbf24" : !a.isBase ? "#a78bfa" : a.isModified ? "#60a5fa" : "#22c55e";
                const tagTxt = a.isDeleted ? "Eliminada" : a.isPending ? "Pendiente" : !a.isBase ? "Nueva" : a.isModified ? "Renombrada" : "Base";
                const usage = usageMap[a.id] || 0;
                return (
                  <tr key={a.id} style={{ borderTop: "1px solid #16304a", opacity: a.isDeleted ? 0.55 : 1 }}>
                    <td style={{ padding: "9px 12px", color: "#b8d8ee", fontWeight: 600 }}>{a.name}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <span style={{ background: "#1e0e06", color: tagCol, padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700 }}>{tagTxt}</span>
                    </td>
                    <td style={{ padding: "9px 12px", textAlign: "right", color: usage > 0 ? "#8aafd2" : "#3a5c7f" }}>{usage || "—"}</td>
                    <td style={{ padding: "9px 12px", textAlign: "right" }}>
                      {a.isDeleted
                        ? <button onClick={() => handleRestore(a)}
                          style={{ background: "none", border: "1px solid #064e3b", color: "#22c55e", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11 }}>
                          ↺ Restaurar
                        </button>
                        : <>
                          <button onClick={() => { setEditing({ id: a.id, name: a.name }); setCreating(false); }}
                            style={{ background: "none", border: "1px solid #1d3b5b", color: "#60a5fa", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, marginRight: 4 }}>
                            ✎
                          </button>
                          {!a.isPending && (
                            <button onClick={() => handleDelete(a)}
                              style={{ background: "none", border: "1px solid #450a0a", color: "#ef4444", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11 }}>
                              🗑
                            </button>
                          )}
                        </>
                      }
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </Card>

      <div style={{ background: "#0c1828", border: "1px solid #1d3b5b", borderRadius: 10, padding: 14, fontSize: 11, color: "#5d85aa" }}>
        💡 Podés agregar <strong style={{ color: "#d4e8f7" }}>tarjetas de crédito/débito</strong>, <strong style={{ color: "#d4e8f7" }}>billeteras digitales</strong> (Tigo Money, PayPal),
        cuentas adicionales de bancos, o cualquier medio de cobro que uses. Cuando registres un depósito, aparecerán en el dropdown.
        Los nombres históricos se preservan: si renombrás "BAC Cta # 730180841" a "BAC Principal", las ventas antiguas siguen mostrando el nombre original.
      </div>

      {/* MODAL */}
      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#0f1c30", border: "1px solid #1d3b5b", borderRadius: 16, padding: 24, width: 460, maxWidth: "95vw" }}>
            <h2 style={{ color: "#d4e8f7", fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>
              {creating ? "➕ Nueva Cuenta / Medio de Pago" : "✎ Editar"}
            </h2>

            <label style={{ color: "#5d85aa", fontSize: 11, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
              Nombre (aparecerá en el dropdown de depósitos)
            </label>
            <input value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))}
              placeholder="ej: Tarjeta Visa Terminal, Tigo Money, etc." style={{ ...inp(), marginBottom: 12 }} autoFocus />

            <div style={{ background: "#0f0a06", border: "1px solid #1d3b5b", borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 11, color: "#5d85aa" }}>
              💡 Ejemplos: <em>"Tarjeta BAC Credit"</em>, <em>"Tigo Money"</em>, <em>"Transferencia SPB"</em>, <em>"POS Atlántida"</em>.
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { setEditing(null); setCreating(false); }}
                style={{ background: "none", border: "1px solid #1d3b5b", color: "#5d85aa", borderRadius: 9, padding: "9px 18px", cursor: "pointer", fontSize: 12 }}>Cancelar</button>
              <button onClick={creating ? handleCreate : handleSaveEdit}
                style={{ background: "#0369a1", color: "#fff", border: "none", borderRadius: 9, padding: "9px 22px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                {creating ? "✓ Crear" : "💾 Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
