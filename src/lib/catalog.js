// ─── PRODUCTS CATALOG ───────────────────────────────────────────────────────
// Catálogo basado en el menú de Restaurante La Mar (Ceviches, Sopas, Salsas y
// Acompañantes). Precios en Lempiras (L.) — ISV incluido.
export const PRODUCTS = [
  // ── Ceviches ──
  { id:"cev-1m-cam",   name:"Ceviche de Camarón",                  cat:"Ceviches", price:280 },
  { id:"cev-1m-car",   name:"Ceviche de Caracol",                  cat:"Ceviches", price:280 },
  { id:"cev-1m-pes",   name:"Ceviche de Pescado",                  cat:"Ceviches", price:280 },
  { id:"cev-2m-camcar",name:"Ceviche Mixto 2M (Camarón/Caracol)",  cat:"Ceviches", price:310 },
  { id:"cev-2m-campes",name:"Ceviche Mixto 2M (Camarón/Pescado)",  cat:"Ceviches", price:310 },
  { id:"cev-2m-carpes",name:"Ceviche Mixto 2M (Caracol/Pescado)",  cat:"Ceviches", price:310 },
  { id:"cev-3m",       name:"Ceviche Mixto 3M (Cam/Car/Pes)",      cat:"Ceviches", price:330 },
  { id:"cev-copa",     name:"Copa Contigo a la Mar (6 Camarones Jumbo + 4oz Ceviche)", cat:"Ceviches", price:390 },

  // ── Sopas ──
  { id:"sopa-lamar",   name:"Sopa de Mariscos La Mar (Cam/Car/Jaiba)", cat:"Sopas", price:320 },

  // ── Salsas (incluidas con el ceviche, elige una) ──
  { id:"salsa-amantes", name:"Salsa Cerca de los Amantes (Dulce-ácida)",    cat:"Salsas", price:0 },
  { id:"salsa-sirena",  name:"Salsa Sirena del Valle (Ácida-picante)",      cat:"Salsas", price:0 },
  { id:"salsa-proa",    name:"Salsa Proa (Dulce-picante)",                  cat:"Salsas", price:0 },
  { id:"salsa-peruana", name:"Salsa Estilo Peruano (Limón + especias)",     cat:"Salsas", price:0 },
  { id:"salsa-manglar", name:"Salsa Manglares del Mar (a base de mayonesa)",cat:"Salsas", price:0 },
  { id:"salsa-extra",   name:"Salsa Extra",                                 cat:"Salsas", price:40 },

  // ── Acompañantes (incluidos; también como extras cobrados) ──
  { id:"acomp-platano", name:"Tajadas de Plátano",      cat:"Acompañantes", price:0 },
  { id:"acomp-malanga", name:"Tajadas de Malanga",      cat:"Acompañantes", price:0 },
  { id:"acomp-yuca",    name:"Tajadas de Yuca",         cat:"Acompañantes", price:0 },
  { id:"acomp-galclub", name:"Galleta Club Social",     cat:"Acompañantes", price:0 },
  { id:"acomp-galsal",  name:"Galleta Salada",          cat:"Acompañantes", price:0 },

  // ── Complementos Extra (cobrados) ──
  { id:"comp-galletas", name:"Complemento Galletas (Club Social y Salada)", cat:"Complementos", price:30 },
  { id:"comp-tajadas",  name:"Complemento Tajadas (Plátano, Malanga y Yuca)", cat:"Complementos", price:50 },

  // ── Bebidas ──
  { id:"ref05",   name:"Refresco 0.5L",     cat:"Bebidas", price:27 },
  { id:"ref15",   name:"Refresco 1.5L",     cat:"Bebidas", price:47 },
  { id:"ref2",    name:"Refresco 2L",       cat:"Bebidas", price:57 },
  { id:"agua500", name:"Agua Bote 500ml",   cat:"Bebidas", price:17 },
  { id:"dasani",  name:"Agua Dasani",       cat:"Bebidas", price:22 },
  { id:"cerveza", name:"Cerveza Nacional",  cat:"Bebidas", price:55 },
  { id:"micha",   name:"Michelada",         cat:"Bebidas", price:80 },
  { id:"jugo-nat",name:"Jugo Natural",      cat:"Bebidas", price:45 },
];

