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

   3. Conversiones (van a GA4 y a Vercel Analytics a la vez):
      whatsapp_click  clic en cualquier enlace a wa.me/<número>, con
                      la página y el bloque de origen (cta-inline,
                      cta-final, cta-movil, hero, contacto, ...). Los
                      enlaces de compartir (wa.me/?text=) no cuentan.
                      Un bloque se puede nombrar a mano con el
                      atributo data-bloque en el enlace o en un padre.
      form_submit     la página gracias.html, a la que FormSubmit
                      devuelve al visitante tras enviar el formulario
                      (se marca con data-evento en su <html>).
      Para que cuenten como conversión hay que marcarlos como eventos
      clave en GA4 (ver SEO.md).
   ════════════════════════════════════════════════════════════════ */
(function () {
  // Vercel Web Analytics (ruta propia del dominio, la sirve Vercel).
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  var v = document.createElement("script");
  v.defer = true;
  v.src = "/_vercel/insights/script.js";
  document.head.appendChild(v);

  var GA4_ID = "G-2ZQZV6K84S";

  if (GA4_ID) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_ID;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA4_ID);
  }

  function evento(nombre, datos) {
    var params = { pagina: location.pathname };
    for (var k in datos) if (Object.prototype.hasOwnProperty.call(datos, k)) params[k] = datos[k];
    if (window.gtag) window.gtag("event", nombre, params);
    window.va("event", { name: nombre, data: params });
  }
  window.nexoEvento = evento;

  // El orden importa: gana el primer selector que contenga al enlace.
  var BLOQUES = [
    [".cta-inline", "cta-inline"],
    [".cta-final-art, .cta-final", "cta-final"],
    [".cta-movil", "cta-movil"],
    ["#contacto, #oficina, #llegada", "contacto"],
    [".hero, header", "hero"],
    ["footer", "pie"],
    ["nav", "menu"],
  ];
  var WA = /^https?:\/\/(api\.)?wa\.me\/\d+/i;

  function bloqueDe(el) {
    var marcado = el.closest("[data-bloque]");
    if (marcado) return marcado.getAttribute("data-bloque");
    for (var i = 0; i < BLOQUES.length; i++) {
      if (el.closest(BLOQUES[i][0])) return BLOQUES[i][1];
    }
    var seccion = el.closest("section[id]");
    return seccion ? seccion.id : "cuerpo";
  }

  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || !WA.test(a.href)) return;
    evento("whatsapp_click", { bloque: bloqueDe(a), enlace: a.href.split("?")[0] });
  }, true);

  // Evento al cargar la página (p. ej. gracias.html). No se repite si el
  // visitante recarga la página o vuelve a ella con el botón Atrás.
  var alCargar = document.documentElement.getAttribute("data-evento");
  if (alCargar) {
    var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
    if (!nav || nav.type === "navigate") {
      evento(alCargar, { formulario: document.documentElement.getAttribute("data-formulario") || "contacto" });
    }
  }
})();
