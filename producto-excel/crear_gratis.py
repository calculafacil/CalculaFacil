# -*- coding: utf-8 -*-
"""Genera la version GRATUITA de CalculaFacil (lead magnet).

Un Excel de una sola hoja para controlar notas y media rapida.
Lo uso la web como lead magnet en /descarga-gratuita/.
"""
import os
import sys

from openpyxl import Workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Protection, Side
from openpyxl.utils import get_column_letter
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

THIN = Side(style="thin", color="BFBFBF")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

FILL_NAVY = PatternFill("solid", fgColor=NAVY)
FILL_BLUE = PatternFill("solid", fgColor=BLUE)
FILL_LIGHT = PatternFill("solid", fgColor=LIGHT)
FILL_AMBER = PatternFill("solid", fgColor=AMBER)
FILL_GREEN = PatternFill("solid", fgColor=GREEN)
FILL_RED = PatternFill("solid", fgColor=RED)

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "descarga-gratuita")
OUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "descarga-gratuita", "Control-Notas-2026-2027.xlsx")
OUT_PATH = os.path.normpath(OUT_PATH)

PW = "calculafacil"

wb = Workbook()
wb.properties.title = "Control Rapido de Notas 2026/2027"
wb.properties.creator = "CalculaFácil"
wb.calculation.fullCalcOnLoad = True

# ---------- PORTADA / INSTRUCCIONES ----------
PORT = wb.active
PORT.title = "CÓMO USARLO"
PORT.sheet_properties.tabColor = NAVY
PORT.sheet_view.showGridLines = False
LAST = 6
for idx, w in enumerate([14, 14, 14, 14, 14, 14], start=1):
    PORT.column_dimensions[get_column_letter(idx)].width = w


def title_block(ws, text, sub):
    plast = get_column_letter(LAST)
    ws.merge_cells(f"A1:{plast}1")
    c = ws["A1"]
    c.value = text
    c.font = Font(bold=True, size=18, color=WHITE)
    c.fill = FILL_NAVY
    c.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 38
    ws.merge_cells(f"A2:{plast}2")
    c2 = ws["A2"]
    c2.value = sub
    c2.font = Font(italic=True, size=11, color=GRAY)
    c2.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[2].height = 20


