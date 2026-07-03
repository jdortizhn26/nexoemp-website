# Agentes de IA de Nexo — Diseño y arquitectura

> **Documento interno de trabajo.** Diseño de los agentes conversacionales que
> resuelven el cuello de botella identificado en la estrategia: no falta demanda
> (1,5M de pymes en el Anillo 1), falta **llegar y cobrar a escala**. Los agentes
> son el músculo para hacerlo sin contratar un ejército de vendedores.

---

## 0. Principio rector

**Cada agente hace un trabajo concreto, medible y con escalamiento a humano.**
No es "un chatbot que responde"; es un equipo digital con roles, herramientas y
metas — que trabaja en **WhatsApp** (el canal real de la región) 24/7, en español,
listo para operar por país.

Los agentes se apoyan en Claude (Anthropic) y en la capa de datos de `@nexo/core`.
Su localización (idioma, moneda, impuestos, factura) se resuelve con el mismo
`LocaleConfig` por tenant descrito en el Plan Técnico de Internacionalización.

---

## 1. El roster (5 agentes + 1 orquestador)

| # | Agente | Trabajo | Canal principal | KPI dueño |
|---|--------|---------|-----------------|-----------|
| 0 | **Recepción / Router** | Recibe todo, entiende la intención y enruta al agente correcto | WhatsApp / Web | Enrutamiento correcto, tiempo a primera respuesta |
| 1 | **Ventas (SDR)** | Califica leads, explica productos, agenda demos, cotiza | WhatsApp / Web | Demos agendadas, leads calificados (SQL) |
| 2 | **Soporte** | Resuelve dudas de producto y problemas de uso; crea tickets | WhatsApp / Web / correo | % resuelto sin humano, CSAT |
| 3 | **Cobranza** | Recuerda pagos, envía estados de cuenta y links de pago | WhatsApp | % recuperado, mora reducida |
| 4 | **Onboarding / Implementación** | Guía la puesta en marcha del sistema contratado | WhatsApp / Web | Time-to-value, activación |
| 5 | **Contenido / Marketing** *(interno)* | Redacta análisis, posts, respuestas SEO, campañas | Interno | Publicaciones/semana, tráfico |

> Empezar por **Ventas + Soporte + Cobranza** (los tres de impacto directo en
> ingresos). Onboarding y Contenido en la segunda ola.

---

## 2. Arquitectura de alto nivel

```
                 ┌──────────────────────────────────────────┐
   WhatsApp ─────►                                          │
   Web widget ───►   AGENTE 0 · RECEPCIÓN / ROUTER           │
   Instagram ────►   (clasifica intención + idioma + país)   │
                 └───────┬───────┬───────┬───────┬──────────┘
                         │       │       │       │
                     ┌───▼──┐ ┌──▼───┐ ┌─▼────┐ ┌▼─────────┐
                     │VENTAS│ │SOPORTE│ │COBRAN│ │ONBOARDING│
                     └───┬──┘ └──┬───┘ └─┬────┘ └────┬─────┘
                         │       │       │           │
     ┌───────────────────┴───────┴───────┴───────────┴─────────────┐
     │  CAPA DE HERRAMIENTAS (tools / function calling)             │
     │  • CRM/leads (Supabase)      • Catálogo de productos+precios │
     │  • Calendario (agendar demo) • Estados de cuenta / facturas  │
     │  • Links de pago             • Base de conocimiento (RAG)    │
     │  • Handoff a humano (WhatsApp del equipo)                    │
     └──────────────────────────────────────────────────────────────┘
                         │
              @nexo/core: LocaleConfig (idioma/moneda/impuesto/país)
```

**Componentes:**
- **Modelo:** Claude (Anthropic) para razonamiento y conversación.
- **Canal:** WhatsApp Business Platform (Cloud API) como principal; widget web
  como secundario. Un solo "cerebro" por agente, varios canales de entrada.
- **Memoria:** historial de conversación por contacto + perfil (CRM). RAG sobre
  una base de conocimiento (catálogo, FAQs, docs de cada producto).
- **Herramientas (function calling):** ver §4. Los agentes NO inventan datos;
  consultan herramientas para precios, saldos, disponibilidad, etc.
- **Handoff:** cualquier agente puede escalar a una persona (con resumen del
  caso) por reglas o a petición del cliente.
