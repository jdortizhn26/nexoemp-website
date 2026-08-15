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
     · los bloques SEO de una página no coinciden con lo que
       scripts/bloques-seo.mjs generaría hoy (TL;DR, FAQ, schema,
       relacionados, compartir, CTA)

   Se corre en CI (.github/workflows/ci.yml) y localmente:
     node scripts/verificar-articulos.mjs
   ════════════════════════════════════════════════════════════════ */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { ROOT, DOMINIO, cargarArticulos, validarArticulo } from "./articulos.mjs";
import { aplicarBloques } from "./bloques-seo.mjs";

const DIR_ANALISIS = path.join(ROOT, "analisis");
const DIR_OG = path.join(ROOT, "assets", "og");
const RUTA_SITEMAP = path.join(ROOT, "sitemap.xml");
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

// 2b. Los bloques SEO publicados coinciden con los que se generarían hoy.
for (const art of articulos) {
  const html = path.join(DIR_ANALISIS, `${art.slug}.html`);
  if (!existsSync(html)) continue;
  const publicado = readFileSync(html, "utf8");
  let esperado;
  try {
    esperado = aplicarBloques(publicado, art, articulos);
  } catch (e) {
    errores.push(`analisis/${art.slug}.html: ${e.message}`);
    continue;
  }
  if (publicado !== esperado) {
    errores.push(
      `analisis/${art.slug}.html tiene bloques SEO desactualizados (correr: node scripts/bloques-seo.mjs)`
    );
  }
}

// 2c. Cabeceras SEO: un solo H1, meta-título distinto del H1, y títulos y
//     descripciones que no se repitan entre artículos.
const titulosVistos = new Map();
const descripcionesVistas = new Map();
for (const art of articulos) {
  const ruta = path.join(DIR_ANALISIS, `${art.slug}.html`);
  if (!existsSync(ruta)) continue;
  const contenido = readFileSync(ruta, "utf8");

  const h1 = (contenido.match(/<h1\b/g) ?? []).length;
  if (h1 !== 1) {
    errores.push(`analisis/${art.slug}.html tiene ${h1} etiquetas <h1> (debe haber exactamente 1)`);
  }

  const titulo = contenido.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim();
  if (!titulo) {
    errores.push(`analisis/${art.slug}.html no tiene <title>`);
  } else {
    if (titulo === `${art.title} — Nexo Empresarial`) {
      errores.push(
        `analisis/${art.slug}.html usa el H1 como <title>: deben ser distintos ` +
          `(sembrar desde "metaTitle" en articles.js)`
      );
    }
    const duplicado = titulosVistos.get(titulo);
    if (duplicado) {
      errores.push(`<title> repetido entre "${duplicado}" y "${art.slug}"`);
    }
    titulosVistos.set(titulo, art.slug);
  }

  const desc = contenido.match(/<meta name="description" content="([^"]*)"/)?.[1]?.trim();
  if (!desc) {
    errores.push(`analisis/${art.slug}.html no tiene meta description`);
  } else {
    const duplicado = descripcionesVistas.get(desc);
    if (duplicado) {
      errores.push(`meta description repetida entre "${duplicado}" y "${art.slug}"`);
    }
    descripcionesVistas.set(desc, art.slug);
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
