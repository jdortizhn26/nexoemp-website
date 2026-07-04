# CLAUDE.md — nexoemp.com

Sitio web oficial de **Nexo Empresarial** (derecho, contabilidad y fiscal, Honduras).
HTML/CSS/JS estático, **sin build ni frameworks**. Hosting sirve el repo tal cual;
`main` es producción.

## Estructura

```
index.html            Portada (servicios, labs, demos, contacto)
analisis/             Blog "Análisis & Noticias" (artículos SEO)
  _plantilla.html     Plantilla de artículo (no borrar)
  index.html          Hub que lista todos los artículos
  README.md           Guía de publicación
labs/                 Página de Nexo Labs
assets/
  articles.js         FUENTE ÚNICA del índice de artículos
  og/                 Portadas 1200x630 (tarjetas + Open Graph)
  site.css            Estilos de las páginas de análisis
scripts/
  nuevo-articulo.mjs      Generador: página + portada + sitemap
  verificar-articulos.mjs Chequeo de consistencia (corre en CI)
  generar_portadas.py     Dibuja portadas OG (requiere Pillow)
sitemap.xml / robots.txt
```

## Publicar un artículo (flujo de 1 paso)

1. Agregar la entrada al inicio de `assets/articles.js` (slug, título,
   categoría, fecha AAAA-MM-DD, autor, excerpt).
2. `node scripts/nuevo-articulo.mjs` — genera `analisis/<slug>.html` desde la
   plantilla (SEO/OG/JSON-LD rellenados), la portada `assets/og/<slug>.png` y
   la entrada en `sitemap.xml`.
3. Redactar el cuerpo en el HTML generado (reemplazar los `[[corchetes]]`).

Antes de subir: `node scripts/verificar-articulos.mjs` (también corre en CI,
`.github/workflows/ci.yml`; falla si índice, HTML, portadas o sitemap se
desincronizan o quedan placeholders).

## Reglas

- **No subir documentos internos** al repo (contratos, notas de clientes,
  informes, PDFs de trabajo): es un sitio público y todo lo commiteado se
  sirve en producción. Ya ocurrió una vez y hubo que retirarlos.
- Contenido en español (es-HN). Los artículos son informativos, nunca asesoría
  para un caso particular (mantener el disclaimer de la plantilla).
- Commits descriptivos en español.
- No editar a mano lo que generan los scripts sin actualizar la fuente
  (`articles.js` manda; el chequeo de CI hace cumplir la consistencia).

## Configuración y despliegue (REGLA)

- Este sitio es **estático y público** (sin build ni variables de entorno): todo
  lo commiteado se sirve tal cual en producción. Por eso la regla central es **NO
  commitear secretos ni documentos internos** (claves, contratos, notas de
  clientes, informes, PDFs de trabajo). Ya ocurrió una vez y hubo que retirarlos.
- Como principio general del ecosistema: la configuración y los secretos van
  **SIEMPRE** en variables de entorno del hosting (Vercel/Supabase/Firebase),
  **NUNCA** hardcodeados en el repo. Aquí no hay env vars, así que la forma de
  cumplir esta regla es no incrustar nada sensible en el HTML/JS estático.
- Si en el futuro alguna página llegara a depender de **nuevas variables de
  entorno**, ese cambio **NO se fusiona a producción** hasta **CONFIRMAR** que esas
  variables existen en el entorno de despliegue. Es un ítem **BLOQUEANTE de
  pre-merge**, no un "pendiente".
