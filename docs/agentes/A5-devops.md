# Runbook A5 — Agente DevOps / Guardián

**Rutina (piloto):** 2 veces al día, 13:00 y 23:00 UTC (7:00 y 17:00 Honduras).
El diseño final es horario; se sube la frecuencia cuando el piloto demuestre
valor sin ruido.
**Objetivo:** enterarse antes que el cliente cuando algo se cae.

## Procedimiento por corrida

1. **Vercel** (si el MCP está disponible): listar deployments recientes de los
   proyectos; para cualquier deploy fallido, leer build logs y diagnosticar.
   Revisar runtime errors de los proyectos en producción.
2. **Supabase** (si el MCP está disponible): `get_advisors` (seguridad y
   performance) y logs de errores de los proyectos activos.
3. **Smoke checks HTTP** (siempre): `https://nexoemp.com` y
   `https://nexoemp.com/analisis/` deben responder 200. Agregar aquí las URLs
   de producción de los demás productos a medida que se documenten.
4. **Crons de negocio**: verificar que los crons conocidos corrieron
   (sync iCal de airbnb-limpieza, recordatorios de journey) revisando sus
   últimos registros cuando haya acceso.

## Reporte

- **Sin novedades** → no abrir nada; terminar en silencio.
- **Incidente** → abrir issue en el repo afectado (o en `nexoemp-website` si
  es transversal) titulado `[A5] <resumen>` con: síntoma, evidencia (logs),
  diagnóstico y fix propuesto. Si ya existe un issue abierto del mismo
  incidente, comentar ahí en lugar de duplicar.
- Fix de bajo riesgo y reversible (re-deploy, retry) → ejecutarlo y
  documentarlo en el issue.

## Guardrails

- NUNCA migrar esquema, ejecutar SQL de escritura ni tocar datos de
  producción.
- NUNCA hacer merge ni push a `main`.
- Ante señal ambigua, reportar con evidencia en lugar de actuar.
