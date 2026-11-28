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
| — | CTA al terminar el artículo | bloque `nexo:cta-final` (WhatsApp y formulario), justo después del cuerpo |
| 9 | Jerarquía H1 → H2 → H3 | cuerpo del artículo; la plantilla lo recuerda al redactar |
| 10 | Interlinkeado y clusters | campo `cluster` → bloque "Seguir leyendo", enlaces estáticos; el campo opcional `relacionados` va antes de la regla del cluster (CI valida los slugs) |
| — | Enlaces dentro del texto hacia lo que se vende | 2 o 3 por artículo en los seis con más tráfico (obligaciones laborales, constituir sociedad, multas SAR, comerciante o sociedad, RTN, ISR), hacia `/contadores/`, `/plataforma.html`, `/precios.html` y las ramas o el contacto de la portada |
| — | Listado de artículos sin JavaScript | tarjetas estáticas en `analisis/index.html` (`nexo:listado`) y en la portada (`nexo:ultimos`); CI falla si se desincronizan del índice |
| — | Menú y pie iguales en todo el sitio | bloques `nexo:nav` y `nexo:pie` en los artículos, con menú móvil y enlace a `/contadores/` |
| — | Página 404 propia | `404.html` en la raíz |
| 11 | Tablas y listas | estilos `.prose table` + `.tabla-scroll` en `assets/site.css`; ejemplo en `_plantilla.html` |
| 12 | FAQ visible | campo `faq` → bloque `nexo:faq`; la portada ya tenía la suya |
| 13 | Schema de FAQ | `FAQPage` generado del mismo campo `faq` (visible y schema nunca se desincronizan) |
| 14 | Nombres de imagen descriptivos | portadas en `assets/og/<slug>.png` |
| 15 | Alt text en imágenes | portadas y logo; el hub usa el título del artículo como alt |
| 16 | Schema de negocio local | `ProfessionalService` + `AccountingService` + `LegalService` en `index.html` (dirección, mapa, `contactPoint`, horario, servicios con `url`); mismo `@id` en `contadores/` |
| — | Schema del software | `SoftwareApplication` con un solo `@id` (`/#nexo-contabilidad`) en `plataforma.html` y `precios.html`, con `offers.price` y `priceCurrency`. No tiene `aggregateRating`: no se inventan reseñas, así que Google no mostrará la ficha enriquecida hasta que existan reseñas reales |
| 17 | robots.txt | `robots.txt`, con permiso explícito a los rastreadores de IA |
| 18 | URLs sin números ni conectores | los slugs se validan en `scripts/articulos.mjs` |
| 19 | Desindexar lo que no debe rankear | `/labs` redirige con 308 a `/plataforma.html` (`vercel.json`); `labs/index.html` queda de respaldo con `noindex` |
| — | Un solo dominio | `vercel.json` redirige `nexoemp-website.vercel.app` a `nexoemp.com` |
| — | Una sola URL de portada | todos los enlaces van a `/` o `/#ancla`; `vercel.json` redirige `/index.html` (y los `index.html` de `analisis/` y `contadores/`) con 308; CI falla si vuelve a aparecer un enlace a `index.html` |
| — | Portada igual para todos | sin detección por país: Google y el visitante ven la versión Honduras; los botones «Ya opera en Honduras / Va a llegar a Honduras» cambian solo el encabezado y no reordenan secciones |
| — | No publicar archivos internos | `.vercelignore` (guías `.md`, `scripts/`, `.github/`, plantilla, `articles.js`); CI falla si falta una entrada |
| — | Medición de conversiones | `assets/analytics.js`: evento `whatsapp_click` (parámetros `pagina`, `bloque`, `enlace`) en todo enlace a `wa.me/<número>` y en el botón de WhatsApp del formulario; `contacto_enviado` al cargar `gracias.html`, destino del formulario. Van a GA4 y a Vercel Analytics |
| — | Caché y peso de imágenes | `vercel.json`: `/assets/` 1 hora y `/assets/og/` 1 día, con `must-revalidate` (los nombres no cambian entre versiones); las tarjetas usan miniaturas `.webp` de 600 px, el PNG queda para `og:image` |
| 20 | llms.txt | `llms.txt` en la raíz: qué hace la firma, páginas y artículos, con nota de atribución |
| 21 | CTA fijo en móvil | bloque `nexo:cta-movil` en artículos; barra propia en portada, plataforma y hub |
| 22 | Botón para compartir | bloque `nexo:compartir` (WhatsApp, LinkedIn, Facebook, copiar enlace) |
| 25 | Sitemap | `sitemap.xml`; el generador agrega cada artículo nuevo y CI verifica que no falte ninguno |
| — | Migas de pan | `BreadcrumbList` en cada artículo (Inicio → Análisis → artículo) |
| — | Schema de artículo | `Article` generado en `nexo:schema`, enlazado al negocio por `@id`; `dateModified` sale del campo opcional `updated` |

## Pendiente — requiere una cuenta, no código

Estos tres puntos no se pueden cerrar desde el repo porque dependen de datos
que solo se obtienen iniciando sesión en Google.

