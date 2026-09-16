import math
import os
import sys
from datetime import date

from openpyxl import Workbook
from openpyxl.chart import BarChart, LineChart, Reference
from openpyxl.formatting.rule import ColorScaleRule, DataBarRule, FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Protection, Side
from openpyxl.styles.colors import Color
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.properties import PageSetupProperties
from openpyxl.worksheet.table import Table, TableStyleInfo

NAVY = "1F4E79"
BLUE = "2E75B6"
LIGHT = "DDEBF7"
AMBER = "FFF2CC"
GREEN = "C6EFCE"
RED = "FFC7CE"
GRAY = "595959"
WHITE = "FFFFFF"
C_GREEN = "006100"
C_RED = "9C0006"
C_AMBER = "9C6500"

THIN = Side(style="thin", color="BFBFBF")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
FILL_GREEN = PatternFill("solid", fgColor=GREEN)
FILL_RED = PatternFill("solid", fgColor=RED)
FILL_AMBER = PatternFill("solid", fgColor=AMBER)
FILL_NAVY = PatternFill("solid", fgColor=NAVY)
FILL_BLUE = PatternFill("solid", fgColor=BLUE)
FILL_LIGHT = PatternFill("solid", fgColor=LIGHT)

SAMPLES = "--ejemplo" in sys.argv
OUT_NAME = "CalculaFacil_2026-2027_EJEMPLO.xlsx" if SAMPLES else "CalculaFacil_2026-2027_LIMPIO.xlsx"
OUT_PATH = os.path.join(os.path.dirname(__file__), OUT_NAME)
PW = "calculafacil"

SAMPLE_SUBJECTS = ["Matemáticas", "Historia", "Lengua", "Física", "Inglés", "Biología", "Filosofía", "Educación Física"]
SAMPLE_CLASSES = [55, 55, 55, 50, 55, 50, 50, 45]
SAMPLE_NOTAS = [
    (7, 8, 6, None, None, 20),
    (6.5, 7, None, None, None, 15),
    (5.5, 4, None, None, None, 15),
    (8, 9, None, None, None, 10),
    (6, 7, 8, None, None, 20),
    (5, 6, None, None, None, 10),
    (7.5, None, None, None, None, 5),
    (9, 10, None, None, None, 5),
]
SAMPLE_REGISTRO = [
    (date(2026, 9, 14), "Lengua", "F", None, "Ejemplo: falta injustificada"),
    (date(2026, 9, 15), "Lengua", "F", None, None),
    (date(2026, 9, 15), "Matemáticas", "F", None, "Ejemplo: falta injustificada"),
    (date(2026, 9, 16), "Lengua", "F", None, None),
    (date(2026, 9, 16), "Historia", "J", None, "Ejemplo: falta justificada (no resta)"),
    (date(2026, 9, 17), "Lengua", "F", None, None),
    (date(2026, 9, 17), "Física", "F", None, None),
    (date(2026, 9, 18), "Lengua", "F", None, None),
    (date(2026, 9, 18), "Inglés", "F", None, None),
    (date(2026, 9, 22), "Lengua", "F", None, None),
    (date(2026, 9, 22), "Biología", "F", None, None),
    (date(2026, 9, 23), "Lengua", "F", None, None),
    (date(2026, 9, 24), "Lengua", "F", None, None),
    (date(2026, 9, 24), "Física", "R", None, "Llegué 5 minutos tarde"),
    (date(2026, 9, 25), "Lengua", "F", None, None),
    (date(2026, 9, 25), "Inglés", "F", None, "Dos faltas en la misma semana"),
    (date(2026, 9, 28), "Lengua", "F", None, None),
    (date(2026, 9, 29), "Lengua", "R", None, None),
    (date(2026, 9, 30), "Lengua", "R", None, "Llegué con retraso"),
]

wb = Workbook()
wb.properties.title = "Control de Asistencia y Notas 2026/2027"
wb.properties.creator = "CalculaFácil"
wb.calculation.fullCalcOnLoad = True


def title_block(ws, last_col, text, sub):
    last = get_column_letter(last_col)
    ws.merge_cells(f"A1:{last}1")
    c = ws["A1"]
    c.value = text
    c.font = Font(bold=True, size=18, color=WHITE)
    c.fill = FILL_NAVY
    c.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 36
    ws.merge_cells(f"A2:{last}2")
    c2 = ws["A2"]
    c2.value = sub
    c2.font = Font(italic=True, size=11, color=GRAY)
    c2.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[2].height = 20


def set_widths(ws, widths):
    for idx, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(idx)].width = w


INSTR = wb.active
INSTR.title = "INSTRUCCIONES"
INSTR.sheet_properties.tabColor = NAVY
set_widths(INSTR, [16, 13, 13, 13, 13, 13, 30])
INSTR.sheet_view.showGridLines = False

INSTR_LAST = 7


def put_line(ws, row, text, fill=None, bold=False, font_color="000000", h=None, center=False):
    last = get_column_letter(INSTR_LAST)
    ws.merge_cells(f"A{row}:{last}{row}")
    cell = ws[f"A{row}"]
    cell.value = text
    cell.font = Font(bold=bold, size=11, color=font_color)
    cell.alignment = Alignment(
        wrap_text=True,
        vertical="top",
        horizontal="center" if center else "left",
    )
    if fill:
        cell.fill = PatternFill("solid", fgColor=fill)
    n_lines = max(1, math.ceil(len(text) / 96)) if text else 1
    ws.row_dimensions[row].height = max(h or 20, n_lines * 17 + 8)
    return row + 1


def section(ws, row, title):
    return put_line(ws, row, title, fill=NAVY, bold=True, font_color=WHITE, h=26)


title_block(INSTR, INSTR_LAST, "BIENVENIDO/A A TU CONTROL 2026/2027", "CalculaFácil · tu cuaderno digital de curso")

r = 4
r = section(INSTR, r, "PARA QUÉ SIRVE ESTE ARCHIVO")
r = put_line(INSTR, r, "Este libro es un cuaderno digital para estudiantes que no quieren jugarse la evaluación continua a la lotería. Tienes 5 pestañas (abajo): PORTADA, INSTRUCCIONES (esta), ASISTENCIA, NOTAS y MI CURSO. Todo se calcula solo.")
r = put_line(INSTR, r, "Regla clave: en muchos centros, perder la EVALUACIÓN CONTINUA depende de tu porcentaje de FALTAS INJUSTIFICADAS sobre las clases. Introduce el porcentaje mínimo que te indique tu centro. Esta plantilla es orientativa y no sustituye la normativa oficial ni la información de tu profesor o secretaría.")
r = r + 1

r = section(INSTR, r, "🚀 EMPIEZA AQUÍ (en 4 pasos)")
r = put_line(INSTR, r, "1. Ve a ASISTENCIA → escribe tus asignaturas en la tabla 'ASISTENCIA POR ASIGNATURA' (primera columna) y las CLASES PREVISTAS de cada una. Revisa en CONFIGURACIÓN GLOBAL el MÍNIMO DE ASISTENCIA PERMITIDO.")
r = put_line(INSTR, r, "2. Registra cada día tus faltas injustificadas, justificadas o retrasos con una X en el registro de arriba.")
r = put_line(INSTR, r, "3. Ve a NOTAS → elige tus asignaturas con el desplegable de la columna ASIGNATURA y escribe tus notas y pesos (%).")
r = put_line(INSTR, r, "4. Mira MI CURSO → tu resumen: media simple, objetivo, asistencia y cómo vas por asignatura. Todo se actualiza solo.")
r = r + 1

