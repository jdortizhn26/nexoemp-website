#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════
   verificar-articulos.mjs — Chequeo de consistencia del blog
   ────────────────────────────────────────────────────────────────
   Valida que el índice (assets/articles.js) y la carpeta analisis/
   estén sincronizados. Falla (exit 1) si:

     · un slug del índice no tiene su analisis/<slug>.html
     · un HTML de analisis/ no está en el índice
       (se ignoran index.html y _plantilla.html)
     · hay slugs duplicados o campos inválidos en el índice
     · una página publicada aún contiene placeholders [[...]]
     · falta la portada assets/og/<slug>.png
     · falta la URL del artículo en sitemap.xml

   Se corre en CI (.github/workflows/ci.yml) y localmente:
     node scripts/verificar-articulos.mjs
   ════════════════════════════════════════════════════════════════ */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cargarArticulos, validarArticulo } from "./nuevo-articulo.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR_ANALISIS = path.join(ROOT, "analisis");
const DIR_OG = path.join(ROOT, "assets", "og");
const RUTA_SITEMAP = path.join(ROOT, "sitemap.xml");
const DOMINIO = "https://nexoemp.com";
const IGNORADOS = new Set(["index.html", "_plantilla.html"]);

const errores = [];

let articulos = [];
try {
  articulos = cargarArticulos();
} catch (e) {
  console.error(`✗ No se pudo leer assets/articles.js: ${e.message}`);
  process.exit(1);
}

// 1. Campos válidos y slugs únicos.
for (const art of articulos) {
  for (const e of validarArticulo(art)) errores.push(e);
}
const vistos = new Set();
for (const { slug } of articulos) {
  if (vistos.has(slug)) errores.push(`slug duplicado en articles.js: "${slug}"`);
  vistos.add(slug);
}

// 2. Cada slug del índice tiene su HTML, portada y entrada en el sitemap.
const sitemap = readFileSync(RUTA_SITEMAP, "utf8");
for (const { slug, date } of articulos) {
  const html = path.join(DIR_ANALISIS, `${slug}.html`);
  if (!existsSync(html)) {
    errores.push(`falta la página analisis/${slug}.html (correr: node scripts/nuevo-articulo.mjs)`);
    continue;
  }
  const contenido = readFileSync(html, "utf8");
  if (/\[\[.+?\]\]/.test(contenido)) {
    errores.push(`analisis/${slug}.html aún contiene placeholders [[...]] sin redactar`);
  }
  if (!existsSync(path.join(DIR_OG, `${slug}.png`))) {
    errores.push(`falta la portada assets/og/${slug}.png (correr: node scripts/nuevo-articulo.mjs)`);
  }
  if (!sitemap.includes(`<loc>${DOMINIO}/analisis/${slug}.html</loc>`)) {
    errores.push(`falta ${slug}.html en sitemap.xml (correr: node scripts/nuevo-articulo.mjs)`);
  }
}

// 3. Cada HTML de analisis/ está en el índice.
const slugs = new Set(articulos.map((a) => a.slug));
for (const archivo of readdirSync(DIR_ANALISIS)) {
  if (!archivo.endsWith(".html") || IGNORADOS.has(archivo)) continue;
  const slug = archivo.replace(/\.html$/, "");
  if (!slugs.has(slug)) {
    errores.push(`analisis/${archivo} existe pero no está en assets/articles.js (huérfano)`);
  }
}

if (errores.length) {
  console.error(`Chequeo de consistencia: ${errores.length} problema(s)\n`);
  for (const e of errores) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`✓ Consistencia OK: ${articulos.length} artículos (índice ↔ HTML ↔ portadas ↔ sitemap).`);