**23. Google Analytics 4.** Hecho (10 nov 2026): ID de medición `G-2ZQZV6K84S`
en `assets/analytics.js`. Vercel Web Analytics también carga desde ese archivo.

**24. Google Search Console.** Hecho (10 nov 2026): propiedad de dominio `nexoemp.com` verificada por el proveedor de dominio. Pasos originales, por si hubiera que repetirlos:

1. Entrá a [search.google.com/search-console](https://search.google.com/search-console)
   y agregá la propiedad.
2. Elegí la verificación por **etiqueta HTML**; Google devuelve una línea
   `<meta name="google-site-verification" content="…"/>`.
3. Pegala en el `<head>` de `index.html`, junto a las otras `<meta>`, y subila.
4. Volvé a Search Console y pulsá Verificar.

**26. Enviar el sitemap en Search Console.** Hecho (10 nov 2026): `https://nexoemp.com/sitemap.xml`, estado Correcto. Pasos:
Search Console → Sitemaps → escribir `sitemap.xml` → Enviar.

**27. Marcar las conversiones en GA4.** Probado el 27 nov 2026 desde un
celular: `whatsapp_click` llega desde los botones y desde el formulario.
El formulario por correo **no estaba activado en FormSubmit** (mostraba
«Check Your Email» y no reenviaba nada); se activó ese día desde el correo
que FormSubmit manda a la dirección del `action`, y el correo de prueba
con los datos del formulario llegó. Si algún día cambia esa
dirección, hay que volver a activarlo y probarlo de punta a punta.

El evento de la página de gracias se llamaba `form_submit`, igual que el
que GA4 dispara solo con la medición mejorada al enviar cualquier
formulario: la prueba dio 3 `form_submit` para una sola visita a gracias.
Se renombró a `contacto_enviado`. Pasos en GA4:

1. Administrar → Visualización de datos → **Eventos clave** → Nuevo
   evento clave → `whatsapp_click` → Guardar. Repetir con
   `contacto_enviado`. **No** marcar `form_submit`: cuenta intentos,
   incluidos los que no llegan.
2. Para ver de qué bloque y página llegó cada clic, en Administrar →
   **Definiciones personalizadas** → Crear dimensión personalizada, alcance
   Evento: `bloque` (parámetro `bloque`) y `pagina` (parámetro `pagina`).
3. En Vercel → Analytics → Events aparecen los mismos eventos (Vercel solo
   los guarda en planes que incluyen eventos personalizados).

**28. Revisar la indexación en Search Console.** Revisado el 27 nov 2026:

- La portada está indexada y Google la rastreó el 26 nov, con el título
  nuevo. No necesitaba solicitud.
- `/plataforma.html` estaba «Descubierta: actualmente sin indexar» (Google
  nunca la había leído). Se solicitó su indexación, igual que la de
  `/precios.html`, `/analisis/` y seis artículos. La cuota es de unas 10
  solicitudes por día; quedaron para el día siguiente
  `como-leer-estados-financieros.html` y el resto de la lista «Descubierta».
- Google tiene muchos artículos registrados con `www.` delante. Todo indica
  que el sitio se servía con `www` hasta el 10 nov 2026, fecha en que se
  modificaron los dominios en Vercel; desde entonces `www.nexoemp.com`
  redirige a `nexoemp.com` (308). Por eso el informe de
  Páginas cuenta direcciones con `www` como «Página con redirección» o como
  indexadas, y las mismas sin `www` como «Descubierta». Google las consolida
  solo al volver a rastrearlas; no hay que cambiar nada. Revisar a mediados
  de diciembre que el informe de Rendimiento ya no muestre direcciones con
  `www`.
- «Página alternativa con etiqueta canónica adecuada» y «Página con
  redirección» son esperables y no se corrigen.

**29. Perfil de Empresa de Google.** Creado y verificado el 27 nov 2026
(Google lo verificó al instante; la cuenta ya era dueña del dominio en
Search Console). Categoría principal «Contador»; tipo «Tienda local» y
«Empresa de servicios»; chat por WhatsApp con mensaje que identifica que el
contacto viene de Google; logo cargado. Enlace del perfil:
`https://share.google/UM6vuu5ngxWufE3ne` (va en `hasMap` y `sameAs` de la
portada y en el botón de mapa de `/contadores/`).

- La dirección va sin número de oficina: Google desarmaba «Oficina No. 3» y
  mostraba una «3 Avenida NO» inexistente. El sitio sí lo conserva.
- Pendiente a mano: fotos reales (fachada primero), categorías secundarias
  («Contador público certificado», abogado, asesor fiscal), zonas de
  servicio (las ciudades de `/contadores/`), servicios personalizados (RTN,
  constitución, CAI, IHSS/RAP) y pedir reseñas a clientes reales.
- Existe otra «Asociación Nexo Empresarial» (asociacionnexoempresarial.com)
  y una inmobiliaria «Nexo Business» en San Pedro Sula: el nombre se escribe
  siempre completo, «Nexo Empresarial».

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
