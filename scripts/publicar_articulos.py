#!/usr/bin/env python3
"""Ensambla y publica artículos del blog a partir de un JSON.

Uso: python3 scripts/publicar_articulos.py <articulos.json>

El JSON es una lista de objetos:
  { slug, category, date (YYYY-MM-DD), title, excerpt, lead,
    metaDescription, keywords, bodyHtml }

Genera para cada uno: la portada PNG (assets/og/<slug>.png), la página
analisis/<slug>.html, y agrega su entrada a assets/articles.js y sitemap.xml.
"""
import sys, os, json, html
from generar_portadas import make_cover, OUT as OG_OUT

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANALISIS = os.path.join(ROOT, "analisis")
ARTICLES_JS = os.path.join(ROOT, "assets", "articles.js")
SITEMAP = os.path.join(ROOT, "sitemap.xml")

MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto',
         'septiembre','octubre','noviembre','diciembre']

def fecha_humana(iso):
    y, m, d = iso.split("-")
    return f"{int(d)} {MESES[int(m)-1]} {y}"

def esc_attr(s):
    return html.escape(s, quote=True)

PAGE = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>{title_attr} — Nexo Empresarial</title>
<meta name="description" content="{meta_desc}"/>
<meta name="keywords" content="{keywords}"/>
<meta name="robots" content="index, follow"/>
<link rel="canonical" href="{url}"/>
<meta property="og:type" content="article"/>
<meta property="og:site_name" content="Nexo Empresarial"/>
<meta property="og:title" content="{title_attr}"/>
<meta property="og:description" content="{meta_desc}"/>
<meta property="og:image" content="{img}"/>
<meta property="og:url" content="{url}"/>
<meta property="og:locale" content="es_HN"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="{title_attr}"/>
<meta name="twitter:description" content="{meta_desc}"/>
<meta name="twitter:image" content="{img}"/>
<link rel="icon" type="image/png" href="../assets/favicon.png"/>
<link rel="apple-touch-icon" href="../assets/logo.png"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="../assets/site.css"/>
<script type="application/ld+json">
{jsonld}
</script>
</head>
<body>

<nav>
  <div class="nav-inner">
    <a href="../index.html" style="display:flex;align-items:center;">
      <img src="../assets/logo.png" class="nav-logo" alt="Nexo Empresarial"/>
    </a>
    <div class="nav-links">
      <a href="../index.html#servicios">Servicios</a>
      <a href="../index.html#labs">Labs</a>
      <a href="../index.html#demos">Demos</a>
      <a href="../index.html#nosotros">Nosotros</a>
      <a href="./">Análisis</a>
      <a href="../index.html#contacto" class="nav-cta">Contactar</a>
    </div>
  </div>
</nav>

<header class="page-head">
  <div class="container container-sm">
    <a href="./" class="back-link">← Todos los análisis</a>
    <div class="article-hero-meta">
      <span class="article-cat">{category}</span>
      <span class="article-date">{fecha}</span>
    </div>
    <h1 class="article-title">{title}</h1>
    <p class="article-lead">{lead}</p>
    <p class="article-byline">Por <strong>Dirección profesional</strong> · Nexo Empresarial</p>
  </div>
</header>

<article class="article-body">
  <div class="container container-sm">
    <div class="prose">
{body}
    </div>

    <div class="article-disclaimer">
      Contenido informativo de carácter general; no constituye asesoría legal,
      fiscal o contable para un caso particular. La normativa hondureña cambia y
      cada empresa tiene circunstancias propias; verifica la información vigente.
    </div>

    <div class="article-cta">
      <h4>¿Quieres resolver esto con acompañamiento profesional?</h4>
      <p>Analizamos tu caso y te decimos, con claridad, qué conviene hacer.</p>
      <a href="../index.html#contacto" class="btn btn-primary">Solicitar diagnóstico →</a>
    </div>
  </div>
</article>

