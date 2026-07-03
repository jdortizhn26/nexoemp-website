# Informe de la noche — Nexo (para revisar al despertar)

Trabajé de forma autónoma como pediste. Aquí está **todo lo que hice, las
decisiones que tomé por ti, y lo que necesita tu revisión.** Nada está publicado
en producción todavía: está en la rama de preview para que lo apruebes tú.

---

## 1. Decisiones que tomé por ti (y por qué)

1. **No fusioné a producción.** Todo está en la rama `claude/nexo-news-legal-section-fbzawy`
   (preview de Vercel). Un cambio de posicionamiento de marca debe verlo un humano
   antes de ser público. **Tú decides cuándo publicar** (ver §4).
2. **No publiqué cifras internas** (TAM/SAM/SOM, precios, ARR de los documentos de
   estrategia). Eso es material interno, no de marketing. Sí usé las **cuñas de
   valor** de cada producto (factura legal local, WhatsApp, español, precio regional).
3. **Posicionamiento regional honesto.** La nueva página de Labs dice "construido
   en Honduras, diseñado para la región / expansión en marcha" — NO afirma que ya
   operamos en 6 países (sería falso y dañaría la credibilidad).
4. **Marca:** mantuve **Nexo Empresarial** (la firma, Honduras) como sitio base y
   creé **Nexo Labs** como página/unidad de producto regional. No sacrifiqué el
   negocio de servicios por el de software; los sumé. (Ver pregunta abierta en §5.)

---

## 2. Lo que quedó hecho (todo en la rama)

### Portada (`index.html`) — modernizada
- Nexo Labs ahora muestra **los 9 sistemas** en producción con íconos y cuadrícula
  moderna (Restaurant, Escuela, Inmobiliaria, Contabilidad, Préstamos, Salud,
  Legal, **Nexo Clean**, y desarrollo a medida).
- **Demos** ampliados a 6 (Contabilidad, Préstamos, Salud, Nexo Clean).
- Nueva sección **Preguntas Frecuentes** (acordeón) orientada a búsquedas.
- Tira de **sectores que atendemos**.
- **Conteo animado** en las estadísticas.
- Botón **"Conocer Nexo Labs"** hacia la nueva página.

### Nueva página **Nexo Labs** (`/labs/`)
- Landing de producto regional: hero, 3 productos punta de lanza con sus cuñas de
  valor, catálogo por vertical, "por qué Nexo", visión regional (Anillo 1) y CTA
  a demo por WhatsApp.

### Contenido / Blog (`/analisis/`)
- **6 artículos** (2 previos + 4 nuevos), cada uno con portada de marca y datos
  estructurados para Google:
  - Impuestos de una empresa (ISV/ISR/retenciones)
  - Qué es el RTN y cómo obtenerlo
  - Facturación conforme al SAR
  - Contador externo vs. departamento contable
  - Constituir una sociedad (ruta de formalización)
  - Cierre fiscal: 7 puntos clave
- Publicar uno nuevo = crear su HTML + una línea en `assets/articles.js`
  (guía en `analisis/README.md`).

### Contacto
- Formulario con **doble vía**: botón WhatsApp (principal) + correo (FormSubmit).

### SEO técnico
- Datos estructurados JSON-LD: **ProfessionalService**, **WebSite**, **FAQPage**
  (portada) y **Article** (cada artículo).
- **`sitemap.xml`** y **`robots.txt`**.
- Metas, títulos y keywords orientados a: contabilidad, legal, crear empresa,
  asesor fiscal, SAR, RTN, facturación.

### Agentes de IA (`docs/agentes/`)
- **Diseño completo** de los agentes que pediste: Ventas, Soporte, Cobranza,
  Onboarding + Router. Arquitectura, herramientas, modelo de datos CRM, guardrails,
  roadmap por fases y **prompts de sistema listos para usar**.

---

## 3. Lo que necesita acción TUYA (rápido)

1. **Activar el formulario de correo:** abre el correo de FormSubmit en
   `josue@nexoemp.com` y pulsa *"Activate Form"*. (El WhatsApp ya funciona.)
2. **Google Business Profile** (para salir "en el mapa"): ver §6. Es lo más
   importante para que te encuentren por búsquedas locales.
3. **Revisar y publicar** el sitio (§4).

---

## 4. Cómo publicar (cuando lo apruebes)

Todo está en la rama `claude/nexo-news-legal-section-fbzawy`. Para publicarlo en
`nexoemp.com`:

- **Opción fácil:** dime "fusiona a producción" y yo abro el PR y lo fusiono a
  `main` (Vercel despliega solo).
- **Tú mismo:** revisa la preview de Vercel de esa rama; si te gusta, haz merge a
  `main` desde GitHub.

> Recomendación: revisa primero la **página de Labs** y el nuevo enfoque regional,
> porque es el cambio de mensaje más grande.

---

## 5. Preguntas abiertas (para cuando puedas)

1. **Marca:** ¿Nexo Labs debe tener su **propio dominio** (ej. `nexolabs.com`) y
   sitio independiente, o se queda como `/labs/` dentro de nexoemp.com? Hoy lo dejé
   como sección; migrarlo a dominio propio es fácil cuando decidas.
2. **Autor de los artículos:** ¿"Nexo Empresarial" o tu nombre?
3. **Agentes — ¿construimos?** El diseño está listo. Para llevarlo a producción
   necesito saber: ¿tienes ya **WhatsApp Business API** (o un proveedor)? ¿Empezamos
   por **Ventas + Cobranza** (mayor ROI)? Con eso arranco la implementación.
4. **Precios públicos:** ¿quieres mostrar precios/planes en la web de Labs, o
   mantener "solicitar cotización"? (Hoy no muestro precios.)

---

## 6. Google Business Profile — cómo salir "en el mapa"

Esto es lo que hace que aparezcas cuando alguien busca *"contador en San Pedro
Sula"*, *"asesor fiscal Honduras"*, etc. El sitio web ayuda, pero **el mapa lo da
Google Business Profile** (gratis):

1. Entra a **google.com/business** con la cuenta de Google de la empresa.
2. Crea el perfil: **Nexo Empresarial**, categoría principal *"Asesor fiscal"* o
   *"Servicio de contabilidad"*, y agrega categorías secundarias (Abogado,
   Servicio de software, Asesoría empresarial).
3. Dirección (San Pedro Sula) — puedes mostrarla o solo indicar zona de servicio.
4. Teléfono **+504 3326-9814**, sitio **nexoemp.com**, horario (L–V 8:00–18:00).
5. **Verifica** el perfil (Google envía un código). Sin verificación no apareces.
6. Sube **logo y fotos**, escribe la descripción con tus servicios (contabilidad,
   legal, fiscal/SAR, crear empresa, sistemas).
7. Pide **reseñas** a tus primeros clientes: es el factor #1 del ranking local.

**Además, para el SEO orgánico:**
- Da de alta el sitio en **Google Search Console** (search.google.com/search-console),
  verifica el dominio y **envía el `sitemap.xml`** (`https://nexoemp.com/sitemap.xml`).
- Con eso Google indexa las 8 páginas (portada, Labs, hub y 6 artículos) más rápido.

---

## 7. Resumen de commits de esta noche

1. Sección de Análisis & Noticias (blog).
2. Portadas de artículos + contacto WhatsApp/correo.
3. Portada modernizada + 9 sistemas + FAQ + sectores + SEO técnico.
4. 4 artículos nuevos + datos estructurados.
5. Página regional de Nexo Labs (`/labs/`).
6. Diseño de los agentes de IA + prompts.

Todo en la rama, listo para tu revisión. Buenos días 👋
