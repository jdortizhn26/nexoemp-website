#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════
   bloques-seo.mjs — Bloques SEO/GEO de las páginas de análisis
   ────────────────────────────────────────────────────────────────
   Todo lo que en un artículo NO es el cuerpo redactado a mano se
   genera desde assets/articles.js y se inserta entre marcadores:

     nexo:schema        Article + FAQPage + BreadcrumbList (JSON-LD, en <head>)
     nexo:analytics     Carga de assets/analytics.js (GA4)
     nexo:nav           Menú del sitio (el mismo de las páginas principales)
     nexo:tldr          Intención de búsqueda + "En resumen"
     nexo:cta-inline    Llamado a la acción tras el primer párrafo
     nexo:cta-final     Llamado a la acción al terminar el artículo
     nexo:faq           Preguntas frecuentes visibles
     nexo:relacionados  Interlinkeado por cluster temático
     nexo:compartir     Botones de compartir
     nexo:pie           Pie de página con enlaces + menú móvil
     nexo:cta-movil     Barra fija de contacto en móvil

   Además mantiene el listado estático de artículos, también entre
   marcadores, para que exista en el HTML sin depender de JavaScript:

     nexo:listado       Todas las tarjetas, en analisis/index.html
     nexo:ultimos       Las 3 más recientes, en index.html

   y la fecha <lastmod> de /analisis/ en sitemap.xml.

   Cada bloque vive entre <!-- nexo:<id>:inicio --> y
   <!-- nexo:<id>:fin -->. Regenerar = borrar los bloques viejos y
   volver a insertarlos en su ancla, así que es idempotente y NO
   toca el texto del artículo.

   Uso:
     node scripts/bloques-seo.mjs          → reaplica en todos y en los listados
     node scripts/bloques-seo.mjs <slug>   → solo ese artículo

   Lo llama scripts/nuevo-articulo.mjs al crear una página nueva, y
   scripts/verificar-articulos.mjs comprueba en CI que lo publicado
   coincida con lo que este script generaría hoy.
   ════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, DOMINIO, WHATSAPP, cargarArticulos, escaparHtml } from "./articulos.mjs";

