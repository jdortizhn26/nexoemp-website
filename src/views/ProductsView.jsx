import { useState, useMemo } from "react";
import { L } from "../lib/helpers";
import { PRODUCTS, resolveCategories, resolveProducts } from "../lib/catalog";
import { Card, KCard } from "../components/ui";

// Prefijos por categoría (para generar IDs legibles tipo "cev-", "sopa-", etc.)
const CAT_PREFIXES = {
  "Ceviches": "cev",
  "Sopas": "sopa",
  "Salsas": "salsa",
  "Acompañantes": "acomp",
  "Complementos": "comp",
  "Bebidas": "bev",
};

// Convierte texto a slug: sin acentos, minúsculas, guiones
function slugify(s) {
  return String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita acentos
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 30);
}

// Genera ID único basado en nombre + categoría, evitando colisiones
function generateId(name, cat, existingIds) {
  const prefix = CAT_PREFIXES[cat] || slugify(cat).slice(0, 4) || "prod";
  const base = slugify(name);
  if (!base) return "";
  let id = `${prefix}-${base}`;
  if (!existingIds.has(id)) return id;
  // agregar sufijo numérico si ya existe
  let i = 2;
  while (existingIds.has(`${id}-${i}`)) i++;
  return `${id}-${i}`;
}

