/* ════════════════════════════════════════════════════════════════
   analytics.js — Google Analytics 4
   ────────────────────────────────────────────────────────────────
   ÚNICO lugar donde se configura la medición del sitio.

   Para activarla: pegá abajo el ID de medición de GA4 (empieza con
   "G-"), que se saca en analytics.google.com → Administrar → Flujos
   de datos → Web. Mientras esté vacío, este archivo no hace nada y
   no carga ningún script externo.

   El ID de medición de GA4 es público por diseño (viaja en el HTML
   de cualquier sitio con Analytics): no es un secreto y por eso sí
   puede vivir en el repo.
   ════════════════════════════════════════════════════════════════ */
(function () {
  var GA4_ID = "";

  if (!GA4_ID) return;

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA4_ID);
})();
