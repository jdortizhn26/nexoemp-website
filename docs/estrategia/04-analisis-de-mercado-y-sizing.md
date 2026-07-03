# Análisis de Mercado y Sizing — Nexo Labs
### TAM / SAM / SOM, competidores y precios de referencia

**Alcance:** foco en los 3 productos punta de lanza (RestaurantOS, PréstamOS, EscuelaOS) sobre el Anillo 1 (Centroamérica + Rep. Dominicana), con vistazo a Anillo 2 (México, Colombia).
**Naturaleza de las cifras:** estimaciones **directrices** (top-down + bottom-up) a partir de fuentes públicas. Sirven para priorizar y fijar metas, no como pronóstico financiero. Supuestos explícitos en cada cálculo.

---

## 1. Contexto macro: el mercado pyme de LatAm

- Las **MIPYMES son el 99,5%** de las empresas de América Latina; cerca de **9 de cada 10 son microempresas**. Se estiman **~17,2 millones** de pymes formales en la región (OECD/UNDP).
- Generan **~60% del empleo** formal.
- **Centroamérica + Rep. Dominicana: ~1,5 millones de MIPYMES** (SELA), con este desglose por país (observatorios MIPYME / gobiernos):

| País | MIPYMES (aprox.) |
|---|---|
| Guatemala | 479.939 |
| Costa Rica | 390.220 |
| El Salvador | 210.575 |
| Nicaragua | 194.644 |
| Honduras | 147.317 (hasta ~250.000 según fuente) |
| Panamá / Rep. Dominicana / Belice | resto hasta ~1,5M* |

> *Las fuentes regionales varían bastante entre sí; tomar como orden de magnitud, no como censo. Rep. Dominicana en particular suele reportarse con cifras propias mayores.

**Lectura para ventas:** hay un océano de clientes potenciales y están **mal atendidos por software**. El reto no es la demanda, es **llegar y cobrar de forma escalable**.

---

## 2. RestaurantOS

**TAM (industria):** el **foodservice de LatAm movió ~US$318.000 millones en 2024**; el segmento de comida rápida (QSR) de LAC ~US$86.200M; México solo ~US$65.400M (Grand View / Fortune / DeepMarket). Es una industria gigante y digitalizándose.

**SAM (clientes direccionables, Anillo 1):**
- Supuesto: food service ≈ 10% de las MIPYMES de CenAm → **~140.000 establecimientos**.
- De ellos, los que tienen volumen para pagar un POS (no el puesto de una sola persona): ~25% → **~35.000 negocios direccionables** en Anillo 1.

**SOM (captura realista a 3 años, Anillo 1):**
- Penetración 1–3% de los direccionables → **350–1.050 locales**.
- ARPU ~US$70/mes → **ARR ~US$0,3M – US$0,9M** solo en CenAm/Caribe; escala fuerte al sumar México/Colombia (mercado ~10x).

**Competencia y precios de referencia:**
| Competidor | Precio | Debilidad frente a Nexo |
|---|---|---|
| Toast | desde **US$69/mes** + hardware, contrato 2 años | Caro, EE.UU., sin factura legal local |
| Square | sin contrato, comisión por transacción | Sin profundidad fiscal local ni multi-sucursal serio |
| Loyverse | **plan gratis** (muy usado en LatAm) | Gratis pero básico; sin facturación legal ni back-office de cadena |

**Cuña de Nexo:** moderno **+ factura legal local + multi-sucursal/recetas/costos + WhatsApp**, a precio de la región. El "gratis" de Loyverse capta al micro; Nexo gana en el negocio que ya factura y necesita control.

---

## 3. PréstamOS

**TAM (industria):** el crédito a pymes y microfinanzas es enorme en LatAm; **el 80% de los servicios de microfinanzas se canaliza vía cooperativas de crédito** (cooperativas de ahorro y crédito), además de miles de prestamistas y financieras pequeñas.

**SAM (clientes direccionables, Anillo 1 + Andes):**
- Cooperativas de ahorro/crédito + financieras pequeñas + prestamistas formales: estimado **~5.000–10.000** entidades direccionables que hoy operan en Excel o sistemas caros.

**SOM (3 años):**
- Penetración 2–4% → **~150–400 clientes**.
- ARPU US$60–US$150/mes (manejan dinero → mayor disposición a pagar) → **ARR ~US$0,2M – US$0,7M**, con upside alto por tier.