r = section(INSTR, r, "HOJA ASISTENCIA · CÓMO USARLA EN 5 PASOS")
r = put_line(INSTR, r, "1. En la tabla 'ASISTENCIA POR ASIGNATURA' escribe cada asignatura y su número de clases previstas. El MÍNIMO DE ASISTENCIA PERMITIDO se pone una sola vez en CONFIGURACIÓN GLOBAL (por defecto 80).")
r = put_line(INSTR, r, "2. En el registro de arriba: en Fecha el día, en Asignatura elige tu asignatura (lista desplegable) y pon una X en FALTA INJUSTIFICADA, FALTA JUSTIFICADA o RETRASO según el caso.")
r = put_line(INSTR, r, "3. Rellena Observaciones si quieres acordarte por qué faltaste. Todo esto se puede escribir a mano o copiar/pegar.")
r = put_line(INSTR, r, "4. La tabla POR ASIGNATURA (abajo) se actualiza sola: faltas, justificadas, retrasos, % de asistencia y el ESTADO de cada asignatura frente a su límite.")
r = put_line(INSTR, r, "5. Cálculo del %: cada falta injustificada cuenta 1 jornada y cada retraso equivale a lo que pongas en CONFIGURACIÓN GLOBAL (0,5 por defecto = media jornada). Las faltas justificadas no restan.")
r = put_line(INSTR, r, "Consejo: no hace falta rellenar las 50 filas del registro; usa las que necesites y deja el resto vacías.")
r = put_line(INSTR, r, "IMPORTANTE: las asignaturas se escriben UNA sola vez, en la tabla POR ASIGNATURA de ASISTENCIA. En NOTAS y en el registro las eliges con desplegables; en MI CURSO aparecen solas. Así todo cruza por nombre: puedes quitar o añadir asignaturas sin que se rompa nada.")
r = r + 1

r = section(INSTR, r, "COLUMNA POR COLUMNA (hoja ASISTENCIA)")
r = put_line(INSTR, r, "FECHA = el día de la clase. ASIGNATURA = elige tu materia (desplegable). FALTA INJUSTIFICADA (X) = faltaste sin justificar. FALTA JUSTIFICADA (X) = justificaste a tiempo (no resta). RETRASO (X) = llegaste tarde (equivale a lo que configures).")
r = put_line(INSTR, r, "Las columnas de la X solo aceptan una X o un espacio vacío (llevan lista desplegable: haz clic en la celda y elige).")
r = r + 1

r = section(INSTR, r, "QUÉ SIGNIFICAN LOS COLORES")
r = put_line(INSTR, r, "VERDE = A SALVO, el % está por encima de tu límite + 1. ÁMBAR = ATENCIÓN, justo en el límite. ROJO = PELIGRO, por debajo del mínimo que marque tu centro.")
r = put_line(INSTR, r, "IMPORTANTE: cambiar el MÍNIMO DE ASISTENCIA PERMITIDO (CONFIGURACIÓN GLOBAL) cambia los COLORES, pero NO los % de asistencia. Los % solo cambian con las X que pongas y con las clases previstas reales de cada asignatura.")
r = r + 1

r = section(INSTR, r, "HOJA NOTAS · CÓMO USARLA")
r = put_line(INSTR, r, "Tienes hueco para hasta 5 notas por asignatura (NOTA 1 a NOTA 5). Usa 1, 2, 3 o 4 si quieres; las casillas que no necesites déjalas vacías. La MEDIA se calcula sola, ignorando las vacías.")
r = put_line(INSTR, r, "PESO (%) = cuánto pesa cada asignatura en tu centro (normalmente suman 100). El TOTAL PESO se pone VERDE cuando suma 100 y ROJO cuando no: ajústalo hasta que se ponga verde.")
r = put_line(INSTR, r, "NOTA FINAL PONDERADA es tu media con pesos: se calcula sola. Aunque tus pesos no sumen 100, sigue siendo tu media ponderada correcta.")
r = put_line(INSTR, r, "Diferencia clave: la MEDIA SIMPLE DEL CURSO (MI CURSO) cuenta todas las asignaturas por igual, mientras que la NOTA FINAL PONDERADA (esta pestaña) da más peso a las asignaturas que más cuentan en tu centro. Son dos medias distintas y de las dos puedes fiarte.")
r = put_line(INSTR, r, "El verde/rojo de la columna MEDIA te dice si cada asignatura está aprobada o suspendida.")
r = put_line(INSTR, r, "Las ASIGNATURAS se eligen con el desplegable de la columna ASIGNATURA (salen de tu lista en ASISTENCIA). Puedes ponerlas en el orden que quieras y quitar la que ya no curses.")
r = put_line(INSTR, r, "Más abajo tienes la mini-calculadora ESTIMACIÓN EXAMEN: escribe la nota deseada, tu nota actual y cuánto pesa el examen, y te dice la nota que te hace falta. (Es un cálculo orientativo, no oficial.)")
r = r + 1

r = section(INSTR, r, "HOJA MI CURSO (TU CUADRO DE MANDOS)")
r = put_line(INSTR, r, "Arriba tienes el resumen del curso: MEDIA SIMPLE DEL CURSO (la media aritmética de tus asignaturas), % DE ASISTENCIA GLOBAL con semáforo, total de FALTAS y el MÍNIMO DE ASISTENCIA PERMITIDO. Todo se lee solo de ASISTENCIA y NOTAS (el mínimo se cambia en ASISTENCIA → CONFIGURACIÓN GLOBAL).")
r = put_line(INSTR, r, "En MI OBJETIVO escribe la nota que quieres conseguir (ej. 8) y verás cuánto te falta. El bloque ASISTENCIA vs MÍNIMO te dice si vas bien, justo o en peligro y con cuánto margen.")
r = put_line(INSTR, r, "La tabla por asignatura se rellena SOLA con tu lista de ASISTENCIA: no se escribe ni borra nada aquí. Las CLASES PREVISTAS se escriben en ASISTENCIA (tabla POR ASIGNATURA): de ahí salen el % ASIST. y el ESTADO. FALTAS, MEDIA, % ASIST. y ESTADO se actualizan solos. Para quitar una asignatura del resumen, bórrala de la lista en ASISTENCIA. La barra de FALTAS es SOLO ORIENTATIVA (su tamaño depende del número de faltas); el ESTADO se calcula con tus clases previstas y el mínimo configurado.")
r = put_line(INSTR, r, "No necesitas desproteger ninguna hoja: todos los campos que debes tocar están desbloqueados y son de color. Los cálculos van bloqueados A PROPÓSITO (con contraseña) para que no se puedan romper por error. Si algo se borra por accidente, pulsa Ctrl+Z (deshacer) y vuelve a la normalidad.")
r = r + 1