<footer>
  <div class="container">
    <p>© 2026 <span class="brand">Nexo Empresarial</span> · Derecho, contabilidad y fiscal · Honduras</p>
    <p>Un equipo multidisciplinario · Derecho · Contabilidad · Fiscal · Finanzas · Tecnología</p>
  </div>
</footer>

</body>
</html>
"""

def build_jsonld(a, url, img):
    return json.dumps({
        "@context": "https://schema.org", "@type": "Article",
        "headline": a["title"], "description": a.get("metaDescription", a["excerpt"]),
        "image": img, "datePublished": a["date"], "inLanguage": "es-HN",
        "author": {"@type": "Organization", "name": "Nexo Empresarial"},
        "publisher": {"@type": "Organization", "name": "Nexo Empresarial",
                      "logo": {"@type": "ImageObject", "url": "https://nexoemp.com/assets/logo.png"}},
        "mainEntityOfPage": url,
    }, ensure_ascii=False, indent=2)

def write_page(a):
    url = f"https://nexoemp.com/analisis/{a['slug']}.html"
    img = f"https://nexoemp.com/assets/og/{a['slug']}.png"
    page = PAGE.format(
        title_attr=esc_attr(a["title"]), title=html.escape(a["title"]),
        meta_desc=esc_attr(a.get("metaDescription", a["excerpt"])),
        keywords=esc_attr(a.get("keywords", "")),
        url=url, img=img, category=html.escape(a["category"]),
        fecha=fecha_humana(a["date"]), lead=html.escape(a["lead"]),
        body=a["bodyHtml"], jsonld=build_jsonld(a, url, img),
    )
    path = os.path.join(ANALISIS, f"{a['slug']}.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(page)
    print("página:", path)

def update_articles_js(arts):
    with open(ARTICLES_JS, encoding="utf-8") as f:
        js = f.read()
    marker = "window.NEXO_ARTICLES = ["
    idx = js.index(marker) + len(marker)
    bloques = []
    for a in arts:
        bloques.append(
            "\n  {\n"
            f"    slug: {json.dumps(a['slug'], ensure_ascii=False)},\n"
            f"    title: {json.dumps(a['title'], ensure_ascii=False)},\n"
            f"    category: {json.dumps(a['category'], ensure_ascii=False)},\n"
            f"    date: {json.dumps(a['date'], ensure_ascii=False)},\n"
            f"    author: \"Nexo Empresarial\",\n"
            f"    excerpt: {json.dumps(a['excerpt'], ensure_ascii=False)}\n"
            "  },"
        )
    js = js[:idx] + "".join(bloques) + js[idx:]
    with open(ARTICLES_JS, "w", encoding="utf-8") as f:
        f.write(js)
    print("articles.js: +", len(arts), "entradas")

def update_sitemap(arts):
    with open(SITEMAP, encoding="utf-8") as f:
        xml = f.read()
    urls = ""
    for a in arts:
        urls += (
            "  <url>\n"
            f"    <loc>https://nexoemp.com/analisis/{a['slug']}.html</loc>\n"
            f"    <lastmod>{a['date']}</lastmod>\n"
            "    <changefreq>yearly</changefreq>\n"
            "    <priority>0.7</priority>\n"
            "  </url>\n"
        )
    xml = xml.replace("</urlset>", urls + "</urlset>")
    with open(SITEMAP, "w", encoding="utf-8") as f:
        f.write(xml)
    print("sitemap.xml: +", len(arts), "urls")

def main():
    with open(sys.argv[1], encoding="utf-8") as f:
        arts = json.load(f)
    for a in arts:
        make_cover(os.path.join(OG_OUT, f"{a['slug']}.png"), a["category"], a["title"])
        write_page(a)
    update_articles_js(arts)
    update_sitemap(arts)
    print(f"\nOK · {len(arts)} artículos publicados.")

if __name__ == "__main__":
    main()