export const CATEGORIES = [...new Set(PRODUCTS.map(p => p.cat))];

// Mezcla productos base con los de Firestore.
// Firestore sobreescribe; productos con deleted:true se excluyen.
export function resolveProducts(fsProducts = []) {
  const fsMap = {};
  (fsProducts || []).forEach(p => { if (p.id) fsMap[p.id] = p; });
  const merged = [];
  // Base productos (respetando overrides y soft-delete)
  PRODUCTS.forEach(p => {
    const fs = fsMap[p.id];
    if (fs?.deleted) return;
    merged.push(fs ? { ...p, ...fs } : p);
  });
  // Productos creados desde la UI que no existen en base
  (fsProducts || []).forEach(p => {
    if (p.deleted) return;
    if (!PRODUCTS.find(b => b.id === p.id)) merged.push(p);
  });
  return merged;
}

// Lista de categorías dinámica a partir de productos resueltos
export function resolveCategories(fsProducts = []) {
  return [...new Set(resolveProducts(fsProducts).map(p => p.cat))];
}

export const BANKS = [
  "VENTA A DEPOSITAR",  // Pendiente — se procesa al día siguiente
  "Banpais Cta # 012990027370",
  "Occidente Cta # 212490063930",
  "Atlántida Cta # 7579",
  "BAC Cta # 730180841",
  "Davivienda Cta # 2181111169",
  "Banrural Cta # 8467",
];

export const PENDING_BANK = "VENTA A DEPOSITAR";

// Mezcla cuentas base con las de Firestore (overrides + nuevas)
export function resolveBanks(fsBankAccounts = []) {
  const fsMap = {};
  (fsBankAccounts || []).forEach(b => { if (b.id) fsMap[b.id] = b; });
  const result = [];
  BANKS.forEach(bankName => {
    const fs = fsMap[bankName];
    if (fs?.deleted) return;
    result.push(fs?.name || bankName);
  });
  (fsBankAccounts || []).forEach(b => {
    if (b.deleted) return;
    if (!BANKS.includes(b.id)) result.push(b.name || b.id);
  });
  return result;
}

export const DEF_INGREDIENTS = [
  "Camarón","Caracol","Pescado Fresco","Jaiba","Camarón Jumbo",
  "Limón","Cebolla Morada","Chile Verde","Chile Habanero","Cilantro",
  "Tomate","Apio","Zanahoria","Ajo","Jengibre",
  "Plátano Verde","Malanga","Yuca","Aceite",
  "Galleta Club Social","Galleta Salada",
  "Salsa de Tomate","Salsa Inglesa","Mayonesa","Mostaza","Vinagre",
  "Sal","Pimienta","Comino","Orégano","Pasta de Tomate","Hielo",
];

export const DEF_COSTS = {
  "Camarón":180,"Caracol":220,"Pescado Fresco":140,"Jaiba":160,"Camarón Jumbo":22,
  "Limón":2,"Cebolla Morada":15,"Chile Verde":12,"Chile Habanero":25,"Cilantro":10,
  "Tomate":14,"Apio":18,"Zanahoria":10,"Ajo":40,"Jengibre":30,
  "Plátano Verde":6,"Malanga":12,"Yuca":8,"Aceite":28,
  "Galleta Club Social":2,"Galleta Salada":1.5,
  "Salsa de Tomate":25,"Salsa Inglesa":35,"Mayonesa":80,"Mostaza":40,"Vinagre":20,
  "Sal":5,"Pimienta":45,"Comino":30,"Orégano":25,"Pasta de Tomate":30,"Hielo":3,
};