r = section(INSTR, r, "PREPARADO PARA IMPRIMIR")
r = put_line(INSTR, r, "Cada hoja está lista para imprimir en A4 horizontal si la necesitas en papel para pegarla en tu corcho. Archivo > Imprimir > Orientación horizontal.")
r = r + 1

r = section(INSTR, r, "LICENCIA DE USO")
r = put_line(INSTR, r, "Has comprado este archivo en CalculaFácil (calculafacil.app) para llevar tu propio curso 2026/2027: notas, faltas y medias. Puedes instalarlo y usarlo en todos tus dispositivos personales.")
r = put_line(INSTR, r, "Queda PROHIBIDO redistribuirlo, pasárselo a otras personas, subirlo a internet o revenderlo. Esta prohibición incluye tanto el archivo Excel como la guía PDF que lo acompaña.")
r = put_line(INSTR, r, "Creado con CalculaFácil · ¿Dudas? Escribe cualquier pregunta en la web y te contestamos. ¡A por un curso tranquilo!")

ASIST = wb.create_sheet("ASISTENCIA")
ASIST.sheet_properties.tabColor = BLUE
set_widths(ASIST, [10, 20, 24, 12, 14, 13, 20, 12, 16])
ASIST.sheet_view.showGridLines = False
ASIST.freeze_panes = "A5"
ASIST.auto_filter.ref = "B4:G54"

ASIST.merge_cells("B1:I1")
at1 = ASIST["B1"]
at1.value = "CONTROL DE ASISTENCIA 2026/2027"
at1.font = Font(bold=True, size=17, color=WHITE)
at1.fill = FILL_NAVY
at1.alignment = Alignment(horizontal="center", vertical="center")
ASIST.row_dimensions[1].height = 40
ASIST.merge_cells("B2:I2")
at2 = ASIST["B2"]
at2.value = "Registra cada día con una X · Cada asignatura se resume abajo, sola"
at2.font = Font(italic=True, size=11, color=GRAY)
at2.alignment = Alignment(horizontal="center", vertical="center")
ASIST.row_dimensions[2].height = 23

headers = ["Fecha", "Asignatura", "Falta injustificada", "Falta justificada", "Retraso", "Observaciones"]
for col, h in enumerate(headers, start=2):
    c = ASIST.cell(row=4, column=col, value=h)
    c.font = Font(bold=True, color=WHITE, size=11)
    c.fill = FILL_BLUE
    c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    c.border = BORDER
ASIST.row_dimensions[4].height = 40

if SAMPLES:
    for i, (fecha, mat, tipo, _, obs) in enumerate(SAMPLE_REGISTRO):
        row = 5 + i
        ASIST.cell(row=row, column=2, value=fecha).number_format = "DD/MM/YYYY"
        ASIST.cell(row=row, column=3, value=mat)
        if tipo == "F":
            ASIST.cell(row=row, column=4, value="X")
        elif tipo == "J":
            ASIST.cell(row=row, column=5, value="X")
        elif tipo == "R":
            ASIST.cell(row=row, column=6, value="X")
        ASIST.cell(row=row, column=7, value=obs)
        ASIST.row_dimensions[row].height = 34

dv = DataValidation(type="list", formula1='"X,"', allow_blank=True, showErrorMessage=True)
dv.error = "Solo se permite escribir X, o dejar la celda vacía."
dv.errorTitle = "Entrada no válida"
dv.prompt = "Escribe X o déjalo vacío."
dv.promptTitle = "Marca"
dv.add("D5:F54")
ASIST.add_data_validation(dv)

dv_asig = DataValidation(type="list", formula1="ASISTENCIA!$B$59:$B$78", allow_blank=True, showErrorMessage=False)
dv_asig.prompt = "Elige tu asignatura de la lista (o escríbela igual)."
dv_asig.promptTitle = "Asignatura"
dv_asig.add("C5:C54")
ASIST.add_data_validation(dv_asig)

for row in range(5, 55):
    ASIST.row_dimensions[row].height = 20
    for col in range(2, 8):
        c = ASIST.cell(row=row, column=col)
        c.border = BORDER
        if col == 2 and c.value is None:
            c.number_format = "DD/MM/YYYY"
        if col in (4, 5, 6):
            c.alignment = Alignment(horizontal="center")
        if col == 7:
            c.alignment = Alignment(wrap_text=True, vertical="top")

tab = Table(displayName="ControlAsistencia", ref="B4:G54")
tab.tableStyleInfo = TableStyleInfo(name="TableStyleMedium2", showRowStripes=True, showColumnStripes=False)
ASIST.add_table(tab)

if SAMPLES:
    ASIST.merge_cells("B55:G55")
    lab = ASIST["B55"]
    lab.value = "Estos datos son de EJEMPLO: edítalos o bórralos al empezar."
    lab.font = Font(bold=True, size=10, color=C_RED)
    lab.alignment = Alignment(horizontal="center", vertical="center")
    ASIST.row_dimensions[55].height = 22

ASIST.merge_cells("B57:I57")
sec_cab = ASIST["B57"]
sec_cab.value = "ASISTENCIA POR ASIGNATURA · se calcula solo"
sec_cab.font = Font(bold=True, color=WHITE, size=13)
sec_cab.fill = FILL_NAVY
sec_cab.alignment = Alignment(horizontal="center", vertical="center")
ASIST.row_dimensions[57].height = 26

subj_headers = ["ASIGNATURA", "CLASES PREVISTAS", "FALTAS", "JUSTIFICADAS", "RETRASOS", "ASISTENCIA", "LÍMITE", "ESTADO"]
for col, h in enumerate(subj_headers, start=2):
    c = ASIST.cell(row=58, column=col, value=h)
    c.font = Font(bold=True, color=WHITE, size=10)
    c.fill = FILL_BLUE
    c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    c.border = BORDER
ASIST.row_dimensions[58].height = 40

SUBJ_END = 78
for row in range(59, SUBJ_END + 1):
    ASIST.row_dimensions[row].height = 22
    ASIST.cell(row=row, column=4, value=f'=IF($B{row}="","",COUNTIFS($C$5:$C$54,$B{row},$D$5:$D$54,"X"))')
    ASIST.cell(row=row, column=5, value=f'=IF($B{row}="","",COUNTIFS($C$5:$C$54,$B{row},$E$5:$E$54,"X"))')
    ASIST.cell(row=row, column=6, value=f'=IF($B{row}="","",COUNTIFS($C$5:$C$54,$B{row},$F$5:$F$54,"X"))')
    pct = ASIST.cell(row=row, column=7, value=f'=IF(OR($C{row}="",$C{row}<=0),"",ROUND(MAX(0,$C{row}-$D{row}-$F{row}*$C$83)/$C{row}*100,1))')
    pct.number_format = '0.0"%"'
    lim = ASIST.cell(row=row, column=8, value=f'=IF($C{row}="","",$C$82)')
    lim.number_format = '0"%"'
    ASIST.cell(
        row=row,
        column=9,
        value=f'=IF($G{row}="","",IF($G{row}>=$H{row}+1,"A SALVO",IF($G{row}>=$H{row},"ATENCIÓN","PELIGRO")))',
    )
    for col in range(2, 10):
        c = ASIST.cell(row=row, column=col)
        c.border = BORDER
        c.alignment = Alignment(horizontal="center", vertical="center")
    ASIST.cell(row=row, column=2).alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)

