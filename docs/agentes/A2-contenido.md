# Runbook A2 — Agente de Contenido / SEO

**Rutina:** martes y jueves 12:00 UTC (6:00 Honduras). Cada corrida = 1 artículo.
**Objetivo:** publicar análisis fiscal/legal/contable que traiga tráfico orgánico
a nexoemp.com y alimente el funnel comercial.

## Procedimiento por corrida

1. Leer `analisis/README.md` (cómo publicar) y `assets/articles.js` (qué ya
   existe, para no repetir tema).
2. Elegir UN tema con valor para empresarios de Honduras (prioridad) o del
   Anillo 1 (GT/CR/RD): reformas fiscales, decretos, obligaciones del mes,
   guías prácticas (SAR, ISV, planillas, constitución de sociedades…).
   Investigar en fuentes oficiales; no inventar normativa ni citar decretos
   sin verificar.
3. Redactar el artículo con `analisis/_plantilla.html`: tono profesional de
   firma, español, 600–1200 palabras, con un callout "En la práctica".
4. Registrar la entrada al inicio de `assets/articles.js`.
5. Crear rama `claude/a2-articulo-<slug>`, commit descriptivo en español,
   push y **abrir PR a `main`** titulado `[A2] <título del artículo>`.
6. Bitácora: el cuerpo del PR incluye tema elegido, fuentes consultadas y
   por qué es relevante ahora.

## Guardrails

- Nunca push directo a `main`; siempre PR (Daniel aprueba).
- No afirmar normativa sin fuente oficial verificable; ante duda, encuadrar
  como análisis y recomendar consulta profesional (el disclaimer de la
  plantilla se mantiene).
- No tocar nada del sitio fuera de `analisis/` y `assets/articles.js`.
- Si no hay tema con sustancia verificable, NO publicar relleno: abrir issue
  `[A2] Sin tema esta corrida` explicando qué se revisó.
