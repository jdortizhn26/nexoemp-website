# 06 — Agentes: la empresa que trabaja sola

> Diseño de la plantilla autónoma de Nexo Empresarial / Nexo Labs: qué agentes
> de IA operan la empresa, qué hace cada uno, con qué herramientas, cuándo se
> disparan y dónde está el humano en el circuito.
> Complementa la serie estratégica (índice en [`README.md`](README.md)).
>
> Fecha: julio 2026 · Estado: v1 (diseño) — implementación por fases (§6)

---

## 1. Principios

1. **Daniel dirige, los agentes operan.** Ningún agente toma decisiones
   estratégicas (precios, contratos, contrataciones, borrado de datos).
2. **Aprobación humana para lo irreversible.** Enviar dinero, borrar datos,
   publicar en producción de un cliente, prometer algo a un cliente →
   requiere OK humano (WhatsApp/email de aprobación o PR review).
3. **Todo agente deja rastro.** Cada corrida escribe su bitácora (qué vio, qué
   hizo, qué dejó pendiente). Sin bitácora no hay confianza.
4. **Un agente = un runbook versionado.** Instrucciones en repo
   (`docs/agentes/`), no prompts sueltos. Se mejoran con PRs, como el código.
5. **Empezar barato y aburrido.** Primero bajo riesgo y alto volumen
   (contenido, monitoreo, triage). Cobranza y desarrollo después.

## 2. Infraestructura (con lo que ya tenemos)

| Pieza | Uso |
|-------|-----|
| **Claude Code (sesiones remotas + Routines/cron)** | Motor de todos los agentes: cada agente es una rutina programada o disparada por evento, con su runbook |
| **GitHub (14 repos)** | Código, runbooks, PRs de A6, issues como cola de trabajo |
| **Supabase** | Datos de los productos + tablas de operación (`agent_runs`, `leads`, `tickets`, `collections`) |
| **Vercel** | Hosting + cron + logs que vigila A5 |
| **Gmail / Google Calendar** | Bandeja comercial y de soporte, agenda de demos |
| **WhatsApp Business API** (`@nexo/core/whatsapp`) | Canal principal con clientes: ventas, recordatorios, soporte |
| **nexoemp.com** | Captación (formulario + Análisis SEO) → alimenta a A1 |

## 3. Organigrama

```
                        ┌─────────────────────┐
                        │  DANIEL (director)  │
                        └──────────┬──────────┘
                                   │ aprueba / decide
                        ┌──────────┴──────────┐
                        │ A0 · AGENTE JEFE    │  orquestador + reporte
                        └─┬───┬───┬───┬───┬───┘
      ┌──────────┐ ┌──────┴┐ ┌┴────┐ ┌┴─────┐ ┌┴──────┐ ┌┴───────┐ ┌────────┐
      │A1        │ │A2     │ │A3   │ │A4    │ │A5     │ │A6      │ │A7      │
      │Comercial │ │Conte- │ │Sopor│ │Cobra-│ │DevOps │ │Desarro-│ │Contable│
      │(ventas)  │ │nido   │ │te   │ │nza   │ │       │ │llo     │ │        │
      └──────────┘ └───────┘ └─────┘ └──────┘ └───────┘ └────────┘ └────────┘
```

### A0 · Agente Jefe (orquestador y reporte)
- **Misión**: que Daniel abra WhatsApp el lunes y sepa todo en 2 minutos.
- **Corre**: lunes 7:00 (semanal) + resumen corto diario 18:00.
- **Hace**: lee las bitácoras de A1–A7, consolida KPIs (leads, tickets,
  cartera vencida, uptime, PRs pendientes), detecta agentes atascados y
  prioriza la semana. Propone; no ejecuta.
- **Entrega**: reporte semanal + lista de decisiones que esperan a Daniel.

### A1 · Agente Comercial (ventas)
- **Misión**: ningún lead sin respuesta en < 15 min, en español, con criterio.
- **Dispara**: formulario de nexoemp.com (email), WhatsApp comercial entrante,
  barrido diario de bandeja.
- **Hace**: califica el lead (vertical → RestaurantOS / EscuelaOS / PréstamOS /
  segundo tier; país del Anillo 1; tamaño), responde con la info del producto
  correcto, ofrece demo, agenda en Calendar, registra en `leads` y da
  seguimiento D+2 / D+7.
- **Límites**: no promete precios fuera de lista ni fechas; ante negociación →
  escala a Daniel con resumen.

### A2 · Agente de Contenido / SEO
- **Misión**: 1–2 análisis por semana en nexoemp.com/analisis que traigan
  tráfico orgánico (fiscal/legal por país del Anillo 1, empezando por HN).
- **Corre**: martes y jueves 6:00.
- **Hace**: monitorea fuentes oficiales (SAR, La Gaceta; luego SAT-GT,
  Hacienda-CR, DGII-RD), redacta con la plantilla del sitio
  (`analisis/_plantilla.html` + `assets/articles.js`) y abre PR a
  `nexoemp-website`.
- **Humano**: Daniel aprueba el PR (rigor de la firma) → Vercel publica.
  Con historial de calidad, pasar a publicación directa.

### A3 · Agente de Soporte
- **Misión**: primera respuesta < 30 min para clientes de los productos.
- **Dispara**: WhatsApp de soporte, email, tabla `tickets`.
- **Hace**: triage (bug / duda de uso / feature), responde con la documentación
  del producto (manuales tipo `journey/docs/manual/`), reproduce bugs y abre
  issue en el repo correcto con pasos y evidencia, vincula ticket→issue y
  avisa al cliente al resolverse.