if SAMPLES:
    for i, mat in enumerate(SAMPLE_SUBJECTS):
        ASIST.cell(row=59 + i, column=2, value=mat)
        ASIST.cell(row=59 + i, column=3, value=SAMPLE_CLASSES[i])

total_name = ASIST.cell(row=79, column=2, value="TOTAL CURSO")
ASIST.cell(row=79, column=3, value="=SUM(C59:C78)").number_format = "0"
ASIST.cell(row=79, column=4, value="=SUM(D59:D78)").number_format = "0"
ASIST.cell(row=79, column=5, value="=SUM(E59:E78)").number_format = "0"
ASIST.cell(row=79, column=6, value="=SUM(F59:F78)").number_format = "0"
total_pct = ASIST.cell(
    row=79, column=7,
    value='=IF(OR($C$79="",$C$79<=0),"",ROUND(MAX(0,$C$79-$D$79-$F$79*$C$83)/$C$79*100,1))',
)
total_pct.number_format = '0.0"%"'
for col in range(2, 10):
    c = ASIST.cell(row=79, column=col)
    c.fill = FILL_LIGHT
    c.border = BORDER
    c.alignment = Alignment(horizontal="center", vertical="center")
total_name.fill = FILL_NAVY
total_name.font = Font(bold=True, color=WHITE)
for col in range(3, 8):
    ASIST.cell(row=79, column=col).font = Font(bold=True)
ASIST.row_dimensions[79].height = 26

ASIST.conditional_formatting.add(
    "G59:G78",
    FormulaRule(formula=['AND($G59<>"",$G59>=$H59+1)'], fill=FILL_GREEN, font=Font(bold=True, color=C_GREEN)),
)
ASIST.conditional_formatting.add(
    "G59:G78",
    FormulaRule(formula=['AND($G59<>"",$G59=$H59)'], fill=FILL_AMBER, font=Font(bold=True, color=C_AMBER)),
)
ASIST.conditional_formatting.add(
    "G59:G78",
    FormulaRule(formula=['AND($G59<>"",$G59<$H59)'], fill=FILL_RED, font=Font(bold=True, color=C_RED)),
)
ASIST.conditional_formatting.add(
    "D59:D78",
    DataBarRule(start_type="num", start_value=0, end_type="num", end_value=10, color="C00000", showValue=True),
)
for estado, fill, color in (
    ("A SALVO", FILL_GREEN, C_GREEN),
    ("ATENCIÓN", FILL_AMBER, C_AMBER),
    ("PELIGRO", FILL_RED, C_RED),
):
    ASIST.conditional_formatting.add(
        "I59:I78",
        FormulaRule(formula=['$I59="%s"' % estado], fill=fill, font=Font(bold=True, color=color)),
    )

ASIST.merge_cells("B81:I81")
cfg_cab = ASIST["B81"]
cfg_cab.value = "CONFIGURACIÓN GLOBAL"
cfg_cab.font = Font(bold=True, color=WHITE, size=13)
cfg_cab.fill = FILL_NAVY
cfg_cab.alignment = Alignment(horizontal="center", vertical="center")
ASIST.row_dimensions[81].height = 26

for label, value, fmt, row in (
    ("MÍNIMO DE ASISTENCIA PERMITIDO (%)", 80, '0"%"', 82),
    ("CADA RETRASO EQUIVALE A (en faltas)", 0.5, "0.##", 83),
):
    a = ASIST.cell(row=row, column=2, value=label)
    a.font = Font(bold=True)
    a.fill = FILL_AMBER
    a.border = BORDER
    a.alignment = Alignment(wrap_text=True, vertical="center", horizontal="left")
    b = ASIST.cell(row=row, column=3, value=value)
    b.fill = FILL_AMBER
    b.border = BORDER
    b.alignment = Alignment(horizontal="center", vertical="center")
    b.number_format = fmt
    ASIST.row_dimensions[row].height = 30

nota_ret = ASIST.merge_cells("B84:I84")
nr = ASIST["B84"]
nr.value = "Cada retraso equivale a X faltas (por defecto 0,5 = media falta). Modifica este valor según el criterio de tu centro: 0 = no cuenta, 0,5 = media falta, 1 = falta completa."
nr.font = Font(italic=True, size=9, color=GRAY)
nr.alignment = Alignment(wrap_text=True)
ASIST.row_dimensions[84].height = 44

nota_dis = ASIST.merge_cells("B85:I85")
nd = ASIST["B85"]
nd.value = "Introduce el porcentaje mínimo de asistencia que exija tu centro. Esta plantilla es orientativa y no sustituye la normativa oficial ni la información de tu profesor o secretaría."
nd.font = Font(italic=True, size=9, color=GRAY)
nd.alignment = Alignment(wrap_text=True)
ASIST.row_dimensions[85].height = 44

ASIST.row_dimensions[86].height = 14

ASIST.merge_cells("B87:I87")
f_p = ASIST["B87"]
f_p.value = "CalculaFácil · calculafacil.app · plantilla para estudiantes"
f_p.font = Font(italic=True, size=9, color="A6A6A6")
f_p.alignment = Alignment(horizontal="center")
ASIST.row_dimensions[87].height = 22

NOTAS = wb.create_sheet("NOTAS")
NOTAS.sheet_properties.tabColor = BLUE
set_widths(NOTAS, [10, 26, 12, 12, 12, 12, 12, 12, 12, 10])
NOTAS.sheet_view.showGridLines = False
NOTAS.freeze_panes = "A5"

NOTAS.merge_cells("B1:I1")
nt1 = NOTAS["B1"]
nt1.value = "CONTROL DE NOTAS 2026/2027"
nt1.font = Font(bold=True, size=17, color=WHITE)
nt1.fill = FILL_NAVY
nt1.alignment = Alignment(horizontal="center", vertical="center")
NOTAS.row_dimensions[1].height = 40
NOTAS.merge_cells("B2:I2")
nt2 = NOTAS["B2"]
nt2.value = "Hasta 5 notas por asignatura · pesos en % (suman 100) · la NOTA FINAL se calcula sola"
nt2.font = Font(italic=True, size=11, color=GRAY)
nt2.alignment = Alignment(horizontal="center", vertical="center")
NOTAS.row_dimensions[2].height = 23

notas_headers = ["ASIGNATURA (elige)", "NOTA 1", "NOTA 2", "NOTA 3", "NOTA 4", "NOTA 5", "MEDIA", "PESO (%)"]
for col, h in enumerate(notas_headers, start=2):
    c = NOTAS.cell(row=4, column=col, value=h)
    c.font = Font(bold=True, color=WHITE, size=11)
    c.fill = FILL_BLUE
    c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    c.border = BORDER
NOTAS.row_dimensions[4].height = 32

if SAMPLES:
    for i, (n1, n2, n3, n4, n5, peso) in enumerate(SAMPLE_NOTAS):
        row = 5 + i
        NOTAS.cell(row=row, column=2, value=SAMPLE_SUBJECTS[i])
        for j, v in enumerate([n1, n2, n3, n4, n5]):
            if v is not None:
                NOTAS.cell(row=row, column=3 + j, value=v)
        NOTAS.cell(row=row, column=9, value=peso)

