/* ════════════════════════════════════════════════════════════════
   Nexo Empresarial — Índice de Análisis & Noticias
   ────────────────────────────────────────────────────────────────
   FUENTE ÚNICA de la lista de artículos. Para publicar uno nuevo:

   1. Agrega una entrada AL INICIO del arreglo de abajo (el más
      reciente va primero). El campo "slug" será el nombre del
      archivo HTML, en minúsculas y con guiones.
   2. Corre:  node scripts/nuevo-articulo.mjs
      (genera la página desde la plantilla, la portada OG, los
      bloques SEO y la entrada en sitemap.xml).
   3. Redacta el cuerpo en analisis/<slug>.html reemplazando lo
      que quedó entre [[corchetes]].

   Detalle completo en analisis/README.md. Tanto la portada
   (últimos 3) como el hub /analisis se generan automáticamente
   desde este arreglo.

   Categorías sugeridas: "Análisis legal", "Fiscal / SAR",
   "Decretos", "Contable", "Noticias", "Guía".

   ── CAMPOS ──────────────────────────────────────────────────────
   Obligatorios: slug · title · category · date · author · excerpt
   SEO (también obligatorios; los usa scripts/bloques-seo.mjs):
     metaTitle  Título para <title>/Open Graph. DEBE ser distinto
                del title (que es el H1) — sin el sufijo de marca,
                que lo agrega el generador.
     intent     Intención de búsqueda que resuelve el artículo.
                Se muestra arriba del TL;DR y orienta la redacción.
     cluster    Grupo temático para el interlinkeado automático
                ("fiscal", "formalizacion", "contable", "laboral").
     tldr       3–4 conclusiones en una frase cada una (key takeaways).
     faq        3+ preguntas frecuentes {q, a}; alimentan el bloque
                visible y el schema FAQPage de la página.
   ════════════════════════════════════════════════════════════════ */
