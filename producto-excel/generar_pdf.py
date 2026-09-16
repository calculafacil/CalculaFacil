# -*- coding: utf-8 -*-
"""Genera la guia de usuario de CalculaFacil en PDF (fpdf2)."""
import os

from fpdf import FPDF

NAVY = (31, 78, 121)
BLUE = (46, 117, 182)
GREEN = (84, 130, 53)
AMBER_BG = (255, 242, 204)
GRAY = (95, 95, 95)
DARK = (40, 40, 40)

FONTS_DIR = r"C:\Windows\Fonts"

OUT_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "CalculaFacil_Guia_2026-2027.pdf",
)


class Guia(FPDF):
    def __init__(self):
        super().__init__(orientation="portrait", unit="mm", format="A4")
        self.add_font("Arial", "", os.path.join(FONTS_DIR, "arial.ttf"))
        self.add_font("Arial", "B", os.path.join(FONTS_DIR, "arialbd.ttf"))
        self.add_font("Arial", "I", os.path.join(FONTS_DIR, "ariali.ttf"))
        self.set_auto_page_break(auto=True, margin=16)
        self.set_margins(16, 16, 16)

    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("Arial", "", 8)
        self.set_text_color(*GRAY)
        self.cell(0, 6, "CalculaFácil  ·  Guía de uso 2026/2027", align="L")
        self.ln(2)
        self.set_draw_color(*NAVY)
        self.set_line_width(0.6)
        self.line(16, 11, 194, 11)
        self.ln(4)

    def footer(self):
        self.set_y(-14)
        self.set_draw_color(200, 200, 200)
        self.set_line_width(0.3)
        self.line(16, self.get_y(), 194, self.get_y())
        self.set_font("Arial", "I", 8)
        self.set_text_color(*GRAY)
        self.cell(0, 6, "CalculaFácil · calculafacil.app · plantilla para estudiantes", align="L")
        self.cell(0, 6, f"{self.page_no()}", align="R")

    def h1(self, text):
        self.set_font("Arial", "B", 13)
        self.set_text_color(255, 255, 255)
        self.set_fill_color(*NAVY)
        self.cell(0, 8.5, text, fill=True)
        self.ln(10)

    def h2(self, text):
        self.set_font("Arial", "B", 11)
        self.set_text_color(*NAVY)
        self.cell(0, 6, text)
        self.ln(7)

    def para(self, text):
        self.set_font("Arial", "", 10)
        self.set_text_color(*DARK)
        self.multi_cell(0, 5.4, text)
        self.ln(1.5)

    def bullet(self, text):
        self.set_font("Arial", "", 10)
        self.set_text_color(*DARK)
        x0 = self.get_x()
        self.cell(5, 5.4, "•")
        self.multi_cell(0, 5.4, text)
        self.ln(0.5)

    def note(self, text):
        self.set_font("Arial", "I", 9)
        self.set_text_color(*GRAY)
        self.set_fill_color(*AMBER_BG)
        self.multi_cell(0, 5.0, text, fill=True)
        self.ln(2)

    def steps(self, items):
        for i, text in enumerate(items, start=1):
            self.set_font("Arial", "B", 10)
            self.set_text_color(255, 255, 255)
            self.set_fill_color(*BLUE)
            n = f"{i}."
            self.cell(8, 6, n, fill=True, align="C")
            self.set_font("Arial", "", 10)
            self.set_text_color(*DARK)
            self.multi_cell(0, 6, "  " + text)
            self.ln(0.5)


pdf = Guia()

# ---------- PORTADA ----------
pdf.add_page()
pdf.set_fill_color(*NAVY)
pdf.rect(0, 0, 210, 297, "F")
pdf.ln(40)
pdf.set_font("Arial", "B", 34)
pdf.set_text_color(255, 255, 255)
pdf.cell(0, 14, "CALCULAFÁCIL", align="C")
pdf.ln(18)
pdf.set_font("Arial", "B", 16)
pdf.cell(0, 9, "Control de asistencia y notas 2026/2027", align="C")
pdf.ln(12)
pdf.set_font("Arial", "", 12)
pdf.set_text_color(214, 224, 240)
pdf.cell(0, 8, "Guía de uso · 5 minutos y a tu día a día", align="C")
pdf.ln(22)

pdf.set_fill_color(*BLUE)
pdf.set_text_color(255, 255, 255)
pdf.set_font("Arial", "B", 11)
pdf.set_x(30)
pdf.cell(150, 10, "NOTAS · ASISTENCIA · MEDIA SIMPLE · OBJETIVO", align="C", fill=True)
pdf.ln(12)
pdf.set_x(30)
pdf.cell(150, 10, "MINI-CALCULADORA DE EXAMEN", align="C", fill=True)
pdf.ln(30)
pdf.set_font("Arial", "", 10)
pdf.set_text_color(214, 224, 240)
pdf.cell(0, 6, "Incluye además un archivo EJEMPLO ya rellenado para verlo funcionando.", align="C")
pdf.ln(90)
pdf.set_font("Arial", "I", 10)
pdf.cell(0, 6, "CalculaFácil · calculafacil.app", align="C")

