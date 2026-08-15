#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════
   bloques-seo.mjs — Bloques SEO/GEO de las páginas de análisis
   ────────────────────────────────────────────────────────────────
   Todo lo que en un artículo NO es el cuerpo redactado a mano se
   genera desde assets/articles.js y se inserta entre marcadores:

     nexo:schema        FAQPage + BreadcrumbList (JSON-LD, en <head>)
     nexo:analytics     Carga de assets/analytics.js (GA4)
     nexo:tldr          Intención de búsqueda + "En resumen"
     nexo:cta-inline    Llamado a la acción tras el primer párrafo
     nexo:faq           Preguntas frecuentes visibles
     nexo:relacionados  Interlinkeado por cluster temático
     nexo:compartir     Botones de compartir
     nexo:cta-movil     Barra fija de contacto en móvil

   Cada bloque vive entre <!-- nexo:<id>:inicio --> y
   <!-- nexo:<id>:fin -->. Regenerar = borrar los bloques viejos y
   volver a insertarlos en su ancla, así que es idempotente y NO
   toca el texto del artículo.

   Uso:
     node scripts/bloques-seo.mjs          → reaplica en todos
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

const IDS = [
  "schema",
  "analytics",
  "tldr",
  "cta-inline",
  "faq",
  "relacionados",
  "compartir",
  "cta-movil",
];

function envolver(id, contenido) {
  return `<!-- nexo:${id}:inicio -->\n${contenido}\n<!-- nexo:${id}:fin -->`;
}

/** Quita los bloques generados para poder reinsertarlos desde cero. */
function limpiarBloques(html) {
  for (const id of IDS) {
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
    `<script type="application/ld+json">\n${JSON.stringify(faqLd, null, 2)}\n</script>\n` +
      `<script type="application/ld+json">\n${JSON.stringify(migasLd, null, 2)}\n</script>`
  );
}

function bloqueAnalytics() {
  return envolver("analytics", '<script src="../assets/analytics.js" defer></script>');
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
    [bloqueFaq(art), bloqueCompartir(art), bloqueRelacionados(art, articulos)]
      .map((b) => `${b}\n`)
      .join("");
  html = html.slice(0, inicioLinea) + bloques + html.slice(inicioLinea);

  html = insertarAntes(html, "</body>", bloqueCtaMovil(art), art.slug);

  return html;
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

  console.log(
    cambios === 0
      ? "Bloques SEO ya al día en todos los artículos."
      : `\nListo: ${cambios} artículo(s) actualizado(s).`
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
