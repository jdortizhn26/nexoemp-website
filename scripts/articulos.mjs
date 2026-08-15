/* ════════════════════════════════════════════════════════════════
   articulos.mjs — Lectura y validación de assets/articles.js
   ────────────────────────────────────────────────────────────────
   Módulo compartido por nuevo-articulo.mjs, bloques-seo.mjs y
   verificar-articulos.mjs. No tiene efectos: solo lee el índice.
   ════════════════════════════════════════════════════════════════ */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DOMINIO = "https://nexoemp.com";
export const WHATSAPP = "50433269814";

const RUTA_ARTICLES = path.join(ROOT, "assets", "articles.js");

export function cargarArticulos() {
  const src = readFileSync(RUTA_ARTICLES, "utf8");
  const ventana = {};
  new Function("window", src)(ventana);
  const articulos = ventana.NEXO_ARTICLES;
  if (!Array.isArray(articulos)) {
    throw new Error("assets/articles.js no define window.NEXO_ARTICLES como arreglo.");
  }
  return articulos;
}

export function validarArticulo(art) {
  const errores = [];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(art.slug ?? "")) {
    errores.push(`slug inválido: "${art.slug}" (usar minúsculas, números y guiones)`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(art.date ?? "")) {
    errores.push(`fecha inválida en "${art.slug}": "${art.date}" (formato AAAA-MM-DD)`);
  }
  for (const campo of ["title", "metaTitle", "category", "author", "excerpt", "intent", "cluster"]) {
    if (!art[campo] || !String(art[campo]).trim()) {
      errores.push(`campo "${campo}" vacío en "${art.slug}"`);
    }
  }
  // El meta-título alimenta <title>; el title es el H1. Si coinciden,
  // la página compite consigo misma en el resultado de búsqueda.
  if (art.metaTitle && art.title && art.metaTitle.trim() === art.title.trim()) {
    errores.push(`"metaTitle" es idéntico al H1 en "${art.slug}": deben ser distintos`);
  }
  if (!Array.isArray(art.tldr) || art.tldr.length < 3) {
    errores.push(`"tldr" debe tener al menos 3 puntos en "${art.slug}"`);
  }
  if (!Array.isArray(art.faq) || art.faq.length < 3) {
    errores.push(`"faq" debe tener al menos 3 preguntas en "${art.slug}"`);
  } else {
    for (const [i, par] of art.faq.entries()) {
      if (!par?.q?.trim() || !par?.a?.trim()) {
        errores.push(`faq[${i}] incompleta en "${art.slug}" (faltan "q" o "a")`);
      }
    }
  }
  return errores;
}

export function escaparHtml(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
