import { useState, useMemo } from "react";
import { L, today } from "../lib/helpers";
import { BANKS, PENDING_BANK, resolveBanks } from "../lib/catalog";
import { Card, KCard } from "../components/ui";
import { filterByScope, filterBranches, isAdmin as roleIsAdmin } from "../lib/permissions";
import { BankAccountsView } from "./BankAccountsView";

export function BanksView({ data, processDeposit, userRole, saveBankAccount, deleteBankAccount, restoreBankAccount }) {
  const isAdmin = roleIsAdmin(userRole);
  // Scope: filtrar ventas (depósitos vienen de sales) a las del usuario
  data = {
    ...data,
    sales: filterByScope(userRole, data?.sales || [], "branchId"),
    branches: filterBranches(userRole, data?.branches || []),
  };
  const [tab, setTab] = useState("pending");
  const [editing, setEditing] = useState(null); // {saleId, index, bank, date, ref}
  const [flash, setFlash] = useState("");

  // Compilar todos los depósitos pendientes y procesados
  const { pending, processed } = useMemo(() => {
    const p = [], pr = [];
    (data.sales || []).forEach(s => {
      (s.deposits || []).forEach((d, idx) => {
        const brName = data.branches.find(b => b.id === s.branchId)?.name || s.branchId;
        const entry = { saleId: s.id, saleDate: s.date, branch: brName, branchId: s.branchId, index: idx, ...d };
        if (d.pending || d.bank === PENDING_BANK) p.push(entry);
        else if (d.processedAt) pr.push(entry);
      });
    });
    return { pending: p, processed: pr.sort((a, b) => (b.processedDate || "").localeCompare(a.processedDate || "")) };
  }, [data.sales, data.branches]);

  const totalPending = pending.reduce((a, d) => a + Number(d.amount || 0), 0);
  const totalProcessedMonth = useMemo(() => {
    const cutoff = new Date(Date.now() - 30 * 864e5).toISOString().split("T")[0];
    return processed.filter(p => (p.processedDate || "") >= cutoff).reduce((a, d) => a + Number(d.amount || 0), 0);
  }, [processed]);

  const banksList = resolveBanks(data?.bankAccounts || []);
  const defaultBank = banksList.find(b => b !== PENDING_BANK) || "";

  const startProcess = (entry) => {
    setEditing({
      saleId: entry.saleId, index: entry.index,
      amount: Number(entry.amount),
      branch: entry.branch,
      saleDate: entry.saleDate,
      splits: [{ bank: defaultBank, date: today(), ref: "", amount: Number(entry.amount) }],
    });
  };

  const updateSplit = (i, field, value) => {
    setEditing(p => ({ ...p, splits: p.splits.map((s, j) => j === i ? { ...s, [field]: value } : s) }));
  };
  const addSplit = () => setEditing(p => ({ ...p, splits: [...p.splits, { bank: defaultBank, date: today(), ref: "", amount: 0 }] }));
  const removeSplit = (i) => setEditing(p => ({ ...p, splits: p.splits.filter((_, j) => j !== i) }));

  const splitsTotal = editing?.splits.reduce((a, s) => a + Number(s.amount || 0), 0) || 0;
  const splitsDiff = editing ? editing.amount - splitsTotal : 0;
  const splitsOk = editing && Math.abs(splitsDiff) < 0.01 && editing.splits.every(s => s.bank && s.bank !== PENDING_BANK && s.date && Number(s.amount) > 0);

  const confirmProcess = async () => {
    if (!splitsOk) return alert("Los montos deben sumar exactamente " + L(editing.amount) + " y cada parte debe tener banco + fecha válidos");
    try {
      await processDeposit(editing.saleId, editing.index, editing.splits);
      setEditing(null);
      setFlash(`✓ Depósito procesado — ${editing.splits.length} parte(s)`);
      setTimeout(() => setFlash(""), 3000);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const inp = (s = {}) => ({ background: "#11233a", border: "1px solid #1d3b5b", borderRadius: 8, padding: "8px 10px", color: "#d4e8f7", fontSize: 12, outline: "none", ...s });

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ color: "#d4e8f7", fontSize: 22, fontWeight: 800, margin: 0 }}>🏦 Bancos — Depósitos</h1>
        {flash && <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 700 }}>{flash}</span>}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <KCard label="Dinero en tránsito" val={L(totalPending)} sub={`${pending.length} depósito(s) pendiente(s)`} col="#fbbf24" icon="⏳" />
        <KCard label="Procesados (30 días)" val={L(totalProcessedMonth)} sub={`${processed.filter(p => (p.processedDate || "") >= new Date(Date.now() - 30 * 864e5).toISOString().split("T")[0]).length} depósitos`} col="#22c55e" icon="✓" />
        <KCard label="Total procesados" val={processed.length} sub="históricos" col="#a78bfa" icon="📊" />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #1d3b5b" }}>
        {[
          ["pending", `⏳ Pendientes (${pending.length})`],
          ["processed", `✓ Procesados (${processed.length})`],
          ...(isAdmin ? [["accounts", "💳 Cuentas & Medios"]] : []),
        ].map(([t, lbl]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "10px 20px", fontSize: 12, fontWeight: tab === t ? 700 : 400, border: "none",
            borderBottom: tab === t ? "2px solid #0369a1" : "2px solid transparent",
            background: "none", cursor: "pointer", color: tab === t ? "#d4e8f7" : "#5d85aa",
          }}>{lbl}</button>
        ))}
      </div>

      {/* TAB: PENDIENTES */}
      {tab === "pending" && (
        <Card>
          {pending.length === 0
            ? <p style={{ color: "#3a5c7f", fontSize: 12, textAlign: "center", padding: 24 }}>✓ No hay depósitos pendientes de procesar</p>
            : <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ background: "#16304a" }}>
                {["Fecha Cuadre", "Sucursal", "Monto", "Tipo", "Acción"].map((h, i) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: i >= 2 && i <= 3 ? "right" : "left", color: "#5d85aa", fontSize: 11, fontWeight: 600 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {pending.map((d, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #16304a" }}>
                    <td style={{ padding: "10px 12px", color: "#8aafd2" }}>{d.saleDate}</td>
                    <td style={{ padding: "10px 12px", color: "#b8d8ee" }}>{d.branch}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#fbbf24", fontWeight: 700 }}>{L(d.amount)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>
                      <span style={{ background: "#451a03", color: "#fbbf24", padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700 }}>{d.type}</span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <button onClick={() => startProcess(d)}
                        style={{ background: "#0369a1", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                        Procesar →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </Card>
      )}

      {/* TAB: PROCESADOS */}
      {tab === "processed" && (
        <Card>
          {processed.length === 0
            ? <p style={{ color: "#3a5c7f", fontSize: 12, textAlign: "center", padding: 16 }}>Aún no hay depósitos procesados</p>
            : <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ background: "#16304a" }}>
                {["Fecha Cuadre", "Fecha Depósito", "Sucursal", "Banco", "Ref", "Monto"].map((h, i) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: i === 5 ? "right" : "left", color: "#5d85aa", fontSize: 11, fontWeight: 600 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {processed.map((d, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #16304a" }}>
                    <td style={{ padding: "10px 12px", color: "#3a5c7f" }}>{d.saleDate}</td>
                    <td style={{ padding: "10px 12px", color: "#22c55e", fontWeight: 600 }}>{d.processedDate}</td>
                    <td style={{ padding: "10px 12px", color: "#b8d8ee" }}>{d.branch}</td>
                    <td style={{ padding: "10px 12px", color: "#8aafd2", fontSize: 11 }}>{d.processedBank || d.bank}</td>
                    <td style={{ padding: "10px 12px", color: "#5d85aa", fontSize: 11 }}>{d.processedRef || "—"}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#a78bfa", fontWeight: 700 }}>{L(d.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </Card>
      )}

      {/* TAB: CUENTAS & MEDIOS (admin) */}
      {tab === "accounts" && isAdmin && (
        <BankAccountsView
          data={data}
          saveBankAccount={saveBankAccount}
          deleteBankAccount={deleteBankAccount}
          restoreBankAccount={restoreBankAccount}
          embedded
        />
      )}

      {/* MODAL PROCESAR (con multi-split) */}
      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#0f1c30", border: "1px solid #1d3b5b", borderRadius: 16, padding: 24, width: 700, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ color: "#d4e8f7", fontSize: 16, fontWeight: 800, margin: "0 0 14px" }}>💰 Procesar Depósito (se puede dividir en varias partes)</h2>

            <div style={{ background: "#0f0a06", border: "1px solid #1d3b5b", borderRadius: 10, padding: 12, marginBottom: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, fontSize: 11 }}>
                <div><span style={{ color: "#5d85aa" }}>Sucursal:</span> <span style={{ color: "#d4e8f7", fontWeight: 600 }}>{editing.branch}</span></div>
                <div><span style={{ color: "#5d85aa" }}>Fecha cuadre:</span> <span style={{ color: "#d4e8f7", fontWeight: 600 }}>{editing.saleDate}</span></div>
                <div><span style={{ color: "#5d85aa" }}>Total a procesar:</span> <span style={{ color: "#22c55e", fontWeight: 700 }}>{L(editing.amount)}</span></div>
              </div>
            </div>

            {/* Grid de splits */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 110px 1.3fr 30px", gap: 8, marginBottom: 6, fontSize: 10, color: "#5d85aa", textTransform: "uppercase", letterSpacing: 1, padding: "0 2px" }}>
                <span>Banco destino</span><span>Fecha real</span><span style={{ textAlign: "right" }}>Monto</span><span>Ref (opcional)</span><span></span>
              </div>
              {editing.splits.map((s, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 110px 1.3fr 30px", gap: 8, marginBottom: 6, alignItems: "center" }}>
                  <select value={s.bank} onChange={e => updateSplit(i, "bank", e.target.value)} style={inp()}>
                    {banksList.filter(b => b !== PENDING_BANK).map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <input type="date" value={s.date} onChange={e => updateSplit(i, "date", e.target.value)} style={inp()} />
                  <input type="number" step="0.01" value={s.amount} onChange={e => updateSplit(i, "amount", e.target.value)} style={{ ...inp(), textAlign: "right" }} />
                  <input value={s.ref} onChange={e => updateSplit(i, "ref", e.target.value)} placeholder="Boleta #" style={inp()} />
                  <button onClick={() => removeSplit(i)} disabled={editing.splits.length === 1}
                    style={{ background: "none", border: "none", color: editing.splits.length === 1 ? "#1d3b5b" : "#ef4444", fontSize: 18, cursor: editing.splits.length === 1 ? "not-allowed" : "pointer", lineHeight: 1 }}>×</button>
                </div>
              ))}
              <button onClick={addSplit} style={{ color: "#0369a1", background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Agregar otra parte</button>
            </div>

            {/* Totales */}
            <div style={{ background: splitsOk ? "#064e3b" : Math.abs(splitsDiff) < 0.01 ? "#1a1005" : "#450a0a", border: `1px solid ${splitsOk ? "#22c55e" : "#1d3b5b"}`, borderRadius: 10, padding: 12, marginBottom: 14, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "#5d85aa" }}>Suma de partes: <span style={{ color: "#d4e8f7", fontWeight: 700 }}>{L(splitsTotal)}</span> &nbsp;/&nbsp; esperado: <span style={{ color: "#d4e8f7", fontWeight: 700 }}>{L(editing.amount)}</span></span>
              <span style={{ color: splitsOk ? "#22c55e" : "#ef4444", fontWeight: 800 }}>
                {splitsOk ? "✓ Cuadra" : Math.abs(splitsDiff) < 0.01 ? "⚠ Falta banco/fecha" : `Diferencia: ${L(splitsDiff)}`}
              </span>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setEditing(null)}
                style={{ background: "none", border: "1px solid #1d3b5b", color: "#5d85aa", borderRadius: 9, padding: "9px 18px", cursor: "pointer", fontSize: 12 }}>Cancelar</button>
              <button onClick={confirmProcess} disabled={!splitsOk}
                style={{ background: splitsOk ? "#0369a1" : "#1d3b5b", color: splitsOk ? "#fff" : "#3a5c7f", border: "none", borderRadius: 9, padding: "9px 20px", fontWeight: 700, fontSize: 12, cursor: splitsOk ? "pointer" : "not-allowed" }}>
                ✓ Confirmar ({editing.splits.length} parte{editing.splits.length > 1 ? "s" : ""})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
