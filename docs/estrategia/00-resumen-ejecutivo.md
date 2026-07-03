# 00 — Resumen Ejecutivo: Nexo Labs a nivel LATAM

> **Documento de entrada a la serie estratégica.** Consolida la visión, el
> portafolio, el benchmark Odoo y las conclusiones de los documentos 01–06.
> Si solo lees un documento, lee este.
>
> Fecha: julio 2026 · Estado: v1 · Serie completa en [`README.md`](README.md)

---

## 1. La tesis

Nexo Empresarial pasa de **firma hondureña de servicios + sistemas a medida** a
**casa de software vertical latinoamericana (Nexo Labs)**, operada en su día a
día por una plantilla de **agentes de IA** con supervisión humana
(doc [06](06-agentes-empresa-autonoma.md)).

Tres decisiones estructurales ya tomadas en la serie:

1. **Verticales, no ERP genérico.** El benchmark funcional es Odoo (analizado
   repo por repo en los `ANALISIS_ODOO.md`); no competimos de frente contra él
   ni contra Siigo/Alegra — atacamos verticales profundos y mal atendidos.
2. **Anillos de expansión** (doc [04](04-analisis-de-mercado-y-sizing.md)):
   - **Anillo 1**: Centroamérica + Rep. Dominicana (~1,5M MIPYMES). Validación.
   - **Anillo 2**: México y Colombia (~10x el mercado). Volumen.
   - **Anillo 3**: hispanos EE.UU. / Brasil / global. Solo aquí urge i18n en/pt.
3. **Plataforma, no reescritura** (doc [05](05-plan-tecnico-internacionalizacion.md)):
   toda la complejidad multi-país vive en la **capa de localización de
   `@nexo/core`** (currency ISO 4217, `localization`, `tax`, `einvoicing`,
   `tenancy`, `i18n`), con Honduras como primera implementación detrás de las
   interfaces. **Honduras en producción no se rompe.**

## 2. Punta de lanza (3 productos)

| Producto | Base (repos) | Por qué es punta de lanza | SOM 3 años (Anillo 1) |
|---|---|---|---|
| **RestaurantOS** | `nexo-restaurante` + `lamar-restaurante` + `molis-pizza` | Clientes reales; industria de US$318.000M en LatAm; se vende el back-office (factura legal, costos, multi-sucursal), no el POS a secas | 350–1.050 locales · ~US$70/mes |
| **PréstamOS** | `matriz-prestamos` | **El hueco más limpio del portafolio**: nadie atiende al prestamista/cooperativa pyme en español y barato; competencia solo enterprise (Mambu, Finastra) u open-source complejo | 150–400 clientes · US$60–150/mes |
| **EscuelaOS** | `journey-bilingual-erp` | Mercado casi virgen fuera de Brasil/México; **ya es bilingüe es/en** (menor barrera técnica); contratos anuales, muy pegajoso | 100–250 colegios · ~US$150/mes |

**Total Anillo 1 a 3 años: ~US$0,7M – 2,0M ARR.** El Anillo 2 multiplica ~10x.

**Segundo tier**: Nexo Contabilidad + Asefisco (nicho **firmas contables** con
OCR por IA — no pelear contra Siigo/Alegra por cada pyme), SaludOS (`biosalud`),
Fayath (auto-partes, cliente ancla), InmobiliariaOS/ConstrucciónOS (futuro).
Satélites: `airbnb-limpieza`, `consultorio-juridico-unah`, `nexoemp-website`.

## 3. Países (orden de apertura, doc 04 §6)

1. **Guatemala** ★★★★★ (más MIPYMES ~480k; 61% secundaria privada = oro para EscuelaOS)
2. **Costa Rica** ★★★★ (poder adquisitivo + digitalización)
3. **Rep. Dominicana** ★★★★ (grande; restaurante/turismo fuerte)
4. **El Salvador / Panamá** ★★★ (dolarizados → cobro en USD sin fricción)
5. **Honduras** = base, caso de éxito y prueba social. **Nicaragua** ★★ después.

## 4. Lo técnico en una línea por concern (doc 05)

