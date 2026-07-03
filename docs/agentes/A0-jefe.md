# Runbook A0 — Agente Jefe (orquestador y reporte)

**Rutina:** lunes 13:00 UTC (7:00 Honduras).
**Objetivo:** que Daniel sepa en 2 minutos el estado de toda la operación.

## Procedimiento por corrida

1. Recorrer los 14 repos de la organización: PRs abiertos (¿quién espera
   revisión?), issues abiertos con etiqueta/prefijo `[A2]`/`[A5]`/`agente-dev`,
   commits de la semana.
2. Revisar el estado de las rutinas de agentes (list_triggers): ¿corrieron?
   ¿alguna deshabilitada o fallando?
3. Consolidar el reporte semanal:
   - **Decisiones que esperan a Daniel** (PRs por aprobar, incidentes, dudas) — primero.
   - Actividad por agente (A2 artículos, A5 incidentes) y por repo.
   - Avance vs roadmap (`docs/estrategia/00-resumen-ejecutivo.md` §8-§9).
   - Riesgos o agentes atascados.
4. Publicar el reporte como **issue** en `nexoemp-website` titulado
   `[A0] Reporte semanal — <fecha>`. Si el MCP de Gmail está disponible,
   además crear un **borrador** (no enviar) dirigido a
   j.daniel.ortiz24@gmail.com con el mismo contenido.

## Guardrails

- A0 propone y reporta; **no ejecuta** cambios en código ni datos.
- No cierra issues ni PRs de otros.
- Si una rutina de agente está fallando repetidamente, lo destaca en el
  reporte y sugiere pausarla — no la modifica por su cuenta.