for row in range(5, 25):
    NOTAS.row_dimensions[row].height = 24
    asig = NOTAS.cell(row=row, column=2)
    if asig.value is None:
        asig.value = ""
    asig.alignment = Alignment(horizontal="left", vertical="center")
    NOTAS.cell(row=row, column=8, value=f'=IF(OR($B{row}="",ISNA(MATCH($B{row},ASISTENCIA!$B$59:$B$78,0))),"",ROUND(AVERAGE(C{row}:G{row}),2))').number_format = "0.00"
    if NOTAS.cell(row=row, column=9).value is None:
        NOTAS.cell(row=row, column=9).number_format = "0"
    for col in range(2, 10):
        c = NOTAS.cell(row=row, column=col)
        c.border = BORDER
        if col >= 3:
            c.alignment = Alignment(horizontal="center")

tab_notas = Table(displayName="ControlNotas", ref="B4:I24")
tab_notas.tableStyleInfo = TableStyleInfo(name="TableStyleMedium2", showRowStripes=True, showColumnStripes=False)
NOTAS.add_table(tab_notas)

dv_peso = DataValidation(type="decimal", operator="between", formula1="1", formula2="100", allow_blank=True, showErrorMessage=True)
dv_peso.error = "El peso debe ser un número entre 1 y 100."
NOTAS.add_data_validation(dv_peso)
dv_peso.add("I5:I24")

dv_asign_notas = DataValidation(type="list", formula1="ASISTENCIA!$B$59:$B$78", allow_blank=True, showErrorMessage=False)
dv_asign_notas.prompt = "Elige la asignatura (sale de tu lista en ASISTENCIA)."
dv_asign_notas.promptTitle = "Asignatura"
dv_asign_notas.add("B5:B24")
NOTAS.add_data_validation(dv_asign_notas)

NOTAS.row_dimensions[25].height = 16

NOTAS.merge_cells("B26:I26")
c = NOTAS["B26"]
c.value = "RESUMEN DE NOTAS"
c.font = Font(bold=True, color=WHITE, size=12)
c.fill = FILL_NAVY
c.alignment = Alignment(horizontal="center", vertical="center")
NOTAS.row_dimensions[26].height = 26

suma = NOTAS.cell(row=27, column=2, value="TOTAL PESO (%)")
suma.font = Font(bold=True)
suma.fill = FILL_AMBER
suma.border = BORDER
suma.alignment = Alignment(wrap_text=True, vertical="center", horizontal="left")
suma_v = NOTAS.cell(row=27, column=3, value="=SUM(I5:I24)")
suma_v.fill = FILL_AMBER
suma_v.border = BORDER
suma_v.alignment = Alignment(horizontal="center", vertical="center")
suma_v.number_format = "0"
suma_v.font = Font(bold=True, size=14)
NOTAS.row_dimensions[27].height = 32

final = NOTAS.cell(row=28, column=2, value="NOTA FINAL PONDERADA")
final.font = Font(bold=True)
final.fill = FILL_AMBER
final.border = BORDER
final.alignment = Alignment(wrap_text=True, vertical="center", horizontal="left")
final_v = NOTAS.cell(row=28, column=3, value='=IF(C27=0,"",ROUND(SUMPRODUCT(N(H5:H24),I5:I24)/C27,2))')
final_v.fill = FILL_AMBER
final_v.border = BORDER
final_v.alignment = Alignment(horizontal="center", vertical="center")
final_v.number_format = "0.00"
final_v.font = Font(bold=True, size=16)
NOTAS.row_dimensions[28].height = 34

NOTAS.row_dimensions[29].height = 14

NOTAS.merge_cells("B30:I30")
tip = NOTAS["B30"]
tip.value = "NOTA FINAL PONDERADA = tus notas con sus pesos. La MEDIA SIMPLE DEL CURSO cuenta todas las asignaturas por igual; la ponderada utiliza los pesos que has introducido. Son dos medias distintas. Solo cuentan las asignaturas con nota."
tip.font = Font(italic=True, size=9, color=GRAY)
tip.alignment = Alignment(wrap_text=True)
NOTAS.row_dimensions[30].height = 30

NOTAS.row_dimensions[31].height = 14

NOTAS.merge_cells("B32:I32")
c = NOTAS["B32"]
c.value = "MINI-CALCULADORA: NOTA QUE NECESITAS EN EL EXAMEN"
c.font = Font(bold=True, color=WHITE, size=12)
c.fill = FILL_NAVY
c.alignment = Alignment(horizontal="center", vertical="center")
NOTAS.row_dimensions[32].height = 26

NOTAS.row_dimensions[33].height = 14

calc_rows = [
    ("Nota que quieres conseguir", 7 if SAMPLES else ""),
    ("Tu nota actual (media)", 6.5 if SAMPLES else ""),
    ("Peso del examen (%)", 30 if SAMPLES else ""),
    ("Nota que te hace falta en el examen", '=IF(OR($C$34="",$C$36="",$C$36=0),"",IFERROR(ROUND(($C$34-($C$35*(1-$C$36/100)))/($C$36/100),2),""))'),
]
for i, (label, val) in enumerate(calc_rows):
    row = 34 + i
    a = NOTAS.cell(row=row, column=2, value=label)
    a.font = Font(bold=True)
    a.fill = FILL_LIGHT
    a.border = BORDER
    a.alignment = Alignment(wrap_text=True, vertical="center", horizontal="left")
    b = NOTAS.cell(row=row, column=3, value=val)
    b.border = BORDER
    b.alignment = Alignment(horizontal="center", vertical="center")
    NOTAS.row_dimensions[row].height = 30
    b.number_format = "0.00"
    if i == 3:
        b.font = Font(bold=True, size=12)

NOTAS.row_dimensions[38].height = 14

NOTAS.merge_cells("B39:I39")
tip2 = NOTAS["B39"]
tip2.value = "Mini-calculadora orientativa: si quieres sacar 7, llevando 6,5 de media y el examen vale el 30 %, necesitas sacar un 8,17 en el examen. Ajusta los valores a tu caso."
tip2.font = Font(italic=True, size=9, color=GRAY)
tip2.alignment = Alignment(wrap_text=True)
NOTAS.row_dimensions[39].height = 44

NOTAS.row_dimensions[40].height = 14

NOTAS.merge_cells("B41:I41")
f_p = NOTAS["B41"]
f_p.value = "CalculaFácil · calculafacil.app · plantilla para estudiantes"
f_p.font = Font(italic=True, size=9, color="A6A6A6")
f_p.alignment = Alignment(horizontal="center")
NOTAS.row_dimensions[41].height = 22