# ---------- QUÉ ES ----------
pdf.add_page()
pdf.h1("QUÉ ES Y QUÉ INCLUYE")
pdf.para(
    "CalculaFácil es un cuaderno digital para estudiantes en Excel (también funciona en LibreOffice, "
    "gratis, y en Google Sheets). Lleva el control de tu asistencia por asignatura, tus notas y pesos, "
    "tu nota final ponderada y tu objetivo de media, todo calculado solo."
)
pdf.h2("Las 5 pestañas")
pdf.bullet("PORTADA: resumen visual y los 4 pasos para empezar.")
pdf.bullet("INSTRUCCIONES: esta guía dentro del propio archivo.")
pdf.bullet("ASISTENCIA: registro diario de faltas, justificadas y retrasos, y tabla por asignatura automática.")
pdf.bullet("NOTAS: hasta 5 notas por asignatura, pesos en % y nota final ponderada.")
pdf.bullet("MI CURSO: tu cuadro de mandos con la media simple, la asistencia global y tu objetivo.")
pdf.note(
    "Es un producto de pago único, sin suscripción y sin caducidad. Puedes duplicar las hojas para usar la "
    "plantilla varios cursos."
)

pdf.h2("ANTES DE EMPEZAR")
pdf.steps(
    [
        "Abre el archivo con Excel 2016 o superior. Si usas LibreOffice o WPS, también funciona.",
        "Las fórmulas se calculan automáticamente al abrir el archivo. Si por lo que sea Excel no actualizara, "
        "activa el cálculo automático: Archivo > Opciones > Fórmulas > Cálculo automático.",
        "Guarda una copia del archivo original donde no la borres por error.",
    ]
)
pdf.note(
    "Te recomendamos abrir primero el archivo EJEMPLO: así ves cómo queda la plantilla con datos reales y "
    "te sirve de referencia."
)

# ---------- ASISTENCIA ----------
pdf.add_page()
pdf.h1("HOJA ASISTENCIA · PASO A PASO")
pdf.steps(
    [
        "Asignaturas: en la tabla «ASISTENCIA POR ASIGNATURA» escribe el nombre de cada asignatura en la "
        "primera columna (una por fila, hasta 20). Es la única vez que las escribes: luego las eliges con "
        "desplegables en NOTAS y en el registro, y en MI CURSO aparecen solas.",
        "Clases previstas: en la segunda columna (CLASES PREVISTAS) pon cuántas clases tendrá esa asignatura "
        "durante el curso. Es el número sobre el que se calcula tu %.",
        "Registro diario: arriba está el registro por fecha. Cada vez que falte, marca una X en la columna "
        "correcta: FALTA INJUSTIFICADA, FALTA JUSTIFICADA o RETRASO. En Asignatura hay desplegables con tu lista.",
        "Configuración global: en CONFIGURACIÓN GLOBAL cambia el MÍNIMO DE ASISTENCIA PERMITIDO (normalmente "
        "80 %) y cuánto equivale un retraso (0,5 por defecto; 0 = no cuenta, 1 = falta completa).",
        "Resultado: la tabla de abajo muestra por asignatura el % de asistencia y el estado: verde A SALVO, "
        "ámbar ATENCIÓN (justo en el límite) o rojo PELIGRO.",
    ]
)
pdf.note(
    "Las faltas justificadas no restan en esta plantilla. Si tu centro las descuenta igual, márcalas también "
    "en FALTA INJUSTIFICADA."
)

# ---------- NOTAS ----------
pdf.h1("HOJA NOTAS · PASO A PASO")
pdf.steps(
    [
        "Elige en cada fila la asignatura con el desplegable (sale de tu lista de ASISTENCIA). Puedes ponerlas "
        "en el orden que quieras y quitar la que ya no curses.",
        "Escribe hasta 5 notas por asignatura (de 1 a 10; usa coma para decimales, p. ej. 7,5).",
        "PESO (%): lo que vale cada asignatura en tu centro. Lo normal es que sumen 100; aunque no sumen 100, "
        "la NOTA FINAL PONDERADA sigue siendo correcta.",
        "La MEDIA de cada asignatura se calcula sola, ignorando las casillas vacías.",
        "Mini-calculadora: escribe la nota que quieres sacar, tu media actual y el peso del examen en %, y te "
        "dirá qué nota te hace falta en el examen (orientativo).",
    ]
)

# ---------- MI CURSO ----------
pdf.h1("HOJA MI CURSO · TU CUADRO DE MANDOS")
pdf.bullet("MEDIA SIMPLE DEL CURSO: la media de tus asignaturas, todas cuentan igual.")
pdf.bullet("ASISTENCIA GLOBAL: tu % total con semáforo frente al mínimo permitido.")
pdf.bullet("TOTAL DE FALTAS: cuántas llevas en todo el curso.")
pdf.bullet("MÍNIMO PERMITIDO: el % que configuraste en ASISTENCIA.")
pdf.bullet(
    "TU OBJETIVO DE NOTA: escribe en la casilla ámbar la nota que quieres conseguir y te dirá cuánto "
    "te falta comparado con tu media simple."
)
pdf.bullet("Tabla por asignatura: se rellena sola con tu lista de ASISTENCIA. No escribes ni borras nada "
           "aquí; para quitar una asignatura, bórrala de la lista en ASISTENCIA.")

