(function () {
  'use strict';

  const CF = window.CF;

  const ICONO_BORRAR = '<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

  // ==========================================================
  // NOTA NECESARIA (EXAMEN FINAL)
  // ==========================================================
  CF.registrar({
    id: 'nota-necesaria',
    historialClave: 'historial_necesaria',

    actualizarBarra(raiz) {
      const pesosPrevios = Array.from(raiz.querySelectorAll('#contenedor-examenes-previos .ex-peso'))
        .reduce((suma, input) => suma + (parseFloat(input.value) || 0), 0);
      const pesoPendiente = parseFloat(raiz.querySelector('#pesoPendiente')?.value) || 0;
      const total = pesosPrevios + pesoPendiente;

      const texto = raiz.querySelector('#textoPorcentajeNecesaria');
      const barra = raiz.querySelector('#barraProgresoNecesaria');
      if (texto) texto.innerText = `${total.toFixed(0)}% / 100%`;
      if (barra) {
        barra.style.width = `${Math.min(total, 100)}%`;
        barra.style.backgroundColor = total === 100 ? '#10b981' : (total > 100 ? '#ef4444' : '#3b82f6');
      }
    },

    iniciar(raiz) {
      this.actualizarBarra(raiz);
    },

    onInput(raiz) {
      this.actualizarBarra(raiz);
    },

    agregarFila(raiz) {
      const cont = raiz.querySelector('#contenedor-examenes-previos');
      if (!cont) return;
      cont.insertAdjacentHTML('beforeend', `
        <div class="fila-dinamica">
          <input type="number" inputmode="decimal" class="ex-nota" placeholder="Nota (0-10)" step="0.1" min="0" max="10" aria-label="Nota anterior">
          <input type="number" inputmode="decimal" class="ex-peso" placeholder="Peso %" min="0" max="100" aria-label="Peso de la nota">
          <button type="button" class="btn-eliminar-fila" data-action="eliminar-fila" aria-label="Eliminar fila">${ICONO_BORRAR}</button>
        </div>
      `);
    },

    eliminarFila(raiz, fila) {
      if (fila) fila.remove();
      this.actualizarBarra(raiz);
    },

    calcular(raiz) {
      const resDiv = raiz.querySelector('#resultadoNotaMultiples');
      const pesoPendiente = parseFloat(raiz.querySelector('#pesoPendiente')?.value);
      const objetivo = parseFloat(raiz.querySelector('#notaObjetivoMultiples')?.value);

      CF.prepararLCD(resDiv);

      if (!CF.validarRangoInputs(raiz, '#contenedor-examenes-previos .ex-nota', CF.RANGO_NOTA)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: Las notas deben estar entre 0 y 10');
        return;
      }
      if (!CF.validarRangoInputs(raiz, '#contenedor-examenes-previos .ex-peso', CF.RANGO_PORCENTAJE)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: Los pesos deben estar entre 0% y 100%');
        return;
      }
      if (!CF.validarNumero(raiz.querySelector('#pesoPendiente'), CF.RANGO_PORCENTAJE) ||
          !CF.validarNumero(raiz.querySelector('#notaObjetivoMultiples'), CF.RANGO_NOTA)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: El peso final debe ser 0-100% y la nota objetivo 0-10');
        return;
      }
      if (isNaN(pesoPendiente) || isNaN(objetivo) || pesoPendiente <= 0) {
        if (resDiv) resDiv.innerText = 'Introduce el peso final y la nota objetivo';
        return;
      }

      let sumaPonderadaActual = 0;
      let sumaPesosActuales = 0;
      raiz.querySelectorAll('#contenedor-examenes-previos .ex-nota').forEach((inputNota, i) => {
        const inputPeso = raiz.querySelectorAll('#contenedor-examenes-previos .ex-peso')[i];
        const n = parseFloat(inputNota.value);
        const p = parseFloat(inputPeso.value);
        if (!isNaN(n) && !isNaN(p)) {
          sumaPonderadaActual += n * (p / 100);
          sumaPesosActuales += p;
        }
      });

      if (sumaPesosActuales + pesoPendiente > 100 + 1e-9) {
        const exceso = (sumaPesosActuales + pesoPendiente).toFixed(1);
        CF.mostrarErrorLCD(resDiv, `ERROR: La suma de pesos (${exceso}%) supera el 100%`);
        return;
      }

      const notaNecesaria = (objetivo - sumaPonderadaActual) / (pesoPendiente / 100);

      if (resDiv) {
        if (notaNecesaria > 10) {
          CF.pintarResultLCD(resDiv, 'Imposible',
            `Habría que sacar un ${CF.formatearNumero(notaNecesaria)} y el máximo es un 10`);
        } else if (notaNecesaria <= 0) {
          CF.pintarResultLCD(resDiv, '¡Objetivo alcanzado!',
            `Ya lo tienes asegurado: llevas ${CF.formatearNumero(sumaPonderadaActual)}`);
        } else {
          CF.pintarResultLCD(resDiv, `Necesitas: ${CF.formatearNumero(notaNecesaria)}`,
            `Llevas ${CF.formatearNumero(sumaPonderadaActual)} con el ${CF.formatearNumero(sumaPesosActuales)}% del curso evaluado`);
        }
      }

      CF.historialGuardar(
        this.historialClave,
        `Objetivo: ${CF.formatearNumero(objetivo)} | Necesitas: ${notaNecesaria > 0 ? CF.formatearNumero(notaNecesaria) : '0'}`,
        raiz
      );
    },

    limpiar(raiz) {
      raiz.querySelectorAll('#contenedor-examenes-previos input').forEach(i => i.value = '');
      const pPen = raiz.querySelector('#pesoPendiente');
      const nObj = raiz.querySelector('#notaObjetivoMultiples');
      const res = raiz.querySelector('#resultadoNotaMultiples');
      if (pPen) pPen.value = '';
      if (nObj) nObj.value = '';
      CF.limpiarMarcasError(raiz);
      CF.prepararLCD(res);
      if (res) res.innerText = 'Necesitas: 0.00';
      this.actualizarBarra(raiz);
    }
  });

  // ==========================================================
  // MEDIA PONDERADA
  // ==========================================================
  CF.registrar({
    id: 'media-ponderada',
    historialClave: 'historial_ponderada',

    actualizarBarra(raiz) {
      const total = Array.from(raiz.querySelectorAll('#contenedor-filas-ponderada .p-peso'))
        .reduce((suma, input) => suma + (parseFloat(input.value) || 0), 0);

      const texto = raiz.querySelector('#textoPorcentajePonderada');
      const barra = raiz.querySelector('#barraProgresoPonderada');
      if (texto) texto.innerText = `${total.toFixed(0)}% / 100%`;
      if (barra) {
        barra.style.width = `${Math.min(total, 100)}%`;
        barra.style.backgroundColor = total === 100 ? '#10b981' : (total > 100 ? '#ef4444' : '#3b82f6');
      }
    },

    iniciar(raiz) {
      this.actualizarBarra(raiz);
    },

    onInput(raiz) {
      this.actualizarBarra(raiz);
    },

    // Barras horizontales: una por asignatura, largo según peso y
    // color según la nota (verde aprobado, rojo suspenso).
    pintarGrafico(raiz) {
      const caja = raiz.querySelector('#graficoPonderada');
      const canvas = raiz.querySelector('#canvasPonderada');
      if (!caja || !canvas) return;
      const notas = raiz.querySelectorAll('#contenedor-filas-ponderada .p-nota');
      const pesos = raiz.querySelectorAll('#contenedor-filas-ponderada .p-peso');
      const filas = [];
      notas.forEach((inputNota, i) => {
        const n = parseFloat(inputNota.value);
        const p = parseFloat(pesos[i] ? pesos[i].value : NaN);
        if (isNaN(n) || isNaN(p)) return;
        filas.push({
          etiqueta: (filas.length + 1) + 'ª',
          valor: p,
          maximo: 100,
          texto: 'Nota ' + CF.formatearNumero(n, 1),
          color: n >= 5 ? '#10b981' : '#ef4444'
        });
      });
      if (!filas.length) {
        CF.reiniciarGrafico(caja);
        return;
      }
      CF.graficoBarras(canvas, filas);
      if (!this._redrawListo) {
        this._redrawListo = true;
        CF.alRedimensionar('ponderada', () => {
          const viva = document.querySelector('[data-calculadora="media-ponderada"]');
          if (viva) this.pintarGrafico(viva);
        });
      }
    },

    agregarFila(raiz) {
      const cont = raiz.querySelector('#contenedor-filas-ponderada');
      if (!cont) return;
      cont.insertAdjacentHTML('beforeend', `
        <div class="fila-dinamica">
          <input type="number" inputmode="decimal" class="p-nota" placeholder="Nota (0-10)" step="0.1" min="0" max="10" aria-label="Nota">
          <input type="number" inputmode="decimal" class="p-peso" placeholder="Peso %" min="0" max="100" aria-label="Peso">
          <button type="button" class="btn-eliminar-fila" data-action="eliminar-fila" aria-label="Eliminar fila">${ICONO_BORRAR}</button>
        </div>
      `);
    },

    eliminarFila(raiz, fila) {
      if (fila) fila.remove();
      this.actualizarBarra(raiz);
      this.pintarGrafico(raiz);
    },

    calcular(raiz) {
      const resDiv = raiz.querySelector('#resultadoPonderada');

      CF.prepararLCD(resDiv);

      if (!CF.validarRangoInputs(raiz, '#contenedor-filas-ponderada .p-nota', CF.RANGO_NOTA)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: Las notas deben estar entre 0 y 10');
        return;
      }
      if (!CF.validarRangoInputs(raiz, '#contenedor-filas-ponderada .p-peso', CF.RANGO_PORCENTAJE)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: Los pesos deben estar entre 0% y 100%');
        return;
      }

      let sumaPonderada = 0;
      let sumaPesos = 0;
      raiz.querySelectorAll('#contenedor-filas-ponderada .p-nota').forEach((inputNota, i) => {
        const inputPeso = raiz.querySelectorAll('#contenedor-filas-ponderada .p-peso')[i];
        const n = parseFloat(inputNota.value);
        const p = parseFloat(inputPeso.value);
        if (!isNaN(n) && !isNaN(p)) {
          sumaPonderada += n * p;
          sumaPesos += p;
        }
      });

      if (sumaPesos > 100 + 1e-9) {
        CF.mostrarErrorLCD(resDiv, `ERROR: La suma de pesos (${sumaPesos.toFixed(1)}%) supera el 100%`);
        return;
      }

      if (sumaPesos === 0) {
        if (resDiv) resDiv.innerText = 'Introduce al menos una nota y peso';
        return;
      }

      const media = sumaPonderada / sumaPesos;
      const contextoPesos = sumaPesos >= 100 - 1e-9
        ? 'Curso evaluado al 100%'
        : `Ojo: solo está evaluado el ${CF.formatearNumero(sumaPesos)}% del curso`;
      CF.pintarResultLCD(resDiv, CF.formatearNumero(media), contextoPesos);

      this.pintarGrafico(raiz);

      CF.historialGuardar(this.historialClave, `Media: ${CF.formatearNumero(media)} (Pesos: ${sumaPesos}%)`, raiz);
    },

    limpiar(raiz) {
      raiz.querySelectorAll('#contenedor-filas-ponderada input').forEach(i => i.value = '');
      const res = raiz.querySelector('#resultadoPonderada');
      CF.limpiarMarcasError(raiz);
      CF.prepararLCD(res);
      if (res) res.innerText = '0.00';
      this.actualizarBarra(raiz);
      this.pintarGrafico(raiz);
    }
  });

  // ==========================================================
  // ADMISIÓN EBAU / PAU
  // ==========================================================
  CF.registrar({
    id: 'admision-ebau-pau',
    historialClave: 'historial_ebau',

    agregarFila(raiz) {
      const cont = raiz.querySelector('#contenedor-especificas-ebau');
      if (!cont) return;
      cont.insertAdjacentHTML('beforeend', `
        <div class="fila-dinamica">
          <input type="number" inputmode="decimal" class="ebau-nota" placeholder="Nota (0-10)" step="0.01" min="0" max="10" aria-label="Nota Asignatura Específica">
          <select class="ebau-ponderacion" aria-label="Ponderación">
            <option value="0.2">Pondera 0.2</option>
            <option value="0.1">Pondera 0.1</option>
          </select>
          <button type="button" class="btn-eliminar-fila" data-action="eliminar-fila" aria-label="Eliminar fila">${ICONO_BORRAR}</button>
        </div>
      `);
    },

    calcular(raiz) {
      const nBach = parseFloat(raiz.querySelector('#notaBachillerato')?.value);
      const nFaseGen = parseFloat(raiz.querySelector('#notaFaseGeneral')?.value);
      const resDiv = raiz.querySelector('#resultadoEbau');

      CF.prepararLCD(resDiv);

      if (!CF.validarNumero(raiz.querySelector('#notaBachillerato'), CF.RANGO_NOTA) ||
          !CF.validarNumero(raiz.querySelector('#notaFaseGeneral'), CF.RANGO_NOTA) ||
          !CF.validarRangoInputs(raiz, '#contenedor-especificas-ebau .ebau-nota', CF.RANGO_NOTA)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: Todas las notas deben estar entre 0 y 10');
        return;
      }
      if (isNaN(nBach) || isNaN(nFaseGen)) {
        if (resDiv) resDiv.innerText = 'Introduce Bachillerato y Fase General';
        return;
      }

      const notaAcceso = (nBach * 0.6) + (nFaseGen * 0.4);

      const puntosEspecificos = [];
      raiz.querySelectorAll('#contenedor-especificas-ebau .ebau-nota').forEach((inputNota, i) => {
        const ponderacion = raiz.querySelectorAll('#contenedor-especificas-ebau .ebau-ponderacion')[i];
        const n = parseFloat(inputNota.value);
        const p = parseFloat(ponderacion.value);
        if (!isNaN(n) && n >= 5) {
          puntosEspecificos.push(n * p);
        }
      });

      puntosEspecificos.sort((a, b) => b - a);
      const sumaMejoresDos = (puntosEspecificos[0] || 0) + (puntosEspecificos[1] || 0);
      const notaAdmision = notaAcceso + sumaMejoresDos;

      CF.pintarResultLCD(resDiv,
        `Nota: ${CF.formatearNumero(notaAdmision, 3)}`,
        `Acceso: ${CF.formatearNumero(notaAcceso)} · Específicas: +${CF.formatearNumero(sumaMejoresDos)} puntos`);

      CF.historialGuardar(
        this.historialClave,
        `Acceso: ${CF.formatearNumero(notaAcceso)} | Admisión: ${CF.formatearNumero(notaAdmision, 3)}`,
        raiz
      );
    },

    limpiar(raiz) {
      const nB = raiz.querySelector('#notaBachillerato');
      const nF = raiz.querySelector('#notaFaseGeneral');
      const res = raiz.querySelector('#resultadoEbau');
      if (nB) nB.value = '';
      if (nF) nF.value = '';
      raiz.querySelectorAll('#contenedor-especificas-ebau input').forEach(i => i.value = '');
      CF.limpiarMarcasError(raiz);
      CF.prepararLCD(res);
      if (res) res.innerText = 'Nota: 0.000';
    }
  });

  // ==========================================================
  // ASISTENCIA Y FALTAS
  // ==========================================================
  CF.registrar({
    id: 'asistencias-faltas',
    historialClave: 'historial_asistencia',

    // Anillo con el % de asistencia real y marca ámbar en el mínimo
    // exigido: verde si cumples, rojo si te pasas.
    pintarGrafico(raiz, porcentajeActual, minimo) {
      const caja = raiz.querySelector('#graficoAsistencia');
      const canvas = raiz.querySelector('#canvasAsistencia');
      if (!caja || !canvas) return;
      if (isNaN(porcentajeActual) || isNaN(minimo)) {
        CF.reiniciarGrafico(caja);
        return;
      }
      this._datosAsistencia = { porcentajeActual, minimo };
      CF.graficoAnillo(canvas, {
        porcentaje: porcentajeActual,
        minimo,
        textoGrande: CF.formatearNumero(Math.min(Math.max(porcentajeActual, 0), 100)) + '%',
        textoPequeno: 'mínimo ' + CF.formatearNumero(minimo) + '%'
      });
      if (!this._redrawListo) {
        this._redrawListo = true;
        CF.alRedimensionar('asistencia', () => {
          const viva = document.querySelector('[data-calculadora="asistencias-faltas"]');
          if (!viva || viva.querySelector('#graficoAsistencia').style.display === 'none') return;
          const d = this._datosAsistencia;
          if (d) this.pintarGrafico(viva, d.porcentajeActual, d.minimo);
        });
      }
    },

    calcular(raiz) {
      const total = parseFloat(raiz.querySelector('#totalClases')?.value);
      const minPorcentaje = parseFloat(raiz.querySelector('#porcentajeMinimo')?.value);
      const faltas = parseFloat(raiz.querySelector('#faltasActuales')?.value) || 0;
      const resDiv = raiz.querySelector('#resultadoAsistencia');

      CF.prepararLCD(resDiv);

      if (!CF.validarNumero(raiz.querySelector('#porcentajeMinimo'), CF.RANGO_PORCENTAJE)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: La asistencia mínima debe estar entre 0% y 100%');
        return;
      }
      if (isNaN(total) || isNaN(minPorcentaje) || total <= 0) {
        if (resDiv) resDiv.innerText = 'Introduce horas totales y % mínimo';
        return;
      }
      if (!isNaN(total) && (faltas < 0 || faltas > total)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: Las faltas no pueden ser negativas ni superar el total de clases');
        return;
      }

      const maxFaltasPermitidas = Math.floor(total * (1 - (minPorcentaje / 100)));
      const faltasRestantes = maxFaltasPermitidas - faltas;

      this.pintarGrafico(raiz, ((total - faltas) / total) * 100, minPorcentaje);

      if (resDiv) {
        if (faltasRestantes < 0) {
          CF.pintarResultLCD(resDiv, 'Límite superado',
            `Te has pasado en ${Math.abs(faltasRestantes)} ${Math.abs(faltasRestantes) === 1 ? 'falta' : 'faltas'} (máximo: ${maxFaltasPermitidas})`);
        } else if (faltasRestantes === 0) {
          CF.pintarResultLCD(resDiv, 'Te quedan: 0 faltas',
            `Estás justo en el límite permitido (${maxFaltasPermitidas})`);
        } else {
          CF.pintarResultLCD(resDiv, `Te quedan: ${faltasRestantes} faltas`,
            `Máximo permitido en el curso: ${maxFaltasPermitidas}`);
        }
      }

      CF.historialGuardar(
        this.historialClave,
        `Total max: ${maxFaltasPermitidas} faltas | Quedan: ${faltasRestantes}`,
        raiz
      );
    },

    limpiar(raiz) {
      const t = raiz.querySelector('#totalClases');
      const p = raiz.querySelector('#porcentajeMinimo');
      const f = raiz.querySelector('#faltasActuales');
      const res = raiz.querySelector('#resultadoAsistencia');
      if (t) t.value = '';
      if (p) p.value = '80';
      if (f) f.value = '0';
      CF.limpiarMarcasError(raiz);
      CF.prepararLCD(res);
      if (res) res.innerText = 'Te quedan: 0 faltas';
      CF.reiniciarGrafico(raiz.querySelector('#graficoAsistencia'));
    }
  });

  // ==========================================================
  // DESCUENTOS
  // ==========================================================
  CF.registrar({
    id: 'descuentos',
    historialClave: 'historial_descuentos',

    calcular(raiz) {
      const cantidad = parseFloat(raiz.querySelector('#cantidad')?.value);
      const porcentaje = parseFloat(raiz.querySelector('#porcentaje')?.value);
      const resDiv = raiz.querySelector('#resultado');

      CF.prepararLCD(resDiv);

      if (!isNaN(cantidad) && cantidad < 0) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: El precio no puede ser negativo');
        return;
      }
      if (!CF.validarNumero(raiz.querySelector('#porcentaje'), CF.RANGO_PORCENTAJE)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: El descuento debe estar entre 0% y 100%');
        return;
      }
      if (isNaN(cantidad) || isNaN(porcentaje)) {
        if (resDiv) resDiv.innerText = 'Campo requerido';
        return;
      }

      const ahorro = cantidad * (porcentaje / 100);
      const precioFinal = cantidad - ahorro;

      CF.pintarResultLCD(resDiv, CF.formatearEuros(precioFinal),
        `Ahorras: ${CF.formatearEuros(ahorro)} (${CF.formatearNumero(porcentaje)}% de rebaja)`);

      CF.historialGuardar(
        this.historialClave,
        `${CF.formatearEuros(cantidad)} - ${CF.formatearNumero(porcentaje)}% = ${CF.formatearEuros(precioFinal)} (Ahorro: ${CF.formatearEuros(ahorro)})`,
        raiz
      );
    },

    limpiar(raiz) {
      const c = raiz.querySelector('#cantidad');
      const p = raiz.querySelector('#porcentaje');
      const res = raiz.querySelector('#resultado');
      if (c) c.value = '';
      if (p) p.value = '';
      CF.limpiarMarcasError(raiz);
      CF.prepararLCD(res);
      if (res) res.innerText = '0.00 €';
    }
  });

  // ==========================================================
  // IVA
  // ==========================================================
  CF.registrar({
    id: 'iva',
    historialClave: 'historial_iva',

    calcular(raiz) {
      const modo = raiz.querySelector('#modoIva')?.value;
      const importe = parseFloat(raiz.querySelector('#importeIva')?.value);
      const tipo = parseFloat(raiz.querySelector('#porcentajeIva')?.value);
      const resDiv = raiz.querySelector('#resultadoIva');

      CF.prepararLCD(resDiv);

      if (!isNaN(importe) && importe < 0) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: El importe no puede ser negativo');
        return;
      }
      if (!isNaN(tipo) && (tipo < 0 || tipo > 100)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: El tipo de IVA debe estar entre 0% y 100%');
        return;
      }
      if (isNaN(importe) || isNaN(tipo)) {
        if (resDiv) resDiv.innerText = 'Introduce importe validado';
        return;
      }

      if (modo === 'anadir') {
        const cuotaIva = importe * (tipo / 100);
        const resultado = importe + cuotaIva;
        CF.pintarResultLCD(resDiv, CF.formatearEuros(resultado),
          `Base: ${CF.formatearEuros(importe)} · IVA (${CF.formatearNumero(tipo)}%): +${CF.formatearEuros(cuotaIva)}`);
        CF.historialGuardar(this.historialClave, `Base: ${CF.formatearEuros(importe)} + IVA ${tipo}% = ${CF.formatearEuros(resultado)}`, raiz);
      } else {
        const base = importe / (1 + (tipo / 100));
        const cuotaIva = importe - base;
        CF.pintarResultLCD(resDiv, `Base: ${CF.formatearEuros(base)}`,
          `Total: ${CF.formatearEuros(importe)} · IVA (${CF.formatearNumero(tipo)}%): ${CF.formatearEuros(cuotaIva)}`);
        CF.historialGuardar(this.historialClave, `Total: ${CF.formatearEuros(importe)} - IVA ${tipo}% = Base ${CF.formatearEuros(base)}`, raiz);
      }
    },

    limpiar(raiz) {
      const i = raiz.querySelector('#importeIva');
      const res = raiz.querySelector('#resultadoIva');
      if (i) i.value = '';
      CF.limpiarMarcasError(raiz);
      CF.prepararLCD(res);
      if (res) res.innerText = '0.00 €';
    }
  });

  // ==========================================================
  // SUELDO NETO
  // ==========================================================
  CF.registrar({
    id: 'sueldo-neto',
    historialClave: 'historial_sueldo',

    // Barra apilada con el reparto del bruto: neto, IRPF y Seguridad Social.
    pintarGrafico(raiz, bruto, irpf, ss) {
      const caja = raiz.querySelector('#graficoSueldo');
      const canvas = raiz.querySelector('#canvasSueldo');
      if (!caja || !canvas) return;
      const netoAnual = bruto * (1 - irpf - ss);
      this._datosSueldo = { bruto, irpf, ss };
      CF.graficoApilada(canvas, [
        { etiqueta: 'Neto', valor: netoAnual, texto: CF.formatearEuros(netoAnual), color: '#10b981' },
        { etiqueta: 'IRPF', valor: bruto * irpf, texto: CF.formatearEuros(bruto * irpf), color: '#f59e0b' },
        { etiqueta: 'Seg. Social', valor: bruto * ss, texto: CF.formatearEuros(bruto * ss), color: '#38bdf8' }
      ]);
      if (!this._redrawListo) {
        this._redrawListo = true;
        CF.alRedimensionar('sueldo', () => {
          const viva = document.querySelector('[data-calculadora="sueldo-neto"]');
          if (!viva || viva.querySelector('#graficoSueldo').style.display === 'none') return;
          const d = this._datosSueldo;
          if (d) this.pintarGrafico(viva, d.bruto, d.irpf, d.ss);
        });
      }
    },

    calcular(raiz) {
      const bruto = parseFloat(raiz.querySelector('#brutoAnual')?.value);
      const pagas = parseInt(raiz.querySelector('#numPagas')?.value, 10);
      const resDiv = raiz.querySelector('#resultadoSueldo');

      CF.prepararLCD(resDiv);

      if (isNaN(bruto) || bruto <= 0) {
        if (resDiv) resDiv.innerText = 'Introduce el sueldo bruto';
        return;
      }

      let irpf = 0.12;
      if (bruto > 12450) irpf = 0.15;
      if (bruto > 20200) irpf = 0.19;
      if (bruto > 35200) irpf = 0.24;

      const ss = 0.0635;
      const deduccionTotal = irpf + ss;
      const netoAnual = bruto * (1 - deduccionTotal);
      const netoMensual = netoAnual / pagas;

      this.pintarGrafico(raiz, bruto, irpf, ss);

      CF.pintarResultLCD(resDiv, `${CF.formatearEuros(netoMensual)} / mes`,
        `Neto anual: ${CF.formatearEuros(netoAnual)} · ${pagas} pagas · Deducciones: ~${CF.formatearNumero(deduccionTotal * 100, 1)}%`);

      CF.historialGuardar(
        this.historialClave,
        `Bruto: ${CF.formatearEuros(bruto)} -> Neto: ${CF.formatearEuros(netoMensual)}/mes (${pagas} pagas)`,
        raiz
      );
    },

    limpiar(raiz) {
      const b = raiz.querySelector('#brutoAnual');
      const res = raiz.querySelector('#resultadoSueldo');
      if (b) b.value = '';
      CF.limpiarMarcasError(raiz);
      CF.prepararLCD(res);
      if (res) res.innerText = '0.00 € / mes';
      CF.reiniciarGrafico(raiz.querySelector('#graficoSueldo'));
    }
  });

  // ==========================================================
  // NOTA DE CORTE
  // ==========================================================
  CF.registrar({
    id: 'nota-de-corte',
    historialClave: 'historial_corte',

    calcular(raiz) {
      const admision = parseFloat(raiz.querySelector('#notaAdmisionCorte')?.value);
      const corte = parseFloat(raiz.querySelector('#notaCorteGrado')?.value);
      const resDiv = raiz.querySelector('#resultadoCorte');

      CF.prepararLCD(resDiv);

      if (!isNaN(admision) && (admision < 0 || admision > 14)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: Tu nota de admisión debe estar entre 0 y 14');
        return;
      }
      if (!isNaN(corte) && (corte < 0 || corte > 14)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: La nota de corte debe estar entre 0 y 14');
        return;
      }
      if (isNaN(admision) || isNaN(corte)) {
        if (resDiv) resDiv.innerText = 'Introduce ambas notas';
        return;
      }

      const diferencia = admision - corte;

      if (resDiv) {
        if (diferencia >= 0) {
          CF.pintarResultLCD(resDiv, '¡Entras!',
            `Te sobran ${CF.formatearNumero(diferencia, 3)} puntos sobre la nota de corte`);
        } else {
          CF.pintarResultLCD(resDiv, 'No entras',
            `Te faltan ${CF.formatearNumero(Math.abs(diferencia), 3)} puntos para la nota de corte`);
        }
      }

      CF.historialGuardar(
        this.historialClave,
        `Admisión ${CF.formatearNumero(admision, 3)} vs Corte ${CF.formatearNumero(corte, 3)} -> ${diferencia >= 0 ? 'ENTRAS' : 'NO ENTRAS'}`,
        raiz
      );
    },

    limpiar(raiz) {
      const a = raiz.querySelector('#notaAdmisionCorte');
      const c = raiz.querySelector('#notaCorteGrado');
      const res = raiz.querySelector('#resultadoCorte');
      if (a) a.value = '';
      if (c) c.value = '';
      CF.limpiarMarcasError(raiz);
      CF.prepararLCD(res);
      if (res) res.innerText = 'Introduce las notas';
    }
  });

  // ==========================================================
  // INTERÉS COMPUESTO
  // ==========================================================
  CF.registrar({
    id: 'interes-compuesto',
    historialClave: 'historial_interes',

    calcular(raiz) {
      const capital = parseFloat(raiz.querySelector('#capitalInicial')?.value);
      const mensual = parseFloat(raiz.querySelector('#aportacionMensual')?.value);
      const rentabilidad = parseFloat(raiz.querySelector('#rentabilidadAnual')?.value);
      const anios = parseFloat(raiz.querySelector('#plazoAnios')?.value);
      const resDiv = raiz.querySelector('#resultadoInteres');

      CF.prepararLCD(resDiv);

      const aportes = isNaN(mensual) ? 0 : mensual;

      if (!isNaN(capital) && capital < 0) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: El capital no puede ser negativo');
        return;
      }
      if (!isNaN(rentabilidad) && (rentabilidad < 0 || rentabilidad > 100)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: La rentabilidad debe estar entre 0% y 100%');
        return;
      }
      if (!isNaN(anios) && (anios < 1 || anios > 100)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: El plazo debe estar entre 1 y 100 años');
        return;
      }
      if (isNaN(capital) || isNaN(rentabilidad) || isNaN(anios)) {
        if (resDiv) resDiv.innerText = 'Introduce capital, rentabilidad y plazo';
        return;
      }

      const meses = Math.round(anios * 12);
      const tasaMensual = rentabilidad / 100 / 12;
      let total;

      if (tasaMensual === 0) {
        total = capital + aportes * meses;
      } else {
        const factor = Math.pow(1 + tasaMensual, meses);
        total = capital * factor + aportes * ((factor - 1) / tasaMensual);
      }

      const aportado = capital + aportes * meses;
      const ganancia = total - aportado;

      CF.pintarResultLCD(resDiv, CF.formatearEuros(total),
        `Aportado: ${CF.formatearEuros(aportado)} · Intereses generados: +${CF.formatearEuros(ganancia)}`);

      // Serie anual para el gráfico
      const serieAnios = [];
      const serieAportado = [];
      const serieTotales = [];
      for (let anio = 0; anio <= anios; anio++) {
        const mesesAcum = Math.round(anio * 12);
        const factorAnio = tasaMensual === 0 ? 1 : Math.pow(1 + tasaMensual, mesesAcum);
        const valorAnio = tasaMensual === 0
          ? capital + aportes * mesesAcum
          : capital * factorAnio + aportes * ((factorAnio - 1) / tasaMensual);
        serieAnios.push(anio);
        serieAportado.push(capital + aportes * mesesAcum);
        serieTotales.push(valorAnio);
      }
      this.pintarGrafico(raiz, { anios: serieAnios, aportado: serieAportado, totales: serieTotales });

      CF.historialGuardar(
        this.historialClave,
        `${CF.formatearEuros(capital)} + ${CF.formatearEuros(aportes)}/mes al ${rentabilidad}% x ${anios} años = ${CF.formatearEuros(total)}`,
        raiz
      );
    },

    // Modo demo (?demo): precarga datos de ejemplo y calcula,
    // útil para capturas y pruebas visuales.
    iniciar(raiz) {
      const params = new URLSearchParams(window.location.search);
      if (!params.get('demo')) return;
      const c = raiz.querySelector('#capitalInicial');
      const m = raiz.querySelector('#aportacionMensual');
      const r = raiz.querySelector('#rentabilidadAnual');
      const p = raiz.querySelector('#plazoAnios');
      if (c) c.value = '1000';
      if (m) m.value = '100';
      if (r) r.value = '8';
      if (p) p.value = '30';
      this.calcular(raiz);
    },

    pintarGrafico(raiz, serie) {
      const caja = raiz.querySelector('#graficoInteres');
      const canvas = raiz.querySelector('#canvasInteres');
      const mensaje = raiz.querySelector('#graficoVacio');
      if (!caja || !canvas || !canvas.getContext) return;

      this._serieActual = serie;

      if (!serie) {
        caja.style.display = '';
        canvas.style.display = 'none';
        if (mensaje) mensaje.style.display = '';
        return;
      }
      caja.style.display = '';
      canvas.style.display = 'block';
      if (mensaje) mensaje.style.display = 'none';

      // Redibujado automático al redimensionar (giro del móvil, etc.)
      if (!this._resizeListo) {
        this._resizeListo = true;
        let temporizadorRedibujar = null;
        window.addEventListener('resize', () => {
          clearTimeout(temporizadorRedibujar);
          temporizadorRedibujar = setTimeout(() => {
            const raizViva = document.querySelector('[data-calculadora="interes-compuesto"]');
            if (raizViva && this._serieActual) this.pintarGrafico(raizViva, this._serieActual);
          }, 200);
        });
      }

      const dpr = window.devicePixelRatio || 1;
      const anchoCss = Math.max(caja.clientWidth - 24, 120);
      const altoCss = anchoCss > 700 ? 380 : 320;
      canvas.width = Math.round(anchoCss * dpr);
      canvas.height = Math.round(altoCss * dpr);
      canvas.style.width = anchoCss + 'px';
      canvas.style.height = altoCss + 'px';

      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, anchoCss, altoCss);

      const padIzq = 58;
      const padDer = 14;
      const padSup = 16;
      const padInf = 30;
      const wGraf = anchoCss - padIzq - padDer;
      const hGraf = altoCss - padSup - padInf;

      const maxAnios = serie.anios[serie.anios.length - 1];
      const maxValor = Math.max.apply(null, serie.totales) * 1.05 || 1;

      const xDe = anio => padIzq + (anio / maxAnios) * wGraf;
      const yDe = valor => padSup + hGraf - (valor / maxValor) * hGraf;

      // Rejilla horizontal + etiquetas del eje Y
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const v = (maxValor / 4) * i;
        const y = yDe(v);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
        ctx.beginPath();
        ctx.moveTo(padIzq, y);
        ctx.lineTo(padIzq + wGraf, y);
        ctx.stroke();
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(formatearEje(v), padIzq - 6, y);
      }

      // Etiquetas del eje X (años)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const pasoMarca = Math.max(1, Math.round(maxAnios / 5));
      for (let anio = 0; anio <= maxAnios; anio += pasoMarca) {
        ctx.fillText(anio === 0 ? 'hoy' : anio + 'a', xDe(anio), padSup + hGraf + 8);
      }

      // Área gris: dinero aportado
      dibujarSerieGrafico(ctx, serie.anios.map(xDe), serie.aportado.map(yDe), padSup + hGraf,
        'rgba(56, 189, 248, 0.15)', '#38bdf8');

      // Área verde: valor total
      dibujarSerieGrafico(ctx, serie.anios.map(xDe), serie.totales.map(yDe), padSup + hGraf,
        'rgba(16, 185, 129, 0.22)', '#10b981');
    },

    limpiar(raiz) {
      const c = raiz.querySelector('#capitalInicial');
      const m = raiz.querySelector('#aportacionMensual');
      const r = raiz.querySelector('#rentabilidadAnual');
      const p = raiz.querySelector('#plazoAnios');
      const res = raiz.querySelector('#resultadoInteres');
      if (c) c.value = '';
      if (m) m.value = '';
      if (r) r.value = '';
      if (p) p.value = '';
      CF.limpiarMarcasError(raiz);
      CF.prepararLCD(res);
      if (res) res.innerText = 'Introduce los datos';
      this.pintarGrafico(raiz, null);
    }
  });

  // ==========================================================
  // PORCENTAJES Y REGLA DE TRES (4 MODOS)
  // ==========================================================

  const ETIQUETAS_MODO_PORCENTAJE = {
    'sacar': 'CALCULAR PORCENTAJE',
    'que-es': 'QUÉ PORCENTAJE REPRESENTA',
    'variacion': 'VARIACIÓN PORCENTUAL',
    'regla': 'REGLA DE TRES'
  };

  CF.registrar({
    id: 'porcentajes',
    historialClave: 'historial_porcentajes',

    // Muestra solo los campos del modo activo y actualiza la etiqueta del LCD
    alternarModo(raiz) {
      const modo = raiz.querySelector('#modoPorcentaje')?.value;
      if (!modo) return;
      raiz.querySelectorAll('[data-grupo-modo]').forEach(grupo => {
        grupo.hidden = grupo.dataset.grupoModo !== modo;
      });
      const etiqueta = raiz.querySelector('.etiqueta-lcd');
      if (etiqueta) etiqueta.textContent = ETIQUETAS_MODO_PORCENTAJE[modo] || 'RESULTADO';
    },

    iniciar(raiz) {
      this.alternarModo(raiz);
      const selector = raiz.querySelector('#modoPorcentaje');
      if (selector) selector.addEventListener('change', () => this.alternarModo(raiz));
    },

    calcular(raiz) {
      const resDiv = raiz.querySelector('#resultadoPorcentajes');
      const modo = raiz.querySelector('#modoPorcentaje')?.value || 'sacar';
      const RANGO_LIBRE = { min: -1e15, max: 1e15 };

      const leer = id => parseFloat(raiz.querySelector('#' + id)?.value);
      const validarCampos = ids => Array.from(new Set(ids)).every(id => CF.validarNumero(raiz.querySelector('#' + id), RANGO_LIBRE));

      CF.prepararLCD(resDiv);

      if (modo === 'sacar') {
        const cantidad = leer('cantidadBase');
        const porcentaje = leer('porcentajeSacar');
        if (!validarCampos(['cantidadBase', 'porcentajeSacar'])) {
          CF.mostrarErrorLCD(resDiv, 'ERROR: Introduce números válidos');
          return;
        }
        if (isNaN(cantidad) || isNaN(porcentaje)) {
          if (resDiv) resDiv.innerText = 'Introduce cantidad y porcentaje';
          return;
        }
        const resultado = cantidad * porcentaje / 100;
        CF.pintarResultLCD(resDiv, CF.formatearNumero(resultado),
          `${CF.formatearNumero(porcentaje)}% de ${CF.formatearNumero(cantidad)}`);
        CF.historialGuardar(this.historialClave,
          `${CF.formatearNumero(porcentaje)}% de ${CF.formatearNumero(cantidad)} = ${CF.formatearNumero(resultado)}`, raiz);
        return;
      }

      if (modo === 'que-es') {
        const parte = leer('parteQueEs');
        const total = leer('totalQueEs');
        if (!validarCampos(['parteQueEs', 'totalQueEs'])) {
          CF.mostrarErrorLCD(resDiv, 'ERROR: Introduce números válidos');
          return;
        }
        if (isNaN(parte) || isNaN(total)) {
          if (resDiv) resDiv.innerText = 'Introduce la parte y el total';
          return;
        }
        if (total === 0) {
          CF.mostrarErrorLCD(resDiv, 'ERROR: El total no puede ser 0');
          return;
        }
        const resultado = parte / total * 100;
        CF.pintarResultLCD(resDiv, `Es el ${CF.formatearNumero(resultado)}%`,
          `${CF.formatearNumero(parte)} de ${CF.formatearNumero(total)}`);
        CF.historialGuardar(this.historialClave,
          `${CF.formatearNumero(parte)} de ${CF.formatearNumero(total)} = ${CF.formatearNumero(resultado)}%`, raiz);
        return;
      }

      if (modo === 'variacion') {
        const antes = leer('valorAntes');
        const ahora = leer('valorAhora');
        if (!validarCampos(['valorAntes', 'valorAhora'])) {
          CF.mostrarErrorLCD(resDiv, 'ERROR: Introduce números válidos');
          return;
        }
        if (isNaN(antes) || isNaN(ahora)) {
          if (resDiv) resDiv.innerText = 'Introduce el valor antes y ahora';
          return;
        }
        if (antes === 0) {
          CF.mostrarErrorLCD(resDiv, 'ERROR: El valor inicial no puede ser 0');
          return;
        }
        const variacion = (ahora - antes) / Math.abs(antes) * 100;
        const flecha = variacion > 0 ? '+' : (variacion < 0 ? '\u2212' : '');
        CF.pintarResultLCD(resDiv,
          variacion === 0 ? 'Sin cambio' : `${flecha}${CF.formatearNumero(Math.abs(variacion))}%`,
          `De ${CF.formatearNumero(antes)} a ${CF.formatearNumero(ahora)}`);
        CF.historialGuardar(this.historialClave,
          `De ${antes} a ${ahora} = ${flecha}${CF.formatearNumero(Math.abs(variacion))}%`, raiz);
        return;
      }

      // MODO REGLA DE TRES
      const tipoRegla = raiz.querySelector('#tipoRegla')?.value || 'directa';
      const a = leer('reglaA');
      const b = leer('reglaB');
      const c = leer('reglaC');
      if (!validarCampos(['reglaA', 'reglaB', 'reglaC'])) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: Introduce números válidos');
        return;
      }
      if (isNaN(a) || isNaN(b) || isNaN(c)) {
        if (resDiv) resDiv.innerText = 'Rellena A, B y C de la regla de tres';
        return;
      }
      const divisorCero = (tipoRegla === 'directa' && a === 0) || (tipoRegla === 'inversa' && c === 0);
      if (divisorCero) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: No se puede dividir entre 0');
        return;
      }
      let resultadoRegla;
      let formulaDesglose;
      if (tipoRegla === 'directa') {
        resultadoRegla = b * c / a;
        formulaDesglose = 'Directa · C × B ÷ A';
      } else {
        resultadoRegla = a * b / c;
        formulaDesglose = 'Inversa · A × B ÷ C';
      }
      CF.pintarResultLCD(resDiv, CF.formatearNumero(resultadoRegla),
        `${formulaDesglose} · Si ${CF.formatearNumero(a)} equivale a ${CF.formatearNumero(b)}, ${CF.formatearNumero(c)} equivale a...`);
      CF.historialGuardar(this.historialClave,
        `Tres ${tipoRegla}: A=${a} B=${b} C=${c} -> D=${CF.formatearNumero(resultadoRegla)}`, raiz);
    },

    limpiar(raiz) {
      ['cantidadBase', 'porcentajeSacar', 'parteQueEs', 'totalQueEs', 'valorAntes', 'valorAhora', 'reglaA', 'reglaB', 'reglaC']
        .forEach(id => {
          const input = raiz.querySelector('#' + id);
          if (input) input.value = '';
        });
      const res = raiz.querySelector('#resultadoPorcentajes');
      CF.limpiarMarcasError(raiz);
      CF.prepararLCD(res);
      if (res) res.innerText = 'Introduce los valores';
    }
  });

})();

// ==========================================================
// GRÁFICO INTERÉS COMPUESTO (funciones auxiliares)
// ==========================================================

function formatearEje(valor) {
  if (valor >= 1000000) return (valor / 1000000).toFixed(1).replace('.', ',') + 'M€';
  if (valor >= 1000) return Math.round(valor / 1000) + 'k€';
  return Math.round(valor) + '€';
}

function dibujarSerieGrafico(ctx, xs, ys, yBase, colorRelleno, colorLinea) {
  if (!xs.length) return;

  // Relleno hasta la base
  ctx.beginPath();
  ctx.moveTo(xs[0], yBase);
  for (let i = 0; i < xs.length; i++) ctx.lineTo(xs[i], ys[i]);
  ctx.lineTo(xs[xs.length - 1], yBase);
  ctx.closePath();
  ctx.fillStyle = colorRelleno;
  ctx.fill();

  // Línea superior
  ctx.beginPath();
  ctx.moveTo(xs[0], ys[0]);
  for (let i = 1; i < xs.length; i++) ctx.lineTo(xs[i], ys[i]);
  ctx.strokeStyle = colorLinea;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
}