NOTAS.conditional_formatting.add(
    "H5:H24",
    FormulaRule(formula=['AND($H5<>"",$H5>=5)'], font=Font(color=C_GREEN), fill=FILL_GREEN),
)
NOTAS.conditional_formatting.add(
    "H5:H24",
    FormulaRule(formula=['AND($H5<>"",$H5<5)'], font=Font(color=C_RED), fill=FILL_RED),
)
NOTAS.conditional_formatting.add(
    "C27",
    FormulaRule(formula=["C27=100"], font=Font(bold=True, color=C_GREEN), fill=FILL_GREEN),
)
NOTAS.conditional_formatting.add(
    "C27",
    FormulaRule(formula=["AND(C27<>100,C27>0)"], font=Font(bold=True, color=C_RED), fill=FILL_RED),
)
NOTAS.conditional_formatting.add(
    "C28",
    FormulaRule(formula=['AND($C$28<>"",$C$28>=5)'], font=Font(bold=True, color=C_GREEN)),
)
NOTAS.conditional_formatting.add(
    "C28",
    FormulaRule(formula=['AND($C$28<>"",$C$28<5)'], font=Font(bold=True, color=C_RED)),
)
NOTAS.conditional_formatting.add(
    "C37",
    FormulaRule(formula=['AND($C37<>"",$C37<=10)'], font=Font(color=C_GREEN)),
)
NOTAS.conditional_formatting.add(
    "C37",
    FormulaRule(formula=['AND($C37<>"",$C37>10)'], font=Font(color=C_RED, bold=True)),
)

GRAF = wb.create_sheet("MI CURSO")
GRAF.sheet_properties.tabColor = "548235"
set_widths(GRAF, [10, 26, 15, 11, 13, 11, 15, 10])
GRAF.sheet_view.showGridLines = False

GRAF.merge_cells("B1:I1")
g_title = GRAF["B1"]
g_title.value = "MI CURSO 2026/27"
g_title.font = Font(bold=True, size=18, color=WHITE)
g_title.fill = FILL_NAVY
g_title.alignment = Alignment(horizontal="center", vertical="center")
GRAF.row_dimensions[1].height = 40
GRAF.merge_cells("B2:I2")
g_sub = GRAF["B2"]
g_sub.value = "Tu cuadro de mandos · Todo se actualiza solo desde ASISTENCIA y NOTAS"
g_sub.font = Font(italic=True, size=11, color=GRAY)
g_sub.alignment = Alignment(horizontal="center", vertical="center")
GRAF.row_dimensions[2].height = 24
GRAF.row_dimensions[3].height = 16

tiles = [
    (2, "MEDIA SIMPLE DEL CURSO", '=IFERROR(ROUND(AVERAGE(NOTAS!$H$5:$H$24),2),"")', NAVY, "0.00"),
    (4, "ASISTENCIA GLOBAL", "=ASISTENCIA!G79", "548235", '0.0"%"'),
    (6, "TOTAL FALTAS", "=ASISTENCIA!D79", "9C0006", "0"),
    (8, "MÍNIMO PERMITIDO", "=ASISTENCIA!C82", "BF8F00", '0"%"'),
]
for c0, label, formula, color, fmt in tiles:
    GRAF.merge_cells(start_row=4, start_column=c0, end_row=4, end_column=c0 + 1)
    lab = GRAF.cell(row=4, column=c0, value=label)
    lab.font = Font(bold=True, size=11, color=WHITE)
    lab.fill = PatternFill("solid", fgColor=color)
    lab.alignment = Alignment(horizontal="center", vertical="center")
    GRAF.merge_cells(start_row=5, start_column=c0, end_row=5, end_column=c0 + 1)
    val = GRAF.cell(row=5, column=c0, value=formula)
    val.font = Font(bold=True, size=22, color=WHITE)
    val.fill = PatternFill("solid", fgColor=color)
    val.alignment = Alignment(horizontal="center", vertical="center")
    val.number_format = fmt
GRAF.row_dimensions[4].height = 22
GRAF.row_dimensions[5].height = 38
GRAF.row_dimensions[6].height = 16

GRAF.conditional_formatting.add(
    "B5:C5",
    FormulaRule(formula=['AND($B5<>"",$B5>=5)'], fill=FILL_GREEN, font=Font(bold=True, size=22, color=C_GREEN)),
)
GRAF.conditional_formatting.add(
    "B5:C5",
    FormulaRule(formula=['AND($B5<>"",$B5<5)'], fill=FILL_RED, font=Font(bold=True, size=22, color=C_RED)),
)
GRAF.conditional_formatting.add(
    "D5:E5",
    FormulaRule(formula=['AND($D5<>"",$D5>=ASISTENCIA!$C$82+1)'], fill=FILL_GREEN, font=Font(bold=True, size=22, color=C_GREEN)),
)
GRAF.conditional_formatting.add(
    "D5:E5",
    FormulaRule(formula=['AND($D5<>"",$D5=ASISTENCIA!$C$82)'], fill=FILL_AMBER, font=Font(bold=True, size=22, color=C_AMBER)),
)
GRAF.conditional_formatting.add(
    "D5:E5",
    FormulaRule(formula=['AND($D5<>"",$D5<ASISTENCIA!$C$82)'], fill=FILL_RED, font=Font(bold=True, size=22, color=C_RED)),
)

GRAF.merge_cells("B7:I7")
obj_title = GRAF["B7"]
obj_title.value = "TU OBJETIVO DE NOTA"
obj_title.font = Font(bold=True, size=12, color=WHITE)
obj_title.fill = FILL_NAVY
obj_title.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
GRAF.row_dimensions[7].height = 26

GRAF.merge_cells("B8:C8")
obj_label = GRAF["B8"]
obj_label.value = "Nota que quieres:"
obj_label.font = Font(bold=True)
obj_label.alignment = Alignment(horizontal="right", vertical="center", wrap_text=True)
GRAF.merge_cells("D8:E8")
obj_input = GRAF["D8"]
obj_input.value = 8 if SAMPLES else None
obj_input.number_format = "0.00"
obj_input.font = Font(bold=True, size=14)
obj_input.fill = FILL_AMBER
obj_input.border = BORDER
obj_input.alignment = Alignment(horizontal="center", vertical="center")
GRAF.merge_cells("F8:I8")
obj_hint = GRAF["F8"]
obj_hint.value = "Se compara con tu MEDIA SIMPLE DEL CURSO (casilla de arriba)."
obj_hint.font = Font(italic=True, size=10, color=GRAY)
obj_hint.alignment = Alignment(horizontal="left", vertical="center", indent=1, wrap_text=True)
GRAF.row_dimensions[8].height = 36

GRAF.merge_cells("B9:I9")
obj_result = GRAF["B9"]
obj_result.value = '=IF(OR($D$8="",$B$5=""),"Fija tu nota objetivo arriba (casilla ámbar). Se compara con tu MEDIA SIMPLE DEL CURSO y te dice cuánto te falta.",IF($B$5>=$D$8,"OBJETIVO CONSEGUIDO · tu media ("&TEXT($B$5,"0.00")&") ya llega a "&TEXT($D$8,"0.00")&".","Tu media simple es "&TEXT($B$5,"0.00")&". Te faltan "&TEXT(ROUND($D$8-$B$5,2),"0.00")&" puntos para llegar a "&TEXT($D$8,"0.00")&". Avanza tu media con mejores notas en NOTAS."))'
obj_result.font = Font(bold=True, size=12)
obj_result.fill = FILL_LIGHT
obj_result.border = BORDER
obj_result.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
GRAF.row_dimensions[9].height = 46

