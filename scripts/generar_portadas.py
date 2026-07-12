#!/usr/bin/env python3
# Genera portadas (1200x630) de marca Nexo para los artículos.
# Se usan como portada en las tarjetas y como imagen Open Graph al compartir.
# Cada portada lleva una ilustración temática: se elige por slug en
# ICONO_POR_SLUG y, si el slug no está mapeado, por categoría en
# ICONO_POR_CATEGORIA (así los artículos nuevos salen ilustrados solos).
#
# Uso:
#   python3 scripts/generar_portadas.py <slug> <categoría> <título>
#       → genera solo assets/og/<slug>.png (así lo llama nuevo-articulo.mjs)
#   python3 scripts/generar_portadas.py
#       → regenera la lista histórica COVERS de abajo
import os
import sys
from PIL import Image, ImageDraw, ImageFont


def _primera_fuente(*candidatas):
    for ruta in candidatas:
        if os.path.exists(ruta):
            return ruta
    raise FileNotFoundError(
        "No se encontró ninguna fuente TTF; instalar fonts-dejavu o ajustar rutas: "
        + ", ".join(candidatas)
    )


FONTS = "/mnt/skills/examples/canvas-design/canvas-fonts"
DEJAVU = "/usr/share/fonts/truetype/dejavu"
SERIF = _primera_fuente(  # ~ Playfair Display
    os.path.join(FONTS, "Gloock-Regular.ttf"),
    os.path.join(DEJAVU, "DejaVuSerif.ttf"),
)
SANS_B = _primera_fuente(
    os.path.join(FONTS, "InstrumentSans-Bold.ttf"),
    os.path.join(DEJAVU, "DejaVuSans-Bold.ttf"),
)
SANS_R = _primera_fuente(
    os.path.join(FONTS, "InstrumentSans-Regular.ttf"),
    os.path.join(DEJAVU, "DejaVuSans.ttf"),
)

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "og")
os.makedirs(OUT, exist_ok=True)

W, H = 1200, 630
NAVY   = (10, 31, 68)
NAVY2  = (7, 22, 49)
LBLUE  = (184, 197, 214)
WHITE  = (255, 255, 255)
SMOKE  = (143, 163, 189)
LINE   = (31, 51, 80)
CHIPBG = (16, 35, 66)

# Ilustración temática (lado derecho de la portada)
TRAZO       = (184, 197, 214, 215)   # línea principal
TRAZO_SUAVE = (184, 197, 214, 110)   # línea secundaria
WASH        = (184, 197, 214, 26)    # relleno translúcido
KNOCK       = (9, 27, 59, 255)       # relleno sólido (tapa lo que hay detrás)
TRAZO_W     = 26                     # grosor base en unidades del ícono (0..1000)

ICONO_CENTRO = (952, 288)
ICONO_TAM = 384

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

def fit_title(draw, text, max_w, max_h, max_lines=4, hi=72, lo=38):
    for size in range(hi, lo - 1, -2):
        f = ImageFont.truetype(SERIF, size)
        lines = wrap(draw, text, f, max_w)
        if len(lines) <= max_lines and len(lines) * int(size * 1.12) <= max_h:
            return f, lines, size
    f = ImageFont.truetype(SERIF, lo)
    return f, wrap(draw, text, f, max_w), lo


# ── Íconos temáticos ────────────────────────────────────────────
# Cada ícono se dibuja en un lienzo cuadrado supersampleado con
# coordenadas en unidades 0..1000 (y hacia abajo) y luego se reduce.

