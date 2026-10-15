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
    slug: "cuanto-se-paga-de-isr-en-honduras",
    title: "¿Cuánto se paga de ISR en Honduras? Así funciona el impuesto sobre la renta",
    metaTitle: "Cuánto se paga de ISR en Honduras: tramos y cálculo",
    category: "Fiscal / SAR",
    date: "2026-08-15",
    author: "Dirección profesional",
    cluster: "fiscal",
    intent: "Saber cuánto impuesto sobre la renta paga una persona en Honduras y cómo se calcula.",
    excerpt: "El ISR de una persona natural no se paga sobre todo lo que gana: hay un tramo exento y una escala progresiva. Te explicamos la lógica del cálculo, quién declara y quién no.",
    tldr: [
      "El ISR de las personas naturales es progresivo: hay un tramo exento y, sobre el excedente, tasas que suben por tramos (15 %, 20 % y 25 %).",
      "Nadie paga la tasa más alta sobre todo su ingreso: cada tasa se aplica solo a la porción que cae dentro de su tramo.",
      "Los montos de cada tramo los actualiza el SAR cada año, así que la tabla vigente hay que consultarla antes de calcular.",
      "Al asalariado con un solo patrono se le retiene mes a mes; quien tiene ingresos por su cuenta suele estar obligado a presentar declaración anual."
    ],
    faq: [
      {
        q: "¿Cuánto se paga de impuesto sobre la renta en Honduras?",
        a: "Depende de cuánto se gane al año. El ISR de personas naturales es progresivo: existe un tramo exento sobre el que no se paga nada y, sobre lo que excede, se aplican tasas crecientes por tramos (15 %, 20 % y 25 %). Los montos de cada tramo se actualizan cada año, por lo que conviene consultar la tabla vigente publicada por el SAR."
      },
      {
        q: "Si mi sueldo entra en el tramo del 25 %, ¿pago 25 % de todo?",
        a: "No. La escala es progresiva, no de todo o nada: el tramo exento sigue sin pagar, la porción que cae en el primer tramo gravado paga su tasa, y así sucesivamente. Solo la parte del ingreso que supera el umbral del último tramo paga la tasa más alta."
      },
      {
        q: "¿Un empleado asalariado tiene que presentar declaración de ISR?",
        a: "Como regla general, el asalariado que recibe su sueldo de un solo patrono no presenta declaración, porque el patrono ya le retiene el impuesto mes a mes y lo entera al SAR. La obligación de declarar aparece cuando hay ingresos de otras fuentes, más de un patrono o actividad por cuenta propia. Ante la duda, confirmá tu caso con un contador."
      },
      {
        q: "¿El ISR de una empresa se calcula igual que el de una persona?",
        a: "No. Las sociedades no usan la escala progresiva: tributan a una tasa fija sobre la renta neta gravable, más la aportación solidaria sobre el excedente que fija la ley. La lógica de deducciones y de pagos a cuenta también es distinta."
      }
    ]
  },
  {
    slug: "calcular-sueldo-neto-honduras",
    title: "Del sueldo bruto al neto en Honduras: qué se descuenta y por qué",
    metaTitle: "Cómo calcular el sueldo neto en Honduras: IHSS, RAP e ISR",
    category: "Laboral",
    date: "2026-08-15",
    author: "Dirección profesional",
    cluster: "laboral",
    intent: "Entender qué descuentos convierten el sueldo bruto pactado en el neto que recibe el trabajador.",
    excerpt: "IHSS, RAP y retención del ISR explican casi toda la diferencia entre lo que se pactó y lo que llega a la cuenta. Te mostramos el orden del cálculo y qué paga el patrono aparte.",
    tldr: [
      "Del sueldo bruto salen tres descuentos de ley al trabajador: su cuota del IHSS, su aporte al RAP y la retención del ISR.",
      "El IHSS y el RAP se calculan sobre bases con techo de cotización, así que un aumento de sueldo no siempre aumenta el descuento en la misma proporción.",
      "La retención del ISR se calcula sobre la base gravable, después de restar los aportes de ley y las deducciones que permite la norma.",
      "Aparte de lo que descuenta, el patrono paga su propia cuota patronal de IHSS y RAP más el aporte al INFOP: ese es el costo real del puesto."
    ],
    faq: [
      {
        q: "¿Qué descuentos de ley se le hacen a un salario en Honduras?",
        a: "Al trabajador se le descuenta su cuota del IHSS (seguridad social), su aporte al RAP y la retención del Impuesto Sobre la Renta cuando su salario supera el mínimo exento. Cualquier otro descuento —préstamos, cooperativa, embargos— requiere base legal o autorización del trabajador."
      },
      {
        q: "¿Por qué mi descuento del IHSS no sube cuando me aumentan el sueldo?",
        a: "Porque el IHSS cotiza sobre un salario base con techo: a partir de cierto monto, el descuento deja de crecer aunque el sueldo siga subiendo. Ese techo lo actualiza el IHSS periódicamente, así que conviene verificar el vigente."
      },
      {
        q: "¿El patrono paga algo además de lo que me descuenta?",
        a: "Sí, y suele ser más de lo que la gente imagina. Además de enterar lo retenido al trabajador, el patrono paga su cuota patronal del IHSS y del RAP y el aporte al INFOP. Por eso el costo de un puesto siempre es mayor que el sueldo bruto pactado."
      }
    ]
  },
  {
    slug: "decimo-tercero-y-decimo-cuarto-honduras",
    title: "Décimo tercer y décimo cuarto mes en Honduras: cómo se calculan y cuándo se pagan",
    metaTitle: "Décimo tercero y décimo cuarto en Honduras: cálculo y fechas",
    category: "Laboral",
    date: "2026-08-15",
    author: "Dirección profesional",
    cluster: "laboral",
    intent: "Calcular correctamente el décimo tercer y el décimo cuarto mes de salario y saber cuándo corresponde pagarlos.",
    excerpt: "Son dos pagos distintos, con fechas distintas, y ambos se prorratean cuando el trabajador no completó el año. La confusión entre ellos es una de las causas más frecuentes de reclamo.",
    tldr: [
      "Son dos prestaciones separadas: el décimo tercer mes se paga a fin de año y el décimo cuarto a mitad de año.",
      "Cada uno equivale a un mes de salario cuando el trabajador completó el período correspondiente.",
      "Si entró o salió a mitad del período, se paga la parte proporcional al tiempo efectivamente trabajado.",
      "No son un bono voluntario ni sustituyen al aguinaldo: son obligaciones de ley y su falta de pago genera reclamos."
    ],
    faq: [
      {
        q: "¿Cuál es la diferencia entre el décimo tercer y el décimo cuarto mes?",
        a: "Son dos prestaciones independientes que se pagan en momentos distintos del año: el décimo tercer mes corresponde al cierre del año y el décimo cuarto a mitad de año. Cada uno se calcula por separado y ninguno reemplaza al otro."
      },
      {
        q: "¿Cómo se calcula el décimo si el empleado no trabajó todo el año?",
        a: "Se paga la parte proporcional al tiempo efectivamente trabajado dentro del período que cubre esa prestación. La proporción se calcula sobre el salario que corresponde según la regla de cálculo aplicable, así que conviene documentar bien las fechas de ingreso y salida."
      },
      {
        q: "¿Se le puede descontar el décimo a un empleado que renunció?",
        a: "No. La parte proporcional ya devengada es un derecho adquirido y debe pagarse en la liquidación, con independencia de si el trabajador renunció o fue despedido. Retenerla es una de las causas más frecuentes de reclamo laboral."
      }
    ]
  },
  {
    slug: "prestaciones-laborales-fin-de-contrato-honduras",
    title: "Qué se le paga a un empleado cuando termina su contrato en Honduras",
    metaTitle: "Prestaciones laborales en Honduras: qué se paga al salir",
    category: "Laboral",
    date: "2026-08-15",
    author: "Dirección profesional",
    cluster: "laboral",
    intent: "Distinguir qué conceptos se pagan siempre al terminar una relación laboral y cuáles dependen de la causa de la salida.",
    excerpt: "Hay conceptos que se pagan siempre y otros que dependen de por qué terminó la relación. Confundirlos es el origen de la mayoría de las demandas laborales contra las MIPYME.",
    tldr: [
      "Los derechos adquiridos —vacaciones y décimos proporcionales, salario pendiente— se pagan siempre, sin importar quién terminó la relación.",
      "El preaviso y el auxilio de cesantía son distintos: proceden cuando el despido no tiene causa justificada, no en toda salida.",
      "Una renuncia no borra los derechos ya devengados; solo cambia si corresponden o no los conceptos indemnizatorios.",
      "El cálculo depende de la antigüedad y del salario base, y ahí es donde nacen la mayoría de los reclamos: documentar fechas y pagos es la mejor defensa."
    ],
    faq: [
      {
        q: "¿Qué se le paga a un empleado que renuncia en Honduras?",
        a: "Los derechos ya devengados: el salario pendiente, las vacaciones proporcionales y la parte proporcional de los décimos. Los conceptos indemnizatorios propios del despido sin causa justificada, como el preaviso y el auxilio de cesantía, no proceden por el solo hecho de renunciar."
      },
      {
        q: "¿Qué diferencia hay entre preaviso y auxilio de cesantía?",
        a: "El preaviso compensa la falta de aviso anticipado de la terminación; el auxilio de cesantía compensa el tiempo de servicio acumulado. Son conceptos distintos, con reglas de cálculo distintas, y ambos dependen de la antigüedad del trabajador."
      },
      {
        q: "¿Puedo pagar la liquidación en cuotas?",
        a: "El pago de la liquidación tiene plazos y formalidades que conviene respetar; los acuerdos de pago deben documentarse con cuidado y no pueden usarse para renunciar a derechos irrenunciables. Antes de proponer un arreglo, revisá el caso con un asesor: un acuerdo mal documentado no protege al empleador."
      }
    ]
  },
  {
    slug: "gastos-deducibles-isr-honduras",
    title: "Qué gastos puede deducir tu empresa del ISR en Honduras",
    metaTitle: "Gastos deducibles del ISR en Honduras: requisitos y errores",
    category: "Fiscal / SAR",
    date: "2026-08-15",
    author: "Dirección profesional",
    cluster: "fiscal",
    intent: "Saber qué gastos reducen legalmente el impuesto de una empresa y qué requisitos debe cumplir cada comprobante.",
    excerpt: "No todo lo que la empresa paga reduce el impuesto. Un gasto es deducible cuando es necesario para generar la renta, está documentado y está registrado — y falla cualquiera de los tres, se cae.",
    tldr: [
      "Un gasto es deducible cuando cumple tres condiciones a la vez: es necesario para generar la renta, está documentado con un comprobante válido y está registrado en la contabilidad.",
      "El comprobante debe ser un documento fiscal autorizado, emitido a nombre y con el RTN de la empresa: la factura a nombre del socio no sirve.",
      "Los gastos personales mezclados con los del negocio son la causa número uno de ajustes en una fiscalización.",
      "Multas, recargos y pagos sin la retención que correspondía no son deducibles, aunque estén documentados."
    ],
    faq: [
      {
        q: "¿Qué requisitos debe cumplir un gasto para ser deducible en Honduras?",
        a: "Debe ser necesario para generar o mantener la renta gravable, estar respaldado por un documento fiscal válido emitido a nombre y con el RTN de la empresa, y estar registrado en la contabilidad en el período correspondiente. Si falla cualquiera de esos tres elementos, el gasto es objetable en una revisión."
      },
      {
        q: "¿Puedo deducir una factura que está a mi nombre y no al de la empresa?",
        a: "No. Si la empresa es una sociedad, es una persona distinta de sus socios: el comprobante debe estar emitido a nombre y con el RTN de la sociedad. Facturar a título personal lo del negocio es uno de los errores que más ajustes genera."
      },
      {
        q: "¿Las multas del SAR se pueden deducir como gasto?",
        a: "No. Las multas y los recargos por incumplimiento no son deducibles: la ley no permite que la sanción reduzca el impuesto. Ese es un costo que la empresa absorbe íntegro, lo que hace todavía más cara la falta de cumplimiento."
      }
    ]
  },
  {
    slug: "comerciante-individual-vs-sociedad",
    title: "Comerciante individual o sociedad mercantil: cuál conviene en Honduras",
    metaTitle: "Comerciante individual vs. sociedad en Honduras: cuál conviene",
    category: "Guía",
    date: "2026-07-01",
    author: "Dirección profesional",
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
    author: "Dirección profesional",
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
    author: "Dirección profesional",
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
    author: "Dirección profesional",
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
    author: "Dirección profesional",
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
    author: "Dirección profesional",
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
    author: "Dirección profesional",
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
    author: "Dirección profesional",
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
    author: "Dirección profesional",
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
    author: "Dirección profesional",
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
    author: "Dirección profesional",
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
    author: "Dirección profesional",
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