**Competencia y precios:**
| Competidor | Posición | Debilidad |
|---|---|---|
| Mambu | Core bancario cloud, enterprise (65 países) | Caro y pesado para el prestamista pyme |
| Finastra | Enterprise global | **Desde ~£10.000/mes**: fuera de alcance del segmento |
| TurnKey Lender | Lending all-in-one, 50+ países | Orientado a lenders medianos/grandes, en inglés |
| Mifos X | Open source para MFIs | Requiere implementarlo y mantenerlo (costo oculto) |

**Cuña de Nexo:** **nadie atiende bien al prestamista/cooperativa pequeña** con algo barato, en español, fácil y con **cobranza por WhatsApp**. Es el hueco más limpio del portafolio. *Requiere multi-tenancy (hoy single-tenant).*

---

## 4. EscuelaOS

**TAM (industria):** la educación privada en LatAm sirve **~40 millones de estudiantes** (K-12 + universidad); **18% de matrícula primaria y 21% secundaria** son privadas en promedio, con picos enormes (**Guatemala: 61% de secundaria privada**) (BID). Es una de las regiones con mayor participación privada del mundo.

**SAM (colegios privados direccionables, Anillo 1):**
- Colegios privados medianos (200–1.500 alumnos), especialmente bilingües: estimado **~3.000–6.000** en CenAm + RD.

**SOM (3 años):**
- Penetración 2–5% → **~100–250 colegios**.
- ARPU ~US$150/mes (contratos anuales, baja rotación) → **ARR ~US$0,18M – US$0,45M**, muy pegajoso.

**Competencia y precios:**
| Competidor | Posición | Debilidad |
|---|---|---|
| PowerSchool | SIS líder en EE.UU. | Caro, enterprise, no localizado a LatAm |
| Gradelink / Classe365 | SIS para colegios privados, global | En inglés, sin facturación/cobranza local ni portal de padres LatAm |
| Soluciones locales | Dispersas, débiles | Anticuadas, sin portal de padres ni WhatsApp |

**Dato clave:** LatAm es solo **7% del mercado global de SIS**, y Brasil + México concentran el 65% de eso → **el resto de LatAm está casi virgen**. **Cuña de Nexo:** **bilingüe es/en de fábrica + cobranza + boletines + portal de padres + WhatsApp**, pensado para LatAm. *Requiere multi-tenancy.*

---

## 5. Verticales secundarios (resumen)

- **Nexo Contabilidad / Asefisco:** mercado grande **pero con incumbentes fuertes** — **Siigo** (1,2M de clientes en 6 países, el mayor de la región) y **Alegra** (150k usuarios en Col/Méx, desde ~US$18–20/mes). *Estrategia:* no competir de frente por cada pyme; **atacar el nicho de firmas/despachos contables** (multi-empresa) y diferenciar con **OCR por IA** y cartas de cobro con IA.
- **InmobiliariaOS / ConstrucciónOS:** mercado sólido (construcción + desarrollo); pocos productos integran obra + venta + finanzas. Buen segundo tier.
- **SaludOS / LegalOS:** nichos de alto valor pero menor volumen; venta consultiva, no masiva.

---

## 6. Priorización de países (Anillo 1)

| País | Atractivo | Notas |
|---|---|---|
| **Guatemala** | ★★★★★ | Más MIPYMES de la región (~480k) + 61% secundaria privada (oro para EscuelaOS) |
| **Costa Rica** | ★★★★ | 2º en MIPYMES (~390k); mayor poder adquisitivo y digitalización |
| **Rep. Dominicana** | ★★★★ | Mercado grande, e-factura (e-CF) en marcha, fuerte sector restaurante/turismo |
| **El Salvador** | ★★★ | ~210k MIPYMES; dolarizado (facilita cobro en USD) |
| **Panamá** | ★★★ | Dolarizado, hub regional, buen ticket |
| **Honduras** | Base | Mercado de origen, referencias y prueba social |
| **Nicaragua** | ★★ | ~195k MIPYMES; menor poder adquisitivo |

**Recomendación:** abrir con **Guatemala + Costa Rica + Rep. Dominicana** (los tres más grandes/atractivos), usando Honduras como caso de éxito. El Salvador y Panamá son "regalo" por estar **dolarizados** (cobras en USD sin fricción).

---

## 7. Síntesis de sizing (Anillo 1, 3 años, punta de lanza)

| Producto | SOM clientes (3 años) | ARPU/mes | ARR estimado |
|---|---|---|---|
| RestaurantOS | 350–1.050 | ~US$70 | US$0,3M – US$0,9M |
| PréstamOS | 150–400 | US$60–150 | US$0,2M – US$0,7M |
| EscuelaOS | 100–250 | ~US$150 | US$0,18M – US$0,45M |
| **Total Anillo 1** | **~600–1.700** | — | **~US$0,7M – US$2,0M ARR** |