window.NEXO_ARTICLES = [
  {
    slug: "comerciante-individual-vs-sociedad",
    title: "Comerciante individual o sociedad mercantil: cuál conviene en Honduras",
    metaTitle: "Comerciante individual vs. sociedad en Honduras: cuál conviene",
    category: "Guía",
    date: "2026-07-01",
    author: "Nexo Empresarial",
    cluster: "formalizacion",
    intent: "Entender qué figura jurídica conviene para un negocio en Honduras antes de formalizarlo.",
    excerpt: "Guía práctica para dueños de MIPYME en Honduras: diferencias entre comerciante individual y sociedad mercantil, riesgo patrimonial, impuestos y cuándo dar el salto.",
    tldr: [
      "Como comerciante individual respondés por las deudas del negocio con todo tu patrimonio personal; en una sociedad, la responsabilidad se limita en principio al capital aportado.",
      "La sociedad mercantil crea una persona jurídica nueva, con RTN y patrimonio propios, separada de sus socios.",
      "La limitación de responsabilidad no es absoluta: las garantías personales, las deudas tributarias y el fraude pueden alcanzar tu patrimonio.",
      "El comerciante individual es más barato y simple para arrancar; la sociedad conviene cuando hay socios, activos que proteger o intención de crecer."
    ],
    faq: [
      {
        q: "¿Qué diferencia hay entre un comerciante individual y una sociedad mercantil en Honduras?",
        a: "El comerciante individual es una persona natural que ejerce el comercio a su nombre: el negocio y la persona son la misma entidad ante la ley y ante el fisco. La sociedad mercantil (S. de R.L. o S.A.) crea una persona jurídica nueva, con su propio patrimonio y su propio RTN, distinta de sus dueños."
      },
      {
        q: "¿Una sociedad protege mi casa y mis bienes personales?",
        a: "En principio sí: en una sociedad de responsabilidad limitada o anónima la responsabilidad de cada socio se limita a lo que aportó al capital. Pero no es un escudo absoluto: las garantías personales que firmés ante un banco, las deudas tributarias y ciertas conductas de fraude o mala fe pueden alcanzar tu patrimonio personal."
      },
      {
        q: "¿Cuándo conviene pasar de comerciante individual a sociedad?",
        a: "Cuando el negocio acumula activos o deudas que no querés arriesgar a título personal, cuando entran socios, cuando necesitás contratar con empresas o con el Estado que exigen persona jurídica, o cuando el volumen justifica la contabilidad formal y la planificación fiscal que permite una sociedad."
      }
    ]
  },
  {
    slug: "obligaciones-laborales-empleador-honduras",
    title: "Obligaciones laborales del empleador en Honduras: el costo real de contratar en regla",
    metaTitle: "Obligaciones laborales en Honduras: IHSS, RAP, INFOP e ISR",
    category: "Laboral",
    date: "2026-06-27",
    author: "Nexo Empresarial",
    cluster: "laboral",
    intent: "Saber qué debe pagar y registrar un empleador hondureño por cada trabajador contratado.",
    excerpt: "IHSS, RAP, INFOP, retención del ISR y prestaciones básicas: una guía clara para que tu MIPYME contrate en regla y calcule el costo verdadero de cada empleado.",
    tldr: [
      "Antes de pagar el primer salario, la empresa debe inscribirse como patrono ante IHSS, RAP e INFOP, y dar de alta a cada trabajador desde su día uno.",
      "El IHSS y el RAP son aportes compartidos entre patrono y empleado; el INFOP es exclusivamente patronal.",
      "El empleador también retiene el ISR del trabajador cuando su salario anual supera el monto exento.",
      "El costo real de un puesto es el salario más las cuotas patronales y las prestaciones: presupuestar solo el sueldo es el error más caro."
    ],
    faq: [
      {
        q: "¿Ante qué instituciones debe inscribirse un empleador en Honduras?",
        a: "Como mínimo ante el IHSS (seguridad social), el RAP (Régimen de Aportaciones Privadas) y el INFOP (formación profesional), además de cumplir con las obligaciones tributarias ante el SAR como agente de retención del ISR de sus trabajadores."
      },
      {
        q: "¿Cuánto cuesta realmente contratar a un empleado?",
        a: "El costo va más allá del salario: incluye la cuota patronal del IHSS y del RAP, el aporte al INFOP y las prestaciones laborales que fija la ley. Por eso conviene calcular el costo total del puesto antes de ofrecer un sueldo, no después."
      },
      {
        q: "¿Qué pasa si registro tarde a un trabajador ante el IHSS?",
        a: "Registrar tarde genera contingencias y posibles recargos, y deja al trabajador sin cobertura durante ese período. La afiliación debe hacerse al momento del ingreso, no cuando la empresa se acomode."
      }
    ]
  },
  {
    slug: "multas-comunes-sar-como-evitarlas",
    title: "Multas más comunes del SAR y cómo evitarlas en su MIPYME",
    metaTitle: "Multas del SAR en Honduras: las 4 más comunes y cómo evitarlas",
    category: "Fiscal / SAR",
    date: "2026-06-25",
    author: "Nexo Empresarial",
    cluster: "fiscal",
    intent: "Identificar por qué sanciona el SAR a una MIPYME y qué rutina previene cada multa.",
    excerpt: "Las sanciones del SAR rara vez llegan por sorpresa: casi siempre nacen de descuidos evitables. Le explicamos las cuatro más frecuentes y cómo blindar su negocio.",
    tldr: [
      "Casi todas las sanciones del SAR se originan en fechas incumplidas o en documentos vencidos, no en cálculos complejos.",
      "Declarar fuera de plazo es la causa más común; en muchos casos hay que presentar aunque el mes no haya tenido operaciones.",
      "Retener y no enterar es la falta que el SAR trata con mayor severidad: el dinero retenido no es capital de trabajo.",
      "Un calendario fiscal con recordatorios anticipados y una revisión mensual previenen la enorme mayoría de las multas."
    ],
    faq: [
      {
        q: "¿Cuál es la multa más frecuente del SAR?",
        a: "Presentar las declaraciones fuera de plazo. Aplica a prácticamente toda obligación periódica —ISV mensual, retenciones, declaración anual del ISR— y los recargos e intereses moratorios crecen mientras más tiempo pase."
      },
      {
        q: "Si mi negocio no tuvo ventas en el mes, ¿igual debo declarar?",
        a: "En muchos casos sí, aun en cero, según el régimen en el que esté inscrito. Omitir la declaración porque «no hubo ventas» es un error frecuente que termina en multa. Confirme con su contador si su obligación exige declarar sin movimiento."
      },
      {
        q: "¿Qué pasa si retengo impuestos y no los entero al SAR?",
        a: "Es una de las faltas sancionadas con mayor severidad, porque implica haber administrado dinero público. La prevención es de disciplina financiera: separe lo retenido en cuanto lo retiene y trátelo como intocable hasta enterarlo dentro del plazo."
      },
      {
        q: "¿Puedo seguir facturando con un CAI vencido?",
        a: "No. El CAI tiene una fecha límite de emisión y un rango de numeración autorizados; emitir fuera de esa autorización invalida el documento y expone al negocio a sanciones. Renueve la autorización antes de agotar el rango o la fecha."
      }
    ]
  },
  {
    slug: "libros-contables-obligatorios-honduras",
    title: "Libros contables obligatorios en Honduras: qué exige la ley y por qué te protegen",
    metaTitle: "Libros contables obligatorios en Honduras: qué exige la ley",
    category: "Contable",
    date: "2026-06-23",
    author: "Nexo Empresarial",
    cluster: "contable",
    intent: "Saber qué libros y registros contables debe llevar una empresa hondureña y por qué.",
    excerpt: "Los libros y registros contables no son un trámite: son la memoria legal de tu empresa. Te explicamos para qué sirven, qué pide la ley a grandes rasgos y cómo llevarlos bien blinda al dueño.",
    tldr: [
      "En Honduras la obligación de llevar contabilidad nace de la condición de comerciante: si tenés empresa formal, llevar libros no es opcional.",
      "Los registros que típicamente se esperan son el Libro Diario, el Libro Mayor, el de Inventarios y Balances, los libros de actas y los registros fiscales del ISV.",
      "Los libros son la voz de tu empresa ante el fisco, un banco o un juez: completos hablan a tu favor, incompletos se interpretan en tu contra.",
      "Además de cumplir, una contabilidad bien llevada sustenta deducciones, habilita crédito bancario y demuestra el valor de la empresa."
    ],
    faq: [
      {
        q: "¿Qué libros contables son obligatorios en Honduras?",
        a: "A grandes rasgos, el Libro Diario (registro cronológico), el Libro Mayor (agrupado por cuenta), el Libro de Inventarios y Balances, los libros de actas en el caso de sociedades y los registros fiscales del ISV según el régimen. El detalle exacto depende del tipo de empresa y su régimen."
      },
      {
        q: "¿Una hoja de cálculo cuenta como contabilidad formal?",
        a: "No por sí sola. Los libros contables son la versión oficial de la vida económica del negocio y deben llevarse de forma ordenada y sustentada con la documentación de respaldo. Una hoja improvisada, sin respaldo ni continuidad, no cumple ese papel."
      },
      {
        q: "¿Cuánto tiempo debo conservar las facturas y comprobantes?",
        a: "La normativa fija un plazo de conservación para la documentación de respaldo —facturas, comprobantes, contratos—. Como los requisitos varían según el tipo de empresa y su régimen, conviene confirmar el plazo vigente con su contador antes de descartar cualquier documento."
      }
    ]
  },
  {
    slug: "como-leer-estados-financieros",
    title: "Cómo leer tus estados financieros: guía para dueños de negocio",
    metaTitle: "Cómo leer estados financieros: balance, resultados y flujo",
    category: "Financiero",
    date: "2026-06-17",
    author: "Nexo Empresarial",
    cluster: "contable",
    intent: "Interpretar los reportes contables que recibe el dueño de un negocio, sin tecnicismos.",
    excerpt: "Aprende a interpretar el balance general, el estado de resultados y el flujo de efectivo sin tecnicismos, y descubre qué mirar en cada uno para tomar mejores decisiones.",
    tldr: [
      "El balance general es la foto del negocio en una fecha: activos, pasivos y patrimonio, siempre en equilibrio (Activos = Pasivos + Patrimonio).",
      "El estado de resultados cubre un período y responde si hubo utilidad: vender mucho no significa ganar mucho.",
      "El flujo de efectivo muestra el dinero que realmente entra y sale, y es el reporte más ignorado y más decisivo.",
      "La señal de liquidez más simple: comparar los activos corrientes contra los pasivos de corto plazo."
    ],
    faq: [
      {
        q: "¿Cuál es la diferencia entre el balance general y el estado de resultados?",
        a: "El balance general es una fotografía en una fecha específica: qué posee, qué debe y cuánto vale realmente la empresa. El estado de resultados cubre un período (mes, trimestre, año) y muestra si en ese lapso el negocio dio utilidad o pérdida."
      },
      {
        q: "¿Por qué mi negocio vende bien pero no tengo efectivo?",
        a: "Porque la utilidad y el efectivo no son lo mismo. Las ventas a crédito se registran como ingreso aunque el dinero no haya entrado, y el inventario o los pagos de deuda consumen caja sin aparecer como gasto. Por eso el estado de flujo de efectivo es el que explica esa diferencia."
      },
      {
        q: "¿Cómo sé si mi empresa tiene liquidez?",
        a: "Compará los activos corrientes —efectivo, cuentas por cobrar, inventario— contra los pasivos de corto plazo. Si lo que podés convertir en efectivo pronto supera con holgura lo que tenés que pagar pronto, hay liquidez; si no, hay una señal de alerta."
      }
    ]
  },
  {
    slug: "factura-electronica-honduras-que-viene",
    title: "Factura electrónica en Honduras: qué viene y cómo preparar su MIPYME",
    metaTitle: "Factura electrónica en Honduras: cómo prepararse desde hoy",
    category: "Fiscal / SAR",
    date: "2026-06-13",
    author: "Nexo Empresarial",
    cluster: "fiscal",
    intent: "Anticipar el cambio hacia la facturación electrónica y saber qué ordenar desde ahora.",
    excerpt: "El régimen de facturación en Honduras avanza hacia lo electrónico. Le explicamos qué significa para su MIPYME y cómo ordenar su facturación desde hoy.",
    tldr: [
      "La tendencia regional —y hondureña— es clara: menos papel, más control en línea y trazabilidad de cada documento emitido.",
      "La factura electrónica no es solo un archivo digital: cambia la forma de registrar, numerar y reportar las ventas.",
      "Los cimientos no cambian: CAI vigente, rangos autorizados y numeración continua sin huecos.",
      "Quien hoy factura ordenado ya tiene medio camino andado; prepararse temprano cuesta menos que correr a última hora."
    ],
    faq: [
      {
        q: "¿Ya es obligatoria la factura electrónica en Honduras?",
        a: "El régimen de facturación lo administra el SAR y la dirección de mediano plazo apunta a esquemas electrónicos, pero eso no significa que la factura actual desaparezca mañana. Conviene verificar siempre el estado y las obligaciones vigentes directamente ante el SAR."
      },
      {
        q: "¿Qué gana una MIPYME al pasar a facturación electrónica?",
        a: "Menos papel y archivo físico, menos errores de numeración porque el sistema controla los rangos, reportes de ventas listos para la contabilidad y las declaraciones, y mejor imagen ante clientes y proveedores."
      },
      {
        q: "¿Qué debo ordenar hoy para estar listo?",
        a: "Mantener el CAI vigente, respetar los rangos autorizados, conservar una numeración continua sin saltos ni duplicados, y migrar de talonarios manuales a un sistema de facturación conforme. Esos hábitos sirven bajo cualquier esquema futuro."
      }
    ]
  },
  {
    slug: "impuestos-empresa-honduras-isv-isr-retenciones",
    title: "Impuestos de una empresa en Honduras: ISV, ISR y retenciones explicados",
    metaTitle: "Impuestos de una empresa en Honduras: ISV, ISR y retenciones",
    category: "Fiscal / SAR",
    date: "2026-06-20",
    author: "Nexo Empresarial",
    cluster: "fiscal",
    intent: "Conocer qué impuestos paga una empresa hondureña y con qué lógica se calcula cada uno.",
    excerpt: "El mapa básico de la carga tributaria de una empresa en Honduras: ISV, ISR, aportación solidaria, impuesto al activo neto, pagos a cuenta y retenciones — en lenguaje claro.",
    tldr: [
      "El ISV es el impuesto al consumo (15% general y 18% para ciertos bienes): lo cobrás al cliente y lo administrás para el Estado, no es ingreso tuyo.",
      "El ISR grava la utilidad —25% sobre la renta neta gravable de las sociedades— más la aportación solidaria del 5% sobre el exceso que fija la ley.",
      "Los pagos a cuenta anticipan el ISR durante el año y el impuesto al activo neto (1%) funciona como piso acreditable.",
      "Cuando tu empresa está obligada a retener y no lo hace, la responsabilidad recae sobre ella, no sobre el proveedor."
    ],
    faq: [
      {
        q: "¿Cuánto es el ISV en Honduras?",
        a: "La tasa general del Impuesto Sobre Ventas es del 15%, con una tasa mayor del 18% para ciertos bienes específicos. La empresa lo cobra al cliente en cada venta gravada y lo entera al SAR, restando el ISV pagado en sus compras como crédito fiscal."
      },
      {
        q: "¿Cuál es la tasa del ISR para una sociedad?",
        a: "Para las sociedades, la tasa es del 25% sobre la renta neta gravable, y adicionalmente aplica una aportación solidaria del 5% sobre el exceso de renta neta gravable por encima del umbral que fija la ley. La declaración es anual y se anticipa con pagos a cuenta."
      },
      {
        q: "¿Qué son los pagos a cuenta?",
        a: "Son anticipos periódicos del ISR que exige el SAR, calculados sobre el impuesto del año anterior. Se acreditan contra la declaración anual; ignorarlos genera recargos."
      },
      {
        q: "¿Por qué dos empresas que facturan igual pagan impuestos distintos?",
        a: "Porque la carga depende de cómo esté estructurada cada empresa y de qué gastos pueda deducir legalmente. Ahí está la diferencia entre pagar de más por desorden y optimizar dentro de la ley: no es evadir, es planificar."
      }
    ]
  },
  {
    slug: "que-es-el-rtn-y-como-obtenerlo-sar",
    title: "Qué es el RTN y cómo obtenerlo ante el SAR",
    metaTitle: "RTN en Honduras: qué es, para qué sirve y cómo obtenerlo",
    category: "Guía",
    date: "2026-06-10",
    author: "Nexo Empresarial",
    cluster: "formalizacion",
    intent: "Obtener el Registro Tributario Nacional y entender qué obligaciones activa tenerlo.",
    excerpt: "El primer documento fiscal que necesita cualquier persona o empresa para operar formalmente en Honduras. Qué es, para qué sirve y cómo se obtiene.",
    tldr: [
      "El RTN es el número de identificación tributaria que asigna el SAR: la identidad fiscal con la que se declara, se paga y se factura.",
      "El RTN de una sociedad es propio y distinto al de sus socios; mezclarlos genera desorden fiscal y riesgo.",
      "En una sociedad el RTN es un eslabón de la ruta de formalización: primero la inscripción mercantil, después el RTN, luego la autorización para facturar.",
      "Tener RTN activa obligaciones: según el régimen hay que declarar aunque no haya movimiento."
    ],
    faq: [
      {
        q: "¿Qué es el RTN y para qué sirve?",
        a: "El Registro Tributario Nacional es el número de identificación tributaria que asigna el Servicio de Administración de Rentas. Sirve para emitir facturas y documentos fiscales autorizados, presentar declaraciones y pagar impuestos, abrir cuentas bancarias empresariales, contratar con el Estado y realizar trámites en instituciones públicas."
      },
      {
        q: "¿Puedo usar mi RTN personal para facturar lo de mi empresa?",
        a: "No conviene. Una sociedad mercantil obtiene un RTN propio, distinto al de sus socios, una vez inscrita en el Registro Mercantil. Facturar lo del negocio a título personal mezcla dos identidades fiscales separadas y genera desorden y riesgos."
      },
      {
        q: "¿Qué pasa si tengo RTN pero mi negocio no está operando?",
        a: "Tener RTN activa obligaciones: según el régimen, hay que presentar declaraciones periódicas aunque no haya movimiento. Un RTN «olvidado» acumula omisiones y multas, así que conviene llevar el control de vencimientos desde que se obtiene."
      }
    ]
  },
  {
    slug: "facturacion-conforme-sar-honduras",
    title: "Facturación conforme al SAR: qué debe tener una factura legal en Honduras",
    metaTitle: "Factura legal en Honduras: requisitos del SAR y errores comunes",
    category: "Fiscal / SAR",
    date: "2026-06-02",
    author: "Nexo Empresarial",
    cluster: "fiscal",
    intent: "Verificar que las facturas del negocio cumplan los requisitos del SAR antes de emitirlas.",
    excerpt: "CAI, RTN, rango de numeración y fecha límite: los elementos que hacen válida una factura — y los errores que más rápido generan multas del SAR.",
    tldr: [
      "Una factura válida lleva datos y RTN del emisor, CAI vigente, rango y correlativo autorizados, fecha límite de emisión, datos del cliente cuando corresponde e ISV desglosado.",
      "El CAI y el rango no son adorno: son lo que hace que el documento exista para el SAR.",
      "Los errores más caros son el CAI vencido, emitir fuera de rango, repetir correlativos y no desglosar el ISV.",
      "Una factura correcta protege dos veces: a vos frente al SAR y a tu cliente, que la necesita para deducir su gasto."
    ],
    faq: [
      {
        q: "¿Qué datos debe llevar una factura en Honduras?",
        a: "Nombre o razón social y RTN del emisor, el CAI vigente, el rango de numeración autorizado con su número correlativo, la fecha límite de emisión, los datos del cliente cuando corresponde y el detalle de bienes o servicios con el ISV desglosado."
      },
      {
        q: "¿Un recibo o un ticket sirve como factura?",
        a: "No, si no es un documento fiscal autorizado. Entregar comprobantes que no cumplen los requisitos del SAR es uno de los errores frecuentes: el documento no es válido para el fisco ni le sirve al cliente para deducir su gasto."
      },
      {
        q: "¿Qué pasa si emito una factura fuera del rango autorizado?",
        a: "El documento queda inválido. Emitir sin autorización vigente, fuera del rango o después de la fecha límite invalida el comprobante y expone al negocio a sanciones. Por eso conviene renovar la autorización antes de agotar el rango."
      }
    ]
  },
  {
    slug: "constituir-sociedad-honduras-ruta-formalizacion",
    title: "Constituir una sociedad en Honduras: la ruta completa de formalización",
    metaTitle: "Constituir una sociedad en Honduras: pasos y orden correcto",
    category: "Guía",
    date: "2026-05-28",
    author: "Nexo Empresarial",
    cluster: "formalizacion",
    intent: "Conocer el orden correcto de los trámites para constituir y formalizar una empresa en Honduras.",
    excerpt: "Del pacto social a la operación legal: el orden correcto de inscripciones ante el Instituto de la Propiedad, el SAR, IHSS, RAP, INFOP y la municipalidad — y los errores que más cuestan después.",
    tldr: [
      "La escritura de constitución es el punto de partida, no la meta: la sociedad existe plenamente cuando se inscribe en el Registro Mercantil del Instituto de la Propiedad.",
      "El orden importa: inscripción mercantil, RTN ante el SAR, autorización de facturación, inscripciones laborales y permiso de operación municipal.",
      "Las decisiones del pacto social —tipo de sociedad, capital, facultades— son caras de cambiar después: conviene diseñarlas pensando en el crecimiento.",
      "Las obligaciones laborales corren desde la primera contratación, no cuando la empresa se acomode."
    ],
    faq: [
      {
        q: "¿Cuáles son los pasos para constituir una sociedad en Honduras?",
        a: "En orden: escritura pública de constitución ante notario e inscripción en el Registro Mercantil del Instituto de la Propiedad; RTN ante el SAR; autorización de facturación; inscripciones laborales ante IHSS, RAP e INFOP cuando haya personal; y permiso de operación municipal."
      },
      {
        q: "¿Mi empresa ya existe cuando el abogado me entrega la escritura?",
        a: "No del todo. La escritura define el tipo societario, el capital, los socios y la administración, pero hasta que la sociedad no está inscrita en el Registro Mercantil no tiene existencia legal plena frente a terceros."
      },
      {
        q: "¿Qué pasa si me salto un paso de la formalización?",
        a: "Cada paso depende del anterior: sin inscripción mercantil no hay RTN de la sociedad, y sin RTN no hay autorización para facturar. Saltarse o desordenar pasos genera multas, bloquea operaciones y expone al dueño justo cuando el negocio empieza a crecer."
      }
    ]
  },
  {
    slug: "contador-externo-o-departamento-contable",
    title: "¿Contador externo o departamento contable? Qué le conviene a tu empresa",
    metaTitle: "Contador externo o interno: cuál conviene a tu empresa",
    category: "Contable",
    date: "2026-05-20",
    author: "Nexo Empresarial",
    cluster: "contable",
    intent: "Decidir entre tercerizar la contabilidad o montar un equipo contable interno.",
    excerpt: "Costos, control y escala: cuándo conviene tercerizar la contabilidad, cuándo montar un equipo interno y por qué el modelo híbrido suele ganar.",
    tldr: [
      "El contador externo conviene cuando el volumen no justifica un salario de tiempo completo y se quiere pagar por resultado, con respaldo de equipo.",
      "El departamento interno tiene sentido con alto volumen diario, necesidad de información en tiempo real y tamaño para absorber salarios y supervisión.",
      "El costo de lo interno no es solo el salario: son cargas laborales, prestaciones, espacio, software, supervisión y la dependencia de una sola persona.",
      "La pregunta correcta no es «cuál», sino qué querés que haga la contabilidad; el modelo híbrido suele dar el mejor punto."
    ],
    faq: [
      {
        q: "¿Cuándo conviene tercerizar la contabilidad?",
        a: "Cuando la operación es pequeña o mediana y no justifica un salario de tiempo completo, cuando se prefiere pagar por resultado en lugar de por presencia, y cuando se valora tener detrás un equipo con visión fiscal y legal en lugar de depender de una sola persona."
      },
      {
        q: "¿Es más barato tener un contador de planta?",
        a: "No necesariamente. Al salario hay que sumarle cargas laborales (IHSS, RAP, INFOP), prestaciones, espacio, software, supervisión y el riesgo de depender de una sola persona que puede renunciar o enfermarse. Muchas veces el «empleado barato» resulta más caro que la firma."
      },
      {
        q: "¿En qué consiste el modelo híbrido?",
        a: "Personal interno para la captura diaria —facturación, caja, planilla— y una firma externa que dirige, revisa, arma los estados financieros y aporta la visión fiscal y estratégica. Es donde un buen sistema de información multiplica el valor de ambas partes."
      }
    ]
  },
  {
    slug: "cierre-fiscal-honduras-7-puntos-clave",
    title: "Cierre fiscal en Honduras: 7 puntos que revisar antes de cerrar el período",
    metaTitle: "Cierre fiscal en Honduras: checklist antes de cerrar el período",
    category: "Fiscal / SAR",
    date: "2026-04-15",
    author: "Nexo Empresarial",
    cluster: "fiscal",
    intent: "Revisar la contabilidad antes del cierre del ejercicio para evitar ajustes y observaciones del SAR.",
    excerpt: "El cierre no empieza en diciembre. Una revisión ordenada de conciliaciones, gastos no deducibles, retenciones e inventarios evita ajustes, multas y sorpresas frente al SAR.",
    tldr: [
      "Un cierre ordenado se construye durante todo el ejercicio, no en las últimas semanas.",
      "Conciliaciones bancarias al día, gastos deducibles separados de los que no lo son y retenciones enteradas son los tres pilares de la revisión.",
      "El inventario físico cotejado contra libros es lo que más distorsiona el costo de venta y la utilidad gravable.",
      "Activos fijos bien capitalizados y cuentas por cobrar y pagar depuradas evitan ajustes en una fiscalización."
    ],
    faq: [
      {
        q: "¿Cuándo debo empezar a preparar el cierre fiscal?",
        a: "Durante todo el ejercicio. El cierre no es un evento de diciembre: conciliar mes a mes, documentar gastos y enterar retenciones a tiempo es lo que evita que el cierre se convierta en una urgencia de último momento."
      },
      {
        q: "¿Qué gastos no son deducibles?",
        a: "No todo lo que la empresa paga reduce el impuesto. Los gastos personales mezclados con los del negocio, los comprobantes que no cumplen requisitos y los pagos sin documento de respaldo no son deducibles, y registrarlos como tales genera un ajuste casi seguro."
      },
      {
        q: "¿Por qué es tan importante el inventario en el cierre?",
        a: "Porque es uno de los rubros que más distorsiona el resultado. Un conteo físico al cierre, cotejado contra el saldo contable, revela mermas, faltantes y errores de registro que afectan directamente el costo de venta y la utilidad gravable."
      }
    ]
  }
];
