/* ════════════════════════════════════════════════════════════════
   Nexo Empresarial — Índice de Análisis & Noticias
   ────────────────────────────────────────────────────────────────
   FUENTE ÚNICA de la lista de artículos. Para publicar uno nuevo:

   1. Agrega una entrada AL INICIO del arreglo de abajo (el más
      reciente va primero). El campo "slug" será el nombre del
      archivo HTML, en minúsculas y con guiones.
   2. Corre:  node scripts/nuevo-articulo.mjs
      (genera la página desde la plantilla, la portada OG y la
      entrada en sitemap.xml).
   3. Redacta el cuerpo en analisis/<slug>.html reemplazando lo
      que quedó entre [[corchetes]].

   Detalle completo en analisis/README.md. Tanto la portada
   (últimos 3) como el hub /analisis se generan automáticamente
   desde este arreglo.

   Categorías sugeridas: "Análisis legal", "Fiscal / SAR",
   "Decretos", "Contable", "Noticias", "Guía".
   ════════════════════════════════════════════════════════════════ */
window.NEXO_ARTICLES = [
  {
    slug: "comerciante-individual-vs-sociedad",
    title: "Comerciante individual o sociedad mercantil: cuál conviene en Honduras",
    category: "Guía",
    date: "2026-07-01",
    author: "Nexo Empresarial",
    excerpt: "Guía práctica para dueños de MIPYME en Honduras: diferencias entre comerciante individual y sociedad mercantil, riesgo patrimonial, impuestos y cuándo dar el salto."
  },
  {
    slug: "obligaciones-laborales-empleador-honduras",
    title: "Obligaciones laborales del empleador en Honduras: el costo real de contratar en regla",
    category: "Laboral",
    date: "2026-06-27",
    author: "Nexo Empresarial",
    excerpt: "IHSS, RAP, INFOP, retención del ISR y prestaciones básicas: una guía clara para que tu MIPYME contrate en regla y calcule el costo verdadero de cada empleado."
  },
  {
    slug: "multas-comunes-sar-como-evitarlas",
    title: "Multas más comunes del SAR y cómo evitarlas en su MIPYME",
    category: "Fiscal / SAR",
    date: "2026-06-25",
    author: "Nexo Empresarial",
    excerpt: "Las sanciones del SAR rara vez llegan por sorpresa: casi siempre nacen de descuidos evitables. Le explicamos las cuatro más frecuentes y cómo blindar su negocio."
  },
  {
    slug: "libros-contables-obligatorios-honduras",
    title: "Libros contables obligatorios en Honduras: qué exige la ley y por qué te protegen",
    category: "Contable",
    date: "2026-06-23",
    author: "Nexo Empresarial",
    excerpt: "Los libros y registros contables no son un trámite: son la memoria legal de tu empresa. Te explicamos para qué sirven, qué pide la ley a grandes rasgos y cómo llevarlos bien blinda al dueño."
  },
  {
    slug: "como-leer-estados-financieros",
    title: "Cómo leer tus estados financieros: guía para dueños de negocio",
    category: "Financiero",
    date: "2026-06-17",
    author: "Nexo Empresarial",
    excerpt: "Aprende a interpretar el balance general, el estado de resultados y el flujo de efectivo sin tecnicismos, y descubre qué mirar en cada uno para tomar mejores decisiones."
  },
  {
    slug: "factura-electronica-honduras-que-viene",
    title: "Factura electrónica en Honduras: qué viene y cómo preparar su MIPYME",
    category: "Fiscal / SAR",
    date: "2026-06-13",
    author: "Nexo Empresarial",
    excerpt: "El régimen de facturación en Honduras avanza hacia lo electrónico. Le explicamos qué significa para su MIPYME y cómo ordenar su facturación desde hoy."
  },
  {
    slug: "impuestos-empresa-honduras-isv-isr-retenciones",
    title: "Impuestos de una empresa en Honduras: ISV, ISR y retenciones explicados",
    category: "Fiscal / SAR",
    date: "2026-06-20",
    author: "Nexo Empresarial",
    excerpt: "El mapa básico de la carga tributaria de una empresa en Honduras: ISV, ISR, aportación solidaria, impuesto al activo neto, pagos a cuenta y retenciones — en lenguaje claro."
  },
  {
    slug: "que-es-el-rtn-y-como-obtenerlo-sar",
    title: "Qué es el RTN y cómo obtenerlo ante el SAR",
    category: "Guía",
    date: "2026-06-10",
    author: "Nexo Empresarial",
    excerpt: "El primer documento fiscal que necesita cualquier persona o empresa para operar formalmente en Honduras. Qué es, para qué sirve y cómo se obtiene."
  },
  {
    slug: "facturacion-conforme-sar-honduras",
    title: "Facturación conforme al SAR: qué debe tener una factura legal en Honduras",
    category: "Fiscal / SAR",
    date: "2026-06-02",
    author: "Nexo Empresarial",
    excerpt: "CAI, RTN, rango de numeración y fecha límite: los elementos que hacen válida una factura — y los errores que más rápido generan multas del SAR."
  },
  {
    slug: "constituir-sociedad-honduras-ruta-formalizacion",
    title: "Constituir una sociedad en Honduras: la ruta completa de formalización",
    category: "Guía",
    date: "2026-05-28",
    author: "Nexo Empresarial",
    excerpt: "Del pacto social a la operación legal: el orden correcto de inscripciones ante el Instituto de la Propiedad, el SAR, IHSS, RAP, INFOP y la municipalidad — y los errores que más cuestan después."
  },
  {
    slug: "contador-externo-o-departamento-contable",
    title: "¿Contador externo o departamento contable? Qué le conviene a tu empresa",
    category: "Contable",
    date: "2026-05-20",
    author: "Nexo Empresarial",
    excerpt: "Costos, control y escala: cuándo conviene tercerizar la contabilidad, cuándo montar un equipo interno y por qué el modelo híbrido suele ganar."
  },
  {
    slug: "cierre-fiscal-honduras-7-puntos-clave",
    title: "Cierre fiscal en Honduras: 7 puntos que revisar antes de cerrar el período",
    category: "Fiscal / SAR",
    date: "2026-04-15",
    author: "Nexo Empresarial",
    excerpt: "El cierre no empieza en diciembre. Una revisión ordenada de conciliaciones, gastos no deducibles, retenciones e inventarios evita ajustes, multas y sorpresas frente al SAR."
  }
];
