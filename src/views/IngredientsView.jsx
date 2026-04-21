import { useState, useMemo } from "react";
import { L } from "../lib/helpers";
import { INGREDIENTS, INGREDIENT_CATEGORIES, resolveIngredients, resolveIngredientCategories } from "../lib/catalog";
import { Card, KCard } from "../components/ui";

const COMMON_UNITS = ["unidad", "libra", "kilo", "litro", "galón", "lata", "botella", "sobre", "paquete", "%"];

export function IngredientsView({ data, saveIngredient, deleteIngredient, restoreIngredient }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [flash, setFlash] = useState("");

  const categories = useMemo(() => resolveIngredientCategories(data?.ingredients || []), [data?.ingredients]);

  const fsIngredients = data?.ingredients || [];
  const baseIds = useMemo(() => new Set(INGREDIENTS.map(i => i.id)), []);
  const fsById = useMemo(() => {
    const m = {};
    fsIngredients.forEach(i => { m[i.id] = i; });
    return m;
  }, [fsIngredients]);

  const allRows = useMemo(() => {
    const rows = [];
    INGREDIENTS.forEach(ing => {
      const fs = fsById[ing.id];
      rows.push({
        ...ing,
        ...(fs || {}),
        isBase: true,
        isModified: !!fs,
        isDeleted: !!fs?.deleted,
      });
    });
    fsIngredients.forEach(i => {
      if (!baseIds.has(i.id)) {
        rows.push({ ...i, isBase: false, isModified: true, isDeleted: !!i.deleted });
      }
    });
    return rows;
  }, [fsIngredients, fsById, baseIds]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allRows
      .filter(i => showDeleted || !i.isDeleted)
      .filter(i => catFilter === "all" || (i.cat || "Materia Prima") === catFilter)
      .filter(i => !q || i.name.toLowerCase().includes(q))
      .sort((a, b) => (a.cat || "").localeCompare(b.cat || "") || a.name.localeCompare(b.name));
  }, [allRows, search, catFilter, showDeleted]);

  const totals = useMemo(() => {
    const active = allRows.filter(i => !i.isDeleted);
    return {
      total: active.length,
      base: active.filter(i => i.isBase).length,
      custom: active.filter(i => !i.isBase).length,
      modified: active.filter(i => i.isModified && i.isBase).length,
      withFranchise: active.filter(i => typeof i.franchisePrice === "number" && i.franchisePrice > 0).length,
    };
  }, [allRows]);

  const handleSaveEdit = async () => {
    if (!editing) return;
    if (!editing.name?.trim()) return alert("Nombre obligatorio");
    if (!editing.unit?.trim()) return alert("Unidad obligatoria");
    if (isNaN(Number(editing.cost)) || Number(editing.cost) < 0) return alert("Costo HQ inválido");
    const franchisePrice = editing.franchisePrice === "" || editing.franchisePrice == null
      ? null : Number(editing.franchisePrice);
    if (franchisePrice != null && (isNaN(franchisePrice) || franchisePrice < 0)) return alert("Precio franquicia inválido");
    try {
      const payload = {
        id: editing.id,
        name: editing.name.trim(),
        unit: editing.unit.trim(),
        cost: Number(editing.cost),
        cat: editing.cat?.trim() || "Materia Prima",
      };
      if (franchisePrice != null) payload.franchisePrice = franchisePrice;
      await saveIngredient(payload);
      setEditing(null);
      setFlash("✓ Ingrediente actualizado");
      setTimeout(() => setFlash(""), 3000);
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleCreate = async () => {
    if (!editing?.id?.trim()) return alert("ID obligatorio");
    if (baseIds.has(editing.id) || fsById[editing.id]) return alert("Ese ID ya existe");
    try {
      const payload = {
        id: editing.id.trim(),
        name: editing.name.trim(),
        unit: editing.unit.trim(),
        cost: Number(editing.cost),
        cat: editing.cat?.trim() || "Materia Prima",
        custom: true,
      };
      if (editing.franchisePrice != null && editing.franchisePrice !== "") {
        payload.franchisePrice = Number(editing.franchisePrice);
      }
      await saveIngredient(payload);
      setEditing(null);
      setCreating(false);
      setFlash("✓ Ingrediente creado");
      setTimeout(() => setFlash(""), 3000);
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleDelete = async (i) => {
    if (!confirm(`¿Eliminar "${i.name}"? Las recetas que lo usan usarán el fallback costPerUnit histórico.`)) return;
    try {
      await deleteIngredient(i.id);
      setFlash("✓ Ingrediente eliminado");
      setTimeout(() => setFlash(""), 3000);
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleRestore = async (i) => {
    try {
      await restoreIngredient(i.id);
      setFlash("✓ Ingrediente restaurado");
      setTimeout(() => setFlash(""), 3000);
    } catch (err) { alert("Error: " + err.message); }
  };

  const startCreate = () => {
    setEditing({ id: "", name: "", unit: "libra", cost: 0, franchisePrice: "", cat: "Materia Prima" });
    setCreating(true);
  };

  const inp = (s = {}) => ({ background: "#11233a", border: "1px solid #1d3b5b", borderRadius: 8, padding: "8px 10px", color: "#d4e8f7", fontSize: 12, outline: "none", width: "100%", boxSizing: "border-box", ...s });

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ color: "#d4e8f7", fontSize: 22, fontWeight: 800, margin: 0 }}>🌿 Ingredientes (Materia Prima)</h1>
          <p style={{ color: "#5d85aa", fontSize: 12, marginTop: 4 }}>
            Costos HQ y precios de venta a franquiciados. Las recetas usan estos precios automáticamente.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {flash && <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 700 }}>{flash}</span>}
          <button onClick={startCreate}
            style={{ background: "#0369a1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            ➕ Nuevo Ingrediente
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <KCard label="Ingredientes activos" val={totals.total} sub={`${totals.base} base + ${totals.custom} creados`} col="#22c55e" icon="🌿" />
        <KCard label="Costos modificados" val={totals.modified} sub="overrides activos" col="#60a5fa" icon="✎" />
        <KCard label="Con precio franquicia" val={totals.withFranchise} sub="venden a franquiciados" col="#a78bfa" icon="🏠" />
        <KCard label="Nuevos creados" val={totals.custom} sub="desde la UI" col="#fbbf24" icon="➕" />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input placeholder="🔍 Buscar ingrediente..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inp(), width: 260 }} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ background: "#16304a", border: "1px solid #1d3b5b", color: "#d4e8f7", borderRadius: 9, padding: "8px 12px", fontSize: 12 }}>
          <option value="all">Todas las categorías</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#5d85aa", fontSize: 11, cursor: "pointer" }}>
          <input type="checkbox" checked={showDeleted} onChange={e => setShowDeleted(e.target.checked)} style={{ accentColor: "#0369a1" }} />
          Ver eliminados
        </label>
      </div>

      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ background: "#16304a" }}>
            {["Ingrediente", "Categoría", "Unidad", "ID", "Tipo", "Costo HQ", "Precio Franquicia", "Margen %", ""].map((h, i) => (
              <th key={h} style={{ padding: "10px 10px", textAlign: i >= 5 ? "right" : "left", color: "#5d85aa", fontSize: 11, fontWeight: 600 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={9} style={{ padding: 24, textAlign: "center", color: "#3a5c7f" }}>Sin ingredientes</td></tr>
              : filtered.map(i => {
                const tagCol = i.isDeleted ? "#3a5c7f" : !i.isBase ? "#a78bfa" : i.isModified ? "#60a5fa" : "#22c55e";
                const tagTxt = i.isDeleted ? "Eliminado" : !i.isBase ? "Nuevo" : i.isModified ? "Modificado" : "Base";
                const hasFranchise = typeof i.franchisePrice === "number" && i.franchisePrice > 0;
                const margin = hasFranchise && i.cost > 0 ? ((i.franchisePrice - i.cost) / i.cost) * 100 : null;
                return (
                  <tr key={i.id} style={{ borderTop: "1px solid #16304a", opacity: i.isDeleted ? 0.55 : 1 }}>
                    <td style={{ padding: "9px 10px", color: "#b8d8ee", fontWeight: 600 }}>{i.name}</td>
                    <td style={{ padding: "9px 10px" }}>
                      <span style={{ background: "#1e0e06", color: "#8aafd2", padding: "2px 8px", borderRadius: 5, fontSize: 10 }}>{i.cat || "Materia Prima"}</span>
                    </td>
                    <td style={{ padding: "9px 10px", color: "#8aafd2" }}>{i.unit}</td>
                    <td style={{ padding: "9px 10px", color: "#3a5c7f", fontSize: 10, fontFamily: "monospace" }}>{i.id}</td>
                    <td style={{ padding: "9px 10px" }}>
                      <span style={{ background: "#1e0e06", color: tagCol, padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700 }}>{tagTxt}</span>
                    </td>
                    <td style={{ padding: "9px 10px", textAlign: "right", color: "#f97316", fontWeight: 700 }}>{L(i.cost)}</td>
                    <td style={{ padding: "9px 10px", textAlign: "right", color: hasFranchise ? "#a78bfa" : "#1d3b5b", fontWeight: hasFranchise ? 700 : 400 }}>
                      {hasFranchise ? L(i.franchisePrice) : "—"}
                    </td>
                    <td style={{ padding: "9px 10px", textAlign: "right", color: margin != null ? (margin >= 20 ? "#22c55e" : margin > 0 ? "#fbbf24" : "#ef4444") : "#1d3b5b", fontWeight: 700 }}>
                      {margin != null ? `${margin.toFixed(0)}%` : "—"}
                    </td>
                    <td style={{ padding: "9px 10px", textAlign: "right" }}>
                      {i.isDeleted
                        ? <button onClick={() => handleRestore(i)}
                          style={{ background: "none", border: "1px solid #064e3b", color: "#22c55e", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11 }}>
                          ↺ Restaurar
                        </button>
                        : <>
                          <button onClick={() => { setEditing({ ...i, franchisePrice: i.franchisePrice ?? "" }); setCreating(false); }}
                            style={{ background: "none", border: "1px solid #1d3b5b", color: "#60a5fa", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, marginRight: 4 }}>
                            ✎
                          </button>
                          <button onClick={() => handleDelete(i)}
                            style={{ background: "none", border: "1px solid #450a0a", color: "#ef4444", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11 }}>
                            🗑
                          </button>
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

      {/* MODAL */}
      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#0f1c30", border: "1px solid #1d3b5b", borderRadius: 16, padding: 24, width: 500, maxWidth: "95vw" }}>
            <h2 style={{ color: "#d4e8f7", fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>
              {creating ? "➕ Nuevo Ingrediente" : "✎ Editar Ingrediente"}
            </h2>

            {creating && (
              <>
                <label style={{ color: "#5d85aa", fontSize: 11, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>ID único</label>
                <input value={editing.id} onChange={e => setEditing(p => ({ ...p, id: e.target.value }))}
                  placeholder="ej: mozz-extra" style={{ ...inp(), marginBottom: 12, fontFamily: "monospace" }} />
              </>
            )}

            <label style={{ color: "#5d85aa", fontSize: 11, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Nombre</label>
            <input value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} style={{ ...inp(), marginBottom: 12 }} />

            <label style={{ color: "#5d85aa", fontSize: 11, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Categoría</label>
            <select value={editing.cat || "Materia Prima"} onChange={e => setEditing(p => ({ ...p, cat: e.target.value }))}
              style={{ ...inp(), marginBottom: 12 }}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <label style={{ color: "#5d85aa", fontSize: 11, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Unidad</label>
            <input value={editing.unit} list="units-list" onChange={e => setEditing(p => ({ ...p, unit: e.target.value }))} style={{ ...inp(), marginBottom: 12 }} />
            <datalist id="units-list">
              {COMMON_UNITS.map(u => <option key={u} value={u} />)}
            </datalist>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ color: "#5d85aa", fontSize: 11, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Costo HQ (L)</label>
                <input type="number" step="0.01" value={editing.cost} onChange={e => setEditing(p => ({ ...p, cost: e.target.value }))} style={inp()} />
              </div>
              <div>
                <label style={{ color: "#a78bfa", fontSize: 11, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Precio Franquicia (L)</label>
                <input type="number" step="0.01" value={editing.franchisePrice ?? ""} onChange={e => setEditing(p => ({ ...p, franchisePrice: e.target.value }))}
                  placeholder="opcional" style={inp()} />
              </div>
            </div>

            <div style={{ background: "#0f0a06", border: "1px solid #1d3b5b", borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 11, color: "#5d85aa" }}>
              💡 El <strong style={{ color: "#f97316" }}>Costo HQ</strong> se usa para costear recetas en reportes internos.
              El <strong style={{ color: "#a78bfa" }}>Precio Franquicia</strong> se usa cuando el usuario es franquiciado (opcional).
              Cada cambio de precio se registra en el historial de auditoría.
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