**Y esto es solo el Anillo 1.** Al entrar a **México y Colombia** (Anillo 2), el mercado direccionable se multiplica ~10x. El Anillo 1 es la **validación**; el Anillo 2 es el **volumen**.

---

## 8. Conclusiones para la estrategia de ventas

1. **La demanda no es el problema** — hay 1,5M de pymes en Anillo 1 y 17M en LatAm. El cuello de botella es **llegar y cobrar a escala** (canal + auto-servicio).
2. **PréstamOS es el hueco más limpio**: la competencia es enterprise-cara u open-source-compleja; nadie atiende bien al prestamista/cooperativa pyme.
3. **EscuelaOS juega en un mercado casi virgen** fuera de Brasil/México, y ya tiene el diferenciador bilingüe.
4. **RestaurantOS pelea contra "gratis" (Loyverse)** → vender el back-office (factura legal, costos, multi-sucursal), no el POS a secas.
5. **Contabilidad: evitar el choque frontal** con Siigo/Alegra; ir por el nicho de **firmas contables** con IA.
6. **Dolarización = ventaja de cobro**: priorizar El Salvador, Panamá, Ecuador para suscripción en USD sin fricción.
7. **Precio sweet-spot**: por encima del "gratis" básico y muy por debajo del enterprise — exactamente donde la pyme regional puede pagar y nadie la atiende bien.

---

## Fuentes

- [OECD — SME Policy Index: Latin America and the Caribbean 2024](https://www.oecd.org/en/publications/2024/07/sme-policy-index-latin-america-and-the-caribbean-2024_d0ab1c40.html)
- [CEPAL — MSMEs](https://www.cepal.org/en/topics/micro-small-and-medium-sized-enterprises-msmes)
- [UNDP — MSMEs en la región](https://www.undp.org/latin-america/blog/yes-there-hope-msmes-region-and-beyond)
- [Grand View Research — Latin America Foodservice Market](https://www.grandviewresearch.com/horizon/outlook/foodservice-market/latin-america)
- [Fortune Business Insights — LAC Quick Service Restaurants Market](https://www.fortunebusinessinsights.com/latin-america-and-caribbean-quick-service-restaurants-market-108600)
- [DeepMarket Insights — LATAM Foodservice Market](https://deepmarketinsights.com/vista/insights/foodservice-market/latam)
- [BID — Private Schooling in Latin America: Trends and Public Policies](https://publications.iadb.org/publications/english/document/Private-Schooling-in-Latin-America-Trends-and-Public-Policies.pdf)
- [Global Growth Insights — Student Information System market](https://www.globalgrowthinsights.com/blog/student-information-system-companies-704)
- [World Council of Credit Unions — 2024 Statistical Report](https://www.woccu.org/documents/2024_Statistical_Report_EN)
- [ASBA — Microfinance in Latin America and the Caribbean: How Large Is the Market?](https://asbaweb.net/es/bibl/ix-inclusion-financiera/ix-3-microfinanzas/967-microfinance-in-latin-america-and-the-caribbean-how-large-is-the-market-1/file)
- [Velmie — Microfinance Software Platforms](https://www.velmie.com/microfinance-software-platform)
- [HES FinTech — Best Loan Management Software](https://hesfintech.com/blog/best-loan-management-software/)
- [Capterra — Toast POS pricing](https://www.capterra.com/p/136301/Toast-POS/)
- [Capterra — Loyverse POS pricing](https://www.capterra.com/p/150632/Loyverse-POS/)
- [Software Advice — Alegra](https://www.softwareadvice.com/accounting/alegra-profile/)
- [CB Insights — Siigo](https://www.cbinsights.com/company/siigo)
- [Satva Solutions — Top Accounting Software in Latin America](https://satvasolutions.com/blog/top-8-accounting-software-in-latin-america)
- [FIJE — Cifras MIPYMES en la región](https://www.fije.org/post/cifras-mipymes-en-la-regi%C3%B3n-nuestras-mipymes-en-cifras)
- [INE Honduras — Directorio de Establecimientos Económicos 2024](https://ine.gob.hn/wp-content/uploads/2026/01/Publicacion-del-Directorio-DEE-Honduras-2024.pdf)

*Documento de trabajo — Nexo Labs. Cifras directrices a validar con investigación de campo y datos de venta reales.*
