# Análisis & Noticias — cómo publicar

Esta carpeta es la sección de análisis de leyes, decretos y noticias del sitio.
No requiere base de datos ni build: es HTML estático.

## Publicar un artículo nuevo (1 paso)

Agrega la entrada **al inicio** del arreglo en `../assets/articles.js`
(el más reciente va primero) y corre el generador:

```js
{
  slug: "reforma-isv-2026",          // será el nombre del archivo .html
  title: "Título tal como aparecerá en las tarjetas",   // es el H1
  metaTitle: "Reforma del ISV 2026: qué cambia para tu empresa", // es el <title>
  category: "Fiscal / SAR",
  date: "2026-06-20",                // formato AAAA-MM-DD
  author: "Nexo Empresarial",
  cluster: "fiscal",                 // agrupa el interlinkeado
  intent: "Qué pregunta del lector resuelve el artículo.",
  excerpt: "Resumen de 1–2 frases que se muestra en la tarjeta.",
  tldr: [
    "Conclusión clave uno, en una frase.",
    "Conclusión clave dos.",
    "Conclusión clave tres."
  ],
  faq: [
    { q: "¿Pregunta que la gente busca?", a: "Respuesta directa en 2–3 frases." },
    { q: "¿Segunda pregunta?", a: "Respuesta." },
    { q: "¿Tercera pregunta?", a: "Respuesta." }
  ]
},
```

`title` es el H1 y `metaTitle` el `<title>` de la pestaña y del resultado de
búsqueda: **deben ser distintos** (el chequeo falla si coinciden), porque son
dos oportunidades de aparecer para búsquedas diferentes.

```bash
node scripts/nuevo-articulo.mjs
```

El script hace todo lo que antes era manual:

- crea `analisis/<slug>.html` desde `_plantilla.html` con título, categoría,
  fecha, canonical, Open Graph, Twitter Card y JSON-LD ya rellenados;
- inserta los bloques SEO del artículo (resumen "En resumen", CTA tras el
  primer párrafo, preguntas frecuentes visibles con su schema `FAQPage`, migas
  de pan, artículos relacionados, botones de compartir y barra fija de contacto
  en móvil), todos derivados de los campos de arriba;
- genera la portada `assets/og/<slug>.png` con una ilustración temática
  (requiere `python3` + Pillow: `pip install pillow`). El dibujo se elige por
  slug en `ICONO_POR_SLUG` de `scripts/generar_portadas.py` y, si el slug no
  está mapeado, por categoría — para darle un ícono propio a un artículo
  nuevo, agregalo a ese mapa antes de generar;
- agrega la URL a `sitemap.xml`.

Solo queda **redactar el cuerpo**: abre el HTML generado y reemplaza lo que
quedó entre `[[corchetes]]` dentro de `<div class="prose">`, usando
`<h2>`, `<h3>`, `<p>`, `<ul><li>`, `<ol><li>`, `<blockquote>`,
`<div class="callout">…</div>` y tablas envueltas en `<div class="tabla-scroll">`.
No toques nada que esté entre marcadores `<!-- nexo:… -->`: eso se regenera.

Por último, agregá el artículo a `../llms.txt` (el resumen del sitio para
ChatGPT, Claude y Perplexity), que es lo único que se mantiene a mano.

La portada (`/`) muestra automáticamente los **3 más recientes** y el
hub (`/analisis`) muestra **todos**, ordenados por fecha.

## Cambiar el resumen, las preguntas frecuentes o el cluster

De un artículo **ya publicado**: editá sus campos en `../assets/articles.js` y corré

```bash
node scripts/bloques-seo.mjs            # todos
node scripts/bloques-seo.mjs <slug>     # solo uno
```

Es idempotente y no toca el texto redactado a mano.

## Verificar antes de subir

```bash
node scripts/verificar-articulos.mjs
```

Comprueba que índice, HTML, portadas y sitemap estén sincronizados, que los
bloques SEO publicados coincidan con lo que el generador produciría hoy, que
cada página tenga un solo H1, que su `<title>` no sea el H1 y que ni títulos ni
descripciones se repitan entre artículos, y que no
queden placeholders `[[...]]` sin redactar. El mismo chequeo corre en CI
(`.github/workflows/ci.yml`) en cada push y pull request.

## Categorías sugeridas

`Análisis legal` · `Fiscal / SAR` · `Decretos` · `Contable` · `Noticias` · `Guía`

## Archivos

- `index.html` — hub que lista todos los artículos (se genera solo en el navegador).
- `_plantilla.html` — plantilla base que usa el generador. **No borrar.**
- `../assets/articles.js` — índice/fuente única de artículos.
- `../assets/site.css` — estilos compartidos de estas páginas.
- `../scripts/articulos.mjs` — lectura y validación del índice (compartido).
- `../scripts/nuevo-articulo.mjs` — generador de página + portada + sitemap.
- `../scripts/bloques-seo.mjs` — bloques SEO/GEO de los artículos.
- `../scripts/verificar-articulos.mjs` — chequeo de consistencia (CI).
- `../scripts/generar_portadas.py` — dibuja las portadas OG (lo llama el generador).
