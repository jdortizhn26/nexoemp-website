# Plan Técnico de Internacionalización — Nexo Labs
### Qué tocar en `@nexo/core` y en cada producto para vender fuera de Honduras

**Principio rector:** convertir la base HN-céntrica en una **plataforma multi-país** sin reescribir los productos, concentrando la complejidad en una **capa de localización dentro de `@nexo/core`** (patrón *adapter*, que el repo ya usa). **Honduras (producción) no se rompe**: queda como la primera implementación detrás de las nuevas interfaces.

---

## 1. Diagnóstico técnico (lo que está realmente en el código)

| Hallazgo (en `@nexo/core` v0.2.0) | Implicación |
|---|---|
| `Currency = 'HNL' \| 'USD'` (`currency/types.ts`) | Tipo cerrado: bloquea GTQ, CRC, DOP, MXN, COP… |
| `convert()` solo USD↔HNL con una sola tasa (`money.ts`) | Falta motor FX general (cross-rates con base USD) |
| `formatMoney` con `formatters` fijos `es-HN` / `en-US` | Formateo no escala a otros locales/monedas |
| `FxRate.source: 'BCH' \| 'fallback' \| 'manual'` | Fuente FX atada a Honduras (Banco Central) |
| Exports: `currency`, `subscriptions`, `reports`, `whatsapp` | No hay módulos `localization`, `tax`, `einvoicing`, `tenancy`, `i18n` |
| Roadmap: `multi-company` (companyId) y `localization/hn` **🔜** | La multi-tenancy y la fiscalidad aún no existen en el core |
| Adapters **Firestore** hechos; **Supabase** no | Varios productos usan Supabase → faltan adapters |
| SAR/CAI/RTN embebidos en cada producto | Fiscalidad duplicada y no portable entre países |
| i18n: solo **EscuelaOS** (next-intl, es/en); el resto español hardcodeado | i18n disperso, pero (ver §7) **no es lo urgente para Anillo 1** |

---

## 2. Arquitectura objetivo: la capa de localización en `@nexo/core`

Nuevos módulos (todos detrás de interfaces, HN como primera impl.):

```
@nexo/core
├── currency/      (AMPLIAR)  Currency ISO 4217 · convert multi-moneda · FX base USD + cross
├── localization/  (NUEVO)    LocaleConfig por tenant: idioma, moneda, locale, zona horaria, formatos
├── tax/           (NUEVO)    TaxRegime adapter por país: IVA/ISV/ITBIS, retenciones, nómina
├── einvoicing/    (NUEVO)    EInvoiceProvider adapter por país: SAR/CAI, FEL, e-CF, DTE, DIAN, CFDI
├── tenancy/       (NUEVO)    scoping multi-tenant (orgId/companyId) + helpers RLS/Rules
└── i18n/          (NUEVO)    convención + catálogos es (base) · en · pt
```

**Contratos clave (ejemplos de diseño):**

```ts
// localization/types.ts
export interface LocaleConfig {
  tenantId: string
  language: 'es' | 'en' | 'pt'
  currency: CurrencyCode          // ISO 4217: 'HNL' | 'GTQ' | 'CRC' | 'DOP' | 'MXN' | 'COP' | 'USD' | ...
  locale: string                  // 'es-HN' | 'es-GT' | 'es-DO' | 'es-MX' | ...
  timeZone: string                // 'America/Tegucigalpa' | 'America/Guatemala' | ...
  taxCountry: CountryCode         // 'HN' | 'GT' | 'CR' | 'DO' | 'SV' | 'PA' | 'CO' | 'MX'
}

// einvoicing/types.ts  → la interfaz común que cada país implementa
export interface EInvoiceProvider {
  country: CountryCode
  issue(invoice: DraftInvoice, cfg: LocaleConfig): Promise<StampedInvoice>  // timbra/autoriza
  void(ref: string): Promise<void>
}

// tax/types.ts
export interface TaxRegime {
  country: CountryCode
  computeSalesTax(base: Money, productClass?: string): Money    // ISV/IVA/ITBIS
  withholdings(base: Money): Withholding[]
  payroll(salary: Money): PayrollBreakdown                      // IHSS/RAP/ISR equivalentes
}
```

