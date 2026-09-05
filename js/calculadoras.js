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

    formula: '<code>Nota = (Objetivo − Σ(notas × pesos)) ÷ pesoPendiente</code><br><small>Si el resultado es ≤0, ya tienes el objetivo asegurado. Si es >10, es imposible.</small>',

    ejemplo(raiz) {
      const cont = raiz.querySelector('#contenedor-examenes-previos');
      if (!cont) return;
      cont.querySelectorAll('.fila-dinamica').forEach(f => f.remove());
      this.agregarFila(raiz);
      this.agregarFila(raiz);
      const notas = cont.querySelectorAll('.ex-nota');
      const pesos = cont.querySelectorAll('.ex-peso');
      if (notas[0]) notas[0].value = '7.5';
      if (pesos[0]) pesos[0].value = '30';
      if (notas[1]) notas[1].value = '6.8';
      if (pesos[1]) pesos[1].value = '25';
      const pp = raiz.querySelector('#pesoPendiente');
      const no = raiz.querySelector('#notaObjetivoMultiples');
      if (pp) pp.value = '45';
      if (no) no.value = '7';
    },

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

    formula: '<code>Media = Σ(nota × peso) ÷ Σ(pesos)</code><br><small>Cada asignatura aporta su nota multiplicada por su peso. Si los pesos no suman 100%, la media solo representa el curso evaluado hasta ahora.</small>',

    ejemplo(raiz) {
      const cont = raiz.querySelector('#contenedor-filas-ponderada');
      if (!cont) return;
      cont.querySelectorAll('.fila-dinamica').forEach(f => f.remove());
      this.agregarFila(raiz);
      this.agregarFila(raiz);
      this.agregarFila(raiz);
      const notas = cont.querySelectorAll('.p-nota');
      const pesos = cont.querySelectorAll('.p-peso');
      if (notas[0]) notas[0].value = '8.5';
      if (pesos[0]) pesos[0].value = '30';
      if (notas[1]) notas[1].value = '7.0';
      if (pesos[1]) pesos[1].value = '40';
      if (notas[2]) notas[2].value = '9.2';
      if (pesos[2]) pesos[2].value = '30';
    },

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

    formula: '<code>Acceso = Bachillerato × 0,6 + Fase General × 0,4</code><br><code>Admisión = Acceso + Σ (mejores 2 específicas × ponderación)</code><br><small>Solo puntúan las específicas con nota ≥ 5. Se suman las dos con mayor puntuación.</small>',

    ejemplo(raiz) {
      const cont = raiz.querySelector('#contenedor-especificas-ebau');
      if (!cont) return;
      cont.querySelectorAll('.fila-dinamica').forEach(f => f.remove());
      this.agregarFila(raiz);
      this.agregarFila(raiz);
      const nB = raiz.querySelector('#notaBachillerato');
      const nF = raiz.querySelector('#notaFaseGeneral');
      if (nB) nB.value = '8.2';
      if (nF) nF.value = '7.5';
      const notas = cont.querySelectorAll('.ebau-nota');
      const pond = cont.querySelectorAll('.ebau-ponderacion');
      if (notas[0]) notas[0].value = '8.8';
      if (pond[0]) pond[0].value = '0.2';
      if (notas[1]) notas[1].value = '7.5';
      if (pond[1]) pond[1].value = '0.1';
    },

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

    formula: '<code>Máx faltas = ⌊Total × (100 − Mínimo) ÷ 100⌋</code><br><code>Restantes = Máx faltas − Faltas actuales</code><br><small>Si las faltas restantes son negativas, has superado el límite permitido.</small>',

    ejemplo(raiz) {
      const t = raiz.querySelector('#totalClases');
      const p = raiz.querySelector('#porcentajeMinimo');
      const f = raiz.querySelector('#faltasActuales');
      if (t) t.value = '180';
      if (p) p.value = '80';
      if (f) f.value = '12';
    },

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
      const mensajeAsistencia = raiz.querySelector('#resultadoAsistenciaActual');

      CF.prepararLCD(resDiv);
      if (mensajeAsistencia) {
        mensajeAsistencia.textContent = 'Introduce el total de clases y tus faltas para ver tu porcentaje de asistencia actual.';
      }

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

      const maxFaltasPermitidas = Math.floor((total * (100 - minPorcentaje)) / 100);
      const faltasRestantes = maxFaltasPermitidas - faltas;

      this.pintarGrafico(raiz, ((total - faltas) / total) * 100, minPorcentaje);

      const asistenciaActual = ((total - faltas) / total) * 100;
      if (mensajeAsistencia) {
        mensajeAsistencia.textContent =
          `Asistencia actual: ${CF.formatearNumero(asistenciaActual)}% (mínimo exigido: ${CF.formatearNumero(minPorcentaje)}%).`;
      }

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
      const mensajeAsistencia = raiz.querySelector('#resultadoAsistenciaActual');
      if (t) t.value = '';
      if (p) p.value = '80';
      if (f) f.value = '0';
      CF.limpiarMarcasError(raiz);
      CF.prepararLCD(res);
      if (res) res.innerText = 'Te quedan: 0 faltas';
      if (mensajeAsistencia) {
        mensajeAsistencia.textContent = 'Introduce el total de clases y tus faltas para ver tu porcentaje de asistencia actual.';
      }
      CF.reiniciarGrafico(raiz.querySelector('#graficoAsistencia'));
    }
  });

  // ==========================================================
  // DESCUENTOS
  // ==========================================================
  CF.registrar({
    id: 'descuentos',
    historialClave: 'historial_descuentos',

    formula: '<code>Final = Original × (1 − Descuento ÷ 100)</code><br><code>Ahorro = Original − Final</code><br><small>Un 25% de descuento significa pagar el 75% del precio original.</small>',

    ejemplo(raiz) {
      const c = raiz.querySelector('#cantidad');
      const p = raiz.querySelector('#porcentaje');
      if (c) c.value = '79.99';
      if (p) p.value = '25';
    },

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

    formula: '<code>Con IVA: Total = Base × (1 + Tipo ÷ 100)</code><br><code>Sin IVA: Base = Total ÷ (1 + Tipo ÷ 100)</code><br><small>El IVA en España es 21% general, 10% reducido y 4% superreducido.</small>',

    ejemplo(raiz) {
      const i = raiz.querySelector('#importeIva');
      const t = raiz.querySelector('#porcentajeIva');
      const m = raiz.querySelector('#modoIva');
      if (i) i.value = '150';
      if (t) t.value = '21';
      if (m) m.value = 'anadir';
    },

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

    formula: '<code>Neto = Bruto × (1 − IRPF − Seguridad Social)</code><br><small>IRPF según tramos: 12% (hasta 12.450€), 15% (hasta 20.200€), 19% (hasta 35.200€), 24% (hasta 60.000€). Seguridad Social: 6,35% fijo.</small>',

    ejemplo(raiz) {
      const b = raiz.querySelector('#brutoAnual');
      const p = raiz.querySelector('#numPagas');
      if (b) b.value = '28000';
      if (p) p.value = '14';
    },

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

      // Tabla desglose: de dónde sale el neto
      const ssAnual = bruto * ss;
      const irpfAnual = bruto * irpf;
      const filasDesglose = [
        { concepto: 'Sueldo bruto', anual: bruto, porPaga: bruto / pagas },
        { concepto: 'Seguridad Social (6,35%)', anual: -ssAnual, porPaga: -(ssAnual / pagas) },
        { concepto: 'IRPF (~' + CF.formatearNumero(irpf * 100, 1) + '%)', anual: -irpfAnual, porPaga: -(irpfAnual / pagas) },
        { concepto: 'Neto en tu bolsillo', anual: netoAnual, porPaga: netoMensual }
      ];
      CF.pintarTablaGenerica(raiz, 'cajaTablaSueldo', 'tablaVaciaSueldo', 'cuerpoTablaSueldo', filasDesglose,
        fila =>
          '<tr><td>' + fila.concepto + '</td>' +
          '<td>' + CF.formatearEuros(fila.anual) + '</td>' +
          '<td>' + CF.formatearEuros(fila.porPaga) + '</td></tr>');

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
      CF.pintarTablaGenerica(raiz, 'cajaTablaSueldo', 'tablaVaciaSueldo', 'cuerpoTablaSueldo', []);
    }
  });

  // ==========================================================
  // NOTA DE CORTE
  // ==========================================================
  CF.registrar({
    id: 'nota-de-corte',
    historialClave: 'historial_corte',

    formula: '<code>Diferencia = Tu nota − Nota de corte</code><br><small>Si la diferencia es ≥ 0, entras. Si es negativa, te faltan esos puntos.</small>',

    ejemplo(raiz) {
      const a = raiz.querySelector('#notaAdmisionCorte');
      const c = raiz.querySelector('#notaCorteGrado');
      if (a) a.value = '9.850';
      if (c) c.value = '9.200';
    },

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

    formula: '<code>FV = C × (1 + r/n)<sup>nt</sup> + A × [((1 + r/n)<sup>nt</sup> − 1) ÷ (r/n)]</code><br><small>C = capital inicial, A = aportación mensual, r = tasa anual, n = 12 (mensual), t = años. Los intereses se generan sobre el capital acumulado, no solo sobre el inicial.</small>',

    ejemplo(raiz) {
      const c = raiz.querySelector('#capitalInicial');
      const m = raiz.querySelector('#aportacionMensual');
      const r = raiz.querySelector('#rentabilidadAnual');
      const p = raiz.querySelector('#plazoAnios');
      if (c) c.value = '5000';
      if (m) m.value = '200';
      if (r) r.value = '7';
      if (p) p.value = '10';
    },

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

      // Tabla año a año: aportado, valor total y ganancia
      const filasAnuales = serieAnios.map((anio, indice) => ({
        anio,
        aportado: serieAportado[indice],
        total: serieTotales[indice],
        ganancia: serieTotales[indice] - serieAportado[indice]
      }));
      CF.pintarTablaGenerica(raiz, 'cajaTablaInteres', 'tablaVaciaInteres', 'cuerpoTablaInteres', filasAnuales,
        fila =>
          '<tr><td>' + fila.anio + '</td>' +
          '<td>' + CF.formatearEuros(fila.aportado) + '</td>' +
          '<td>' + CF.formatearEuros(fila.total) + '</td>' +
          '<td>+' + CF.formatearEuros(fila.ganancia) + '</td></tr>');

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
      CF.pintarTablaGenerica(raiz, 'cajaTablaInteres', 'tablaVaciaInteres', 'cuerpoTablaInteres', []);
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

    formula: '<code>Sacar: Resultado = Cantidad × Porcentaje ÷ 100</code><br><code>Qué es: % = Parte ÷ Total × 100</code><br><code>Variación: Δ% = (Nuevo − Antiguo) ÷ |Antiguo| × 100</code><br><code>Regla de tres directa: D = B × C ÷ A</code>',

    ejemplo(raiz) {
      const c = raiz.querySelector('#cantidadBase');
      const p = raiz.querySelector('#porcentajeSacar');
      if (c) c.value = '250';
      if (p) p.value = '15';
    },

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

  // ==========================================================
  // INTERÉS SIMPLE (con comparativa vs compuesto)
  // ==========================================================
  CF.registrar({
    id: 'interes-simple',
    historialClave: 'historial_interes_simple',

    formula: '<code>Total = C × (1 + r × t)</code><br><code>Interés = C × r × t</code><br><small>C = capital, r = tasa anual (decimal), t = años. A diferencia del compuesto, los intereses NO se reinvierten sobre sí mismos.</small>',

    ejemplo(raiz) {
      const c = raiz.querySelector('#capitalSimple');
      const t = raiz.querySelector('#tasaSimple');
      const p = raiz.querySelector('#plazoSimple');
      if (c) c.value = '5000';
      if (t) t.value = '5';
      if (p) p.value = '3';
    },

    calcular(raiz) {
      const capital = parseFloat(raiz.querySelector('#capitalSimple')?.value);
      const tasa = parseFloat(raiz.querySelector('#tasaSimple')?.value);
      const anios = parseFloat(raiz.querySelector('#plazoSimple')?.value);
      const resDiv = raiz.querySelector('#resultadoSimple');

      CF.prepararLCD(resDiv);

      if (!isNaN(capital) && capital < 0) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: El capital no puede ser negativo');
        return;
      }
      if (!isNaN(tasa) && (tasa < 0 || tasa > 100)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: El interés debe estar entre 0% y 100%');
        return;
      }
      if (!isNaN(anios) && (anios < 1 || anios > 100)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: El plazo debe estar entre 1 y 100 años');
        return;
      }
      if (isNaN(capital) || isNaN(tasa) || isNaN(anios)) {
        if (resDiv) resDiv.innerText = 'Introduce capital, interés y plazo';
        return;
      }

      const interes = capital * (tasa / 100) * anios;
      const total = capital + interes;

      CF.pintarResultLCD(resDiv, CF.formatearEuros(total),
        `Interés generado: +${CF.formatearEuros(interes)} · ${CF.formatearNumero(tasa)}% anual x ${CF.formatearNumero(anios)} años`);

      // Serie anual para el gráfico comparativo
      const serieAnios = [];
      const serieSimple = [];
      const serieCompuesto = [];
      for (let a = 0; a <= anios; a++) {
        serieAnios.push(a);
        serieSimple.push(capital + capital * (tasa / 100) * a);
        serieCompuesto.push(capital * Math.pow(1 + tasa / 100, a));
      }
      this.pintarGrafico(raiz, { anios: serieAnios, simple: serieSimple, compuesto: serieCompuesto });

      // Tabla año a año: interés fijo del año, acumulado y total
      const tasaDecimal = tasa / 100;
      const filasAnuales = serieAnios.map(anio => ({
        anio,
        interesAno: capital * tasaDecimal,
        acumulado: capital * tasaDecimal * anio
      }));
      CF.pintarTablaGenerica(raiz, 'cajaTablaSimple', 'tablaVaciaSimple', 'cuerpoTablaSimple', filasAnuales,
        fila =>
          '<tr><td>' + fila.anio + '</td>' +
          '<td>+' + CF.formatearEuros(fila.interesAno) + '</td>' +
          '<td>+' + CF.formatearEuros(fila.acumulado) + '</td>' +
          '<td>' + CF.formatearEuros(capital + fila.acumulado) + '</td></tr>');

      CF.historialGuardar(
        this.historialClave,
        `${CF.formatearEuros(capital)} al ${tasa}% simple x ${anios} años = ${CF.formatearEuros(total)} (+${CF.formatearEuros(interes)})`,
        raiz
      );
    },

    iniciar(raiz) {
      const params = new URLSearchParams(window.location.search);
      if (!params.get('demo')) return;
      const c = raiz.querySelector('#capitalSimple');
      const t = raiz.querySelector('#tasaSimple');
      const p = raiz.querySelector('#plazoSimple');
      if (c) c.value = '1000';
      if (t) t.value = '5';
      if (p) p.value = '3';
      this.calcular(raiz);
    },

    pintarGrafico(raiz, serie) {
      const caja = raiz.querySelector('#graficoSimple');
      const canvas = raiz.querySelector('#canvasSimple');
      const mensaje = raiz.querySelector('#graficoVacioSimple');
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

      if (!this._resizeListo) {
        this._resizeListo = true;
        let temporizadorRedibujar = null;
        window.addEventListener('resize', () => {
          clearTimeout(temporizadorRedibujar);
          temporizadorRedibujar = setTimeout(() => {
            const raizViva = document.querySelector('[data-calculadora="interes-simple"]');
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
      const maxValor = Math.max.apply(null, serie.compuesto) * 1.05 || 1;

      const xDe = anio => padIzq + (anio / maxAnios) * wGraf;
      const yDe = valor => padSup + hGraf - (valor / maxValor) * hGraf;

      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.lineWidth = 1;
      for (let k = 0; k <= 4; k++) {
        const v = (maxValor / 4) * k;
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

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const pasoMarca = Math.max(1, Math.round(maxAnios / 5));
      for (let anio = 0; anio <= maxAnios; anio += pasoMarca) {
        ctx.fillText(anio === 0 ? 'hoy' : anio + 'a', xDe(anio), padSup + hGraf + 8);
      }

      dibujarSerieGrafico(ctx, serie.anios.map(xDe), serie.simple.map(yDe), padSup + hGraf,
        'rgba(56, 189, 248, 0.15)', '#38bdf8');

      dibujarSerieGrafico(ctx, serie.anios.map(xDe), serie.compuesto.map(yDe), padSup + hGraf,
        'rgba(16, 185, 129, 0.22)', '#10b981');
    },

    limpiar(raiz) {
      ['capitalSimple', 'tasaSimple', 'plazoSimple'].forEach(id => {
        const input = raiz.querySelector('#' + id);
        if (input) input.value = '';
      });
      const res = raiz.querySelector('#resultadoSimple');
      CF.limpiarMarcasError(raiz);
      CF.prepararLCD(res);
      if (res) res.innerText = 'Introduce los datos';
      this.pintarGrafico(raiz, null);
      CF.pintarTablaGenerica(raiz, 'cajaTablaSimple', 'tablaVaciaSimple', 'cuerpoTablaSimple', []);
    }
  });

  // ==========================================================
  // CUOTA DE PRÉSTAMO / HIPOTECA (sistema francés)
  // ==========================================================
  CF.registrar({
    id: 'cuota-prestamo',
    historialClave: 'historial_prestamo',

    formula: '<code>Cuota = P × [r(1+r)<sup>n</sup>] ÷ [(1+r)<sup>n</sup> − 1]</code><br><small>P = principal, r = tipo de interés mensual, n = total de cuotas. Esta es la fórmula francesa usada por todos los bancos españoles.</small>',

    ejemplo(raiz) {
      const im = raiz.querySelector('#importePrestamo');
      const ti = raiz.querySelector('#interesPrestamo');
      const pl = raiz.querySelector('#plazoPrestamo');
      if (im) im.value = '150000';
      if (ti) ti.value = '3.5';
      if (pl) pl.value = '30';
    },

    calcular(raiz) {
      const importe = parseFloat(raiz.querySelector('#importePrestamo')?.value);
      const tin = parseFloat(raiz.querySelector('#interesPrestamo')?.value);
      const anios = parseFloat(raiz.querySelector('#plazoPrestamo')?.value);
      const resDiv = raiz.querySelector('#resultadoPrestamo');

      CF.prepararLCD(resDiv);

      if (!isNaN(importe) && importe <= 0) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: El importe debe ser mayor que 0');
        return;
      }
      if (!isNaN(tin) && (tin < 0 || tin > 100)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: El interés debe estar entre 0% y 100%');
        return;
      }
      if (!isNaN(anios) && (anios < 1 || anios > 75)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: El plazo debe estar entre 1 y 75 años');
        return;
      }
      if (isNaN(importe) || isNaN(tin) || isNaN(anios)) {
        if (resDiv) resDiv.innerText = 'Introduce importe, interés y plazo';
        return;
      }

      const meses = Math.round(anios * 12);
      const i = tin / 100 / 12;
      const cuota = i === 0 ? importe / meses : importe * i / (1 - Math.pow(1 + i, -meses));

      let pendiente = importe;
      let interesesAcum = 0;
      let interesAnual = 0;
      let amortizadoAnual = 0;
      const filasAnuales = [];

      for (let m = 1; m <= meses; m++) {
        const interesMes = pendiente * i;
        const amortizadoMes = cuota - interesMes;
        pendiente -= amortizadoMes;
        interesAnual += interesMes;
        amortizadoAnual += amortizadoMes;
        interesesAcum += interesMes;
        if (m % 12 === 0 || m === meses) {
          filasAnuales.push({
            anio: Math.ceil(m / 12),
            interesAnual,
            amortizadoAnual,
            pendiente: Math.max(pendiente, 0),
            interesesAcum
          });
          interesAnual = 0;
          amortizadoAnual = 0;
        }
      }

      const totalPagado = cuota * meses;
      const totalIntereses = totalPagado - importe;

      CF.pintarResultLCD(resDiv, CF.formatearEuros(cuota),
        `${meses} cuotas · Total intereses: ${CF.formatearEuros(totalIntereses)} · Total pagado: ${CF.formatearEuros(totalPagado)}`);

      this.pintarTabla(raiz, filasAnuales);

      const serieAnios = [0];
      const seriePendiente = [importe];
      const serieIntereses = [0];
      filasAnuales.forEach(fila => {
        serieAnios.push(fila.anio);
        seriePendiente.push(fila.pendiente);
        serieIntereses.push(fila.interesesAcum);
      });
      this.pintarGrafico(raiz, { anios: serieAnios, pendiente: seriePendiente, intereses: serieIntereses });

      CF.historialGuardar(
        this.historialClave,
        `${CF.formatearEuros(importe)} al ${tin}% x ${anios} años -> cuota ${CF.formatearEuros(cuota)}`,
        raiz
      );
    },

    pintarTabla(raiz, filas) {
      CF.pintarTablaGenerica(raiz, 'cajaTablaAmort', 'tablaVaciaPrestamo', 'cuerpoTablaAmort', filas,
        fila =>
          '<tr><td>' + fila.anio + '</td>' +
          '<td>' + CF.formatearEuros(fila.interesAnual) + '</td>' +
          '<td>' + CF.formatearEuros(fila.amortizadoAnual) + '</td>' +
          '<td>' + CF.formatearEuros(fila.pendiente) + '</td></tr>');
    },

    iniciar(raiz) {
      const params = new URLSearchParams(window.location.search);
      if (!params.get('demo')) return;
      const im = raiz.querySelector('#importePrestamo');
      const ti = raiz.querySelector('#interesPrestamo');
      const pl = raiz.querySelector('#plazoPrestamo');
      if (im) im.value = '150000';
      if (ti) ti.value = '3.5';
      if (pl) pl.value = '30';
      this.calcular(raiz);
    },

    pintarGrafico(raiz, serie) {
      const caja = raiz.querySelector('#graficoPrestamo');
      const canvas = raiz.querySelector('#canvasPrestamo');
      const mensaje = raiz.querySelector('#graficoVacioPrestamo');
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

      if (!this._resizeListo) {
        this._resizeListo = true;
        let temporizadorRedibujar = null;
        window.addEventListener('resize', () => {
          clearTimeout(temporizadorRedibujar);
          temporizadorRedibujar = setTimeout(() => {
            const raizViva = document.querySelector('[data-calculadora="cuota-prestamo"]');
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
      const maxValor = Math.max.apply(null, serie.pendiente.concat(serie.intereses)) * 1.05 || 1;

      const xDe = anio => padIzq + (anio / maxAnios) * wGraf;
      const yDe = valor => padSup + hGraf - (valor / maxValor) * hGraf;

      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.lineWidth = 1;
      for (let k = 0; k <= 4; k++) {
        const v = (maxValor / 4) * k;
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

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const pasoMarca = Math.max(1, Math.round(maxAnios / 5));
      for (let anio = 0; anio <= maxAnios; anio += pasoMarca) {
        ctx.fillText(anio === 0 ? 'hoy' : anio + 'a', xDe(anio), padSup + hGraf + 8);
      }

      dibujarSerieGrafico(ctx, serie.anios.map(xDe), serie.pendiente.map(yDe), padSup + hGraf,
        'rgba(56, 189, 248, 0.15)', '#38bdf8');

      dibujarSerieGrafico(ctx, serie.anios.map(xDe), serie.intereses.map(yDe), padSup + hGraf,
        'rgba(16, 185, 129, 0.22)', '#10b981');
    },

    limpiar(raiz) {
      ['importePrestamo', 'interesPrestamo', 'plazoPrestamo'].forEach(id => {
        const input = raiz.querySelector('#' + id);
        if (input) input.value = '';
      });
      const res = raiz.querySelector('#resultadoPrestamo');
      CF.limpiarMarcasError(raiz);
      CF.prepararLCD(res);
      if (res) res.innerText = 'Introduce los datos';
      this.pintarGrafico(raiz, null);
      this.pintarTabla(raiz, []);
    }
  });

  // ==========================================================
  // IMC (ÍNDICE DE MASA CORPORAL)
  // ==========================================================
  const CATEGORIAS_IMC = [
    { minimo: 40, nombre: 'Obesidad mórbida (grado III)', color: '#be123c' },
    { minimo: 35, nombre: 'Obesidad grado II', color: '#e11d48' },
    { minimo: 30, nombre: 'Obesidad grado I', color: '#f59e0b' },
    { minimo: 25, nombre: 'Sobrepeso', color: '#fbbf24' },
    { minimo: 18.5, nombre: 'Peso normal', color: '#10b981' },
    { minimo: 0, nombre: 'Bajo peso', color: '#38bdf8' }
  ];

  CF.registrar({
    id: 'imc',
    historialClave: 'historial_imc',

    formula: '<code>IMC = peso (kg) ÷ altura (m)<sup>2</sup></code><br><small>Clasificación OMS: &lt;18,5 bajo peso · 18,5–24,9 normal · 25–29,9 sobrepeso · ≥30 obesidad.</small>',

    ejemplo(raiz) {
      const p = raiz.querySelector('#pesoImc');
      const a = raiz.querySelector('#alturaImc');
      if (p) p.value = '70';
      if (a) a.value = '175';
    },

    // Barra de categorías según el IMC calculado.
    pintarGrafico(raiz, imc) {
      const caja = raiz.querySelector('#graficoImc');
      const canvas = raiz.querySelector('#canvasImc');
      if (!caja || !canvas || !canvas.getContext) return;
      if (isNaN(imc)) {
        CF.reiniciarGrafico(caja);
        return;
      }
      this._ultimoImc = imc;
      const cat = CATEGORIAS_IMC.find(c => imc >= c.minimo);
      CF.graficoBarras(canvas, [{
        etiqueta: 'Tu IMC',
        valor: Math.min(Math.max(imc, 0), 45),
        maximo: 45,
        texto: 'IMC ' + CF.formatearNumero(imc, 1),
        color: cat.color
      }]);
      if (!this._redrawListo) {
        this._redrawListo = true;
        CF.alRedimensionar('imc', () => {
          const viva = document.querySelector('[data-calculadora="imc"]');
          if (!viva || viva.querySelector('#graficoImc').style.display === 'none') return;
          this.pintarGrafico(viva, this._ultimoImc);
        });
      }
    },

    calcular(raiz) {
      const peso = parseFloat(raiz.querySelector('#pesoImc')?.value);
      const altura = parseFloat(raiz.querySelector('#alturaImc')?.value);
      const resDiv = raiz.querySelector('#resultadoImc');

      CF.prepararLCD(resDiv);

      if (!isNaN(peso) && (peso <= 0 || peso > 500)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: El peso debe estar entre 1 y 500 kg');
        return;
      }
      if (!isNaN(altura) && (altura < 50 || altura > 250)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: La altura debe estar entre 50 y 250 cm');
        return;
      }
      if (isNaN(peso) || isNaN(altura)) {
        if (resDiv) resDiv.innerText = 'Introduce peso y altura';
        return;
      }

      const alturaMetros = altura / 100;
      const imc = peso / (alturaMetros * alturaMetros);
      const categoria = CATEGORIAS_IMC.find(c => imc >= c.minimo);

      CF.pintarResultLCD(resDiv, CF.formatearNumero(imc, 1),
        categoria.nombre + ' · Peso ' + CF.formatearNumero(peso) + ' kg / ' + CF.formatearNumero(altura) + ' cm');

      this.pintarGrafico(raiz, imc);

      CF.historialGuardar(
        this.historialClave,
        `IMC ${CF.formatearNumero(imc, 1)} (${categoria.nombre}) · ${peso} kg / ${altura} cm`,
        raiz
      );
    },

    limpiar(raiz) {
      const p = raiz.querySelector('#pesoImc');
      const a = raiz.querySelector('#alturaImc');
      const res = raiz.querySelector('#resultadoImc');
      if (p) p.value = '';
      if (a) a.value = '';
      CF.limpiarMarcasError(raiz);
      CF.prepararLCD(res);
      if (res) res.innerText = '--';
      CF.reiniciarGrafico(raiz.querySelector('#graficoImc'));
    }
  });

  // ==========================================================
  // HIPOTECA (precio + entrada + interés + plazo)
  // ==========================================================
  CF.registrar({
    id: 'hipoteca',
    historialClave: 'historial_hipoteca',

    formula: '<code>Financiación = Precio × (1 − Entrada÷100)</code><br><code>Cuota = P × [r(1+r)<sup>n</sup>] ÷ [(1+r)<sup>n</sup> − 1]</code><br><small>Amortización francesa, la usada por los bancos españoles. La cuota es constante: interés + amortización.</small>',

    ejemplo(raiz) {
      const p = raiz.querySelector('#precioVivienda');
      const e = raiz.querySelector('#entradaHipoteca');
      const i = raiz.querySelector('#interesHipoteca');
      const pl = raiz.querySelector('#plazoHipoteca');
      if (p) p.value = '200000';
      if (e) e.value = '20';
      if (i) i.value = '3.2';
      if (pl) pl.value = '30';
    },

    calcular(raiz) {
      const precio = parseFloat(raiz.querySelector('#precioVivienda')?.value);
      const entrada = parseFloat(raiz.querySelector('#entradaHipoteca')?.value);
      const interes = parseFloat(raiz.querySelector('#interesHipoteca')?.value);
      const anios = parseFloat(raiz.querySelector('#plazoHipoteca')?.value);
      const resDiv = raiz.querySelector('#resultadoHipoteca');

      CF.prepararLCD(resDiv);

      if (!isNaN(precio) && precio <= 0) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: El precio debe ser mayor que 0');
        return;
      }
      if (!isNaN(entrada) && (entrada < 0 || entrada > 90)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: La entrada debe estar entre 0% y 90%');
        return;
      }
      if (!isNaN(interes) && (interes < 0 || interes > 20)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: El interés debe estar entre 0% y 20%');
        return;
      }
      if (!isNaN(anios) && (anios < 1 || anios > 40)) {
        CF.mostrarErrorLCD(resDiv, 'ERROR: El plazo debe estar entre 1 y 40 años');
        return;
      }
      if (isNaN(precio) || isNaN(entrada) || isNaN(interes) || isNaN(anios)) {
        if (resDiv) resDiv.innerText = 'Introduce precio, entrada, interés y plazo';
        return;
      }

      const financiado = precio * (1 - entrada / 100);
      const meses = Math.round(anios * 12);
      const iMensual = interes / 100 / 12;
      const cuota = iMensual === 0
        ? financiado / meses
        : financiado * iMensual / (1 - Math.pow(1 + iMensual, -meses));

      let pendiente = financiado;
      let interesesAcum = 0;
      let interesAnual = 0;
      let amortizadoAnual = 0;
      const filasAnuales = [];
      for (let m = 1; m <= meses; m++) {
        const interesMes = pendiente * iMensual;
        const amortizadoMes = cuota - interesMes;
        pendiente -= amortizadoMes;
        interesAnual += interesMes;
        amortizadoAnual += amortizadoMes;
        interesesAcum += interesMes;
        if (m % 12 === 0 || m === meses) {
          filasAnuales.push({
            anio: Math.ceil(m / 12),
            interesAnual,
            amortizadoAnual,
            pendiente: Math.max(pendiente, 0),
            interesesAcum
          });
          interesAnual = 0;
          amortizadoAnual = 0;
        }
      }

      const totalPagado = cuota * meses;
      const totalIntereses = totalPagado - financiado;
      const entradaEuros = precio - financiado;

      CF.pintarResultLCD(resDiv, CF.formatearEuros(cuota) + '/mes',
        `Financiación: ${CF.formatearEuros(financiado)} · Total a pagar: ${CF.formatearEuros(totalPagado)} · Intereses: ${CF.formatearEuros(totalIntereses)}`);

      this.pintarTabla(raiz, filasAnuales, financiado);

      const serieAnios = [0];
      const seriePendiente = [financiado];
      const serieIntereses = [0];
      filasAnuales.forEach(fila => {
        serieAnios.push(fila.anio);
        seriePendiente.push(fila.pendiente);
        serieIntereses.push(fila.interesesAcum);
      });
      this.pintarGrafico(raiz, { anios: serieAnios, pendiente: seriePendiente, intereses: serieIntereses });

      CF.historialGuardar(
        this.historialClave,
        `${CF.formatearEuros(precio)} (entrada ${CF.formatearNumero(entrada)}%) al ${interes}% x ${anios} años -> ${CF.formatearEuros(cuota)}/mes`,
        raiz
      );
    },

    pintarTabla(raiz, filas, financiado) {
      CF.pintarTablaGenerica(raiz, 'cajaTablaHipoteca', 'tablaVaciaHipoteca', 'cuerpoTablaHipoteca', filas,
        fila =>
          '<tr><td>' + fila.anio + '</td>' +
          '<td>' + CF.formatearEuros(fila.interesAnual) + '</td>' +
          '<td>' + CF.formatearEuros(fila.amortizadoAnual) + '</td>' +
          '<td>' + CF.formatearEuros(fila.pendiente) + '</td></tr>');
    },

    iniciar(raiz) {
      const params = new URLSearchParams(window.location.search);
      if (!params.get('demo')) return;
      const p = raiz.querySelector('#precioVivienda');
      const e = raiz.querySelector('#entradaHipoteca');
      const i = raiz.querySelector('#interesHipoteca');
      const pl = raiz.querySelector('#plazoHipoteca');
      if (p) p.value = '200000';
      if (e) e.value = '20';
      if (i) i.value = '3.2';
      if (pl) pl.value = '30';
      this.calcular(raiz);
    },

    pintarGrafico(raiz, serie) {
      const caja = raiz.querySelector('#graficoHipoteca');
      const canvas = raiz.querySelector('#canvasHipoteca');
      const mensaje = raiz.querySelector('#graficoVacioHipoteca');
      if (!caja || !canvas || !canvas.getContext) return;

      this._serieHipoteca = serie;

      if (!serie) {
        caja.style.display = '';
        canvas.style.display = 'none';
        if (mensaje) mensaje.style.display = '';
        return;
      }
      caja.style.display = '';
      canvas.style.display = 'block';
      if (mensaje) mensaje.style.display = 'none';

      if (!this._resizeListo) {
        this._resizeListo = true;
        let temporizador = null;
        window.addEventListener('resize', () => {
          clearTimeout(temporizador);
          temporizador = setTimeout(() => {
            const raizViva = document.querySelector('[data-calculadora="hipoteca"]');
            if (raizViva && this._serieHipoteca) this.pintarGrafico(raizViva, this._serieHipoteca);
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
      const maxValor = Math.max.apply(null, serie.pendiente.concat(serie.intereses)) * 1.05 || 1;

      const xDe = anio => padIzq + (anio / maxAnios) * wGraf;
      const yDe = valor => padSup + hGraf - (valor / maxValor) * hGraf;

      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.lineWidth = 1;
      for (let k = 0; k <= 4; k++) {
        const v = (maxValor / 4) * k;
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

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const pasoMarca = Math.max(1, Math.round(maxAnios / 5));
      for (let anio = 0; anio <= maxAnios; anio += pasoMarca) {
        ctx.fillText(anio === 0 ? 'hoy' : anio + 'a', xDe(anio), padSup + hGraf + 8);
      }

      dibujarSerieGrafico(ctx, serie.anios.map(xDe), serie.pendiente.map(yDe), padSup + hGraf,
        'rgba(56, 189, 248, 0.15)', '#38bdf8');

      dibujarSerieGrafico(ctx, serie.anios.map(xDe), serie.intereses.map(yDe), padSup + hGraf,
        'rgba(16, 185, 129, 0.22)', '#10b981');
    },

    limpiar(raiz) {
      ['precioVivienda', 'entradaHipoteca', 'interesHipoteca', 'plazoHipoteca'].forEach(id => {
        const input = raiz.querySelector('#' + id);
        if (input) input.value = '';
      });
      const res = raiz.querySelector('#resultadoHipoteca');
      CF.limpiarMarcasError(raiz);
      CF.prepararLCD(res);
      if (res) res.innerText = '0.00 €';
      this.pintarGrafico(raiz, null);
      this.pintarTabla(raiz, [], 0);
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
