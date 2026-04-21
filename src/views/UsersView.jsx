import { useState, useMemo } from "react";
import { Card, KCard } from "../components/ui";
import { ROLES, isAdmin, isFranchisee } from "../lib/permissions";

const ROLE_LABELS = {
  admin: { label: "👑 Admin General", color: "#ef4444", desc: "Acceso total al sistema" },
  inventory: { label: "📦 Encargado Inventario", color: "#60a5fa", desc: "Gestiona inventario de 1 sucursal" },
  branch: { label: "🧾 Encargado Tienda", color: "#22c55e", desc: "Registra ventas de 1 sucursal" },
  franchisee: { label: "🏠 Franquiciado", color: "#a78bfa", desc: "Dueño de 1+ franquicias" },
  franchisee_delegate: { label: "👥 Delegado", color: "#fbbf24", desc: "Empleado de un franquiciado" },
};

export function UsersView({ data, userRole, createUser, updateUserProfile, deleteUserProfile }) {
  const [tab, setTab] = useState("list");
  const [flash, setFlash] = useState("");
  const [editUser, setEditUser] = useState(null);

  // Form state para crear
  const [form, setForm] = useState({
    email: "", password: "",
    role: isAdmin(userRole) ? ROLES.BRANCH : ROLES.FRANCHISEE_DELEGATE,
    branchId: "", branchIds: [],
  });

  const allUsers = data?.users || [];
  const myUid = userRole?.uid;

  // Scope: admin ve todos, franchisee ve solo sus delegados
  const visibleUsers = useMemo(() => {
    if (isAdmin(userRole)) return allUsers;
    if (isFranchisee(userRole)) {
      return allUsers.filter(u => u.franchiseOwnerUid === myUid || u.uid === myUid);
    }
    return [];
  }, [allUsers, userRole, myUid]);

  // Roles que este usuario puede asignar
  const allowedRoles = useMemo(() => {
    if (isAdmin(userRole)) return [ROLES.ADMIN, ROLES.INVENTORY, ROLES.BRANCH, ROLES.FRANCHISEE, ROLES.FRANCHISEE_DELEGATE];
    if (isFranchisee(userRole)) return [ROLES.FRANCHISEE_DELEGATE];
    return [];
  }, [userRole]);

  // Sucursales que este usuario puede asignar
  const allowedBranches = useMemo(() => {
    if (isAdmin(userRole)) return data?.branches || [];
    if (isFranchisee(userRole)) {
      const ids = userRole.branchIds || (userRole.branchId ? [userRole.branchId] : []);
      return (data?.branches || []).filter(b => ids.includes(b.id));
    }
    return [];
  }, [userRole, data?.branches]);

  const counts = useMemo(() => {
    const c = { admin: 0, inventory: 0, branch: 0, franchisee: 0, franchisee_delegate: 0 };
    visibleUsers.forEach(u => { if (c[u.role] !== undefined) c[u.role]++; });
    return c;
  }, [visibleUsers]);

  const handleCreate = async () => {
    if (!form.email || !form.password) return alert("Email y contraseña son obligatorios");
    if (form.password.length < 6) return alert("La contraseña debe tener al menos 6 caracteres");

    const profile = { role: form.role };

    // Roles single-branch
    if ([ROLES.BRANCH, ROLES.INVENTORY].includes(form.role)) {
      if (!form.branchId) return alert("Seleccioná una sucursal");
      profile.branchId = form.branchId;
    }
    // Franchisee puede tener 1+ sucursales
    if (form.role === ROLES.FRANCHISEE) {
      if (form.branchIds.length === 0) return alert("Seleccioná al menos una sucursal");
      profile.branchIds = form.branchIds;
    }
    // Delegate heredará sucursales del franchisee
    if (form.role === ROLES.FRANCHISEE_DELEGATE) {
      if (isFranchisee(userRole)) {
        profile.franchiseOwnerUid = myUid;
        profile.branchIds = userRole.branchIds || (userRole.branchId ? [userRole.branchId] : []);
      } else {
        if (!form.branchId) return alert("Seleccioná el franquiciado padre");
        // Admin crea delegado → debería seleccionar franchisee padre (por simplicidad, asume branchId)
        profile.franchiseOwnerUid = form.branchId; // abuso del campo; refinar si hace falta
      }
    }

    try {
      await createUser({ email: form.email, password: form.password, profile });
      setForm({ email: "", password: "", role: form.role, branchId: "", branchIds: [] });
      setTab("list");
      setFlash(`✓ Usuario ${form.email} creado`);
      setTimeout(() => setFlash(""), 4000);
    } catch (err) {
      alert("Error al crear usuario:\n\n" + err.message);
    }
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    const updates = { role: editUser.role };
    if ([ROLES.BRANCH, ROLES.INVENTORY].includes(editUser.role)) updates.branchId = editUser.branchId || null;
    if (editUser.role === ROLES.FRANCHISEE) updates.branchIds = editUser.branchIds || [];
    if (editUser.role === ROLES.FRANCHISEE_DELEGATE) {
      updates.franchiseOwnerUid = editUser.franchiseOwnerUid || null;
      updates.branchIds = editUser.branchIds || [];
    }
    try {
      await updateUserProfile(editUser.uid, updates);
      setEditUser(null);
      setFlash("✓ Usuario actualizado");
      setTimeout(() => setFlash(""), 3000);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (uid, email) => {
    if (!confirm(`¿Eliminar el perfil de ${email}? La cuenta de Firebase Auth seguirá existiendo pero sin acceso al sistema.`)) return;
    try {
      await deleteUserProfile(uid);
      setFlash("✓ Perfil eliminado");
      setTimeout(() => setFlash(""), 3000);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const inp = (s = {}) => ({ background: "#11233a", border: "1px solid #1d3b5b", borderRadius: 8, padding: "8px 10px", color: "#d4e8f7", fontSize: 12, outline: "none", width: "100%", boxSizing: "border-box", ...s });

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ color: "#d4e8f7", fontSize: 22, fontWeight: 800, margin: 0 }}>👥 Gestión de Usuarios</h1>
          <p style={{ color: "#5d85aa", fontSize: 12, marginTop: 4 }}>
            {isAdmin(userRole) ? "Administrá todos los usuarios del sistema" : "Gestioná los empleados delegados de tu franquicia"}
          </p>
        </div>
        {flash && <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 700 }}>{flash}</span>}
      </div>

      {/* KPIs por rol */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${allowedRoles.length}, 1fr)`, gap: 12 }}>
        {allowedRoles.map(r => (
          <KCard key={r} label={ROLE_LABELS[r]?.label || r} val={counts[r] || 0}
            sub={ROLE_LABELS[r]?.desc || ""} col={ROLE_LABELS[r]?.color || "#8aafd2"} icon="" />
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #1d3b5b" }}>
        {[["list", `📋 Usuarios (${visibleUsers.length})`], ["create", "➕ Crear Usuario"]].map(([t, lbl]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "10px 20px", fontSize: 12, fontWeight: tab === t ? 700 : 400, border: "none",
            borderBottom: tab === t ? "2px solid #0369a1" : "2px solid transparent",
            background: "none", cursor: "pointer", color: tab === t ? "#d4e8f7" : "#5d85aa",
          }}>{lbl}</button>
        ))}
      </div>

      {/* TAB: LIST */}
      {tab === "list" && (
        <Card>
          {visibleUsers.length === 0
            ? <p style={{ color: "#3a5c7f", fontSize: 12, textAlign: "center", padding: 24 }}>No hay usuarios registrados todavía</p>
            : <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ background: "#16304a" }}>
                {["Email", "Rol", "Sucursal(es)", "Creado", ""].map((h, i) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: i >= 4 ? "right" : "left", color: "#5d85aa", fontSize: 11, fontWeight: 600 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {visibleUsers.map(u => {
                  const rl = ROLE_LABELS[u.role] || { label: u.role, color: "#8aafd2" };
                  const branchNames = (u.branchIds || (u.branchId ? [u.branchId] : []))
                    .map(id => data.branches.find(b => b.id === id)?.name || id).join(", ") || "—";
                  const isSelf = u.uid === myUid;
                  return (
                    <tr key={u.uid} style={{ borderTop: "1px solid #16304a" }}>
                      <td style={{ padding: "10px 12px", color: "#b8d8ee", fontWeight: 600 }}>
                        {u.email || "—"} {isSelf && <span style={{ color: "#5d85aa", fontSize: 10 }}>(vos)</span>}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: "#1e0e06", color: rl.color, padding: "3px 9px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>{rl.label}</span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#8aafd2", fontSize: 11 }}>{branchNames}</td>
                      <td style={{ padding: "10px 12px", color: "#5d85aa", fontSize: 11 }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("es-HN") : "—"}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        {!isSelf && allowedRoles.includes(u.role) && (
                          <>
                            <button onClick={() => setEditUser({ ...u })}
                              style={{ background: "none", border: "1px solid #1d3b5b", color: "#60a5fa", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11, marginRight: 4 }}>
                              ✎ Editar
                            </button>
                            <button onClick={() => handleDelete(u.uid, u.email)}
                              style={{ background: "none", border: "1px solid #450a0a", color: "#ef4444", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11 }}>
                              🗑 Eliminar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          }
        </Card>
      )}

      {/* TAB: CREATE */}
      {tab === "create" && (
        <Card>
          <h2 style={{ color: "#d4e8f7", fontSize: 14, fontWeight: 700, marginBottom: 14 }}>➕ Crear Nuevo Usuario</h2>
          <div style={{ background: "#0f0a06", border: "1px solid #1d3b5b", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 11, color: "#5d85aa" }}>
            💡 Se creará una cuenta en Firebase Auth con el email y contraseña indicados. El usuario podrá ingresar inmediatamente. Tu sesión no se verá afectada.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ color: "#5d85aa", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="usuario@lamar.hn" style={inp()} />
            </div>
            <div>
              <label style={{ color: "#5d85aa", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Contraseña (mín 6 chars)</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••" style={inp()} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ color: "#5d85aa", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Rol</label>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${allowedRoles.length}, 1fr)`, gap: 8 }}>
              {allowedRoles.map(r => (
                <button key={r} onClick={() => setForm(p => ({ ...p, role: r }))} style={{
                  background: form.role === r ? "#16304a" : "transparent",
                  border: `1px solid ${form.role === r ? ROLE_LABELS[r].color : "#1d3b5b"}`,
                  color: form.role === r ? ROLE_LABELS[r].color : "#5d85aa",
                  borderRadius: 9, padding: "10px 12px", cursor: "pointer", fontSize: 11, fontWeight: form.role === r ? 700 : 400, textAlign: "left",
                }}>
                  <div>{ROLE_LABELS[r].label}</div>
                  <div style={{ fontSize: 10, color: "#3a5c7f", marginTop: 2 }}>{ROLE_LABELS[r].desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sucursal(es) según rol */}
          {[ROLES.BRANCH, ROLES.INVENTORY].includes(form.role) && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: "#5d85aa", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Sucursal</label>
              <select value={form.branchId} onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))} style={inp()}>
                <option value="">— Seleccionar —</option>
                {allowedBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          {form.role === ROLES.FRANCHISEE && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ color: "#5d85aa", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Sucursales asignadas (1 o más)</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 6 }}>
                {allowedBranches.map(b => {
                  const checked = form.branchIds.includes(b.id);
                  return (
                    <label key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#11233a", borderRadius: 7, cursor: "pointer", fontSize: 12, color: "#b8d8ee" }}>
                      <input type="checkbox" checked={checked} onChange={e => {
                        setForm(p => ({ ...p, branchIds: e.target.checked ? [...p.branchIds, b.id] : p.branchIds.filter(x => x !== b.id) }));
                      }} style={{ accentColor: "#0369a1" }} />
                      {b.name}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {form.role === ROLES.FRANCHISEE_DELEGATE && isFranchisee(userRole) && (
            <div style={{ marginBottom: 14, padding: 12, background: "#170c2a", border: "1px solid #3730a3", borderRadius: 8, fontSize: 11, color: "#8aafd2" }}>
              Este delegado heredará acceso a tus {userRole.branchIds?.length || 1} sucursal(es) automáticamente.
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setTab("list")}
              style={{ background: "none", border: "1px solid #1d3b5b", color: "#5d85aa", borderRadius: 9, padding: "9px 18px", cursor: "pointer", fontSize: 12 }}>Cancelar</button>
            <button onClick={handleCreate}
              style={{ background: "#0369a1", color: "#fff", border: "none", borderRadius: 9, padding: "9px 22px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              ✓ Crear Usuario
            </button>
          </div>
        </Card>
      )}

      {/* MODAL EDITAR */}
      {editUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#0f1c30", border: "1px solid #1d3b5b", borderRadius: 16, padding: 24, width: 500, maxWidth: "95vw" }}>
            <h2 style={{ color: "#d4e8f7", fontSize: 16, fontWeight: 800, margin: "0 0 12px" }}>✎ Editar Usuario</h2>
            <p style={{ color: "#5d85aa", fontSize: 12, margin: "0 0 16px" }}>{editUser.email}</p>

            <label style={{ color: "#5d85aa", fontSize: 11, display: "block", marginBottom: 6 }}>Rol</label>
            <select value={editUser.role} onChange={e => setEditUser(p => ({ ...p, role: e.target.value }))} style={{ ...inp(), marginBottom: 12 }}>
              {allowedRoles.map(r => <option key={r} value={r}>{ROLE_LABELS[r].label}</option>)}
            </select>

            {[ROLES.BRANCH, ROLES.INVENTORY].includes(editUser.role) && (
              <>
                <label style={{ color: "#5d85aa", fontSize: 11, display: "block", marginBottom: 6 }}>Sucursal</label>
                <select value={editUser.branchId || ""} onChange={e => setEditUser(p => ({ ...p, branchId: e.target.value }))} style={{ ...inp(), marginBottom: 12 }}>
                  <option value="">— Sin sucursal —</option>
                  {allowedBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </>
            )}

            {editUser.role === ROLES.FRANCHISEE && (
              <>
                <label style={{ color: "#5d85aa", fontSize: 11, display: "block", marginBottom: 6 }}>Sucursales asignadas</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
                  {allowedBranches.map(b => {
                    const checked = (editUser.branchIds || []).includes(b.id);
                    return (
                      <label key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#11233a", borderRadius: 7, cursor: "pointer", fontSize: 11, color: "#b8d8ee" }}>
                        <input type="checkbox" checked={checked} onChange={e => {
                          setEditUser(p => ({ ...p, branchIds: e.target.checked ? [...(p.branchIds || []), b.id] : (p.branchIds || []).filter(x => x !== b.id) }));
                        }} style={{ accentColor: "#0369a1" }} />
                        {b.name}
                      </label>
                    );
                  })}
                </div>
              </>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
              <button onClick={() => setEditUser(null)}
                style={{ background: "none", border: "1px solid #1d3b5b", color: "#5d85aa", borderRadius: 9, padding: "9px 18px", cursor: "pointer", fontSize: 12 }}>Cancelar</button>
              <button onClick={handleSaveEdit}
                style={{ background: "#0369a1", color: "#fff", border: "none", borderRadius: 9, padding: "9px 22px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