> La fiscalidad de Honduras que hoy vive dispersa en los productos se **refactoriza para vivir detrás de `TaxRegime('HN')` y `EInvoiceProvider('HN')`**. Esto no cambia el comportamiento en Honduras, pero deja el hueco para enchufar GT, CR, RD, etc.

---

## 3. Plan por *concern* (esfuerzo)

| Concern | Qué hacer | Esfuerzo | Dónde |
|---|---|---|---|
| **Multi-moneda** | `Currency` → ISO 4217; `convert` con base USD + cross-rates; `formatMoney` por locale dinámico; FX provider configurable (ya usan Open Exchange Rates) | **M** | `@nexo/core/currency` |
| **Locale/tenant config** | `LocaleConfig` + contexto por tenant; quitar `America/Tegucigalpa` hardcodeado | **S–M** | `@nexo/core/localization` |
| **Impuestos** | `TaxRegime` adapter; refactor HN detrás de la interfaz; añadir GT/CR/DO/SV | **M** (×país) | `@nexo/core/tax` |
| **E-factura** | `EInvoiceProvider` adapter; **integrar PACs locales** (no construir certificación) | **L** (×país) | `@nexo/core/einvoicing` |
| **Multi-tenancy** | `orgId/companyId` scoping; RLS (Supabase) / Rules (Firestore) | **M** (×producto single-tenant) | `@nexo/core/tenancy` + productos |
| **i18n** | next-intl (Next) / react-i18next (Vite); catálogos es→en→pt | **M** (solo Anillo 3) | productos |
| **Adapters Supabase** | Portar adapters Firestore→Supabase para `currency`/`subscriptions` | **M** | `@nexo/core` |

---

## 4. Plan por producto (los 3 punta de lanza primero)

| Producto | Estado i18n/tenant | Trabajo principal | Esfuerzo |
|---|---|---|---|
| **`@nexo/core`** | — | Construir la capa de localización (§2). Es la fundación de todo. | **L** |
| **RestaurantOS** (nexo-restaurante + Molis/La Mar) | Multi-tenant parcial; español | Moneda por tenant + `EInvoiceProvider` + adapter Supabase | **M–L** |
| **PréstamOS** (matriz-prestamos) | **Single-tenant (1 usuario)**; multi-moneda parcial | **Multi-tenancy** (org + roles) + adoptar `currency` del core | **M** |
| **EscuelaOS** (journey) | **Ya bilingüe es/en** (next-intl) ✅; single-school | Multi-tenancy (`school_id`) + moneda/calendario por tenant | **M** |

> Nota de ventaja: **EscuelaOS ya resolvió el i18n** (es/en con next-intl). Es el producto con la barrera de internacionalización más baja → coherente con priorizarlo como punta de lanza.

---

## 5. Estrategia de e-factura: **integrar, no construir** (esto es lo que ahorra meses)

La factura electrónica es el mayor esfuerzo. **No conviene construir la certificación desde cero por país.** Patrón recomendado: `EInvoiceProvider` que **envuelve a un PAC/proveedor autorizado local**.

| País | Régimen | Vía recomendada |
|---|---|---|
| Honduras | SAR / CAI | Ya implementado (refactor a la interfaz) |
| Guatemala | FEL | Integrar certificador FEL autorizado |
| Costa Rica | Comprobantes electrónicos (Hacienda) | API de Hacienda / proveedor |
| Rep. Dominicana | e-CF (DGII) | Proveedor e-CF |
| El Salvador | DTE | Ministerio de Hacienda DTE |
| Colombia | DIAN | Proveedor tecnológico DIAN |
| México | CFDI 4.0 | **PAC** (timbrado vía PAC, no propio) |

**Nexo orquesta; no se vuelve certificador.** Esto baja el esfuerzo por país de "L enorme" a "M acotado".

---

## 6. Multi-tenancy: patrón por stack

