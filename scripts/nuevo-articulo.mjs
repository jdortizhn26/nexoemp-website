#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════
   nuevo-articulo.mjs — Publicación de artículos en 1 paso
   ────────────────────────────────────────────────────────────────
   Lee assets/articles.js (fuente única) y, para cada artículo que
   aún no tenga página, hace TODO lo que antes era manual:

     1. Genera analisis/<slug>.html desde analisis/_plantilla.html
        (título, categoría, fecha, resumen, canonical, Open Graph,
        Twitter Card y JSON-LD ya rellenados).
     2. Genera la portada OG (assets/og/<slug>.png) llamando a
        scripts/generar_portadas.py.
     3. Agrega la URL del artículo a sitemap.xml.

   Uso:
     node scripts/nuevo-articulo.mjs            → procesa lo que falte
     node scripts/nuevo-articulo.mjs <slug>     → solo ese slug
     node scripts/nuevo-articulo.mjs --force-portadas
                                                → regenera portadas ya existentes

   Nunca sobreescribe un HTML existente (ahí vive el contenido
   escrito a mano). Después de correrlo, solo queda redactar el
   cuerpo del artículo en el HTML generado.
   ════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RUTA_ARTICLES = path.join(ROOT, "assets", "articles.js");
const RUTA_PLANTILLA = path.join(ROOT, "analisis", "_plantilla.html");
const RUTA_SITEMAP = path.join(ROOT, "sitemap.xml");
const RUTA_PORTADAS = path.join(ROOT, "scripts", "generar_portadas.py");
const DIR_ANALISIS = path.join(ROOT, "analisis");
const DIR_OG = path.join(ROOT, "assets", "og");
const DOMINIO = "https://nexoemp.com";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

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
  for (const campo of ["title", "category", "author", "excerpt"]) {
    if (!art[campo] || !String(art[campo]).trim()) {
      errores.push(`campo "${campo}" vacío en "${art.slug}"`);
    }
  }
  return errores;
}

function fechaLarga(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES[m - 1]} ${a}`;
}

function escaparHtml(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function generarPagina(art) {
  const destino = path.join(DIR_ANALISIS, `${art.slug}.html`);
  if (existsSync(destino)) return false;

  let html = readFileSync(RUTA_PLANTILLA, "utf8");
  // Quitar el comentario-instructivo de la plantilla.
  html = html.replace(/<!-- ═+[\s\S]*?═+ -->\n?/, "");

  const titulo = escaparHtml(art.title);
  const resumen = escaparHtml(art.excerpt);
  const ogPng = `${DOMINIO}/assets/og/${art.slug}.png`;

  html = html
    .replaceAll("[[Título del artículo]]", titulo)
    .replaceAll("[[Resumen de una o dos frases para buscadores y redes sociales.]]", resumen)
    .replaceAll("[[Resumen de una o dos frases.]]", resumen)
    .replaceAll("[[nombre-archivo]]", art.slug)
    .replaceAll("[[Categoría]]", escaparHtml(art.category))
    .replaceAll("[[27 mayo 2026]]", fechaLarga(art.date))
    .replaceAll("[[Autor]]", escaparHtml(art.author));

  // Portada OG real en lugar del logo genérico.
  html = html.replace(
    '<meta property="og:image" content="../assets/logo.png"/>',
    `<meta property="og:image" content="${ogPng}"/>`
  );

  // Twitter Card, como en los artículos ya publicados.
  html = html.replace(
    '<meta property="og:locale" content="es_HN"/>',
    `<meta property="og:locale" content="es_HN"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${titulo}"/>
<meta name="twitter:description" content="${resumen}"/>
<meta name="twitter:image" content="${ogPng}"/>`
  );

  // Datos estructurados JSON-LD.
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: art.title,
    description: art.excerpt,
    image: ogPng,
    datePublished: art.date,
    inLanguage: "es-HN",
    author: { "@type": "Organization", name: art.author },
    publisher: {
      "@type": "Organization",
      name: "Nexo Empresarial",
      logo: { "@type": "ImageObject", url: `${DOMINIO}/assets/logo.png` },
    },
    mainEntityOfPage: `${DOMINIO}/analisis/${art.slug}.html`,
  });
  html = html.replace(
    "</head>",
    `<script type="application/ld+json">\n${jsonLd}\n</script>\n</head>`
  );

  writeFileSync(destino, html);
  console.log(`✓ Página creada: analisis/${art.slug}.html`);
  return true;
}

function generarPortada(art, forzar) {
  const destino = path.join(DIR_OG, `${art.slug}.png`);
  if (existsSync(destino) && !forzar) return false;

  const res = spawnSync("python3", [RUTA_PORTADAS, art.slug, art.category, art.title], {
    stdio: "inherit",
  });
  if (res.status !== 0) {
    console.warn(
      `⚠ No se pudo generar la portada de "${art.slug}". ` +
        `Verificá que python3 y Pillow estén instalados (pip install pillow) y volvé a correr el script.`
    );
    return false;
  }
  return true;
}

function actualizarSitemap(art) {
  const loc = `${DOMINIO}/analisis/${art.slug}.html`;
  let xml = readFileSync(RUTA_SITEMAP, "utf8");
  if (xml.includes(`<loc>${loc}</loc>`)) return false;

  const bloque = `  <url>
    <loc>${loc}</loc>
    <lastmod>${art.date}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  xml = xml.replace("</urlset>", `${bloque}</urlset>`);
  writeFileSync(RUTA_SITEMAP, xml);
  console.log(`✓ sitemap.xml: agregado ${loc}`);
  return true;
}

function main() {
  const args = process.argv.slice(2);
  const forzarPortadas = args.includes("--force-portadas");
  const slugsPedidos = args.filter((a) => !a.startsWith("--"));

  let articulos = cargarArticulos();

  const errores = articulos.flatMap(validarArticulo);
  if (errores.length) {
    console.error("Errores en assets/articles.js:");
    for (const e of errores) console.error(`  ✗ ${e}`);
    process.exit(1);
  }

  if (slugsPedidos.length) {
    const conocidos = new Set(articulos.map((a) => a.slug));
    const desconocidos = slugsPedidos.filter((s) => !conocidos.has(s));
    if (desconocidos.length) {
      console.error(`✗ Slug(s) no encontrados en articles.js: ${desconocidos.join(", ")}`);
      process.exit(1);
    }
    articulos = articulos.filter((a) => slugsPedidos.includes(a.slug));
  }

  let cambios = 0;
  for (const art of articulos) {
    if (generarPagina(art)) cambios++;
    if (generarPortada(art, forzarPortadas)) cambios++;
    if (actualizarSitemap(art)) cambios++;
  }

  if (cambios === 0) {
    console.log("Nada que generar: todos los artículos ya tienen página, portada y sitemap.");
  } else {
    console.log(
      "\nListo. Si se creó una página nueva, abrila y redactá el cuerpo " +
        "reemplazando lo que quedó entre [[corchetes]]."
    );
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