def put_line(ws, row, text, fill=None, bold=False, font_color="000000", h=None, center=False):
    plast = get_column_letter(LAST)
    ws.merge_cells(f"A{row}:{plast}{row}")
    cell = ws[f"A{row}"]
    cell.value = text
    cell.font = Font(bold=bold, size=11, color=font_color)
    cell.alignment = Alignment(wrap_text=True, vertical="top", horizontal="center" if center else "left")
    if fill:
        cell.fill = PatternFill("solid", fgColor=fill)
    n_lines = max(1, (len(text) // 85) + 1) if text else 1
    ws.row_dimensions[row].height = max(h or 20, n_lines * 17 + 8)
    return row + 1


def section(ws, row, title):
    return put_line(ws, row, title, fill=NAVY, bold=True, font_color=WHITE, h=26)


title_block(PORT, "MI CONTROL DE NOTAS 2026/2027", "La versión gratuita de CalculaFácil · media simple, sin más")

r = 4
r = section(PORT, r, "PARA QUÉ SIRVE")
r = put_line(PORT, r, "Una sola hoja (NOTAS) para apuntar hasta 12 asignaturas y 5 notas por asignatura. Calcula tu MEDIA simple y tu NOTA FINAL según los pesos de tu centro, todo automático.")
r = put_line(PORT, r, "Es la versión GRATUITA del Organizador de Estudios de CalculaFácil. La versión de pago además controla las FALTAS DE ASISTENCIA con semáforo, hace la media ponderada de verdad y lleva un cuadro de mandos.")

r = r + 1
r = section(PORT, r, "EMPIEZA AQUÍ (en 3 pasos)")
r = put_line(PORT, r, "1. Ve a la hoja NOTAS (abajo). Escribe el nombre de cada asignatura y tus notas en NOTA 1, NOTA 2... Las que no uses, déjalas vacías.")
r = put_line(PORT, r, "2. En PESO (%) pon lo que vale cada asignatura en tu centro (normalmente suman 100; se pone verde cuando suman 100).")
r = put_line(PORT, r, "3. Mira NOTA FINAL PONDERADA: tu media con los pesos, calculada sola.")

r = r + 1
r = section(PORT, r, "CÓMO ABRIRLO (si no tienes Excel, sin problema)")
r = put_line(PORT, r, "1. Con Microsoft Excel (Windows/Mac): doble clic en el archivo y listo.")
r = put_line(PORT, r, "2. Sin Excel, con Google Sheets (gratis y sin instalar): entra en drive.google.com → Nuevo → Subir archivo → elige este archivo .xlsx → doble clic sobre el archivo subido y se abrirá solo en Google Sheets.")
r = put_line(PORT, r, "3. O instala LibreOffice (gratis): tras instalarlo, doble clic en el archivo y se abre igual.")
r = put_line(PORT, r, "¿Solo te ofrece el Bloc de notas? Botón derecho sobre el archivo → Abrir con → elige Excel, Google Sheets o LibreOffice.")

r = r + 1
r = section(PORT, r, "DIFERENCIA CON LA VERSIÓN DE PAGO")
r = put_line(PORT, r, "Este archivo gratuito solo controla NOTAS. El Organizador de Estudios 2026-2027 completo (calculafacil.app/organizador-estudios/) además incluye: asistencia día a día con semáforo verde/ámbar/rojo, registro de faltas, retrasos y justificadas, tabla por asignatura automática y tu cuadro de mandos con objetivo de nota.")

r = r + 1
r = section(PORT, r, "LICENCIA")
r = put_line(PORT, r, "Puedes usar esta versión gratuita libremente para tu curso. No la revendas ni la subas a portales de pago.")
r = put_line(PORT, r, "CalculaFácil · calculafacil.app · plantilla para estudiantes")

# ---------- HOJA NOTAS ----------
NOTAS = wb.create_sheet("NOTAS")
NOTAS.sheet_properties.tabColor = BLUE
W = [10, 26, 12, 12, 12, 12, 12, 12, 12, 10]
for idx, w in enumerate(W, start=1):
    NOTAS.column_dimensions[get_column_letter(idx)].width = w
NOTAS.sheet_view.showGridLines = False
NOTAS.freeze_panes = "A5"

NOTAS.merge_cells("A1:I1")
t1 = NOTAS["A1"]
t1.value = "CONTROL RÁPIDO DE NOTAS 2026/2027"
t1.font = Font(bold=True, size=20, color=WHITE)
t1.fill = FILL_NAVY
t1.alignment = Alignment(horizontal="center", vertical="center")
NOTAS.row_dimensions[1].height = 46
NOTAS.merge_cells("A2:I2")
t2 = NOTAS["A2"]
t2.value = "Hasta 5 notas por asignatura · PESO (%) · la NOTA FINAL se calcula sola"
t2.font = Font(italic=True, size=11, color=GRAY)
t2.alignment = Alignment(horizontal="center", vertical="center")
NOTAS.row_dimensions[2].height = 23
NOTAS.merge_cells("A3:I3")
t3 = NOTAS["A3"]
t3.value = "CALCULAFÁCIL · calculafacil.app · versión gratuita"
t3.font = Font(bold=True, size=10, color="1F4E79")
t3.alignment = Alignment(horizontal="center", vertical="center")
NOTAS.row_dimensions[3].height = 20

headers = ["ASIGNATURA", "NOTA 1", "NOTA 2", "NOTA 3", "NOTA 4", "NOTA 5", "MEDIA", "PESO (%)"]
for col, h in enumerate(headers, start=2):
    c = NOTAS.cell(row=4, column=col, value=h)
    c.font = Font(bold=True, color=WHITE, size=11)
    c.fill = FILL_BLUE
    c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    c.border = BORDER
NOTAS.row_dimensions[4].height = 32

SUBJ_START = 5
SUBJ_END = 16  # 12 filas
for row in range(SUBJ_START, SUBJ_END + 1):
    NOTAS.row_dimensions[row].height = 24
    asig = NOTAS.cell(row=row, column=2, value="")
    asig.alignment = Alignment(horizontal="left", vertical="center")
    NOTAS.cell(row=row, column=8, value=f'=IF($B{row}="","",ROUND(AVERAGE(C{row}:G{row}),2))').number_format = "0.00"
    peso = NOTAS.cell(row=row, column=9, value=None)
    peso.number_format = "0"
    peso.border = BORDER
    peso.alignment = Alignment(horizontal="center", vertical="center")
    for col in range(2, 10):
        c = NOTAS.cell(row=row, column=col)
        c.border = BORDER
        if col >= 3:
            c.alignment = Alignment(horizontal="center", vertical="center")

tab = Table(displayName="ControlNotasGratis", ref="B4:I16")
tab.tableStyleInfo = TableStyleInfo(name="TableStyleMedium2", showRowStripes=True, showColumnStripes=False)
NOTAS.add_table(tab)

NOTAS.row_dimensions[17].height = 16

NOTAS.merge_cells("B18:I18")
sec = NOTAS["B18"]
sec.value = "RESUMEN"
sec.font = Font(bold=True, color=WHITE, size=12)
sec.fill = FILL_NAVY
sec.alignment = Alignment(horizontal="center", vertical="center")
NOTAS.row_dimensions[18].height = 26

suma = NOTAS.cell(row=19, column=2, value="TOTAL PESO (%)")
suma.font = Font(bold=True)
suma.fill = FILL_AMBER
suma.border = BORDER
suma.alignment = Alignment(wrap_text=True, vertical="center", horizontal="left")
suma_v = NOTAS.cell(row=19, column=3, value="=SUM(I5:I16)")
suma_v.fill = FILL_AMBER
suma_v.border = BORDER
suma_v.alignment = Alignment(horizontal="center", vertical="center")
suma_v.number_format = "0"
suma_v.font = Font(bold=True, size=14)
NOTAS.row_dimensions[19].height = 30

final = NOTAS.cell(row=20, column=2, value="NOTA FINAL PONDERADA")
final.font = Font(bold=True)
final.fill = FILL_AMBER
final.border = BORDER
final.alignment = Alignment(wrap_text=True, vertical="center", horizontal="left")
final_v = NOTAS.cell(row=20, column=3, value='=IF(C19=0,"",ROUND(SUMPRODUCT(N(H5:H16),I5:I16)/C19,2))')
final_v.fill = FILL_AMBER
final_v.border = BORDER
final_v.alignment = Alignment(horizontal="center", vertical="center")
final_v.number_format = "0.00"
final_v.font = Font(bold=True, size=16)
NOTAS.row_dimensions[20].height = 32

NOTAS.merge_cells("B21:I21")
tip = NOTAS["B21"]
tip.value = "La NOTA FINAL PONDERADA usa los pesos de tu centro. Solo cuentan las asignaturas con nota. Si tu centro pondera de otra forma, ajusta los PESO (%) hasta que el TOTAL sume 100 y se ponga verde."
tip.font = Font(italic=True, size=9, color=GRAY)
tip.alignment = Alignment(wrap_text=True)
NOTAS.row_dimensions[21].height = 40

NOTAS.merge_cells("B22:I22")
up = NOTAS["B22"]
up.value = "¿Quieres también el control de FALTAS y el cuadro de mandos? Mira el Organizador de Estudios completo en calculafacil.app/organizador-estudios/"
up.font = Font(bold=True, size=10, color="1F4E79")
up.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
NOTAS.row_dimensions[22].height = 30

NOTAS.merge_cells("B23:I23")
f_p = NOTAS["B23"]
f_p.value = "CalculaFácil · calculafacil.app · versión gratuita"
f_p.font = Font(italic=True, size=9, color="A6A6A6")
f_p.alignment = Alignment(horizontal="center")
NOTAS.row_dimensions[23].height = 22

NOTAS.conditional_formatting.add(
    "H5:H16",
    FormulaRule(formula=['AND($H5<>"",$H5>=5)'], font=Font(color=C_GREEN), fill=FILL_GREEN),
)
NOTAS.conditional_formatting.add(
    "H5:H16",
    FormulaRule(formula=['AND($H5<>"",$H5<5)'], font=Font(color=C_RED), fill=FILL_RED),
)
NOTAS.conditional_formatting.add(
    "C19",
    FormulaRule(formula=["C19=100"], font=Font(bold=True, color=C_GREEN), fill=FILL_GREEN),
)
NOTAS.conditional_formatting.add(
    "C19",
    FormulaRule(formula=["AND(C19<>100,C19>0)"], font=Font(bold=True, color=C_RED), fill=FILL_RED),
)
NOTAS.conditional_formatting.add(
    "C20",
    FormulaRule(formula=['AND($C$20<>"",$C$20>=5)'], font=Font(bold=True, color=C_GREEN)),
)
NOTAS.conditional_formatting.add(
    "C20",
    FormulaRule(formula=['AND($C$20<>"",$C$20<5)'], font=Font(bold=True, color=C_RED)),
)


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


def setup_print(ws, orientation="portrait", title_rows=None):
    ws.page_setup.orientation = orientation
    ws.page_setup.fitToWidth = 1
    ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
    ws.page_setup.horizontalCentered = True
    ws.print_title_rows = title_rows
    for side, val in (("left", 0.4), ("right", 0.4), ("top", 0.6), ("bottom", 0.6)):
        setattr(ws.page_margins, side, val)


setup_print(PORT, "portrait")
setup_print(NOTAS, "landscape", "4:4")

lock_sheet(PORT)
lock_sheet(NOTAS, ["B5:B16", "C5:G16", "I5:I16"], password=PW)

wb.active = 1
wb.save(OUT_PATH)
print("OK ->", OUT_PATH)