const DIR_ANALISIS = path.join(ROOT, "analisis");
const RUTA_HUB = path.join(DIR_ANALISIS, "index.html");
const RUTA_PORTADA = path.join(ROOT, "index.html");
const RUTA_SITEMAP = path.join(ROOT, "sitemap.xml");

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function fechaLarga(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES[m - 1]} ${a}`;
}

const IDS = [
  "schema",
  "analytics",
  "nav",
  "tldr",
  "cta-inline",
  "cta-final",
  "faq",
  "relacionados",
  "compartir",
  "pie",
  "cta-movil",
];

function envolver(id, contenido) {
  return `<!-- nexo:${id}:inicio -->\n${contenido}\n<!-- nexo:${id}:fin -->`;
}

/** Quita los bloques generados para poder reinsertarlos desde cero. */
function limpiarBloques(html, ids = IDS) {
  for (const id of ids) {
    const re = new RegExp(
      `[ \\t]*<!-- nexo:${id}:inicio -->[\\s\\S]*?<!-- nexo:${id}:fin -->\\n?`,
      "g"
    );
    html = html.replace(re, "");
  }
  // Quitar bloques puede dejar huecos; normalizarlos mantiene estable
  // el archivo cuando se reaplica.
  return html.replace(/\n{3,}/g, "\n\n");
}

/** Los 3 artículos más afines: primero el mismo cluster, luego los más recientes. */
export function relacionados(art, articulos, cantidad = 3) {
  const otros = articulos.filter((a) => a.slug !== art.slug);
  const mismoCluster = otros.filter((a) => a.cluster === art.cluster);
  const resto = otros.filter((a) => a.cluster !== art.cluster);
  return [...mismoCluster, ...resto].slice(0, cantidad);
}

function bloqueSchema(art) {
  const url = `${DOMINIO}/analisis/${art.slug}.html`;
  const articuloLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: art.title,
    description: art.excerpt,
    image: `${DOMINIO}/assets/og/${art.slug}.png`,
    datePublished: art.date,
    dateModified: art.updated ?? art.date,
    inLanguage: "es-HN",
    author: { "@type": "Organization", "@id": `${DOMINIO}/#empresa`, name: "Nexo Empresarial" },
    publisher: {
      "@type": "Organization",
      "@id": `${DOMINIO}/#empresa`,
      name: "Nexo Empresarial",
      logo: { "@type": "ImageObject", url: `${DOMINIO}/assets/logo.png` },
    },
    mainEntityOfPage: url,
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: art.faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
  const migasLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${DOMINIO}/` },
      { "@type": "ListItem", position: 2, name: "Análisis", item: `${DOMINIO}/analisis/` },
      { "@type": "ListItem", position: 3, name: art.title, item: url },
    ],
  };
  return envolver(
    "schema",
    `<script type="application/ld+json">\n${JSON.stringify(articuloLd, null, 2)}\n</script>\n` +
      `<script type="application/ld+json">\n${JSON.stringify(faqLd, null, 2)}\n</script>\n` +
      `<script type="application/ld+json">\n${JSON.stringify(migasLd, null, 2)}\n</script>`
  );
}

function bloqueAnalytics() {
  return envolver("analytics", '<script src="../assets/analytics.js" defer></script>');
}

function bloqueNav() {
  return envolver(
    "nav",
    `<nav>
  <div class="nav-inner">
    <a href="../index.html" style="display:flex;align-items:center;" aria-label="Nexo Empresarial, inicio">
      <img src="../assets/logo.png" class="nav-logo" alt="Nexo Empresarial" width="256" height="256"/>
    </a>
    <button type="button" class="nav-toggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="nav-menu">
      <span class="nav-toggle-box" aria-hidden="true">
        <span class="nav-toggle-bar"></span>
        <span class="nav-toggle-bar"></span>
        <span class="nav-toggle-bar"></span>
      </span>
    </button>
    <div class="nav-links" id="nav-menu">
      <a href="../index.html#servicios">Servicios</a>
      <a href="../plataforma.html">Plataforma</a>
      <a href="../precios.html">Precios</a>
      <a href="../invertir-en-honduras.html">Invertir en Honduras</a>
      <a href="./" style="color:var(--white);">Análisis</a>
      <a href="../index.html#contacto" class="nav-cta">Contactar</a>
    </div>
  </div>
</nav>`
  );
}

function bloqueTldr(art) {
  const puntos = art.tldr
    .map((p) => `        <li>${escaparHtml(p)}</li>`)
    .join("\n");
  return envolver(
    "tldr",
    `      <aside class="tldr" aria-labelledby="tldr-titulo">
        <p class="tldr-intent"><strong>Qué resuelve este artículo:</strong> ${escaparHtml(art.intent)}</p>
        <h2 id="tldr-titulo" class="tldr-titulo">En resumen</h2>
        <ul>
${puntos}
        </ul>
      </aside>`
  );
}

function bloqueCtaInline(art) {
  const texto = encodeURIComponent(
    `Hola, leí "${art.title}" en nexoemp.com y quiero una asesoría.`
  );
  return envolver(
    "cta-inline",
    `      <div class="cta-inline">
        <p><strong>¿Su caso necesita revisión profesional?</strong> Agende una sesión de diagnóstico sin costo con nuestro equipo fiscal, contable y legal.</p>
        <a href="https://wa.me/${WHATSAPP}?text=${texto}" target="_blank" rel="noopener" class="cta-inline-btn">Hablar por WhatsApp →</a>
      </div>`
  );
}

function bloqueCtaFinal(art) {
  const texto = encodeURIComponent(
    `Hola, terminé de leer "${art.title}" en nexoemp.com y quiero hablar con ustedes sobre mi caso.`
  );
  return envolver(
    "cta-final",
    `    <div class="cta-final-art">
      <h2>Hablemos de su caso</h2>
      <p>Lo que acaba de leer es la regla general; su empresa tiene sus propios números. Cuéntenos su situación y le decimos qué le aplica. La primera sesión de diagnóstico no tiene costo.</p>
      <div class="cta-final-btns">
        <a href="https://wa.me/${WHATSAPP}?text=${texto}" target="_blank" rel="noopener" class="btn btn-wa">Hablar con nosotros por WhatsApp →</a>
        <a href="../index.html#contacto" class="btn btn-ghost">Escribirnos por el formulario</a>
      </div>
    </div>`
  );
}

function bloqueFaq(art) {
  const items = art.faq
    .map(
      ({ q, a }) => `      <details class="faq-item">
        <summary><h3>${escaparHtml(q)}</h3></summary>
        <p>${escaparHtml(a)}</p>
      </details>`
    )
    .join("\n");
  return envolver(
    "faq",
    `    <section class="faq" aria-labelledby="faq-titulo">
      <h2 id="faq-titulo">Preguntas frecuentes</h2>
