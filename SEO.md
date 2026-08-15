# SEO y visibilidad en IA — nexoemp.com

Estado de la lista de verificación que se aplicó al sitio, qué archivo se
encarga de cada punto y qué queda por hacer a mano.

Regla general: **casi todo se genera desde `assets/articles.js`**. Si algo del
listado se ve mal en un artículo, se corrige ahí y se corre
`node scripts/bloques-seo.mjs`, no editando el HTML a mano.

## Listo en el repo

| # | Punto | Dónde vive |
|---|-------|-----------|
| 1 | Meta-títulos distintos entre páginas | `<title>` de cada página; el chequeo de CI falla si se repiten |
| 2 | Meta-descripciones distintas | `<meta name="description">` de cada página, redactada a mano; CI falla si se repiten |
| 3 | Un solo H1 por página | CI cuenta las etiquetas `<h1>` de cada artículo |
| 4 | H1 distinto del meta-título | `title` (H1) y `metaTitle` (`<title>`) en `articles.js`; CI falla si coinciden |
| 5 | Intención de búsqueda declarada | campo `intent`, visible arriba del resumen |
| 6 | TL;DR / conclusiones clave | campo `tldr` → bloque "En resumen" |
| 7 | El resumen va después de la intención | orden fijo del bloque `nexo:tldr` |
| 8 | CTA después del primer párrafo | bloque `nexo:cta-inline` (WhatsApp con el artículo precargado) |
| 9 | Jerarquía H1 → H2 → H3 | cuerpo del artículo; la plantilla lo recuerda al redactar |
| 10 | Interlinkeado y clusters | campo `cluster` → bloque "Seguir leyendo", enlaces estáticos |
| 11 | Tablas y listas | estilos `.prose table` + `.tabla-scroll` en `assets/site.css`; ejemplo en `_plantilla.html` |
| 12 | FAQ visible | campo `faq` → bloque `nexo:faq`; la portada ya tenía la suya |
| 13 | Schema de FAQ | `FAQPage` generado del mismo campo `faq` (visible y schema nunca se desincronizan) |
| 14 | Nombres de imagen descriptivos | portadas en `assets/og/<slug>.png` |
| 15 | Alt text en imágenes | portadas y logo; el hub usa el título del artículo como alt |
| 16 | Schema de negocio local | `ProfessionalService` en `index.html` (dirección, teléfono, horario, servicios) |
| 17 | robots.txt | `robots.txt`, con permiso explícito a los rastreadores de IA |
| 18 | URLs sin números ni conectores | los slugs se validan en `scripts/articulos.mjs` |
| 19 | Desindexar lo que no debe rankear | `labs/index.html` es `noindex` y solo redirige a `/plataforma.html` |
| 20 | llms.txt | `llms.txt` en la raíz: qué hace la firma, páginas y artículos, con nota de atribución |
| 21 | CTA fijo en móvil | bloque `nexo:cta-movil` en artículos; barra propia en portada, plataforma y hub |
| 22 | Botón para compartir | bloque `nexo:compartir` (WhatsApp, LinkedIn, Facebook, copiar enlace) |
| 25 | Sitemap | `sitemap.xml`; el generador agrega cada artículo nuevo y CI verifica que no falte ninguno |
| — | Migas de pan | `BreadcrumbList` en cada artículo (Inicio → Análisis → artículo) |

## Pendiente — requiere una cuenta, no código

Estos tres puntos no se pueden cerrar desde el repo porque dependen de datos
que solo se obtienen iniciando sesión en Google.

**23. Google Analytics 4.** El código ya está puesto y cargando en todas las
páginas; solo falta el identificador.

1. Entrá a [analytics.google.com](https://analytics.google.com) → Administrar →
   Flujos de datos → Web → crear el flujo de `nexoemp.com`.
2. Copiá el **ID de medición** (empieza con `G-`).
3. Pegalo en `assets/analytics.js`, en la línea `var GA4_ID = "";`.
4. Commit y push: con el ID vacío el archivo no hace nada, y con el ID
   empieza a medir en el siguiente despliegue.

**24. Google Search Console.** Verificar la propiedad `nexoemp.com`:

1. Entrá a [search.google.com/search-console](https://search.google.com/search-console)
   y agregá la propiedad.
2. Elegí la verificación por **etiqueta HTML**; Google devuelve una línea
   `<meta name="google-site-verification" content="…"/>`.
3. Pegala en el `<head>` de `index.html`, junto a las otras `<meta>`, y subila.
4. Volvé a Search Console y pulsá Verificar.

**26. Enviar el sitemap en Search Console.** Ya verificada la propiedad:
Search Console → Sitemaps → escribir `sitemap.xml` → Enviar.

## Cómo se mantiene

- Publicar un artículo: `assets/articles.js` + `node scripts/nuevo-articulo.mjs`
  (ver `analisis/README.md`).
- Cambiar el resumen, las preguntas frecuentes o el cluster de un artículo ya
  publicado: editar `articles.js` y correr `node scripts/bloques-seo.mjs`.
- Antes de subir: `node scripts/verificar-articulos.mjs`. El mismo chequeo corre
  en CI y falla si los bloques publicados quedaron desactualizados respecto del
  índice, si dos páginas comparten título o descripción, si un artículo tiene
  más de un H1 o si el `<title>` es igual al H1.
- Actualizar `llms.txt` cuando se publique un artículo nuevo: es el único
  archivo del listado que se mantiene a mano.