class Icono:
    def __init__(self, tam, ss=3):
        self.tam = tam
        self.px = tam * ss
        self.k = self.px / 1000
        self.img = Image.new("RGBA", (self.px, self.px), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.img)

    def _pt(self, p):
        return (p[0] * self.k, p[1] * self.k)

    def _cap(self, p, w, color):
        x, y = p
        r = w * self.k / 2
        self.d.ellipse([x - r, y - r, x + r, y + r], fill=color)

    def linea(self, pts, w=TRAZO_W, color=TRAZO):
        pp = [self._pt(p) for p in pts]
        self.d.line(pp, fill=color, width=round(w * self.k), joint="curve")
        self._cap(pp[0], w, color)
        self._cap(pp[-1], w, color)

    def poligono(self, pts, w=TRAZO_W, fill=None, color=TRAZO):
        pp = [self._pt(p) for p in pts]
        if fill:
            self.d.polygon(pp, fill=fill)
        self.d.line(pp + [pp[0]], fill=color, width=round(w * self.k), joint="curve")
        for p in pp:
            self._cap(p, w, color)

    def circulo(self, c, radio, w=TRAZO_W, fill=None, color=TRAZO):
        x, y = self._pt(c)
        r = radio * self.k
        box = [x - r, y - r, x + r, y + r]
        if fill:
            self.d.ellipse(box, fill=fill)
        self.d.ellipse(box, outline=color, width=round(w * self.k))

    def rrect(self, box, radio, w=TRAZO_W, fill=None, color=TRAZO):
        x0, y0 = self._pt((box[0], box[1]))
        x1, y1 = self._pt((box[2], box[3]))
        if fill:
            self.d.rounded_rectangle([x0, y0, x1, y1], radius=radio * self.k, fill=fill)
        self.d.rounded_rectangle([x0, y0, x1, y1], radius=radio * self.k,
                                 outline=color, width=round(w * self.k))

    def arco(self, box, ini, fin, w=TRAZO_W, color=TRAZO):
        x0, y0 = self._pt((box[0], box[1]))
        x1, y1 = self._pt((box[2], box[3]))
        self.d.arc([x0, y0, x1, y1], ini, fin, fill=color, width=round(w * self.k))

    def render(self):
        return self.img.resize((self.tam, self.tam), Image.LANCZOS)


def icono_balanza(L):
    L.linea([(340, 880), (660, 880)])
    L.linea([(500, 860), (500, 215)])
    L.linea([(255, 265), (745, 265)])
    L.circulo((500, 168), 32)
    for cx in (255, 745):
        L.linea([(cx, 275), (cx - 85, 470)], w=16, color=TRAZO_SUAVE)
        L.linea([(cx, 275), (cx + 85, 470)], w=16, color=TRAZO_SUAVE)
        L.arco((cx - 112, 358, cx + 112, 582), 0, 180)
        L.linea([(cx - 112, 470), (cx + 112, 470)], w=18)

def icono_edificio_persona(L):
    L.circulo((250, 335), 80)
    L.arco((115, 475, 385, 825), 180, 360)
    L.linea([(115, 650), (385, 650)], w=18)
    L.linea([(497, 215), (437, 790)], w=14, color=TRAZO_SUAVE)
    L.poligono([(578, 375), (932, 375), (755, 225)])
    for x in (632, 755, 878):
        L.linea([(x, 428), (x, 690)], w=20)
    L.linea([(600, 428), (910, 428)], w=20)
    L.linea([(588, 745), (922, 745)])
    L.linea([(558, 815), (952, 815)])

def icono_maletin(L):
    L.arco((375, 205, 625, 440), 180, 360)
    L.rrect((150, 320, 850, 810), 45, fill=WASH)
    L.linea([(150, 532), (850, 532)], w=18)
    L.rrect((442, 488, 558, 578), 16, fill=KNOCK)

def icono_alerta_documento(L):
    L.poligono([(200, 150), (540, 150), (650, 260), (650, 840), (200, 840)], fill=WASH)
    L.linea([(540, 150), (540, 260), (650, 260)], w=18)
    for y, x1 in ((385, 560), (475, 560), (565, 455)):
        L.linea([(285, y), (x1, y)], w=18, color=TRAZO_SUAVE)
    L.poligono([(760, 490), (985, 905), (535, 905)], fill=KNOCK)
    L.linea([(760, 630), (760, 760)], w=30)
    L.circulo((760, 838), 17, w=6, fill=TRAZO)

def icono_libros(L):
    L.rrect((215, 380, 785, 525), 22, fill=WASH)
    L.linea([(318, 395), (318, 510)], w=16, color=TRAZO_SUAVE)
    L.rrect((255, 525, 865, 670), 22, fill=WASH)
    L.linea([(758, 540), (758, 655)], w=16, color=TRAZO_SUAVE)
    L.rrect((165, 670, 815, 815), 22, fill=WASH)
    L.linea([(268, 685), (268, 800)], w=16, color=TRAZO_SUAVE)
    L.linea([(110, 815), (910, 815)])