- **Límites**: nunca toca datos de producción del cliente; para eso escala.

### A4 · Agente de Cobranza
- **Misión**: cartera vencida ≈ 0 sin que Daniel persiga a nadie.
- **Corre**: diario 8:00, respetando la zona horaria del cliente.
- **Hace**: lee facturas/suscripciones por vencer y vencidas, envía
  recordatorio WhatsApp **T−3, T, T+3, T+7** con estado de cuenta PDF,
  registra promesas de pago y confirma pagos (concilia contra registro).
  El patrón ya existe en EscuelaOS (`auto_reminders`) y se generaliza vía
  `@nexo/core/subscriptions`.
- **Límites**: tono siempre cordial; suspensión de servicio SOLO con
  aprobación de Daniel; nunca negocia quitas.

### A5 · Agente DevOps / Guardián
- **Misión**: enterarse antes que el cliente cuando algo se cae.
- **Corre**: cada hora (barrido) + al fallar un deploy (evento).
- **Hace**: revisa deploys y runtime logs de Vercel, errores y advisors de
  Supabase, crons que no corrieron (sync iCal, recordatorios), dominios y
  certificados. Abre issue con diagnóstico; si el fix es obvio y de bajo
  riesgo (retry, redeploy) lo ejecuta y lo reporta.
- **Límites**: nunca migra esquema ni toca datos de producción sin aprobación.

### A6 · Agente de Desarrollo
- **Misión**: convertir la cola de issues en PRs listos para revisar.
- **Dispara**: etiqueta `agente-dev` en un issue (la ponen A3/A5/Daniel).
- **Hace**: implementa en rama `claude/*` siguiendo el CLAUDE.md del repo y
  abre PR. Cola inicial obvia: los **PR1–PR5 de `@nexo/core`** del doc
  [05](05-plan-tecnico-internacionalizacion.md) §9, los quick wins de los
  `ANALISIS_ODOO.md` (mora automática, estados de cuenta PDF, FX diario) y la
  consolidación Lamar/Molis → RestaurantOS.
- **Humano**: Daniel revisa y fusiona. El agente nunca hace merge a `main` de
  un repo con clientes en producción.

### A7 · Agente Contable (interno)
- **Misión**: la contabilidad de Nexo (y de clientes de Asefisco, como
  asistente del contador) siempre al día.
- **Corre**: diario 19:00 + cierre mensual (día 1).
- **Hace**: procesa la bandeja OCR de facturas (asefisco2), propone asientos,
  detecta descuadres, prepara borradores de declaraciones (ISV, retenciones)
  y el paquete de cierre para revisión del contador.
- **Humano**: el contador aprueba asientos y presenta declaraciones.

## 4. Flujos de punta a punta

**Lead → cliente (sin humanos hasta la negociación)**
Formulario o WhatsApp → A1 califica y responde → agenda demo → demo del
vertical (multi-tenant con empresa demo) → propuesta estándar → si acepta plan
de lista: onboarding autónomo (crear empresa + checklist guiado) → A4 activa
cobro recurrente → A0 lo reporta el lunes.

**Bug de cliente → fix en producción**
Cliente escribe por WhatsApp → A3 triage y reproduce → issue `agente-dev` →
A6 abre PR → Daniel aprueba y fusiona → Vercel despliega → A3 confirma con el
cliente y cierra el ticket.

**Decreto nuevo → tráfico → leads**
A2 detecta publicación oficial → redacta análisis → PR → Daniel aprueba →
/analisis publica → SEO + shares → formulario → A1.

## 5. Reglas duras (guardrails)

1. **Dinero**: los agentes nunca mueven dinero; solo registran y recuerdan.
2. **Datos**: nunca `DELETE`/migraciones en producción sin aprobación explícita.
3. **Compromisos**: precios, plazos y alcances solo de la lista aprobada.
4. **Identidad**: se presentan como "el equipo de Nexo Empresarial"; no
   suplantan a Daniel en firmas ni decisiones personales.
5. **Escalamiento**: ante duda o cliente molesto → resumen + escalar, nunca
   improvisar.
6. **Bitácora obligatoria** por corrida (`agent_runs`: agente, inicio/fin,
   acciones, pendientes, errores). A0 la audita.

## 6. Plan de implementación

| Fase | Agentes | Criterio para avanzar |
|------|---------|----------------------|
| **1 (ya)** | A2 Contenido, A5 DevOps, A0 Jefe (reporte) | 4 semanas de corridas estables con bitácora |
| **2** | A1 Comercial, A3 Soporte | Leads/tickets < SLA sin errores de tono por 2 semanas |
| **3** | A4 Cobranza, A6 Desarrollo | A4: cero quejas; A6: ≥5 PRs fusionados sin retrabajos mayores |
| **4** | A7 Contable + autonomía creciente (publicación directa de A2, auto-merge de fixes triviales) | Auditoría mensual limpia de A0 |

**Primer paso concreto**: crear las Routines de A2 (mar/jue 6:00) y A5 (cada
hora) sobre este entorno de Claude Code, con runbooks en `docs/agentes/` de
este repo.

---

*Los runbooks individuales (uno por agente) se versionan en `docs/agentes/` a
medida que cada agente entra en servicio.*