# ---------- EJEMPLO ----------
pdf.add_page()
pdf.h1("EJEMPLO RESUELTO (qué esperar)")
pdf.para(
    "El archivo EJEMPLO viene ya relleno con un curso completo de muestra: 8 asignaturas con sus clases "
    "previstas, un mes de registro (faltas, justificadas y retrasos), notas y pesos. Abre la pestaña "
    "MI CURSO y verás el resumen calculado: MEDIA SIMPLE DEL CURSO, NOTA FINAL PONDERADA, asistencia global "
    "con semáforo y la tabla por asignatura con su estado."
)
pdf.para(
    "Observa que la asignatura de ejemplo «Lengua» está en ATENCIÓN (ámbar), justo en el mínimo permitido: "
    "así verás el aviso en acción. La mini-calculadora de NOTAS te muestra cómo estimar la nota que necesitas "
    "en un examen (orientativo)."
)
pdf.note(
    "Prueba a tocar el EJEMPLO sin miedo: añade una asignatura en ASISTENCIA y verás que aparece sola en "
    "MI CURSO y en el desplegable de NOTAS; bórrala y el resto queda intacto. Así funciona de verdad."
)

# ---------- TRUCOS ----------
pdf.h1("TRUCOS QUE TE AHORRARÁN PROBLEMAS")
pdf.bullet("Imprimir: Archivo > Imprimir, orientación horizontal y «ajustar a una página». Cada hoja ya viene "
           "configurada para imprimir bien en A4.")
pdf.bullet("Protección: los cálculos van bloqueados a propósito (con contraseña) para que no se rompan. "
           "Todos los campos que debes tocar van en color y están desbloqueados; no necesitas desproteger "
           "nada. Si algo se borra por error, Ctrl+Z lo deshace.")
pdf.bullet("Móvil: funciona en la app de Excel para el móvil (edición básica). Para el día a día, mejor en el "
           "ordenador.")
pdf.bullet("Borrar datos entre usos: borra solo las celdas de color (ámbar y grises editables), no las blancas "
           "con fórmulas.")
pdf.bullet("Quitar el EJEMPLO: si reciclas el archivo EJEMPLO, vacía el registro y la tabla por asignatura del todo.")

# ---------- FAQ ----------
pdf.h1("PREGUNTAS FRECUENTES")
pdf.h2("¿Mi centro exige otro porcentaje?")
pdf.para("Cámbialo en CONFIGURACIÓN GLOBAL de ASISTENCIA. Los colores se recalculan solos.")
pdf.h2("¿Las faltas justificadas restan?")
pdf.para("En la plantilla no restan (solo restan las injustificadas y los retrasos). Si tu centro las cuenta, "
         "ponlas también como FALTA INJUSTIFICADA.")
pdf.h2("¿Cuánto equivale un retraso?")
pdf.para("Lo decides tú en CONFIGURACIÓN GLOBAL (por defecto 0,5 = media falta). No hay una regla universal.")
pdf.h2("¿Puedo usar más de 20 asignaturas?")
pdf.para("El hueco es de 20 filas. Si necesitas más, agrupa asignaturas menores o guarda una copia del archivo.")
pdf.h2("¿Qué pasa si meto más faltas que clases previstas?")
pdf.para("El % nunca baja de 0 y el estado avisa con rojo PELIGRO. No da errores.")
pdf.h2("¿Es una herramienta oficial?")
pdf.para("No. Es orientativa y de control personal; no sustituye la normativa de tu centro ni a tu profesor o "
         "secretaría.")

pdf.h1("LICENCIA DE USO")
pdf.para(
    "Has comprado esta guía y el archivo Excel que la acompaña en CalculaFácil (calculafacil.app) para tu uso "
    "personal: llevar el control de tu propio curso 2026/2027. Puedes usarlos en todos tus dispositivos personales."
)
pdf.bullet("Queda PROHIBIDO redistribuir el archivo Excel o esta guía, pasárselos a otras personas, subirlos a internet o revenderlos.")
pdf.bullet("Cada comprador debe hacerse con su propia copia en calculafacil.app. Es un producto de pago único.")
pdf.note(
    "Un precio pequeño permite que quien lo usa lo tenga legal. Si aparece en algún grupo, sube el aviso: "
    "la licencia prohíbe compartirlo."
)

pdf.h1("ÚLTIMO CONSEJO")
pdf.para(
    "Échale un vistazo 5 minutos cada semana (o cada 15 días). La evaluación continua se juega con constancia, "
    "no entrando en pánico en junio. Con esta plantilla nunca te sorprenderá una falta que no contabas."
)
pdf.ln(3)
pdf.set_font("Arial", "B", 11)
pdf.set_text_color(*GREEN)
pdf.cell(0, 6, "¡A por un curso tranquilo!", align="C")
pdf.ln(8)

pdf.output(OUT_PATH)
print("OK ->", OUT_PATH)