GRAF.conditional_formatting.add(
    "B12",
    FormulaRule(formula=['$D$11>=$H$11+1'], fill=FILL_GREEN, font=Font(bold=True, size=13, color=C_GREEN)),
)
GRAF.conditional_formatting.add(
    "B12",
    FormulaRule(formula=['$D$11=$H$11'], fill=FILL_AMBER, font=Font(bold=True, size=13, color=C_AMBER)),
)
GRAF.conditional_formatting.add(
    "B12",
    FormulaRule(formula=['$D$11<$H$11'], fill=FILL_RED, font=Font(bold=True, size=13, color=C_RED)),
)

GRAF.merge_cells("B10:I10")
avm_title = GRAF["B10"]
avm_title.value = "TU ASISTENCIA vs EL MÍNIMO PERMITIDO"
avm_title.font = Font(bold=True, size=12, color=WHITE)
avm_title.fill = FILL_NAVY
avm_title.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
GRAF.row_dimensions[10].height = 26

GRAF.merge_cells("B11:C11")
la = GRAF["B11"]
la.value = "Tu asistencia:"
la.font = Font(bold=True)
la.alignment = Alignment(horizontal="right", vertical="center")
GRAF.merge_cells("D11:E11")
va = GRAF["D11"]
va.value = '=IF(ASISTENCIA!$G$79="","",ASISTENCIA!$G$79)'
va.number_format = '0.0"%"'
va.font = Font(bold=True, size=14)
va.fill = FILL_LIGHT
va.border = BORDER
va.alignment = Alignment(horizontal="center", vertical="center")
GRAF.merge_cells("F11:G11")
lm = GRAF["F11"]
lm.value = "Mínimo permitido:"
lm.font = Font(bold=True)
lm.alignment = Alignment(horizontal="right", vertical="center")
GRAF.merge_cells("H11:I11")
vm = GRAF["H11"]
vm.value = '=IF(ASISTENCIA!$C$82="","",ASISTENCIA!$C$82)'
vm.number_format = '0"%"'
vm.font = Font(bold=True, size=14)
vm.fill = FILL_AMBER
vm.border = BORDER
vm.alignment = Alignment(horizontal="center", vertical="center")
GRAF.row_dimensions[11].height = 30

GRAF.merge_cells("B12:I12")
st = GRAF["B12"]
st.value = '=IF(OR($D$11="",$H$11=""),"",IF($D$11>=$H$11+1,"A SALVO · tu asistencia va "&TEXT(ROUND($D$11-$H$11,1),"0.0")&" p. por encima del mínimo permitido",IF($D$11>=$H$11,"ATENCIÓN · vas justo en el mínimo permitido","PELIGRO · te faltan "&TEXT(ROUND($H$11-$D$11,1),"0.0")&" p. para llegar al mínimo permitido")))'
st.font = Font(bold=True, size=13)
st.alignment = Alignment(horizontal="center", vertical="center")
GRAF.row_dimensions[12].height = 40

micurso_headers = ["ASIGNATURA", "CLASES (TOTAL)", "FALTAS", "MEDIA", "% ASIST.", "ESTADO"]
for col, h in enumerate(micurso_headers, start=2):
    c = GRAF.cell(row=14, column=col, value=h)
    c.font = Font(bold=True, color=WHITE, size=11)
    c.fill = PatternFill("solid", fgColor="548235")
    c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    c.border = BORDER
GRAF.row_dimensions[14].height = 32

for row in range(15, 35):
    GRAF.row_dimensions[row].height = 20
    base = row + 44
    name = GRAF.cell(row=row, column=2, value=f'=IF(ASISTENCIA!$B${base}="","",ASISTENCIA!$B${base})')
    name.alignment = Alignment(horizontal="left", vertical="center")
    GRAF.cell(row=row, column=3, value=f'=IF($B{row}="","",IFERROR(INDEX(ASISTENCIA!$C$59:$C$78,MATCH($B{row},ASISTENCIA!$B$59:$B$78,0)),""))').number_format = "0"
    GRAF.cell(row=row, column=4, value=f'=IF($B{row}="","",IFERROR(INDEX(ASISTENCIA!$D$59:$D$78,MATCH($B{row},ASISTENCIA!$B$59:$B$78,0)),""))')
    md = GRAF.cell(row=row, column=5, value=f'=IF($B{row}="","",IFERROR(INDEX(NOTAS!$H$5:$H$24,MATCH($B{row},NOTAS!$B$5:$B$24,0)),""))')
    md.number_format = "0.00"
    pc = GRAF.cell(row=row, column=6, value=f'=IF($B{row}="","",IFERROR(INDEX(ASISTENCIA!$G$59:$G$78,MATCH($B{row},ASISTENCIA!$B$59:$B$78,0)),""))')
    pc.number_format = '0.0"%"'
    GRAF.cell(row=row, column=7, value=f'=IF($B{row}="","",IFERROR(INDEX(ASISTENCIA!$I$59:$I$78,MATCH($B{row},ASISTENCIA!$B$59:$B$78,0)),""))')
    for col in range(2, 8):
        c = GRAF.cell(row=row, column=col)
        c.border = BORDER
        c.alignment = Alignment(horizontal="center", vertical="center")
        if col == 2:
            c.alignment = Alignment(horizontal="left", vertical="center")

graf_tab = Table(displayName="DashboardTabla", ref="B14:G34")
graf_tab.tableStyleInfo = TableStyleInfo(name="TableStyleMedium2", showRowStripes=True, showColumnStripes=False)
GRAF.add_table(graf_tab)

GRAF.conditional_formatting.add(
    "D15:D34",
    DataBarRule(start_type="num", start_value=0, end_type="num", end_value=10, color="C00000", showValue=True),
)

GRAF.conditional_formatting.add(
    "E15:E34",
    FormulaRule(formula=['AND($E15<>"",$E15>=5)'], fill=FILL_GREEN, font=Font(bold=True, color=C_GREEN)),
)
GRAF.conditional_formatting.add(
    "E15:E34",
    FormulaRule(formula=['AND($E15<>"",$E15<5)'], fill=FILL_RED, font=Font(bold=True, color=C_RED)),
)
GRAF.conditional_formatting.add(
    "F15:F34",
    ColorScaleRule(
        start_type="num", start_value=0, start_color=Color(rgb="FFC7CE"),
        mid_type="num", mid_value=50, mid_color=Color(rgb="FFEB9C"),
        end_type="num", end_value=100, end_color=Color(rgb="C6EFCE"),
    ),
)
for estado, fill, color in (
    ("A SALVO", FILL_GREEN, C_GREEN),
    ("ATENCIÓN", FILL_AMBER, C_AMBER),
    ("PELIGRO", FILL_RED, C_RED),
):
    cond = f'$G15="{estado}"'
    GRAF.conditional_formatting.add("G15:G34", FormulaRule(formula=[cond], fill=fill, font=Font(bold=True, color=color)))

GRAF.row_dimensions[35].height = 14

