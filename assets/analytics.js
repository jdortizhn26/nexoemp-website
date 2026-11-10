/* ════════════════════════════════════════════════════════════════
   analytics.js — medición del sitio
   ────────────────────────────────────────────────────────────────
   ÚNICO lugar donde se configura la medición. Todas las páginas
   cargan este archivo, así que lo que se agregue aquí queda en todas.

   1. Vercel Web Analytics: siempre activo. Se habilita en el panel
      de Vercel (proyecto nexoemp-website → Analytics) y no lleva
      ningún identificador en el repo.

   2. Google Analytics 4: para activarla, pegá abajo el ID de
      medición (empieza con "G-"), que se saca en
      analytics.google.com → Administrar → Flujos de datos → Web.
      Mientras esté vacío, GA4 no carga ningún script externo.

   El ID de medición de GA4 es público por diseño (viaja en el HTML
   de cualquier sitio con Analytics): no es un secreto y por eso sí
   puede vivir en el repo.
   ════════════════════════════════════════════════════════════════ */
(function () {
  // Vercel Web Analytics (ruta propia del dominio, la sirve Vercel).
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  var v = document.createElement("script");
  v.defer = true;
  v.src = "/_vercel/insights/script.js";
  document.head.appendChild(v);

  var GA4_ID = "G-2ZQZV6K84S";

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