- **Moneda**: `Currency` → ISO 4217 + FX base USD con cross-rates (PR1 del core).
- **Tenant**: `LocaleConfig` por empresa (idioma, moneda, locale, TZ, país fiscal) — fuera `America/Tegucigalpa` quemado (PR2).
- **Fiscal**: `TaxRegime` + `EInvoiceProvider` por país; HN refactorizado detrás de las interfaces (PR3).
- **E-factura**: **integrar PACs/certificadores locales, nunca construir certificación** (FEL-GT, Hacienda-CR, e-CF-RD, DTE-SV, DIAN-CO, CFDI-MX vía PAC).
- **Multi-tenancy**: prioridad **PréstamOS** (hoy single-tenant, el más rentable de productizar) y **EscuelaOS** (PR5).
- **i18n**: NO urgente para Anillo 1 (todo es español). "No gastes en traducir a inglés para vender en Guatemala; gasta en GTQ + FEL."

## 5. Qué aporta el benchmark Odoo (síntesis de los ANALISIS_ODOO.md)

- Lo que Odoo tiene y nosotros no de forma consistente: **(a)** auto-asiento
  contable desde la operación, **(b)** multi-empresa/multi-moneda nativos,
  **(c)** reporting fiscal por país. Exactamente lo que resuelve la capa de
  localización + la integración con Nexo Contabilidad.
- Paridad por vertical: Odoo POS Restaurant es el checklist de RestaurantOS
  (mesas, KDS, BOM-recetas, food cost, propinas, offline, loyalty, QR);
  `account_loan` (OCA) es el modelo de datos de PréstamOS (cuotas, mora,
  asientos); Documents+OCR es el patrón de Asefisco.
- Decisión: **no migrar a Odoo**; ganarle en vertical, UX, WhatsApp y precio
  regional. Cada análisis por repo queda como plan B documentado.

## 6. La empresa que trabaja sola (doc 06)

Ocho agentes de IA operan el día a día: **A0 Jefe** (reporte semanal a Daniel),
**A1 Comercial** (leads < 15 min), **A2 Contenido/SEO** (2 análisis/semana en
nexoemp.com), **A3 Soporte**, **A4 Cobranza** (WhatsApp T−3/T/T+3/T+7),
**A5 DevOps** (vigilancia continua), **A6 Desarrollo** (issues → PRs),
**A7 Contable**. Guardrails duros: nunca mueven dinero, nunca tocan datos de
producción, todo lo irreversible pasa por Daniel. Implementación en 4 fases
empezando por los de bajo riesgo (A2, A5, A0).

## 7. Go-to-market en nexoemp.com

- Página pública **`/plataforma.html`**: la suite, los 4 pilares
  (fiscalidad por país, WhatsApp-first, multi-empresa/moneda, contabilidad
  integrada), países y la operación asistida por IA, con CTA de WhatsApp.
- **`/analisis`** alimentado semanalmente por A2 → SEO fiscal/legal regional → leads.
- Funnel: formulario/WhatsApp → A1 califica → demo del vertical → onboarding
  autónomo (empresa demo + checklist) → A4 activa el cobro recurrente.

## 8. Roadmap combinado (técnico + mercado + agentes)

| Fase | Meses | Técnico (doc 05) | Mercado (doc 04) | Agentes (doc 06) |
|---|---|---|---|---|
| **0 — Fundaciones** | 0–3 | Core: currency ISO 4217, localization, tax/einvoicing (interfaces + HN), adapters Supabase; multi-tenancy PréstamOS y EscuelaOS | Honduras como caso de éxito; página LATAM publicada | A2 Contenido, A5 DevOps, A0 Jefe |
| **1 — Anillo 1** | 3–9 | TaxRegime + EInvoiceProvider GT, CR, RD (+ SV/PA) | Abrir Guatemala, Costa Rica, RD; vender los 3 punta de lanza | A1 Comercial, A3 Soporte |
| **2 — Escala** | 9–18 | Colombia (DIAN) y México (CFDI vía PAC); i18n en/pt; segundo tier | Anillo 2 (~10x); pasarelas de pago por país | A4 Cobranza, A6 Desarrollo, A7 Contable |

**KPIs**: MRR por producto/país · empresas activas · churn · % de operación
atendida por agentes sin humano · tiempo de onboarding (< 1 día, autónomo).

## 9. Pendientes inmediatos

1. Consolidar en esta carpeta los documentos **01, 02 y 03** de la serie
   (desarrollados en otra sesión — ver nota en `README.md`).
2. Fusionar a `main` los `ANALISIS_ODOO.md` rescatados (Fayath, Lamar, Molis).
3. PR1 de `@nexo/core` (currency ISO 4217) — arranca la Fase 0 técnica.
4. Crear las Routines de A2 y A5 (primeros agentes en servicio).
5. Publicar `/plataforma.html` (merge de esta rama a `main` → Vercel).

---

*Serie estratégica Nexo Labs — índice en [`README.md`](README.md).*