- **Apps Supabase** (journey, biosalud, nexo-contabilidad, flores): añadir columna `org_id`/`tenant_id` + **políticas RLS** de scoping (ya usan RLS por rol; se extiende a tenant). Patrón replicable.
- **Apps Firestore** (matriz, restaurante, molis, lamar, asefisco): scoping por `companyId` + **security rules** (es el módulo `multi-company` ya previsto en el roadmap del core).
- **Convertir a multi-tenant:** PréstamOS (prioridad, el más rentable de productizar), EscuelaOS, SaludOS, Flores, Consultorio.

---

## 7. i18n: lo importante (y lo que NO es urgente)

**Decisión estratégica:** para el **Anillo 1 (Centroamérica + Caribe, todo hispanohablante), i18n NO es la prioridad.** Lo urgente ahí es **multi-moneda + e-factura por país + multi-tenancy**. El idioma ya es español.

- **i18n se vuelve crítico solo en Anillo 3** (hispanos en EE.UU. en inglés, Brasil en portugués, mercado global).
- Cuando toque: **next-intl** para las apps Next.js (replicar el patrón de EscuelaOS) y **react-i18next** para las React+Vite. Orden de catálogos: **es (base) → en → pt**.

> Esto reordena el esfuerzo: no gastes en traducir a inglés para vender en Guatemala. Gasta en GTQ + FEL.

---

## 8. Roadmap técnico (alineado a las fases del documento #1)

**Fase 0 — Fundaciones (0–3 meses)**
- `@nexo/core`: ampliar `currency` (ISO 4217, convert/format multi-moneda), crear `localization`, `tax`, `einvoicing`, `tenancy` (interfaces + HN como primera impl.).
- Adapters Supabase para `currency`/`subscriptions`.
- Multi-tenancy de **PréstamOS** y **EscuelaOS**.

**Fase 1 — Anillo 1 (3–9 meses)**
- `EInvoiceProvider` + `TaxRegime` para **Guatemala, Costa Rica, Rep. Dominicana** (y El Salvador/Panamá, dolarizados → fáciles de cobrar).
- RestaurantOS, PréstamOS y EscuelaOS listos para vender en Anillo 1.

**Fase 2 — Escala (9–18 meses)**
- Adapters **Colombia (DIAN)** y **México (CFDI vía PAC)**.
- i18n **en/pt** para Anillo 3.
- Productizar el segundo tier (InmobiliariaOS, Conta/Asefisco) e incorporar adapters restantes.

---

## 9. Primeros pasos concretos (orden de PRs en `@nexo/core`)

1. **PR1 — Currency multi-moneda:** `Currency` → `CurrencyCode` (ISO 4217); generalizar `convert` (base USD + cross) y `formatMoney` (Intl por locale). *Backwards-compatible: HNL/USD siguen funcionando.* Con tests.
2. **PR2 — LocaleConfig + tenant context:** módulo `localization`; eliminar `America/Tegucigalpa` hardcodeado; resolver locale/moneda/zona por tenant.
3. **PR3 — Interfaces fiscales:** `TaxRegime` y `EInvoiceProvider`; **refactor de Honduras detrás de ellas** (sin cambiar comportamiento en producción).
4. **PR4 — Adapters Supabase:** portar `currency`/`subscriptions` a Supabase.
5. **PR5 — Multi-tenancy de PréstamOS:** de "1 usuario" a org + roles (el de mayor ROI de productización).

---

## 10. Riesgos técnicos y mitigación

| Riesgo | Mitigación |
|---|---|
| E-factura por país consume el cronograma | **Integrar PACs/proveedores locales**, no construir certificación; priorizar 4 países |
| Romper Honduras (producción) | Todo detrás de interfaces; HN = primera implementación; tests de regresión |
| Split Firestore vs Supabase | Unificar vía **adapters**; no migrar todo de golpe |
| Multi-tenancy mal hecha (fuga de datos entre tenants) | RLS/Rules con scoping estricto + pruebas de aislamiento por tenant |
| Sobre-ingeniería (traducir antes de tiempo) | Anillo 1 NO necesita i18n; foco en moneda + fiscal |

---

*Documento de trabajo — Nexo Labs. El esfuerzo real se afina al abrir cada adapter de país; las interfaces del core son la inversión que lo hace barato.*