export function ProductsView({ data, saveProduct, deleteProduct, restoreProduct }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [editing, setEditing] = useState(null); // producto en edición
  const [creating, setCreating] = useState(false);
  const [flash, setFlash] = useState("");
  const [catMode, setCatMode] = useState("select"); // "select" | "new"
  const [idEdited, setIdEdited] = useState(false); // si el user tocó el ID manualmente

  const fsProducts = data?.products || [];
  const baseIds = useMemo(() => new Set(PRODUCTS.map(p => p.id)), []);
  const fsById = useMemo(() => {
    const m = {};
    fsProducts.forEach(p => { m[p.id] = p; });
    return m;
  }, [fsProducts]);

  const categories = useMemo(() => resolveCategories(fsProducts), [fsProducts]);

  // Todos los productos incluyendo eliminados
  const allRows = useMemo(() => {
    // base productos + fsProducts nuevos
    const rows = [];
    PRODUCTS.forEach(p => {
      const fs = fsById[p.id];
      rows.push({
        ...p,
        ...(fs || {}),
        isBase: true,
        isModified: !!fs,
        isDeleted: !!fs?.deleted,
      });
    });
    fsProducts.forEach(p => {
      if (!baseIds.has(p.id)) {
        rows.push({
          ...p,
          isBase: false,
          isModified: true,
          isDeleted: !!p.deleted,
        });
      }
    });
    return rows;
  }, [fsProducts, fsById, baseIds]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allRows
      .filter(p => showDeleted || !p.isDeleted)
      .filter(p => !q || p.name.toLowerCase().includes(q))
      .filter(p => catFilter === "all" || p.cat === catFilter)
      .sort((a, b) => (a.cat || "").localeCompare(b.cat || "") || (a.name || "").localeCompare(b.name || ""));
  }, [allRows, search, catFilter, showDeleted]);

  const counts = useMemo(() => ({
    total: allRows.filter(p => !p.isDeleted).length,
    base: allRows.filter(p => p.isBase && !p.isDeleted).length,
    modified: allRows.filter(p => p.isModified && !p.isDeleted).length,
    custom: allRows.filter(p => !p.isBase && !p.isDeleted).length,
    deleted: allRows.filter(p => p.isDeleted).length,
  }), [allRows]);

  const handleSaveEdit = async () => {
    if (!editing) return;
    if (!editing.name?.trim()) return alert("El nombre es obligatorio");
    if (isNaN(Number(editing.price)) || Number(editing.price) < 0) return alert("Precio inválido");
    if (!editing.cat) return alert("Categoría obligatoria");
    try {
      await saveProduct({
        id: editing.id,
        name: editing.name.trim(),
        cat: editing.cat,
        price: Number(editing.price),
      });
      setEditing(null);
      setFlash("✓ Producto actualizado");
      setTimeout(() => setFlash(""), 3000);
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleCreate = async () => {
    if (!editing?.id?.trim()) return alert("ID obligatorio");
    if (baseIds.has(editing.id) || fsById[editing.id]) return alert("Ese ID ya existe");
    if (!editing.name?.trim()) return alert("Nombre obligatorio");
    if (isNaN(Number(editing.price)) || Number(editing.price) < 0) return alert("Precio inválido");
    if (!editing.cat?.trim()) return alert("Categoría obligatoria");
    try {
      await saveProduct({
        id: editing.id.trim(),
        name: editing.name.trim(),
        cat: editing.cat.trim(),
        price: Number(editing.price),
        custom: true,
      });
      setEditing(null);
      setCreating(false);
      setFlash("✓ Producto creado");
      setTimeout(() => setFlash(""), 3000);
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleDelete = async (p) => {
    if (!confirm(`¿Eliminar "${p.name}"? No afectará ventas pasadas, pero ya no aparecerá para nuevas ventas.`)) return;
    try {
      await deleteProduct(p.id);
      setFlash("✓ Producto eliminado (soft-delete)");
      setTimeout(() => setFlash(""), 3000);
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleRestore = async (p) => {
    try {
      await restoreProduct(p.id);
      setFlash("✓ Producto restaurado");
      setTimeout(() => setFlash(""), 3000);
    } catch (err) { alert("Error: " + err.message); }
  };

  const startCreate = () => {
    setEditing({ id: "", name: "", cat: categories[0] || "Ceviches", price: 0 });
    setCreating(true);
    setCatMode("select");
    setIdEdited(false);
  };

  const existingIds = useMemo(() => {
    const s = new Set(PRODUCTS.map(p => p.id));
    fsProducts.forEach(p => s.add(p.id));
    return s;
  }, [fsProducts]);

  // Actualiza nombre y auto-genera ID si el user no lo editó manualmente
  const handleNameChange = (name) => {
    setEditing(p => {
      const next = { ...p, name };
      if (creating && !idEdited) next.id = generateId(name, p.cat, existingIds);
      return next;
    });
  };

  const handleCatChange = (cat) => {
    setEditing(p => {
      const next = { ...p, cat };
      if (creating && !idEdited && p.name) next.id = generateId(p.name, cat, existingIds);
      return next;
    });
  };

  const inp = (s = {}) => ({ background: "#11233a", border: "1px solid #1d3b5b", borderRadius: 8, padding: "8px 10px", color: "#d4e8f7", fontSize: 12, outline: "none", width: "100%", boxSizing: "border-box", ...s });

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ color: "#d4e8f7", fontSize: 22, fontWeight: 800, margin: 0 }}>🛒 Productos</h1>
          <p style={{ color: "#5d85aa", fontSize: 12, marginTop: 4 }}>Gestioná precios, nombres y el catálogo completo</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {flash && <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 700 }}>{flash}</span>}
          <button onClick={startCreate}
            style={{ background: "#0369a1", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            ➕ Nuevo Producto
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <KCard label="Productos activos" val={counts.total} sub={`${counts.base} base + ${counts.custom} creados`} col="#22c55e" icon="🛒" />
        <KCard label="Con precio modificado" val={counts.modified} sub="Overrides activos" col="#60a5fa" icon="✎" />
        <KCard label="Nuevos creados" val={counts.custom} sub="desde la UI" col="#a78bfa" icon="➕" />
        <KCard label="Eliminados" val={counts.deleted} sub="(soft-delete)" col="#5d85aa" icon="🗑" />
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input placeholder="🔍 Buscar producto..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inp(), width: 300 }} />
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
            {["Producto", "Categoría", "ID", "Tipo", "Precio", ""].map((h, i) => (
              <th key={h} style={{ padding: "10px 12px", textAlign: i >= 4 ? "right" : "left", color: "#5d85aa", fontSize: 11, fontWeight: 600 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#3a5c7f" }}>Sin productos</td></tr>
              : filtered.map(p => {
                const tagCol = p.isDeleted ? "#3a5c7f" : !p.isBase ? "#a78bfa" : p.isModified ? "#60a5fa" : "#22c55e";
                const tagTxt = p.isDeleted ? "Eliminado" : !p.isBase ? "Nuevo" : p.isModified ? "Modificado" : "Base";
                return (
                  <tr key={p.id} style={{ borderTop: "1px solid #16304a", opacity: p.isDeleted ? 0.55 : 1 }}>
                    <td style={{ padding: "9px 12px", color: "#b8d8ee", fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: "9px 12px", color: "#8aafd2" }}>{p.cat}</td>
                    <td style={{ padding: "9px 12px", color: "#3a5c7f", fontSize: 10, fontFamily: "monospace" }}>{p.id}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <span style={{ background: "#1e0e06", color: tagCol, padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700 }}>{tagTxt}</span>
                    </td>
                    <td style={{ padding: "9px 12px", textAlign: "right", color: "#22c55e", fontWeight: 700 }}>{L(p.price)}</td>
                    <td style={{ padding: "9px 12px", textAlign: "right" }}>
                      {p.isDeleted
                        ? <button onClick={() => handleRestore(p)}
                          style={{ background: "none", border: "1px solid #064e3b", color: "#22c55e", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11 }}>
                          ↺ Restaurar
                        </button>
                        : <>
                          <button onClick={() => { setEditing({ ...p }); setCreating(false); }}
                            style={{ background: "none", border: "1px solid #1d3b5b", color: "#60a5fa", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, marginRight: 4 }}>
                            ✎ Editar
                          </button>
                          <button onClick={() => handleDelete(p)}
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

      {/* MODAL EDITAR / CREAR */}
      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#0f1c30", border: "1px solid #1d3b5b", borderRadius: 16, padding: 24, width: 500, maxWidth: "95vw" }}>
            <h2 style={{ color: "#d4e8f7", fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>
              {creating ? "➕ Nuevo Producto" : "✎ Editar Producto"}
            </h2>

            <label style={{ color: "#5d85aa", fontSize: 11, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Nombre</label>
            <input value={editing.name}
              onChange={e => creating ? handleNameChange(e.target.value) : setEditing(p => ({ ...p, name: e.target.value }))}
              placeholder="ej: Ceviche Especial de la Casa" style={{ ...inp(), marginBottom: 12 }}
              autoFocus={creating} />

            <label style={{ color: "#5d85aa", fontSize: 11, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Categoría</label>
            {creating && catMode === "select" ? (
              <select value={editing.cat}
                onChange={e => {
                  if (e.target.value === "__new__") {
                    setCatMode("new");
                    handleCatChange("");
                  } else {
                    handleCatChange(e.target.value);
                  }
                }}
                style={{ ...inp(), marginBottom: 12 }}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__new__">➕ Otra (crear nueva)…</option>
              </select>
            ) : creating ? (
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                <input value={editing.cat} onChange={e => handleCatChange(e.target.value)}
                  placeholder="Nombre de la nueva categoría" style={{ ...inp(), flex: 1 }} autoFocus />
                <button onClick={() => { setCatMode("select"); handleCatChange(categories[0] || ""); }}
                  type="button"
                  style={{ background: "none", border: "1px solid #1d3b5b", color: "#5d85aa", borderRadius: 8, padding: "0 14px", cursor: "pointer", fontSize: 11 }}>
                  ← Volver
                </button>
              </div>
            ) : (
              <input value={editing.cat} list="cats-list" onChange={e => setEditing(p => ({ ...p, cat: e.target.value }))}
                style={{ ...inp(), marginBottom: 12 }} />
            )}
            <datalist id="cats-list">
              {categories.map(c => <option key={c} value={c} />)}
            </datalist>

            {creating && (
              <>
                <label style={{ color: "#5d85aa", fontSize: 11, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                  ID único {!idEdited && <span style={{ color: "#22c55e", textTransform: "none", letterSpacing: 0, fontSize: 10 }}>· generado automáticamente</span>}
                </label>
                <input value={editing.id}
                  onChange={e => { setIdEdited(true); setEditing(p => ({ ...p, id: e.target.value })); }}
                  placeholder="se generará al escribir el nombre"
                  style={{ ...inp(), marginBottom: 12, fontFamily: "monospace", fontSize: 11, color: idEdited ? "#d4e8f7" : "#8aafd2" }} />
              </>
            )}

            <label style={{ color: "#5d85aa", fontSize: 11, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Precio (L)</label>
            <input type="number" step="0.01" value={editing.price} onChange={e => setEditing(p => ({ ...p, price: e.target.value }))}
              style={{ ...inp(), marginBottom: 16 }} />

            {!creating && !editing.isBase === false && (
              <div style={{ background: "#0f0a06", border: "1px solid #1d3b5b", borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 11, color: "#5d85aa" }}>
                💡 Este es un producto <strong style={{ color: "#d4e8f7" }}>base</strong>. Al guardar, se creará un override que prevalece sobre el código fuente.
              </div>
            )}

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
