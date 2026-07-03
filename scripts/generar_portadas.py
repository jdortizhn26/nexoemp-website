#!/usr/bin/env python3
# Genera portadas (1200x630) de marca Nexo para los artículos.
# Se usan como portada en las tarjetas y como imagen Open Graph al compartir.
import os
from PIL import Image, ImageDraw, ImageFont

FONTS = "/mnt/skills/examples/canvas-design/canvas-fonts"
SERIF      = os.path.join(FONTS, "Gloock-Regular.ttf")        # ~ Playfair Display
SANS_B     = os.path.join(FONTS, "InstrumentSans-Bold.ttf")
SANS_R     = os.path.join(FONTS, "InstrumentSans-Regular.ttf")

OUT = "/home/user/nexoemp-website/assets/og"
os.makedirs(OUT, exist_ok=True)

W, H = 1200, 630
NAVY   = (10, 31, 68)
NAVY2  = (7, 22, 49)
LBLUE  = (184, 197, 214)
WHITE  = (255, 255, 255)
SMOKE  = (143, 163, 189)
LINE   = (31, 51, 80)
CHIPBG = (16, 35, 66)

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def base_canvas():
    img = Image.new("RGB", (W, H), NAVY)
    px = img.load()
    # gradiente vertical navy -> navy2
    for y in range(H):
        c = lerp(NAVY, NAVY2, y / H)
        for x in range(W):
            px[x, y] = c
    # rejilla sutil (como el hero), más visible arriba-izquierda
    grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    step = 60
    for gx in range(0, W, step):
        gd.line([(gx, 0), (gx, H)], fill=(184, 197, 214, 10), width=1)
    for gy in range(0, H, step):
        gd.line([(0, gy), (W, gy)], fill=(184, 197, 214, 10), width=1)
    img = Image.alpha_composite(img.convert("RGBA"), grid).convert("RGB")
    return img

def draw_tracked(draw, pos, text, font, fill, tracking=0):
    x, y = pos
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking
    return x

def wrap(draw, text, font, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if draw.textlength(test, font=font) <= max_w:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines

def fit_title(draw, text, max_w, max_lines=4, hi=80, lo=44):
    for size in range(hi, lo - 1, -2):
        f = ImageFont.truetype(SERIF, size)
        lines = wrap(draw, text, f, max_w)
        if len(lines) <= max_lines:
            return f, lines, size
    f = ImageFont.truetype(SERIF, lo)
    return f, wrap(draw, text, f, max_w), lo

def make_cover(path, category, title):
    img = base_canvas()
    d = ImageDraw.Draw(img)
    MX = 90
    max_w = W - MX * 2

    # barra de acento (como el ::before de las tarjetas)
    d.rectangle([MX, 96, MX + 4, 150], fill=LBLUE)

    # etiqueta de sección
    lab = ImageFont.truetype(SANS_B, 22)
    d.line([(MX + 24, 122), (MX + 64, 122)], fill=LBLUE, width=2)
    draw_tracked(d, (MX + 80, 110), "ANÁLISIS & NOTICIAS", lab, LBLUE, tracking=3)

    # chip de categoría
    if category:
        cf = ImageFont.truetype(SANS_B, 20)
        ctxt = category.upper()
        tw = sum(d.textlength(c, font=cf) + 3 for c in ctxt)
        cx0, cy0 = MX, 178
        d.rounded_rectangle([cx0, cy0, cx0 + tw + 36, cy0 + 44], radius=6,
                            fill=CHIPBG, outline=LBLUE, width=2)
        draw_tracked(d, (cx0 + 18, cy0 + 9), ctxt, cf, LBLUE, tracking=3)
        ty0 = 270
    else:
        ty0 = 230

    # título
    tf, lines, size = fit_title(d, title, max_w, max_lines=4)
    lh = int(size * 1.12)
    y = ty0
    for ln in lines:
        d.text((MX, y), ln, font=tf, fill=WHITE)
        y += lh

    # pie: wordmark + dominio
    d.line([(MX, H - 96), (W - MX, H - 96)], fill=LINE, width=1)
    wm = ImageFont.truetype(SERIF, 30)
    d.text((MX, H - 74), "Nexo Empresarial", font=wm, fill=LBLUE)
    dom = ImageFont.truetype(SANS_R, 20)
    dtxt = "nexoemp.com"
    dw = d.textlength(dtxt, font=dom)
    d.text((W - MX - dw, H - 68), dtxt, font=dom, fill=SMOKE)

    img.save(path, "PNG")
    print("→", path, f"({size}px, {len(lines)} líneas)")

COVERS = [
    ("cierre-fiscal-honduras-7-puntos-clave.png", "Fiscal / SAR",
     "Cierre fiscal en Honduras: 7 puntos que revisar antes de cerrar el período"),
    ("constituir-sociedad-honduras-ruta-formalizacion.png", "Guía",
     "Constituir una sociedad en Honduras: la ruta completa de formalización"),
    ("impuestos-empresa-honduras-isv-isr-retenciones.png", "Fiscal / SAR",
     "Impuestos de una empresa en Honduras: ISV, ISR y retenciones explicados"),
    ("que-es-el-rtn-y-como-obtenerlo-sar.png", "Guía",
     "Qué es el RTN y cómo obtenerlo ante el SAR"),
    ("facturacion-conforme-sar-honduras.png", "Fiscal / SAR",
     "Facturación conforme al SAR: qué debe tener una factura legal en Honduras"),
    ("contador-externo-o-departamento-contable.png", "Contable",
     "¿Contador externo o departamento contable? Qué le conviene a tu empresa"),
    ("default.png", None,
     "Leyes y decretos, traducidos a decisiones."),
]

for fn, cat, title in COVERS:
    make_cover(os.path.join(OUT, fn), cat, title)