${items}
    </section>`
  );
}

function bloqueRelacionados(art, articulos) {
  const items = relacionados(art, articulos)
    .map(
      (a) => `        <li>
          <a href="${a.slug}.html">
            <span class="rel-cat">${escaparHtml(a.category)}</span>
            <span class="rel-title">${escaparHtml(a.title)}</span>
          </a>
        </li>`
    )
    .join("\n");
  return envolver(
    "relacionados",
    // <aside> y no <nav>: la hoja de estilos fija todo <nav> a la parte
    // superior de la ventana (es el encabezado del sitio).
    `    <aside class="relacionados" aria-labelledby="rel-titulo">
      <h2 id="rel-titulo">Seguir leyendo</h2>
      <ul>
${items}
      </ul>
    </aside>`
  );
}

function bloqueCompartir(art) {
  const url = `${DOMINIO}/analisis/${art.slug}.html`;
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(art.title);
  return envolver(
    "compartir",
    `    <div class="compartir">
      <span class="compartir-label">Compartir</span>
      <a href="https://wa.me/?text=${t}%20${u}" target="_blank" rel="noopener" aria-label="Compartir en WhatsApp">WhatsApp</a>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${u}" target="_blank" rel="noopener" aria-label="Compartir en LinkedIn">LinkedIn</a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${u}" target="_blank" rel="noopener" aria-label="Compartir en Facebook">Facebook</a>
      <button type="button" class="compartir-copiar" data-url="${url}">Copiar enlace</button>
    </div>
    <script>
      document.querySelectorAll(".compartir-copiar").forEach(function (b) {
        b.addEventListener("click", function () {
          navigator.clipboard.writeText(b.dataset.url).then(function () {
            var previo = b.textContent;
            b.textContent = "¡Copiado!";
            setTimeout(function () { b.textContent = previo; }, 1800);
          });
        });
      });
    </script>`
  );
}

function bloquePie() {
  return envolver(
    "pie",
    `<footer>
  <div class="container">
    <div class="foot-links">
      <a href="../index.html">Inicio</a>
      <a href="../index.html#servicios">Servicios</a>
      <a href="../contadores/">Contadores</a>
      <a href="../plataforma.html">Plataforma</a>
      <a href="../precios.html">Precios</a>
      <a href="../invertir-en-honduras.html">Invertir en Honduras</a>
      <a href="./">Análisis</a>
      <a href="../index.html#contacto">Contacto</a>
    </div>
    <p>© 2026 <span class="brand">Nexo Empresarial</span> · San Pedro Sula, Honduras</p>
    <p>Legal · Fiscal · Contable · Financiera</p>
  </div>
</footer>

<script>
  (function(){
    var toggle = document.querySelector('.nav-toggle');
    if (!toggle) return;
    var menu = document.getElementById(toggle.getAttribute('aria-controls'));
    if (!menu) return;
    function close(){
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menú');
    }
    function open(){
      menu.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Cerrar menú');
    }
    toggle.addEventListener('click', function(){
      if (menu.classList.contains('open')) close(); else open();
    });
    menu.addEventListener('click', function(e){
      if (e.target.closest('a')) close();
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && menu.classList.contains('open')){
        close();
        toggle.focus();
      }
    });
    window.addEventListener('resize', function(){
      if (window.innerWidth > 720) close();
    });
  })();
