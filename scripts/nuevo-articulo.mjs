#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════
   nuevo-articulo.mjs — Publicación de artículos en 1 paso
   ────────────────────────────────────────────────────────────────
   Lee assets/articles.js (fuente única) y, para cada artículo que
   aún no tenga página, hace TODO lo que antes era manual:

     1. Genera analisis/<slug>.html desde analisis/_plantilla.html
        (título, categoría, fecha, resumen, canonical, Open Graph
        y Twitter Card ya rellenados, más los bloques SEO).
     2. Genera la portada OG (assets/og/<slug>.png) llamando a
        scripts/generar_portadas.py.
     3. Agrega la URL del artículo a sitemap.xml.
     4. Actualiza el listado estático del hub y de la portada.

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
import { ROOT, DOMINIO, cargarArticulos, validarArticulo, escaparHtml } from "./articulos.mjs";
import { aplicarBloques, actualizarListados, fechaLarga } from "./bloques-seo.mjs";

const RUTA_PLANTILLA = path.join(ROOT, "analisis", "_plantilla.html");
const RUTA_SITEMAP = path.join(ROOT, "sitemap.xml");
const RUTA_PORTADAS = path.join(ROOT, "scripts", "generar_portadas.py");
const DIR_ANALISIS = path.join(ROOT, "analisis");
const DIR_OG = path.join(ROOT, "assets", "og");

function generarPagina(art, articulos) {
  const destino = path.join(DIR_ANALISIS, `${art.slug}.html`);
  if (existsSync(destino)) return false;

  let html = readFileSync(RUTA_PLANTILLA, "utf8");
  // Quitar el comentario-instructivo de la plantilla.
  html = html.replace(/<!-- ═+[\s\S]*?═+ -->\n?/, "");

  const titulo = escaparHtml(art.title);
  const metaTitulo = escaparHtml(art.metaTitle);
  const resumen = escaparHtml(art.excerpt);
  const ogPng = `${DOMINIO}/assets/og/${art.slug}.png`;

  // El <title> y el Open Graph usan el meta-título; el H1 usa el title.
  html = html
    .replaceAll("<title>[[Título del artículo]]</title>",
      `<title>${metaTitulo}</title>`)
    .replaceAll('<meta property="og:title" content="[[Título del artículo]]"/>',
      `<meta property="og:title" content="${metaTitulo}"/>`)
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
<meta name="twitter:title" content="${metaTitulo}"/>
<meta name="twitter:description" content="${resumen}"/>
<meta name="twitter:image" content="${ogPng}"/>`
  );

  html = aplicarBloques(html, art, articulos);

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

  const todos = cargarArticulos();
  let articulos = todos;

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
    if (generarPagina(art, todos)) cambios++;
    if (generarPortada(art, forzarPortadas)) cambios++;
    if (actualizarSitemap(art)) cambios++;
  }
  cambios += actualizarListados(todos);

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