def icono_lupa_grafico(L):
    L.linea([(135, 840), (865, 840)])
    for x0, y0 in ((175, 615), (340, 500), (505, 560), (670, 415)):
        L.rrect((x0, y0, x0 + 120, 840), 12, w=20, fill=WASH)
    L.circulo((690, 315), 175, fill=KNOCK)
    L.linea([(565, 360), (640, 270), (700, 320), (795, 225)], w=22)
    L.linea([(818, 442), (925, 550)], w=44)

def _recibo(L):
    L.poligono([(240, 140), (700, 140), (700, 820), (654, 872), (608, 820),
                (562, 872), (516, 820), (470, 872), (424, 820), (378, 872),
                (332, 820), (286, 872), (240, 820)], fill=WASH)
    for y, x1 in ((305, 610), (395, 610), (485, 505)):
        L.linea([(330, y), (x1, y)], w=18, color=TRAZO_SUAVE)

def icono_factura_check(L):
    _recibo(L)
    L.circulo((775, 685), 158, fill=KNOCK)
    L.linea([(700, 690), (757, 752), (858, 612)], w=30)

def icono_factura_rayo(L):
    _recibo(L)
    L.poligono([(858, 355), (705, 618), (793, 618), (668, 898),
                (935, 535), (843, 535), (938, 355)], w=20, fill=KNOCK)

def icono_porcentaje(L):
    L.circulo((185, 800), 118, fill=KNOCK)
    L.circulo((185, 800), 74, w=14, color=TRAZO_SUAVE)
    L.linea([(365, 790), (720, 215)], w=30)
    L.circulo((385, 330), 115)
    L.circulo((700, 672), 115)

def icono_carnet(L):
    L.rrect((125, 250, 875, 750), 40, fill=WASH)
    L.linea([(125, 365), (875, 365)], w=18)
    L.rrect((200, 430, 380, 665), 18, w=20)
    L.circulo((290, 512), 36, w=16)
    L.arco((228, 568, 352, 700), 180, 360, w=16)
    L.linea([(450, 470), (800, 470)], w=18, color=TRAZO_SUAVE)
    L.linea([(450, 550), (800, 550)], w=18, color=TRAZO_SUAVE)
    L.linea([(450, 630), (660, 630)], w=18, color=TRAZO_SUAVE)

def icono_ruta(L):
    # curva punteada (bezier cúbica) con hitos y bandera al final
    p0, p1, p2, p3 = (190, 858), (585, 905), (215, 430), (728, 330)
    pts = []
    for i in range(61):
        t = i / 60
        u = 1 - t
        x = u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0]
        y = u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1]
        pts.append((x, y))
    for i in range(0, 59, 4):
        L.linea([pts[i], pts[i + 1]], w=16, color=TRAZO_SUAVE)
    L.circulo(pts[0], 42, fill=KNOCK)
    L.circulo(pts[30], 42, fill=KNOCK)
    L.linea([(728, 330), (728, 148)], w=20)
    L.poligono([(728, 158), (890, 205), (728, 252)], w=18, fill=WASH)
    L.circulo((728, 330), 42, fill=KNOCK)

def icono_calculadora(L):
    L.rrect((250, 130, 750, 870), 44, fill=WASH)
    L.rrect((320, 210, 680, 330), 16, w=20)
    for y in (445, 580, 715):
        for x in (375, 500, 625):
            L.circulo((x, y), 40, w=20)

def icono_lista_check(L):
    L.rrect((215, 175, 785, 865), 34, fill=WASH)
    L.rrect((405, 112, 595, 228), 28, fill=KNOCK)
    for i, y in enumerate((350, 480, 610, 740)):
        L.rrect((285, y - 34, 353, y + 34), 10, w=16)
        L.linea([(400, y), (700, y)], w=16, color=TRAZO_SUAVE)
        if i < 3:
            L.linea([(299, y), (317, y + 17), (344, y - 15)], w=14)

def icono_periodico(L):
    L.rrect((150, 230, 850, 770), 24, fill=WASH)
    L.rrect((215, 300, 545, 520), 12, w=16, fill=WASH)
    for y in (320, 390, 460):
        L.linea([(610, y), (785, y)], w=16, color=TRAZO_SUAVE)
    for y in (600, 670):
        L.linea([(215, y), (785, y)], w=16, color=TRAZO_SUAVE)