// ─── INVENTARIO: Categorías de insumos ────────────────────────────────────
export const INGREDIENT_CATEGORIES = [
  "Mariscos",             // producto principal (camarón, caracol, pescado, jaiba)
  "Materia Prima",        // verduras, condimentos, cítricos
  "Acompañantes",         // tajadas, galletas
  "Bebidas",              // producto terminado de reventa (refrescos, agua)
  "Empaque",              // recipientes, bolsas, tapas
  "Desechables",          // platos, servilletas, cubiertos, guantes
  "Limpieza",             // jabones, detergentes, papel higiénico
  "Papelería",            // papel impresora, papel rayado
  "Servicios",            // gas, agua
];

// ─── INVENTARIO: Catálogo de insumos con unidades y categoría ──────────────
export const INGREDIENTS = [
  // ── MARISCOS (producto principal) ──
  { id:"camaron",       name:"Camarón",                  unit:"libra",   cost:180, cat:"Mariscos" },
  { id:"camaron-jumbo", name:"Camarón Jumbo",            unit:"unidad",  cost:22,  cat:"Mariscos" },
  { id:"caracol",       name:"Caracol",                  unit:"libra",   cost:220, cat:"Mariscos" },
  { id:"pescado",       name:"Pescado Fresco",           unit:"libra",   cost:140, cat:"Mariscos" },
  { id:"jaiba",         name:"Jaiba",                    unit:"libra",   cost:160, cat:"Mariscos" },
  { id:"pulpo",         name:"Pulpo",                    unit:"libra",   cost:240, cat:"Mariscos" },
  { id:"calamar",       name:"Calamar",                  unit:"libra",   cost:190, cat:"Mariscos" },

  // ── MATERIA PRIMA (verduras, cítricos, condimentos) ──
  { id:"limon",         name:"Limón",                    unit:"unidad",  cost:2,   cat:"Materia Prima" },
  { id:"cebolla-mor",   name:"Cebolla Morada",           unit:"libra",   cost:15,  cat:"Materia Prima" },
  { id:"cebolla",       name:"Cebolla Blanca",           unit:"libra",   cost:10,  cat:"Materia Prima" },
  { id:"chile-verde",   name:"Chile Verde",              unit:"libra",   cost:12,  cat:"Materia Prima" },
  { id:"chile-hab",     name:"Chile Habanero",           unit:"libra",   cost:25,  cat:"Materia Prima" },
  { id:"chile-jalap",   name:"Chile Jalapeño",           unit:"bote",    cost:35,  cat:"Materia Prima" },
  { id:"cilantro",      name:"Cilantro",                 unit:"manojo",  cost:10,  cat:"Materia Prima" },
  { id:"perejil",       name:"Perejil",                  unit:"manojo",  cost:10,  cat:"Materia Prima" },
  { id:"tomate",        name:"Tomate",                   unit:"libra",   cost:14,  cat:"Materia Prima" },
  { id:"pasta-tomate",  name:"Pasta de Tomate",          unit:"bote",    cost:30,  cat:"Materia Prima" },
  { id:"apio",          name:"Apio",                     unit:"libra",   cost:18,  cat:"Materia Prima" },
  { id:"zanahoria",     name:"Zanahoria",                unit:"libra",   cost:10,  cat:"Materia Prima" },
  { id:"ajo",           name:"Ajo",                      unit:"libra",   cost:40,  cat:"Materia Prima" },
  { id:"jengibre",      name:"Jengibre",                 unit:"libra",   cost:30,  cat:"Materia Prima" },
  { id:"aguacate",      name:"Aguacate",                 unit:"unidad",  cost:15,  cat:"Materia Prima" },
  { id:"pepino",        name:"Pepino",                   unit:"libra",   cost:10,  cat:"Materia Prima" },
  { id:"aceite",        name:"Aceite",                   unit:"litro",   cost:28,  cat:"Materia Prima" },
  { id:"vinagre",       name:"Vinagre",                  unit:"litro",   cost:20,  cat:"Materia Prima" },
  { id:"salsa-ing",     name:"Salsa Inglesa",            unit:"botella", cost:35,  cat:"Materia Prima" },
  { id:"mayonesa",      name:"Mayonesa",                 unit:"galón",   cost:150, cat:"Materia Prima" },
  { id:"mostaza",       name:"Mostaza",                  unit:"botella", cost:40,  cat:"Materia Prima" },
  { id:"salsa-tomate",  name:"Salsa de Tomate",          unit:"botella", cost:25,  cat:"Materia Prima" },
  { id:"sal",           name:"Sal",                      unit:"libra",   cost:5,   cat:"Materia Prima" },
  { id:"pimienta",      name:"Pimienta",                 unit:"bote",    cost:45,  cat:"Materia Prima" },
  { id:"comino",        name:"Comino",                   unit:"bote",    cost:30,  cat:"Materia Prima" },
  { id:"oregano",       name:"Orégano",                  unit:"bote",    cost:25,  cat:"Materia Prima" },
  { id:"hielo",         name:"Hielo",                    unit:"libra",   cost:3,   cat:"Materia Prima" },

  // ── ACOMPAÑANTES (guarniciones) ──
  { id:"platano",       name:"Plátano Verde",            unit:"unidad",  cost:6,   cat:"Acompañantes" },
  { id:"malanga",       name:"Malanga",                  unit:"libra",   cost:12,  cat:"Acompañantes" },
  { id:"yuca",          name:"Yuca",                     unit:"libra",   cost:8,   cat:"Acompañantes" },
  { id:"gal-club",      name:"Galleta Club Social",      unit:"unidad",  cost:2,   cat:"Acompañantes" },
  { id:"gal-sal",       name:"Galleta Salada",           unit:"unidad",  cost:1.5, cat:"Acompañantes" },

  // ── EMPAQUE ──
  { id:"copa-cev",      name:"Copa para Ceviche",        unit:"unidad",  cost:4,   cat:"Empaque" },
  { id:"bandeja-8x8",   name:"Bandeja 8x8",              unit:"unidad",  cost:7,   cat:"Empaque" },
  { id:"bandeja-6x6",   name:"Bandeja 6x6",              unit:"unidad",  cost:5,   cat:"Empaque" },
  { id:"bandeja-alum",  name:"Bandeja de Aluminio",      unit:"unidad",  cost:8,   cat:"Empaque" },
  { id:"papel-alum",    name:"Papel Aluminio",           unit:"unidad",  cost:45,  cat:"Empaque" },
  { id:"bolsa-7x15",    name:"Bolsa Camiseta 7x15",      unit:"paquete", cost:50,  cat:"Empaque" },
  { id:"bolsa-9x16",    name:"Bolsa Lisa 9x16",          unit:"paquete", cost:55,  cat:"Empaque" },
  { id:"bolsa-basura",  name:"Bolsa para Basura",        unit:"rollo",   cost:80,  cat:"Empaque" },
  { id:"tapas-copitas", name:"Tapas y Copitas 2 oz",     unit:"unidad",  cost:1,   cat:"Empaque" },

  // ── DESECHABLES ──
  { id:"platos-cart",   name:"Platos N°8 de Cartón",     unit:"paquete", cost:45,  cat:"Desechables" },
  { id:"servilletas",   name:"Servilletas",              unit:"paquete", cost:40,  cat:"Desechables" },
  { id:"tenedores",     name:"Tenedores",                unit:"unidad",  cost:1,   cat:"Desechables" },
  { id:"cucharas",      name:"Cucharas",                 unit:"unidad",  cost:1,   cat:"Desechables" },
  { id:"pajillas",      name:"Caja de Pajillas",         unit:"unidad",  cost:25,  cat:"Desechables" },
  { id:"guantes",       name:"Caja de Guantes",          unit:"unidad",  cost:120, cat:"Desechables" },

  // ── LIMPIEZA ──
  { id:"azistin",       name:"Azistin",                  unit:"galón",   cost:180, cat:"Limpieza" },
  { id:"cloro",         name:"Cloro",                    unit:"bolsa",   cost:15,  cat:"Limpieza" },
  { id:"detergente",    name:"Detergente",               unit:"libra",   cost:25,  cat:"Limpieza" },
  { id:"gel-mano",      name:"Gel de Mano",              unit:"unidad",  cost:80,  cat:"Limpieza" },
  { id:"jabon-trast",   name:"Jabón Lava Trastes",       unit:"unidad",  cost:35,  cat:"Limpieza" },
  { id:"jabon-liq",     name:"Jabón Líquido",            unit:"galón",   cost:120, cat:"Limpieza" },
  { id:"papel-tualla",  name:"Papel Toalla",             unit:"unidad",  cost:30,  cat:"Limpieza" },
  { id:"papel-bano",    name:"Papel de Baño",            unit:"unidad",  cost:25,  cat:"Limpieza" },

  // ── PAPELERÍA ──
  { id:"papel-impr",    name:"Papel Impresora",          unit:"rollo",   cost:60,  cat:"Papelería" },
  { id:"papel-rayado",  name:"Papel Rayado Diseño",      unit:"unidad",  cost:2,   cat:"Papelería" },

  // ── BEBIDAS ──
  { id:"bev-ref05",     name:"Refresco 0.5L",            unit:"unidad",  cost:15,  cat:"Bebidas" },
  { id:"bev-ref15",     name:"Refresco 1.5L",            unit:"unidad",  cost:28,  cat:"Bebidas" },
  { id:"bev-ref2",      name:"Refresco 2L",              unit:"unidad",  cost:35,  cat:"Bebidas" },
  { id:"bev-dasani",    name:"Agua Dasani",              unit:"unidad",  cost:12,  cat:"Bebidas" },
  { id:"bev-agua500",   name:"Agua Bote 500ml",          unit:"unidad",  cost:10,  cat:"Bebidas" },
  { id:"bev-cerveza",   name:"Cerveza Nacional",         unit:"unidad",  cost:30,  cat:"Bebidas" },
  { id:"bev-vaso",      name:"Vaso para Refresco",       unit:"unidad",  cost:1,   cat:"Bebidas" },

  // ── SERVICIOS ──
  { id:"gas",           name:"Gas",                      unit:"%",       cost:1,   cat:"Servicios" },
  { id:"agua-botellon", name:"Agua Botellón",            unit:"unidad",  cost:35,  cat:"Servicios" },
];

