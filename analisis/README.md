# Análisis & Noticias — cómo publicar

Esta carpeta es la sección de análisis de leyes, decretos y noticias del sitio.
No requiere base de datos ni build: es HTML estático.

## Publicar un artículo nuevo (1 paso)

Agrega la entrada **al inicio** del arreglo en `../assets/articles.js`
(el más reciente va primero) y corre el generador:

```js
{
  slug: "reforma-isv-2026",          // será el nombre del archivo .html
  title: "Título tal como aparecerá en las tarjetas",
  category: "Fiscal / SAR",
  date: "2026-06-20",                // formato AAAA-MM-DD
  author: "Nexo Empresarial",
  excerpt: "Resumen de 1–2 frases que se muestra en la tarjeta."
},
```

```bash
node scripts/nuevo-articulo.mjs
```

El script hace todo lo que antes era manual:

- crea `analisis/<slug>.html` desde `_plantilla.html` con título, categoría,
  fecha, canonical, Open Graph, Twitter Card y JSON-LD ya rellenados;
- genera la portada `assets/og/<slug>.png` (requiere `python3` + Pillow:
  `pip install pillow`);
- agrega la URL a `sitemap.xml`.

Solo queda **redactar el cuerpo**: abre el HTML generado y reemplaza lo que
quedó entre `[[corchetes]]` dentro de `<div class="prose">`, usando
`<h2>`, `<h3>`, `<p>`, `<ul><li>`, `<ol><li>`, `<blockquote>` y
`<div class="callout">…</div>`.

La portada (`/`) muestra automáticamente los **3 más recientes** y el
hub (`/analisis`) muestra **todos**, ordenados por fecha.

## Verificar antes de subir

```bash
node scripts/verificar-articulos.mjs
```

Comprueba que índice, HTML, portadas y sitemap estén sincronizados y que no
queden placeholders `[[...]]` sin redactar. El mismo chequeo corre en CI
(`.github/workflows/ci.yml`) en cada push y pull request.

## Categorías sugeridas

`Análisis legal` · `Fiscal / SAR` · `Decretos` · `Contable` · `Noticias` · `Guía`

## Archivos

- `index.html` — hub que lista todos los artículos (se genera solo en el navegador).
- `_plantilla.html` — plantilla base que usa el generador. **No borrar.**
- `../assets/articles.js` — índice/fuente única de artículos.
- `../assets/site.css` — estilos compartidos de estas páginas.
- `../scripts/nuevo-articulo.mjs` — generador de página + portada + sitemap.
- `../scripts/verificar-articulos.mjs` — chequeo de consistencia (CI).
- `../scripts/generar_portadas.py` — dibuja las portadas OG (lo llama el generador).