ICONO_POR_SLUG = {
    "comerciante-individual-vs-sociedad": icono_edificio_persona,
    "obligaciones-laborales-empleador-honduras": icono_maletin,
    "multas-comunes-sar-como-evitarlas": icono_alerta_documento,
    "libros-contables-obligatorios-honduras": icono_libros,
    "como-leer-estados-financieros": icono_lupa_grafico,
    "factura-electronica-honduras-que-viene": icono_factura_rayo,
    "impuestos-empresa-honduras-isv-isr-retenciones": icono_porcentaje,
    "que-es-el-rtn-y-como-obtenerlo-sar": icono_carnet,
    "facturacion-conforme-sar-honduras": icono_factura_check,
    "constituir-sociedad-honduras-ruta-formalizacion": icono_ruta,
    "contador-externo-o-departamento-contable": icono_calculadora,
    "cierre-fiscal-honduras-7-puntos-clave": icono_lista_check,
    "default": icono_balanza,
}

ICONO_POR_CATEGORIA = {
    "Fiscal / SAR": icono_porcentaje,
    "Guía": icono_ruta,
    "Contable": icono_libros,
    "Financiero": icono_lupa_grafico,
    "Laboral": icono_maletin,
    "Análisis legal": icono_balanza,
    "Decretos": icono_balanza,
    "Noticias": icono_periodico,
}

def elegir_icono(slug, category):
    if slug and slug in ICONO_POR_SLUG:
        return ICONO_POR_SLUG[slug]
    if category and category in ICONO_POR_CATEGORIA:
        return ICONO_POR_CATEGORIA[category]
    return icono_balanza

def capa_ilustracion(dibujar):
    capa = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cd = ImageDraw.Draw(capa)
    cx, cy = ICONO_CENTRO
    # halo radial suave detrás del ícono
    radio = 250
    for r in range(radio, 0, -3):
        a = int(20 * (1 - r / radio))
        if a:
            cd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(184, 197, 214, a))
    # anillos decorativos
    for r in (212, 250):
        cd.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(184, 197, 214, 26), width=2)
    L = Icono(ICONO_TAM)
    dibujar(L)
    icono = L.render()
    capa.alpha_composite(icono, (cx - ICONO_TAM // 2, cy - ICONO_TAM // 2))
    return capa

def make_cover(path, category, title, slug=None):
    img = base_canvas().convert("RGBA")
    img = Image.alpha_composite(img, capa_ilustracion(elegir_icono(slug, category)))
    img = img.convert("RGB")
    d = ImageDraw.Draw(img)
    MX = 90
    max_w = 620  # columna de texto; la ilustración ocupa la derecha

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
        ty0 = 266
    else:
        ty0 = 230

    # título (a la izquierda, sin invadir la ilustración ni el pie)
    tf, lines, size = fit_title(d, title, max_w, max_h=510 - ty0)
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
    ("comerciante-individual-vs-sociedad.png", "Guía",
     "Comerciante individual o sociedad mercantil: cuál conviene en Honduras"),
    ("obligaciones-laborales-empleador-honduras.png", "Laboral",
     "Obligaciones laborales del empleador en Honduras: el costo real de contratar en regla"),
    ("multas-comunes-sar-como-evitarlas.png", "Fiscal / SAR",
     "Multas más comunes del SAR y cómo evitarlas en su MIPYME"),
    ("libros-contables-obligatorios-honduras.png", "Contable",
     "Libros contables obligatorios en Honduras: qué exige la ley y por qué te protegen"),
    ("como-leer-estados-financieros.png", "Financiero",
     "Cómo leer tus estados financieros: guía para dueños de negocio"),
    ("factura-electronica-honduras-que-viene.png", "Fiscal / SAR",
     "Factura electrónica en Honduras: qué viene y cómo preparar su MIPYME"),
    ("default.png", None,
     "Leyes y decretos, traducidos a decisiones."),
]

if __name__ == "__main__":
    if len(sys.argv) == 4:
        # Modo de un solo artículo: <slug> <categoría> <título>
        slug, categoria, titulo = sys.argv[1], sys.argv[2], sys.argv[3]
        make_cover(os.path.join(OUT, f"{slug}.png"), categoria, titulo, slug=slug)
    elif len(sys.argv) == 1:
        for fn, cat, title in COVERS:
            make_cover(os.path.join(OUT, fn), cat, title, slug=fn[:-4])
    else:
        print("Uso: generar_portadas.py [<slug> <categoría> <título>]", file=sys.stderr)
        sys.exit(2)
