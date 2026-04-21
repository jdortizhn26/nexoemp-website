/**
 * permissions.js — Módulo central de permisos por rol
 *
 * Roles:
 *   admin                 → HQ, acceso total
 *   inventory             → Encargado de inventario (1 sucursal)
 *   branch                → Encargado de tienda (1 sucursal)
 *   franchisee            → Dueño de franquicia (1+ sucursales)
 *   franchisee_delegate   → Empleado delegado del franquiciado
 *
 * Estructura de userRole (doc users/{uid}):
 *   {
 *     role: "admin" | "inventory" | "branch" | "franchisee" | "franchisee_delegate",
 *     branchId?: string,         // sucursal principal (para branch, inventory, delegate)
 *     branchIds?: string[],      // sucursales del franquiciado (1 o más)
 *     franchiseOwnerUid?: string // uid del franquiciado padre (para delegates)
 *   }
 */

export const ROLES = {
  ADMIN: "admin",
  INVENTORY: "inventory",
  BRANCH: "branch",
  FRANCHISEE: "franchisee",
  FRANCHISEE_DELEGATE: "franchisee_delegate",
};

// ─── Helpers de pertenencia ────────────────────────────────────────────────
export const isAdmin = (u) => u?.role === ROLES.ADMIN;
export const isFranchisee = (u) => u?.role === ROLES.FRANCHISEE;
export const isFranchiseeDelegate = (u) => u?.role === ROLES.FRANCHISEE_DELEGATE;
export const isFranchiseeOrDelegate = (u) => isFranchisee(u) || isFranchiseeDelegate(u);
export const isInventoryRole = (u) => u?.role === ROLES.INVENTORY;
export const isBranchRole = (u) => u?.role === ROLES.BRANCH;

// Sucursales que el usuario puede ver
export function visibleBranchIds(u) {
  if (!u) return [];
  if (isAdmin(u)) return "*"; // todas
  if (isFranchiseeOrDelegate(u)) return u.branchIds || (u.branchId ? [u.branchId] : []);
  return u.branchId ? [u.branchId] : [];
}

export function filterBranches(u, allBranches) {
  const ids = visibleBranchIds(u);
  if (ids === "*") return allBranches;
  return (allBranches || []).filter(b => ids.includes(b.id));
}

export function canSeeBranch(u, branchId) {
  const ids = visibleBranchIds(u);
  if (ids === "*") return true;
  return ids.includes(branchId);
}

// ─── Permisos por vista ────────────────────────────────────────────────────
export function canAccessView(u, view) {
  if (!u) return false;
  if (isAdmin(u)) return true;

  const r = u.role;

  switch (view) {
    case "dashboard":
    case "reports":
      return true; // todos ven su propio scope

    case "sales":
      // branch y franchisee/delegate registran ventas. inventory en emergencia.
      return [ROLES.BRANCH, ROLES.FRANCHISEE, ROLES.FRANCHISEE_DELEGATE, ROLES.INVENTORY].includes(r);

    case "inventory":
      // inventory gestiona, branch solo ve (controlado dentro de la vista), franchisees gestionan
      return [ROLES.INVENTORY, ROLES.BRANCH, ROLES.FRANCHISEE, ROLES.FRANCHISEE_DELEGATE].includes(r);

    case "recipes":
      // todos pueden acceder, franchisees en modo "solo costo"
      return true;

    case "banks":
      // admin y franchisee (sus propios depósitos)
      return [ROLES.FRANCHISEE, ROLES.FRANCHISEE_DELEGATE].includes(r);

    case "warehouse":
      // solo admin (bodega central es de HQ)
      return false;

    case "differences":
      // admin todo, franchisee su local, inventory su local
      return [ROLES.FRANCHISEE, ROLES.FRANCHISEE_DELEGATE, ROLES.INVENTORY].includes(r);

    case "branches":
      // admin + franchisee (para crear sucursales adicionales de su franquicia)
      return r === ROLES.FRANCHISEE;

    case "users":
      // admin + franchisee (para gestionar sus delegados)
      return r === ROLES.FRANCHISEE;

    case "products":
      // solo admin (isAdmin ya retornó true arriba si aplica)
      return false;  // no-admin llega acá → denegado

    default:
      return false;
  }
}

