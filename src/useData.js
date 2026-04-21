/**
 * useData.js
 * Hook central que maneja toda la comunicación con Firestore.
 * El resto de la app no necesita saber nada de Firebase —
 * solo usa { data, saveSale, saveRecipe, importSales, addBranch, deleteBranch }.
 */

import { useState, useEffect, useCallback } from "react";
import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc,
  onSnapshot, query, orderBy, writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged, createUserWithEmailAndPassword, signOut as fbSignOut } from "firebase/auth";
import { db, auth, getSecondaryAuth } from "./firebase";

const DEFAULT_BRANCHES = [
  { id: "la-mar-principal", name: "La Mar — Sucursal Principal", loc: "San Pedro Sula, Cortés" },
];

export function useData() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  // ─── CARGA INICIAL Y LISTENER EN TIEMPO REAL ───────────────────────────────
  // Espera a que Firebase Auth resuelva antes de intentar leer Firestore.
  // Sin esto, en ventanas nuevas / incógnito el primer getDocs() se dispara
  // sin token y las rules lanzan "Missing or insufficient permissions".
  useEffect(() => {
    let unsubSales, unsubRecipes, unsubWarehouse, unsubTransfers, unsubInventory, unsubRequisitions, unsubMovements, unsubUsers, unsubProducts, unsubIngredients, unsubBankAccounts, unsubAuth;
    let loaded = false;

    const loadAll = async () => {
      try {
        // Sucursales — se cargan una vez (no necesitan listener RT)
        const branchSnap = await getDocs(collection(db, "branches"));
        let branches = branchSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Si no hay sucursales guardadas aún, creamos la default
        if (branches.length === 0) {
          const batch = writeBatch(db);
          DEFAULT_BRANCHES.forEach(b => {
            batch.set(doc(db, "branches", b.id), { name: b.name, loc: b.loc });
          });
          await batch.commit();
          branches = DEFAULT_BRANCHES;
        }

        // Recetas — listener en tiempo real
        unsubRecipes = onSnapshot(collection(db, "recipes"), snap => {
          const recipes = {};
          snap.docs.forEach(d => { recipes[d.id] = d.data(); });
          setData(prev => prev ? { ...prev, recipes } : { branches, sales: [], recipes });
        });

        // Ventas — listener en tiempo real, ordenadas por fecha desc
        const salesQ = query(collection(db, "sales"), orderBy("date", "desc"));
        unsubSales = onSnapshot(salesQ, snap => {
          const sales = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setData(prev => prev ? { ...prev, sales } : { branches, sales, recipes: {} });
          setLoading(false);
        }, err => {
          console.error("Sales listener error:", err);
          setError(err.message);
          setLoading(false);
        });

        // Bodega central — documento único
        unsubWarehouse = onSnapshot(doc(db, "config", "warehouse"), snap => {
          const warehouse = snap.exists() ? snap.data() : {};
          setData(prev => prev ? { ...prev, warehouse } : prev);
        });

        // Transferencias — tiempo real
        const trQ = query(collection(db, "transfers"), orderBy("date", "desc"));
        unsubTransfers = onSnapshot(trQ, snap => {
          const transfers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setData(prev => prev ? { ...prev, transfers } : prev);
        });

        // Inventario diario — tiempo real
        const invQ = query(collection(db, "inventory"), orderBy("date", "desc"));
        unsubInventory = onSnapshot(invQ, snap => {
          const inventory = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setData(prev => prev ? { ...prev, inventory } : prev);
        });

        // Requisiciones — tiempo real
        const reqQ = query(collection(db, "requisitions"), orderBy("createdAt", "desc"));
        unsubRequisitions = onSnapshot(reqQ, snap => {
          const requisitions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setData(prev => prev ? { ...prev, requisitions } : prev);
        });

        // Movimientos de bodega — tiempo real
        const movQ = query(collection(db, "warehouse_movements"), orderBy("createdAt", "desc"));
        unsubMovements = onSnapshot(movQ, snap => {
          const movements = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setData(prev => prev ? { ...prev, movements } : prev);
        });

        // Usuarios — tiempo real (admin y franchisee lo usan)
        unsubUsers = onSnapshot(collection(db, "users"), snap => {
          const users = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
          setData(prev => prev ? { ...prev, users } : prev);
        });

        // Productos — overrides y nuevos creados desde la UI
        unsubProducts = onSnapshot(collection(db, "products"), snap => {
          const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setData(prev => prev ? { ...prev, products } : prev);
        });

        // Ingredientes — overrides de costo HQ y precio franquicia
        unsubIngredients = onSnapshot(collection(db, "ingredients"), snap => {
          const ingredients = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setData(prev => prev ? { ...prev, ingredients } : prev);
        });

        // Cuentas bancarias / medios de pago — overrides y nuevos
        unsubBankAccounts = onSnapshot(collection(db, "bank_accounts"), snap => {
          const bankAccounts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setData(prev => prev ? { ...prev, bankAccounts } : prev);
        });

      } catch (err) {
        console.error("loadAll error:", err);
        setError(err.message);
        setLoading(false);
        // Fallback offline
        setData({ branches: DEFAULT_BRANCHES, sales: [], recipes: {}, warehouse: {}, transfers: [], inventory: [], requisitions: [], movements: [], users: [], products: [], ingredients: [], bankAccounts: [] });
      }
    };

    unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user && !loaded) {
        loaded = true;
        setLoading(true);
        setError(null);
        loadAll();
      } else if (!user) {
        // Sin sesión: limpiar listeners y resetear estado
        unsubSales?.(); unsubSales = undefined;
        unsubRecipes?.(); unsubRecipes = undefined;
        unsubWarehouse?.(); unsubWarehouse = undefined;
        unsubTransfers?.(); unsubTransfers = undefined;
        unsubInventory?.(); unsubInventory = undefined;
        unsubRequisitions?.(); unsubRequisitions = undefined;
        unsubMovements?.(); unsubMovements = undefined;
        unsubUsers?.(); unsubUsers = undefined;
        unsubProducts?.(); unsubProducts = undefined;
        unsubIngredients?.(); unsubIngredients = undefined;
        unsubBankAccounts?.(); unsubBankAccounts = undefined;
        loaded = false;
        setData(null);
        setError(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth?.();
      unsubSales?.();
      unsubRecipes?.();
      unsubWarehouse?.();
      unsubTransfers?.();
      unsubInventory?.();
      unsubRequisitions?.();
      unsubMovements?.();
      unsubUsers?.();
      unsubProducts?.();
      unsubIngredients?.();
      unsubBankAccounts?.();
    };
  }, []);

  // ─── GUARDAR VENTA DIARIA ──────────────────────────────────────────────────
  const saveSale = useCallback(async (sale) => {
    try {
      await setDoc(doc(db, "sales", sale.id), sale);
    } catch (err) {
      console.error("saveSale error:", err);
      throw err;
    }
  }, []);

  // ─── GUARDAR RECETA ────────────────────────────────────────────────────────
  const saveRecipe = useCallback(async (productId, recipe) => {
    try {
      await setDoc(doc(db, "recipes", productId), recipe);
    } catch (err) {
      console.error("saveRecipe error:", err);
      throw err;
    }
  }, []);

  // ─── IMPORTAR LOTE DE VENTAS (JSON de Gemini) ─────────────────────────────
  const importSales = useCallback(async (incomingSales) => {
    try {
      const existingIds = new Set((data?.sales || []).map(s => s.id));
      const fresh = incomingSales.filter(s => !existingIds.has(s.id));
      if (fresh.length === 0) return { imported: 0, skipped: incomingSales.length };

      // Firestore batch: máximo 500 por lote
      const BATCH_SIZE = 400;
      for (let i = 0; i < fresh.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        fresh.slice(i, i + BATCH_SIZE).forEach(sale => {
          batch.set(doc(db, "sales", sale.id), sale);
        });
        await batch.commit();
      }

      // Asegurar que la sucursal exista
      const existingBranchIds = new Set((data?.branches || []).map(b => b.id));
      const newBranchIds = [...new Set(fresh.map(s => s.branchId))].filter(id => !existingBranchIds.has(id));
      for (const id of newBranchIds) {
        const name = id.charAt(0).toUpperCase() + id.slice(1);
        await setDoc(doc(db, "branches", id), { name, loc: "" });
      }

      return { imported: fresh.length, skipped: incomingSales.length - fresh.length };
    } catch (err) {
      console.error("importSales error:", err);
      throw err;
    }
  }, [data]);

  // ─── SUCURSALES ────────────────────────────────────────────────────────────
  const addBranch = useCallback(async (branch) => {
    try {
      await setDoc(doc(db, "branches", branch.id), { name: branch.name, loc: branch.loc });
      setData(prev => ({ ...prev, branches: [...prev.branches, branch] }));
    } catch (err) {
      console.error("addBranch error:", err);
      throw err;
    }
  }, []);

  const deleteBranch = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, "branches", id));
      setData(prev => ({ ...prev, branches: prev.branches.filter(b => b.id !== id) }));
    } catch (err) {
      console.error("deleteBranch error:", err);
      throw err;
    }
  }, []);


  // ─── ACTUALIZAR SUCURSAL ───────────────────────────────────────────────────
  const updateBranch = useCallback(async (branch) => {
    try {
      await setDoc(doc(db, "branches", branch.id), { name: branch.name, loc: branch.loc }, { merge: true });
      setData(prev => ({
        ...prev,
        branches: prev.branches.map(b => b.id === branch.id ? branch : b)
      }));
    } catch (err) {
      console.error("updateBranch error:", err);
      throw err;
    }
  }, []);


  // ─── METAS MENSUALES ──────────────────────────────────────────────────────
  const saveGoal = useCallback(async (branchId, month, target) => {
    try {
      const branchRef = doc(db, "branches", branchId);
      const snap = await getDoc(branchRef);
      const existing = snap.exists() ? snap.data() : {};
      const goals = { ...(existing.goals||{}), [month]: target };
      await setDoc(branchRef, { ...existing, goals }, { merge: true });
      setData(prev => ({
        ...prev,
        branches: prev.branches.map(b =>
          b.id === branchId ? { ...b, goals } : b
        )
      }));
    } catch (err) {
      console.error("saveGoal error:", err);
      throw err;
    }
  }, []);

  // ─── GASTOS HABITUALES POR SUCURSAL ───────────────────────────────────────
  const saveDefaultExpenses = useCallback(async (branchId, defaultExpenses) => {
    try {
      const branchRef = doc(db, "branches", branchId);
      await setDoc(branchRef, { defaultExpenses }, { merge: true });
      setData(prev => ({
        ...prev,
        branches: prev.branches.map(b =>
          b.id === branchId ? { ...b, defaultExpenses } : b
        )
      }));
    } catch (err) {
      console.error("saveDefaultExpenses error:", err);
      throw err;
    }
  }, []);

  // ─── BODEGA CENTRAL ────────────────────────────────────────────────────────
  // Helper: registra un movimiento de bodega
  const logMovement = useCallback(async (mov) => {
    try {
      const now = new Date();
      const id = `mov-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`;
      await setDoc(doc(db, "warehouse_movements", id), {
        ...mov, id, createdAt: now.toISOString(),
      });
    } catch (err) {
      console.error("logMovement error:", err);
    }
  }, []);

  const saveWarehouse = useCallback(async (newWarehouse, previousWarehouse = null) => {
    try {
      await setDoc(doc(db, "config", "warehouse"), newWarehouse);
      // Registrar diferencias como movimientos (ajuste manual)
      if (previousWarehouse) {
        const changes = [];
        Object.keys(newWarehouse).forEach(id => {
          const before = Number(previousWarehouse[id]?.stock || 0);
          const after = Number(newWarehouse[id]?.stock || 0);
          if (before !== after) changes.push({ ingredientId: id, before, after, diff: after - before });
        });
        if (changes.length > 0) {
          await logMovement({
            type: "ajuste",
            description: `Ajuste manual de stock (${changes.length} ingrediente(s))`,
            items: changes,
          });
        }
      }
    } catch (err) {
      console.error("saveWarehouse error:", err);
      throw err;
    }
  }, [logMovement]);

  // ─── TRANSFERENCIAS (BODEGA → SUCURSAL) ──────────────────────────────────
  const createTransfer = useCallback(async ({ branchId, items }) => {
    try {
      const now = new Date();
      const id = `tr-${branchId}-${now.toISOString().split("T")[0]}-${Date.now()}`;
      const transfer = {
        branchId, items, status: "pendiente",
        date: now.toISOString().split("T")[0],
        createdAt: now.toISOString(),
      };
      await setDoc(doc(db, "transfers", id), transfer);

      // Descontar de bodega central
      const whRef = doc(db, "config", "warehouse");
      const whSnap = await getDoc(whRef);
      const wh = whSnap.exists() ? whSnap.data() : {};
      items.forEach(it => {
        if (wh[it.ingredientId]) {
          wh[it.ingredientId].stock = Math.max(0, (wh[it.ingredientId].stock || 0) - it.qty);
        }
      });
      await setDoc(whRef, wh);

      // Log movimiento: salida a sucursal
      await logMovement({
        type: "salida",
        description: `Envío manual a sucursal`,
        branchId, transferId: id,
        items: items.map(it => ({ ingredientId: it.ingredientId, diff: -it.qty })),
      });
    } catch (err) {
      console.error("createTransfer error:", err);
      throw err;
    }
  }, [logMovement]);

  const receiveTransfer = useCallback(async (transferId) => {
    try {
      const ref = doc(db, "transfers", transferId);
      const snap = await getDoc(ref);
      const now = new Date().toISOString();
      await setDoc(ref, { status: "recibido", receivedAt: now }, { merge: true });
      // Si el transfer viene de una requisición, marcarla como entregada
      const reqId = snap.exists() ? snap.data()?.requisitionId : null;
      if (reqId) {
        await setDoc(doc(db, "requisitions", reqId), {
          status: "entregada", deliveredAt: now,
        }, { merge: true });
      }
    } catch (err) {
      console.error("receiveTransfer error:", err);
      throw err;
    }
  }, []);

  // ─── PROCESAR DEPÓSITO PENDIENTE (con splits opcional) ───────────────────
  // splits: [{ bank, date, ref, amount }, ...] — si 1 solo, reemplaza; si N, divide
  const processDeposit = useCallback(async (saleId, depositIndex, splits) => {
    try {
      const saleRef = doc(db, "sales", saleId);
      const snap = await getDoc(saleRef);
      if (!snap.exists()) throw new Error("Venta no encontrada");
      const sale = snap.data();
      const deposits = [...(sale.deposits || [])];
      const original = deposits[depositIndex];
      if (!original) throw new Error("Depósito no encontrado");

      const now = new Date().toISOString();
      const newDeposits = splits.map(s => ({
        bank: s.bank,
        amount: Number(s.amount),
        type: original.type,
        pending: false,
        processedBank: s.bank,
        processedDate: s.date,
        processedRef: s.ref || "",
        processedAt: now,
      }));

      // Reemplazar el pendiente con los nuevos depósitos procesados
      deposits.splice(depositIndex, 1, ...newDeposits);
      await setDoc(saleRef, { deposits }, { merge: true });
    } catch (err) {
      console.error("processDeposit error:", err);
      throw err;
    }
  }, []);

  // ─── INVENTARIO DIARIO ────────────────────────────────────────────────────
  const saveInventory = useCallback(async (inv) => {
    try {
      await setDoc(doc(db, "inventory", inv.id), inv);
    } catch (err) {
      console.error("saveInventory error:", err);
      throw err;
    }
  }, []);

  // ─── REQUISICIONES DE INVENTARIO ──────────────────────────────────────────
  const saveRequisition = useCallback(async (req) => {
    try {
      const now = new Date();
      const id = req.id || `req-${req.branchId}-${now.getTime()}`;
      const data = {
        ...req, id,
        status: req.status || "pendiente",
        createdAt: req.createdAt || now.toISOString(),
      };
      await setDoc(doc(db, "requisitions", id), data);
      return id;
    } catch (err) {
      console.error("saveRequisition error:", err);
      throw err;
    }
  }, []);

  const updateRequisitionStatus = useCallback(async (reqId, status, extra = {}) => {
    try {
      const updates = { status, ...extra };
      if (status === "aprobada") updates.approvedAt = new Date().toISOString();
      if (status === "entregada") updates.deliveredAt = new Date().toISOString();
      if (status === "rechazada") updates.rejectedAt = new Date().toISOString();
      await setDoc(doc(db, "requisitions", reqId), updates, { merge: true });
    } catch (err) {
      console.error("updateRequisitionStatus error:", err);
      throw err;
    }
  }, []);

  // Aprobar requisición con items finales (admin puede modificar cantidades)
  // customItems: [{ ingredientId, qty }, ...] — si omitido, usa los items originales
  const approveRequisition = useCallback(async (reqId, customItems = null) => {
    try {
      const reqRef = doc(db, "requisitions", reqId);
      const reqSnap = await getDoc(reqRef);
      if (!reqSnap.exists()) throw new Error("Requisición no encontrada");
      const req = reqSnap.data();
      if (req.status !== "pendiente") throw new Error("Esta requisición ya fue procesada");

      // Items finales que se van a enviar
      const finalItems = (customItems || req.items || [])
        .filter(it => Number(it.qty) > 0)
        .map(it => ({ ingredientId: it.ingredientId, qty: Number(it.qty) }));

      if (finalItems.length === 0) throw new Error("Debe haber al menos un ingrediente con cantidad > 0");

      // Verificar stock bodega
      const whRef = doc(db, "config", "warehouse");
      const whSnap = await getDoc(whRef);
      const wh = whSnap.exists() ? whSnap.data() : {};
      const shortages = [];
      finalItems.forEach(it => {
        const available = Number(wh[it.ingredientId]?.stock || 0);
        if (available < it.qty) {
          shortages.push({ id: it.ingredientId, needed: it.qty, available });
        }
      });
      if (shortages.length > 0) {
        const msg = shortages.map(s => `• ${s.id}: ${s.needed} (disponible: ${s.available})`).join("\n");
        throw new Error(`Stock insuficiente en bodega:\n${msg}`);
      }

      // Crear envío (transfer)
      const now = new Date();
      const transferId = `tr-${req.branchId}-${now.toISOString().split("T")[0]}-${now.getTime()}`;
      const wasModified = !!customItems;
      const transfer = {
        branchId: req.branchId,
        items: finalItems,
        status: "pendiente",
        date: now.toISOString().split("T")[0],
        createdAt: now.toISOString(),
        requisitionId: reqId,
      };
      await setDoc(doc(db, "transfers", transferId), transfer);

      // Descontar de bodega
      finalItems.forEach(it => {
        if (wh[it.ingredientId]) {
          wh[it.ingredientId].stock = Math.max(0, Number(wh[it.ingredientId].stock || 0) - it.qty);
        }
      });
      await setDoc(whRef, wh);

      // Actualizar requisición (guardar items aprobados si se modificó)
      const update = {
        status: "aprobada",
        approvedAt: now.toISOString(),
        transferId,
        modifiedByAdmin: wasModified,
      };
      if (wasModified) {
        update.approvedItems = finalItems.map(fi => {
          const orig = (req.items || []).find(o => o.ingredientId === fi.ingredientId);
          return {
            ingredientId: fi.ingredientId,
            qty: fi.qty,
            name: orig?.name || fi.ingredientId,
            unit: orig?.unit || "",
            cost: orig?.cost || 0,
          };
        });
      }
      await setDoc(reqRef, update, { merge: true });

      // Log movimiento: salida por requisición aprobada
      await logMovement({
        type: "salida",
        description: `Requisición aprobada → ${req.branchName || req.branchId}${wasModified ? " (modificada por admin)" : ""}`,
        branchId: req.branchId,
        transferId, requisitionId: reqId,
        items: finalItems.map(it => ({ ingredientId: it.ingredientId, diff: -it.qty })),
      });

      return transferId;
    } catch (err) {
      console.error("approveRequisition error:", err);
      throw err;
    }
  }, [logMovement]);

  // ─── GESTIÓN DE USUARIOS ──────────────────────────────────────────────────
  // Crea usuario en Firebase Auth (via app secundaria para no desloguear al admin)
  // + crea su perfil en Firestore
  const createUser = useCallback(async ({ email, password, profile }) => {
    try {
      const secAuth = getSecondaryAuth();
      const cred = await createUserWithEmailAndPassword(secAuth, email, password);
      const uid = cred.user.uid;
      await setDoc(doc(db, "users", uid), {
        ...profile, email,
        createdAt: new Date().toISOString(),
      });
      // Desloguear de la app secundaria para no mantener sesión
      await fbSignOut(secAuth);
      return uid;
    } catch (err) {
      console.error("createUser error:", err);
      throw err;
    }
  }, []);

  const updateUserProfile = useCallback(async (uid, updates) => {
    try {
      await setDoc(doc(db, "users", uid), {
        ...updates, updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.error("updateUserProfile error:", err);
      throw err;
    }
  }, []);

  const deleteUserProfile = useCallback(async (uid) => {
    try {
      // Nota: NO elimina el usuario de Auth (eso requiere Admin SDK server-side)
      // solo elimina su perfil, por lo que ya no tendrá acceso a datos del sistema
      await deleteDoc(doc(db, "users", uid));
    } catch (err) {
      console.error("deleteUserProfile error:", err);
      throw err;
    }
  }, []);

  // ─── PRODUCTOS ────────────────────────────────────────────────────────────
  // Crea o actualiza un producto (override de base o producto nuevo)
  const saveProduct = useCallback(async (product) => {
    try {
      if (!product.id) throw new Error("Product ID requerido");
      await setDoc(doc(db, "products", product.id), {
        ...product,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.error("saveProduct error:", err);
      throw err;
    }
  }, []);

  // Soft-delete: marca deleted:true. Para productos base esto los oculta.
  const deleteProduct = useCallback(async (productId) => {
    try {
      await setDoc(doc(db, "products", productId), {
        deleted: true,
        deletedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.error("deleteProduct error:", err);
      throw err;
    }
  }, []);

  // Restaurar un producto eliminado (quita el flag deleted)
  const restoreProduct = useCallback(async (productId) => {
    try {
      await setDoc(doc(db, "products", productId), {
        deleted: false,
        restoredAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.error("restoreProduct error:", err);
      throw err;
    }
  }, []);

  // ─── INGREDIENTES (materia prima) ─────────────────────────────────────────
  const saveIngredient = useCallback(async (ingredient) => {
    try {
      if (!ingredient.id) throw new Error("Ingredient ID requerido");
      const ref = doc(db, "ingredients", ingredient.id);
      // Guardar historial si cambió el cost o franchisePrice
      const prevSnap = await getDoc(ref);
      const prev = prevSnap.exists() ? prevSnap.data() : null;
      const costChanged = prev && Number(prev.cost) !== Number(ingredient.cost);
      const franchChanged = prev && Number(prev.franchisePrice || 0) !== Number(ingredient.franchisePrice || 0);
      if (costChanged || franchChanged) {
        const histId = `${ingredient.id}-${Date.now()}`;
        await setDoc(doc(db, "ingredient_price_history", histId), {
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          beforeCost: Number(prev.cost || 0),
          afterCost: Number(ingredient.cost || 0),
          beforeFranchisePrice: Number(prev.franchisePrice || 0),
          afterFranchisePrice: Number(ingredient.franchisePrice || 0),
          changedAt: new Date().toISOString(),
        });
      }
      await setDoc(ref, {
        ...ingredient,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.error("saveIngredient error:", err);
      throw err;
    }
  }, []);

  const deleteIngredient = useCallback(async (ingredientId) => {
    try {
      await setDoc(doc(db, "ingredients", ingredientId), {
        deleted: true,
        deletedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.error("deleteIngredient error:", err);
      throw err;
    }
  }, []);

  const restoreIngredient = useCallback(async (ingredientId) => {
    try {
      await setDoc(doc(db, "ingredients", ingredientId), {
        deleted: false,
        restoredAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.error("restoreIngredient error:", err);
      throw err;
    }
  }, []);

  // ─── CUENTAS BANCARIAS / MEDIOS DE PAGO ───────────────────────────────────
  const saveBankAccount = useCallback(async (account) => {
    try {
      if (!account.id) throw new Error("ID requerido");
      await setDoc(doc(db, "bank_accounts", account.id), {
        ...account,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.error("saveBankAccount error:", err);
      throw err;
    }
  }, []);

  const deleteBankAccount = useCallback(async (id) => {
    try {
      await setDoc(doc(db, "bank_accounts", id), {
        deleted: true,
        deletedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.error("deleteBankAccount error:", err);
      throw err;
    }
  }, []);

  const restoreBankAccount = useCallback(async (id) => {
    try {
      await setDoc(doc(db, "bank_accounts", id), {
        deleted: false,
        restoredAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.error("restoreBankAccount error:", err);
      throw err;
    }
  }, []);

  return { data, loading, error, saveSale, saveRecipe, importSales, addBranch, deleteBranch, updateBranch, saveGoal, saveDefaultExpenses, saveWarehouse, createTransfer, receiveTransfer, saveInventory, processDeposit, saveRequisition, updateRequisitionStatus, approveRequisition, createUser, updateUserProfile, deleteUserProfile, saveProduct, deleteProduct, restoreProduct, saveIngredient, deleteIngredient, restoreIngredient, saveBankAccount, deleteBankAccount, restoreBankAccount };
}