// Mezcla ingredientes base con los de Firestore (overrides + nuevos).
export function resolveIngredients(fsIngredients = []) {
  const fsMap = {};
  (fsIngredients || []).forEach(i => { if (i.id) fsMap[i.id] = i; });
  const merged = [];
  INGREDIENTS.forEach(ing => {
    const fs = fsMap[ing.id];
    if (fs?.deleted) return;
    merged.push(fs ? { ...ing, ...fs } : ing);
  });
  (fsIngredients || []).forEach(i => {
    if (i.deleted) return;
    if (!INGREDIENTS.find(b => b.id === i.id)) merged.push(i);
  });
  return merged;
}

// Lista de categorías de ingredientes (base + las que agreguen en Firestore)
export function resolveIngredientCategories(fsIngredients = []) {
  const resolved = resolveIngredients(fsIngredients);
  const cats = new Set(INGREDIENT_CATEGORIES);
  resolved.forEach(i => { if (i.cat) cats.add(i.cat); });
  return [...cats];
}

// Devuelve el costo adecuado según si es franquiciado o HQ
export function getIngredientCost(ing, isFranchise = false) {
  if (!ing) return 0;
  if (isFranchise && typeof ing.franchisePrice === "number") return ing.franchisePrice;
  return Number(ing.cost || 0);
}

// Calcula el costo total de una receta usando precios vigentes de ingredientes
export function calcRecipeCost(recipe, resolvedIngredients, isFranchise = false) {
  if (!recipe?.ingredients?.length) return 0;
  return recipe.ingredients.reduce((total, ri) => {
    let ing = ri.ingredientId ? resolvedIngredients.find(x => x.id === ri.ingredientId) : null;
    if (!ing && ri.name) ing = resolvedIngredients.find(x => x.name === ri.name);
    if (ing) {
      return total + Number(ri.qty || 0) * getIngredientCost(ing, isFranchise);
    }
    return total + Number(ri.qty || 0) * Number(ri.costPerUnit || 0);
  }, 0);
}