// ─── Permisos granulares ───────────────────────────────────────────────────
export function canEditRecipes(u) { return isAdmin(u); }
export function canViewRecipeQuantities(u) {
  // franchisees solo ven costo total, no cantidades ni ingredientes
  return !isFranchiseeOrDelegate(u);
}
export function canApproveRequisitions(u) { return isAdmin(u); }
export function canCreateRequisitions(u) {
  return [ROLES.INVENTORY, ROLES.FRANCHISEE, ROLES.FRANCHISEE_DELEGATE].includes(u?.role);
}
export function canReceiveTransfers(u) {
  return [ROLES.INVENTORY, ROLES.BRANCH, ROLES.FRANCHISEE, ROLES.FRANCHISEE_DELEGATE].includes(u?.role);
}
export function canDoInventoryCount(u) {
  return [ROLES.INVENTORY, ROLES.FRANCHISEE, ROLES.FRANCHISEE_DELEGATE].includes(u?.role);
}
export function canProcessDeposits(u, depositBranchId = null) {
  if (isAdmin(u)) return true;
  if (isFranchiseeOrDelegate(u) && depositBranchId) return canSeeBranch(u, depositBranchId);
  return false;
}
export function canManageUsers(u) {
  return isAdmin(u) || isFranchisee(u); // franchisee gestiona sus delegados
}
export function canManageBranches(u) {
  return isAdmin(u) || isFranchisee(u); // franchisee crea sucursales adicionales
}
export function canSeeWarehouseCentral(u) { return isAdmin(u); }
export function canSeeCostsHQ(u) { return isAdmin(u); }

// ─── Nav items según rol ───────────────────────────────────────────────────
export function navItemsFor(u) {
  if (!u) return [];
  const items = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "sales",     icon: "🧾", label: "Ingreso de Ventas" },
    { id: "inventory", icon: "📦", label: "Inventario" },
    { id: "recipes",   icon: "🦐", label: "Recetas & Costos" },
    { id: "reports",   icon: "📈", label: "Reportes" },
  ];
  // Bancos: admin y franquiciados
  if (isAdmin(u) || isFranchiseeOrDelegate(u)) {
    items.push({ id: "banks", icon: "🏦", label: "Bancos" });
  }
  // Bodega Central: solo admin
  if (isAdmin(u)) {
    items.push({ id: "warehouse", icon: "🏭", label: "Bodega Central" });
  }
  // Productos: solo admin
  if (isAdmin(u)) {
    items.push({ id: "products", icon: "🛒", label: "Productos" });
  }
  // Ingredientes: solo admin
  if (isAdmin(u)) {
    items.push({ id: "ingredients", icon: "🌿", label: "Ingredientes" });
  }
  // Diferencias: admin, franchisees, inventory
  if (isAdmin(u) || isFranchiseeOrDelegate(u) || isInventoryRole(u)) {
    items.push({ id: "differences", icon: "🔍", label: "Diferencias" });
  }
  // Sucursales: admin y franchisee (sus propias)
  if (canManageBranches(u)) {
    items.push({ id: "branches", icon: "🏪", label: "Sucursales" });
  }
  // Usuarios: admin y franchisee
  if (canManageUsers(u)) {
    items.push({ id: "users", icon: "👥", label: "Usuarios" });
  }
  // Filtrar por view access por si hay alguna excepción
  return items.filter(n => canAccessView(u, n.id));
}

// ─── Filtros de datos según scope ──────────────────────────────────────────
// Aplican a ventas, inventarios, transfers, requisiciones, movements
export function filterByScope(u, items, branchKey = "branchId") {
  if (!u || !items) return [];
  const ids = visibleBranchIds(u);
  if (ids === "*") return items;
  return items.filter(it => ids.includes(it[branchKey]));
}
