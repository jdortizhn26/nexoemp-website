// Devuelve el país del visitante según la geolocalización de Vercel.
// La portada solo lo usa para elegir el encabezado; el HTML servido es siempre el mismo.
module.exports = function handler(req, res) {
  var pais = String(req.headers["x-vercel-ip-country"] || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(pais)) pais = "";
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store");
  res.statusCode = 200;
  res.end(JSON.stringify({ pais: pais || null }));
};
