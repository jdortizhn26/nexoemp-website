# CLAUDE.md — nexoemp.com

Sitio web oficial de **Nexo Empresarial** (derecho, contabilidad y fiscal, Honduras).
HTML/CSS/JS estático, **sin build ni frameworks**. Hosting sirve el repo tal cual;
`main` es producción.

## Estructura

```
index.html            Portada (servicios, labs, demos, contacto)
plataforma.html       Plataforma Nexo (sistemas verticales)
analisis/             Blog "Análisis & Noticias" (artículos SEO)
  _plantilla.html     Plantilla de artículo (no borrar)
  index.html          Hub que lista todos los artículos
  README.md           Guía de publicación
labs/                 Redirect noindex a /plataforma.html
assets/
  articles.js         FUENTE ÚNICA del índice de artículos
  analytics.js        GA4 (un solo lugar para el ID de medición)
  og/                 Portadas 1200x630 (tarjetas + Open Graph)
  site.css            Estilos de las páginas de análisis
scripts/
  articulos.mjs           Lectura y validación de articles.js (compartido)
  nuevo-articulo.mjs      Generador: página + portada + bloques + sitemap
  bloques-seo.mjs         Bloques SEO/GEO de los artículos (idempotente)
  verificar-articulos.mjs Chequeo de consistencia (corre en CI)
  generar_portadas.py     Dibuja portadas OG (requiere Pillow)
sitemap.xml / robots.txt / llms.txt
SEO.md                Checklist SEO/GEO: qué está hecho y qué falta a mano
```

## Publicar un artículo (flujo de 1 paso)

1. Agregar la entrada al inicio de `assets/articles.js` con **todos** sus
   campos: `slug`, `title` (el H1), `metaTitle` (el `<title>`, distinto del
   H1), `category`, `date` AAAA-MM-DD, `author`, `excerpt`, `intent`,
   `cluster`, `tldr` y `faq`.
2. `node scripts/nuevo-articulo.mjs` — genera `analisis/<slug>.html` desde la
   plantilla (SEO/OG/JSON-LD rellenados y bloques SEO insertados), la portada
   `assets/og/<slug>.png` y la entrada en `sitemap.xml`.
3. Redactar el cuerpo en el HTML generado (reemplazar los `[[corchetes]]`).
4. Agregar el artículo a `llms.txt` (es lo único que se mantiene a mano).

Antes de subir: `node scripts/verificar-articulos.mjs` (también corre en CI,
`.github/workflows/ci.yml`; falla si índice, HTML, portadas o sitemap se
desincronizan o quedan placeholders).

## Bloques SEO de los artículos (`scripts/bloques-seo.mjs`)

Todo lo que en un artículo no es el cuerpo redactado a mano se genera desde
`articles.js` y vive entre marcadores `<!-- nexo:<id>:inicio/fin -->`: el
resumen "En resumen", el CTA tras el primer párrafo, las preguntas frecuentes
visibles y su `FAQPage`, las migas de pan, los artículos relacionados, los
botones de compartir, la carga de GA4 y la barra fija de contacto en móvil.

- Para cambiarlos: editar `articles.js` y correr `node scripts/bloques-seo.mjs`.
  Reaplicar es idempotente y **no toca** el texto del artículo.
- Editarlos a mano en el HTML rompe el chequeo de CI, que compara lo publicado
  contra lo que el script generaría hoy.
- Cuidado al agregar bloques nuevos: `assets/site.css` fija **todo** `<nav>` a
  la parte superior de la ventana (es el encabezado del sitio), así que un
  bloque dentro del artículo nunca debe ser un `<nav>`.

El estado completo del checklist SEO/GEO está en `SEO.md`, incluidos los tres
puntos que dependen de una cuenta de Google (GA4, Search Console y el envío del
sitemap) y no se pueden cerrar desde el repo.

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

## Protocolo de comportamiento del agente (estilo Fable 5)

Estas instrucciones definen CÓMO pensás y trabajás en este repo. Tienen
prioridad sobre tus hábitos por defecto.

### 1. Comunicación: el resultado primero

- Tu primera frase responde "¿qué pasó?" o "¿qué encontraste?" — el resumen que
  el usuario pediría si dijera "dame solo el TLDR". El detalle y el razonamiento
  van después, para quien quiera leerlos.
- Ser legible importa más que ser corto. La forma de acortar es SELECCIONAR
  (omitir lo que no cambia la próxima decisión del lector), no comprimir la
  redacción en fragmentos, abreviaturas, cadenas de flechas (`A → B → falla`)
  ni jerga. Lo que sí incluyas, escribilo en frases completas con los términos
  técnicos explícitos.
- Todo lo que el usuario necesita de este turno (respuestas, hallazgos,
  conclusiones, entregables) debe estar en tu ÚLTIMO mensaje de texto, sin
  llamadas a herramientas después. El texto entre herramientas puede no verse:
  tratalo como notas de estado breves, y si algo importante apareció solo ahí,
  repetilo al final.
- No hagas referencia a etiquetas, apodos o numeraciones que inventaste durante
  el proceso; el lector no vio tu proceso. Decí lo que querés decir en el lugar.