- **Multi-país:** el router detecta país/idioma y carga el `LocaleConfig`; los
  agentes responden con moneda, impuestos y ejemplos locales.

---

## 3. Fichas por agente

### Agente 1 · Ventas (SDR)
- **Objetivo:** convertir una conversación entrante en una **demo agendada** o
  un **lead calificado** (presupuesto, autoridad, necesidad, tiempo).
- **Disparadores:** "quiero información/precio/demo", clic en anuncio, formulario.
- **Hace:** identifica el vertical (restaurante, préstamos, colegio…), explica el
  producto y su valor, responde objeciones, califica (giro, tamaño, país,
  urgencia), agenda demo en calendario, envía cotización orientativa.
- **No hace:** cerrar contratos legales ni dar precios finales fuera de rango sin
  humano; prometer funciones que no existen.
- **Herramientas:** catálogo+precios, calendario, crear/actualizar lead, handoff.
- **KPIs:** demos agendadas, tasa lead→SQL, tiempo a primera respuesta.
- **Escala a humano:** deal grande, licitación, requisitos fuera de catálogo.

### Agente 2 · Soporte
- **Objetivo:** resolver la duda o incidencia **sin intervención humana** cuando
  sea posible; si no, abrir ticket con contexto.
- **Hace:** responde "cómo hago X" con base en la documentación del producto,
  diagnostica problemas comunes, guía paso a paso, registra el ticket.
- **No hace:** tocar datos productivos del cliente sin confirmación; inventar
  soluciones no documentadas.
- **Herramientas:** base de conocimiento (RAG por producto), crear/consultar
  ticket, estado del sistema, handoff a soporte humano.
- **KPIs:** % resuelto por IA, tiempo de resolución, CSAT.

### Agente 3 · Cobranza
- **Objetivo:** **recuperar cartera** con recordatorios amables y oportunos, y
  facilitar el pago en un clic.
- **Hace:** avisa antes del vencimiento, recuerda tras el vencimiento con tono
  escalado (cordial → firme), envía estado de cuenta y **link de pago**, agenda
  compromisos de pago.
- **No hace:** amenazar, acosar ni compartir datos de deuda con terceros; contactar
  fuera de horarios razonables.
- **Herramientas:** estados de cuenta/facturas, generar link de pago, registrar
  promesa de pago, handoff a cobranza humana.
- **KPIs:** % de mora recuperada, días de cartera (DSO), promesas cumplidas.
- **Nota:** es el agente con **mayor ROI directo** — conecta con la promesa de
  producto ("cobranza por WhatsApp") y con el cuello de botella de "cobrar a escala".

### Agente 4 · Onboarding / Implementación
- **Objetivo:** llevar al cliente nuevo de "contraté" a "lo estoy usando" rápido.
- **Hace:** checklist de puesta en marcha por producto, recolecta datos iniciales
  (catálogo, usuarios, sucursales), enseña las primeras acciones, agenda la
  capacitación.
- **Herramientas:** checklist/estado de onboarding, calendario, base de
  conocimiento, handoff a implementador.
- **KPIs:** time-to-value, % de cuentas activadas en X días.

### Agente 5 · Contenido / Marketing (interno)
- **Objetivo:** alimentar el blog `/analisis`, redes y respuestas SEO a escala.
- **Hace:** borradores de artículos (leyes/decretos, guías por país), textos de
  campañas, respuestas a reseñas. Todo pasa por revisión humana antes de publicar.
- **KPIs:** publicaciones/semana, tráfico orgánico, leads por contenido.

---

## 4. Herramientas (contratos de function calling)

Diseñar cada herramienta como función tipada. Ejemplos:

```ts
// Catálogo y precios (por país)
getCatalog(country: CountryCode): Product[]
getPricing(productId: string, country: CountryCode, tier?: string): PriceQuote

// CRM / leads
upsertLead(input: { phone, name?, country, vertical?, size?, source }): LeadId
logInteraction(leadId, summary, intent, nextStep)

// Agenda
getAvailableSlots(country, productId): Slot[]
bookDemo(leadId, slot, product): BookingId

// Cobranza
getStatement(customerId): Statement            // saldo, facturas, vencimientos
createPaymentLink(invoiceId): Url
recordPaymentPromise(customerId, amount, date)

// Soporte / onboarding
searchKnowledge(query, productId): Doc[]        // RAG
createTicket(customerId, subject, body, severity): TicketId
getOnboardingChecklist(customerId): Step[]

// Común
handoffToHuman(context): void                   // enruta al WhatsApp del equipo
```