GRAF.merge_cells("B36:I36")
note = GRAF["B36"]
note.value = "Las asignaturas de esta tabla salen SOLAS de tu lista de ASISTENCIA (no se escribe nada aquí; para quitar una, bórrala de la lista). CLASES, FALTAS, % ASIST. y ESTADO se leen de ASISTENCIA; la MEDIA se lee de NOTAS. El MÍNIMO DE ASISTENCIA PERMITIDO se cambia en ASISTENCIA (CONFIGURACIÓN GLOBAL) y cada retraso equivale a lo que tú configures (por defecto 0,5). La barra de FALTAS es SOLO ORIENTATIVA: el ESTADO se calcula según tus clases previstas y el mínimo configurado. Tu objetivo de nota se cambia en la casilla ámbar (D8)."
note.font = Font(italic=True, size=9, color=GRAY)
note.alignment = Alignment(wrap_text=True)
GRAF.row_dimensions[36].height = 80

GRAF.row_dimensions[37].height = 14

GRAF.merge_cells("B38:H38")
f_p = GRAF["B38"]
f_p.value = "CalculaFácil · calculafacil.app · plantilla para estudiantes"
f_p.font = Font(italic=True, size=9, color="A6A6A6")
f_p.alignment = Alignment(horizontal="center")
GRAF.row_dimensions[38].height = 22

PORTADA = wb.create_sheet("PORTADA")
PORTADA.sheet_properties.tabColor = "7030A0"
set_widths(PORTADA, [10, 16, 10, 12, 12, 12, 9, 9])
PORTADA.sheet_view.showGridLines = False

P_LAST = 8
plast = get_column_letter(P_LAST)
GREEN_SOLID = PatternFill("solid", fgColor="548235")

PORTADA.merge_cells(f"A2:{plast}2")
t0 = PORTADA["A2"]
t0.value = "CALCULAFÁCIL"
t0.font = Font(bold=True, size=28, color=WHITE)
t0.fill = FILL_NAVY
t0.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
PORTADA.row_dimensions[2].height = 60

PORTADA.merge_cells(f"A3:{plast}3")
t1 = PORTADA["A3"]
t1.value = "Control de tu curso"
t1.font = Font(bold=True, size=18, color=WHITE)
t1.fill = FILL_NAVY
t1.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
PORTADA.row_dimensions[3].height = 40

PORTADA.merge_cells(f"A4:{plast}4")
t2 = PORTADA["A4"]
t2.value = "2026 / 2027"
t2.font = Font(bold=True, size=24, color=WHITE)
t2.fill = PatternFill("solid", fgColor="2E75B6")
t2.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
PORTADA.row_dimensions[4].height = 48

PORTADA.merge_cells(f"A5:{plast}5")
t3 = PORTADA["A5"]
t3.value = "NOTAS · ASISTENCIA · RESUMEN DE TU CURSO"
t3.font = Font(bold=True, size=11, color=WHITE)
t3.fill = PatternFill("solid", fgColor="2E75B6")
t3.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
PORTADA.row_dimensions[5].height = 28
PORTADA.row_dimensions[6].height = 16

PORTADA.merge_cells(f"A7:{plast}7")
t = PORTADA["A7"]
t.value = "EMPIEZA AQUÍ EN 4 PASOS"
t.font = Font(bold=True, size=14, color=WHITE)
t.fill = FILL_NAVY
t.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
PORTADA.row_dimensions[7].height = 30

start_steps = [
    ("PASO 1", "Escribe tus asignaturas en ASISTENCIA y las clases previstas de cada una."),
    ("PASO 2", "Registra cada día falta injustificada, justificada o retraso con una X."),
    ("PASO 3", "Añade notas y pesos en NOTAS (elige tus asignaturas del desplegable)."),
    ("PASO 4", "Mira tu resumen, objetivo y evolución en MI CURSO (todo se rellena solo)."),
]
for i, (badge, text) in enumerate(start_steps):
    row = 8 + i
    PORTADA.merge_cells(f"A{row}:C{row}")
    bb = PORTADA[f"A{row}"]
    bb.value = badge
    bb.font = Font(bold=True, size=13, color=WHITE)
    bb.fill = PatternFill("solid", fgColor="2E75B6")
    bb.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    PORTADA.merge_cells(f"D{row}:{plast}{row}")
    cc = PORTADA[f"D{row}"]
    cc.value = text
    cc.font = Font(size=11)
    cc.fill = PatternFill("solid", fgColor="DDEBF7")
    cc.alignment = Alignment(vertical="center", horizontal="left", indent=1, wrap_text=True)
    PORTADA.row_dimensions[row].height = 44

PORTADA.row_dimensions[12].height = 14

PORTADA.merge_cells(f"A13:{plast}13")
band = PORTADA["A13"]
band.value = "Todo se calcula solo · Sin fórmulas · Listo para el curso 2026/2027"
band.font = Font(bold=True, size=12, color=WHITE)
band.fill = GREEN_SOLID
band.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
PORTADA.row_dimensions[13].height = 40

PORTADA.merge_cells(f"A15:{plast}15")
cr = PORTADA["A15"]
cr.value = "Creado con CalculaFácil · calculafacil.app"
cr.font = Font(italic=True, size=10, color=GRAY)
cr.alignment = Alignment(horizontal="center")

wb.move_sheet("PORTADA", offset=-(len(wb.sheetnames) - 1))


def lock_sheet(ws, unlocked=(), password=None):
    ws.protection.sheet = True
    ws.protection.enable()
    ws.protection.selectLockedCells = True
    ws.protection.selectUnlockedCells = True
    for attr in (
        "insertRows", "deleteRows", "insertColumns", "deleteColumns",
        "formatCells", "formatColumns", "formatRows", "sort", "autoFilter",
        "pivotTables", "insertHyperlinks", "objects", "scenarios",
    ):
        setattr(ws.protection, attr, False)
    if password:
        ws.protection.set_password(password)
    for rng in unlocked:
        if ":" in rng:
            for row_cells in ws[rng]:
                for cell in row_cells:
                    cell.protection = Protection(locked=False)
        else:
            ws[rng].protection = Protection(locked=False)


def setup_print(ws, orientation="portrait", title_rows=None, single_page=False):
    ws.page_setup.orientation = orientation
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 1 if single_page else 0
    ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
    ws.page_setup.horizontalCentered = True
    ws.print_title_rows = title_rows
    for side, val in (("left", 0.4), ("right", 0.4), ("top", 0.6), ("bottom", 0.6)):
        setattr(ws.page_margins, side, val)


setup_print(PORTADA, "portrait", single_page=True)
setup_print(INSTR, "portrait", "1:2")
setup_print(ASIST, "landscape", "4:4")
setup_print(NOTAS, "landscape", "4:4")
setup_print(GRAF, "landscape", "1:2")

lock_sheet(PORTADA)
lock_sheet(INSTR)
lock_sheet(ASIST, ["B5:G54", "B59:B78", "C59:C78", "H59:H78", "C82", "C83"], password=PW)
lock_sheet(NOTAS, ["C5:G24", "I5:I24", "C34:C36", "B5:B24"], password=PW)
lock_sheet(GRAF, ["D8"], password=PW)

wb.active = 0
wb.save(OUT_PATH)
print("OK ->", OUT_PATH)