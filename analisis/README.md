# Análisis & Noticias — cómo publicar

Esta carpeta es la sección de análisis de leyes, decretos y noticias del sitio.
No requiere base de datos ni build: es HTML estático.

## Publicar un artículo nuevo (3 pasos)

1. **Crea la página.** Copia `_plantilla.html` con un nombre descriptivo en
   minúsculas y con guiones. Ese nombre (sin `.html`) es el *slug*.

   Ejemplo: `reforma-isv-2026.html` → slug `reforma-isv-2026`

2. **Escribe el contenido.** Reemplaza todo lo que está entre `[[ corchetes ]]`
   y redacta el cuerpo dentro de `<div class="prose">` usando:
   `<h2>`, `<h3>`, `<p>`, `<ul><li>`, `<ol><li>`, `<blockquote>` y
   `<div class="callout">…</div>`.

3. **Agrégalo al índice.** En `../assets/articles.js`, añade una entrada
   **al inicio** del arreglo (el más reciente va primero):

   ```js
   {
     slug: "reforma-isv-2026",
     title: "Título tal como aparecerá en las tarjetas",
     category: "Fiscal / SAR",
     date: "2026-06-20",            // formato AAAA-MM-DD
     author: "Nexo Empresarial",
     excerpt: "Resumen de 1–2 frases que se muestra en la tarjeta."
   },
   ```

Listo. La portada (`/`) muestra automáticamente los **3 más recientes** y el
hub (`/analisis`) muestra **todos**, ordenados por fecha. No hay que tocar nada más.

## Categorías sugeridas

`Análisis legal` · `Fiscal / SAR` · `Decretos` · `Contable` · `Noticias` · `Guía`

## Archivos

- `index.html` — hub que lista todos los artículos (se genera solo).
- `_plantilla.html` — plantilla base. **No borrar.**
- `../assets/articles.js` — índice/fuente única de artículos.
- `../assets/site.css` — estilos compartidos de estas páginas.