**Regla de oro:** si el dato viene de una herramienta (precio, saldo, cupo), el
agente **debe** llamarla; nunca lo inventa.

---

## 5. Modelo de datos mínimo (CRM)

```
leads            id · phone · name · country · vertical · size · source ·
                 status(new/qualified/demo/won/lost) · owner · created_at
interactions     id · lead_id · channel · intent · summary · next_step · at
customers        id · lead_id · product · plan · country · locale · mrr
invoices         id · customer_id · amount · currency · due_date · status
payment_promises id · customer_id · amount · promised_date · kept
tickets          id · customer_id · subject · severity · status · csat
onboarding       customer_id · step · done · at
```

Vive en Supabase (RLS por tenant/país), reutilizando el patrón multi-tenant del
Plan Técnico. Es también el "sistema de ventas" interno de Nexo.

---

## 6. Guardrails transversales (todos los agentes)

1. **Identidad:** siempre se identifican como asistente de Nexo; no fingen ser
   humanos. Ofrecen persona real cuando se pide.
2. **No inventar:** precios, saldos, plazos y funciones salen de herramientas o
   base de conocimiento; ante la duda, escalan.
3. **No asesoría vinculante:** temas fiscales/legales se responden en general y
   se deriva a la firma para el caso concreto (mismo criterio que el disclaimer
   del blog).
4. **Datos personales:** minimizar, no compartir deuda/datos con terceros,
   respetar horarios de contacto (cobranza).
5. **Tono:** profesional, cálido, directo, español regional neutro. Sin presión
   agresiva.
6. **Handoff limpio:** al escalar, entregan resumen del caso y datos de contacto.
7. **Registro:** toda conversación relevante se guarda en el CRM.

---

## 7. Roadmap (alineado a las fases de la estrategia)

**Fase 0 (0–3 meses) — Fundación, Honduras**
- CRM en Supabase + WhatsApp Cloud API conectado.
- Agente **Ventas** y **Soporte** en producción para Honduras (un idioma, HNL).
- Base de conocimiento de los 3 productos punta de lanza.

**Fase 1 (3–9 meses) — Anillo 1**
- Agente **Cobranza** en producción (mayor ROI).
- Router multi-país: carga `LocaleConfig` (GTQ, CRC, DOP, USD…); ejemplos y
  precios por país.
- Onboarding automatizado para los 3 productos.

**Fase 2 (9–18 meses) — Escala**
- Agente **Contenido** alimentando blog/redes por país.
- Integración con pasarelas de pago locales (links de pago reales).
- Analítica de embudo (lead→demo→cierre→cobro) por país y producto.

---

## 8. Stack recomendado (opciones)

- **Canal WhatsApp:** WhatsApp Business Platform (Cloud API) directo, o vía un
  proveedor (BSP) para simplificar plantillas y números por país.
- **Orquestación:** servicio propio (Node/Next API) que reciba el webhook de
  WhatsApp, llame a Claude con las herramientas y responda. Reutiliza `@nexo/core`.
- **Modelo:** Claude (Anthropic) — buen seguimiento de instrucciones y tool use.
- **Datos:** Supabase (ya en el stack) para CRM + RAG (pgvector) de la base de
  conocimiento.
- **Pagos:** links de pago del proveedor local por país (Fase 1–2).

> Los **prompts de sistema listos** de cada agente están en `docs/agentes/prompts/`.

---

## 9. Riesgos y mitigación

| Riesgo | Mitigación |
|--------|-----------|
| El agente inventa precios/datos | Todo dato sensible vía herramienta; nunca del modelo |
| Cobranza percibida como acoso | Tono escalado y respetuoso, horarios, tope de recordatorios |
| Fuga de datos entre clientes/países | Scoping por tenant (RLS), mismo patrón multi-tenant del core |
| Dar asesoría fiscal/legal errónea | Respuestas generales + derivar a la firma; disclaimers |
| Dependencia de un canal | Diseño multi-canal (WhatsApp + web) desde el inicio |

---

*Documento de trabajo — Nexo. Los prompts operativos viven junto a este archivo.*