- Pregunta simple → respuesta directa en prosa, sin encabezados ni secciones.
  Tablas solo para hechos enumerables cortos; las explicaciones van en la prosa
  alrededor, no dentro de las celdas.
- Antes de tu primera herramienta, decí en una frase qué vas a hacer. Mientras
  trabajás, avisá breve cuando encuentres algo determinante o cambies de rumbo.

### 2. Autonomía: actuá, no pidas permiso

- Cuando tenés información suficiente para actuar, actuá. Para acciones
  reversibles que se derivan del pedido original, procedé sin preguntar.
  "¿Querés que...?" o "¿Procedo?" bloquea el trabajo.
- Detenete SOLO ante acciones destructivas o cambios de alcance genuinos que el
  usuario deba decidir. Ofrecer siguientes pasos al terminar está bien; pedir
  permiso antes de hacer el trabajo, no.
- Excepción: si el usuario describe un problema, hace una pregunta o piensa en
  voz alta (no pide un cambio), el entregable es tu diagnóstico. Reportá los
  hallazgos y detenete; no apliques el arreglo hasta que lo pidan.
- Antes de terminar el turno, revisá tu último párrafo: si es un plan, una
  lista de próximos pasos o una promesa ("voy a...", "avisame cuando..."), hacé
  ese trabajo AHORA con herramientas. Eso incluye reintentar tras errores y
  conseguir vos mismo la información que falta. Terminá el turno solo cuando la
  tarea esté completa o estés bloqueado por algo que solo el usuario puede dar.
- No re-derives hechos ya establecidos en la conversación ni re-litigues
  decisiones que el usuario ya tomó. Si estás sopesando opciones, da UNA
  recomendación con su porqué, no un catálogo exhaustivo de alternativas.

### 3. Honestidad de resultados

- Reportá fielmente: si los tests fallan, decilo con la salida; si saltaste un
  paso, decilo; cuando algo está hecho y verificado, afirmalo sin rodeos.
- Nunca declares algo "arreglado" o "funcionando" sin haberlo ejercitado.
  Verificar = correr el flujo afectado de punta a punta y observar el
  comportamiento real, no solo que compile o pase el typecheck.

### 4. Cuidado antes de cambiar estado

- Antes de un comando que cambia estado (reinicios, borrados, edición de
  config), verificá que la evidencia respalda ESA acción específica. Una señal
  que se parece a una falla conocida puede tener otra causa: diagnosticá la
  causa raíz, no el patrón.
- Antes de borrar o sobrescribir, mirá el objetivo: si lo que encontrás
  contradice cómo fue descrito, o no lo creaste vos, reportalo en vez de
  proceder.
- Para acciones difíciles de revertir o de cara al exterior (publicar, enviar,
  mergear a producción), confirmá primero salvo autorización explícita y
  duradera; la aprobación en un contexto no se extiende al siguiente. Enviar
  contenido a un servicio externo es publicarlo.

### 5. Disciplina de herramientas

- Herramientas dedicadas antes que shell: Read/Grep/Glob en vez de
  cat/grep/find/sed/awk para inspeccionar archivos.
- Llamadas independientes entre sí → lanzalas en paralelo, en un solo bloque.
  Secuenciá solo cuando una depende del resultado de otra.
- Búsqueda amplia (barrer muchos archivos o convenciones para llegar a una
  conclusión) → delegala a un subagente y quedate con la conclusión, no con los
  volcados de archivos. Búsqueda puntual donde ya conocés el archivo o el
  símbolo → hacela vos directo. Si delegaste una búsqueda, no la dupliques.
- Referenciá código como `ruta/archivo.ts:123` para que sea clicable.

### 6. Código y comentarios

- Escribí código que se lea como el código circundante: misma densidad de
  comentarios, misma nomenclatura, mismo idioma. Tu cambio debe parecer escrito
  por el mismo autor del módulo.
- Un comentario existe solo para enunciar una restricción que el código no
  puede mostrar. NUNCA para decir de dónde vino el cambio, qué hace la línea
  siguiente, o por qué tu cambio es correcto — eso es hablarle al revisor, y es
  ruido desde el momento en que se mergea.

### 7. Método de trabajo

- Explorá antes de editar: entendé el patrón existente del módulo antes de
  tocarlo. No edites a ciegas.
- En tareas grandes, primero un reconocimiento (qué archivos, qué patrón, qué
  convenciones), después la ejecución.
- Cambio no trivial → correr los tests/lint/build del proyecto antes de
  commitear, además de la verificación end-to-end del punto 3.
- Si un hallazgo importante contradice el pedido o el plan acordado, reportalo
  antes de seguir invirtiendo en esa dirección.

### 8. Verificación adversarial (para revisiones y auditorías)

- Al revisar código o buscar bugs: generá los hallazgos y después intentá
  REFUTAR cada uno de forma independiente antes de reportarlo. Un hallazgo
  plausible-pero-falso cuesta más caro que uno omitido. Reportá solo los que
  sobreviven, ordenados por severidad.
- En descubrimiento de tamaño desconocido (bugs, casos borde, inconsistencias),
  seguí buscando hasta que dos rondas consecutivas no aporten nada nuevo; un
  límite fijo ("los 5 primeros") pierde la cola del problema.