</script>`
  );
}

function bloqueCtaMovil(art) {
  const texto = encodeURIComponent(
    `Hola, leí "${art.title}" en nexoemp.com y quiero una asesoría.`
  );
  return envolver(
    "cta-movil",
    `<div class="cta-movil">
  <a href="https://wa.me/${WHATSAPP}?text=${texto}" target="_blank" rel="noopener" class="cta-movil-wa">WhatsApp</a>
  <a href="../index.html#contacto" class="cta-movil-btn">Solicitar diagnóstico</a>
</div>`
  );
}

/** Inserta `texto` justo antes de `ancla`; falla si el ancla no existe. */
function insertarAntes(html, ancla, texto, slug) {
  const i = html.indexOf(ancla);
  if (i === -1) throw new Error(`no se encontró el ancla ${JSON.stringify(ancla)} en ${slug}.html`);
  return html.slice(0, i) + texto + "\n" + html.slice(i);
}

/** Inserta `texto` justo después de `ancla`; falla si el ancla no existe. */
function insertarDespues(html, ancla, texto, slug) {
  const i = html.indexOf(ancla);
  if (i === -1) throw new Error(`no se encontró el ancla ${JSON.stringify(ancla)} en ${slug}.html`);
  const corte = i + ancla.length;
  return html.slice(0, corte) + "\n" + texto + html.slice(corte);
}

export function aplicarBloques(html, art, articulos) {
  html = limpiarBloques(html);

  html = insertarAntes(html, "</head>", bloqueSchema(art), art.slug);
  html = insertarAntes(html, "</head>", bloqueAnalytics(), art.slug);
  html = insertarDespues(html, "<body>", bloqueNav(), art.slug);

  const ANCLA_PROSE = '<div class="prose">';
  html = insertarDespues(html, ANCLA_PROSE, bloqueTldr(art), art.slug);

  // El CTA va después del primer párrafo del cuerpo, que empieza
  // donde termina el bloque TL;DR.
  const finTldr = html.indexOf("<!-- nexo:tldr:fin -->");
  const finParrafo = html.indexOf("</p>", finTldr);
  if (finParrafo === -1) {
    throw new Error(`no se encontró un primer párrafo en ${art.slug}.html`);
  }
  const corte = finParrafo + "</p>".length;
  html = html.slice(0, corte) + "\n" + bloqueCtaInline(art) + html.slice(corte);

  const ANCLA_DISCLAIMER = '<div class="article-disclaimer">';
  const i = html.indexOf(ANCLA_DISCLAIMER);
  if (i === -1) throw new Error(`no se encontró el disclaimer en ${art.slug}.html`);
  const inicioLinea = html.lastIndexOf("\n", i) + 1;
  // Un solo salto entre bloques: limpiarBloques() se lleva exactamente ese
  // salto con cada bloque, y así reaplicar deja el archivo idéntico.
  const bloques =
    [bloqueCtaFinal(art), bloqueFaq(art), bloqueCompartir(art), bloqueRelacionados(art, articulos)]
      .map((b) => `${b}\n`)
      .join("");
  html = html.slice(0, inicioLinea) + bloques + html.slice(inicioLinea);

  html = insertarAntes(html, "</body>", bloquePie(), art.slug);
  html = insertarAntes(html, "</body>", bloqueCtaMovil(art), art.slug);

  return html;
}

function porFecha(articulos) {
  return articulos.slice().sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
}

/** Reemplaza el contenido entre los marcadores de `id`; falla si no existen. */
function reemplazarBloque(html, id, contenido, archivo) {
  const re = new RegExp(`[ \\t]*<!-- nexo:${id}:inicio -->[\\s\\S]*?<!-- nexo:${id}:fin -->`);
  if (!re.test(html)) throw new Error(`faltan los marcadores nexo:${id} en ${archivo}`);
  return html.replace(re, () => envolver(id, contenido));
}

/** Listado completo de artículos del hub analisis/index.html. */
export function aplicarListadoHub(html, articulos) {
  const tarjetas = porFecha(articulos)
    .map(
      (a) => `      <a class="article-card" href="${a.slug}.html">
        <img class="article-card-cover" src="../assets/og/${a.slug}.png" alt="${escaparHtml(a.title)}" width="1200" height="630" loading="lazy"/>
        <div class="article-card-inner">
          <div class="article-meta">
            <span class="article-cat">${escaparHtml(a.category)}</span>
            <span class="article-date">${fechaLarga(a.date)}</span>
          </div>
          <h2>${escaparHtml(a.title)}</h2>
          <p>${escaparHtml(a.excerpt)}</p>
          <span class="article-readmore">Leer análisis <span class="arr">→</span></span>
        </div>
      </a>`
    )
    .join("\n");
  return reemplazarBloque(html, "listado", tarjetas, "analisis/index.html");
}

/** Los 3 artículos más recientes en la portada. */
export function aplicarUltimosPortada(html, articulos) {
  const tarjetas = porFecha(articulos)
    .slice(0, 3)
    .map(
      (a) => `      <a class="news-card" href="analisis/${a.slug}.html">
        <img class="news-cover" src="assets/og/${a.slug}.png" alt="${escaparHtml(a.title)}" width="1200" height="630" loading="lazy"/>
        <div class="news-body">
          <div class="news-meta"><span class="news-cat">${escaparHtml(a.category)}</span><span class="news-date">${fechaLarga(a.date)}</span></div>
          <h3>${escaparHtml(a.title)}</h3>
          <p>${escaparHtml(a.excerpt)}</p>
          <span class="news-readmore">Leer análisis <svg class="ico"><use href="#i-flecha"/></svg></span>
        </div>
      </a>`
    )
    .join("\n");
  return reemplazarBloque(html, "ultimos", tarjetas, "index.html");
}

/** <lastmod> de /analisis/ = fecha del artículo más reciente. */
export function aplicarLastmodHub(xml, articulos) {
  const ultima = porFecha(articulos)[0]?.updated ?? porFecha(articulos)[0]?.date;
  const re = new RegExp(`(<loc>${DOMINIO}/analisis/</loc>\\s*<lastmod>)[^<]*(</lastmod>)`);
  if (!ultima) return xml;
  if (!re.test(xml)) throw new Error("no se encontró /analisis/ en sitemap.xml");
  return xml.replace(re, `$1${ultima}$2`);
}

/** Archivos derivados del índice completo: [ruta, función que los regenera]. */
export const LISTADOS = [
  [RUTA_HUB, aplicarListadoHub],
  [RUTA_PORTADA, aplicarUltimosPortada],
  [RUTA_SITEMAP, aplicarLastmodHub],
];

export function actualizarListados(articulos) {
  let cambios = 0;
  for (const [ruta, aplicar] of LISTADOS) {
    const antes = readFileSync(ruta, "utf8");
    const despues = aplicar(antes, articulos);
    if (antes !== despues) {
      writeFileSync(ruta, despues);
      console.log(`✓ Listado actualizado: ${path.relative(ROOT, ruta)}`);
      cambios++;
    }
  }
  return cambios;
}

function main() {
  const slugsPedidos = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const articulos = cargarArticulos();
  const objetivo = slugsPedidos.length
    ? articulos.filter((a) => slugsPedidos.includes(a.slug))
    : articulos;

  if (slugsPedidos.length && objetivo.length !== slugsPedidos.length) {
    const conocidos = new Set(articulos.map((a) => a.slug));
    const faltan = slugsPedidos.filter((s) => !conocidos.has(s));
    console.error(`✗ Slug(s) no encontrados en articles.js: ${faltan.join(", ")}`);
    process.exit(1);
  }

  let cambios = 0;
  for (const art of objetivo) {
    const ruta = path.join(DIR_ANALISIS, `${art.slug}.html`);
    if (!existsSync(ruta)) {
      console.error(`✗ falta analisis/${art.slug}.html (correr: node scripts/nuevo-articulo.mjs)`);
      process.exit(1);
    }
    const antes = readFileSync(ruta, "utf8");
    const despues = aplicarBloques(antes, art, articulos);
    if (antes !== despues) {
      writeFileSync(ruta, despues);
      console.log(`✓ Bloques actualizados: analisis/${art.slug}.html`);
      cambios++;
    }
  }

  if (!slugsPedidos.length) cambios += actualizarListados(articulos);

  console.log(
    cambios === 0
      ? "Bloques SEO ya al día en todos los artículos."
      : `\nListo: ${cambios} archivo(s) actualizado(s).`
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
