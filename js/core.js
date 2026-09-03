window.CF = (function () {
  'use strict';

  // ==========================================================
  // NÚCLEO COMPARTIDO - CalculaFácil
  // Cómo añadir una nueva calculadora:
  //   1. Crea carpeta/index.html copiando la página más simple
  //      (ej. descuentos) con su contenido único y marca el
  //      contenedor con data-calculadora="mi-id".
  //   2. Registra en js/calculadoras.js un objeto con:
  //      { id, historialClave, calcular(root), limpiar(root)
  //        [, iniciar, onInput, agregarFila, eliminarFila] }
  //   3. Nada más: botones, historial, copiado, validación y
  //      tema se conectan solos mediante data-attributes.
  // ==========================================================

  const REGISTRO = {};

  // Bandera interna: durante el cálculo en vivo NO se escribe historial
  let modoVivo = false;

  function registrar(definicion) {
    if (!definicion || !definicion.id) return;
    REGISTRO[definicion.id] = definicion;
  }

  // RANGOS DE VALIDACIÓN DE DATOS
  const RANGO_NOTA = Object.freeze({ min: 0, max: 10 });
  const RANGO_PORCENTAJE = Object.freeze({ min: 0, max: 100 });

  function marcarInputInvalido(input, invalido) {
    if (!input) return;
    input.classList.toggle('input-error', !!invalido);
  }

  function validarNumero(input, rango) {
    if (!input) return true;
    const texto = String(input.value).trim();
    if (texto === '') {
      marcarInputInvalido(input, false);
      return true;
    }
    const valor = parseFloat(texto.replace(',', '.'));
    const valido = Number.isFinite(valor) && valor >= rango.min && valor <= rango.max;
    marcarInputInvalido(input, !valido);
    return valido;
  }

  function validarRangoInputs(raiz, selector, rango) {
    return Array.from(raiz.querySelectorAll(selector)).every(input => validarNumero(input, rango));
  }

  // PANTALLA LCD
  function mostrarErrorLCD(resDiv, mensaje) {
    if (!resDiv) return;
    resDiv.innerText = mensaje;
    resDiv.classList.add('texto-error');
  }

  function prepararLCD(resDiv) {
    if (resDiv) resDiv.classList.remove('texto-error');
  }

  // RESULTADO CON JERARQUÍA: cifra protagonista + línea de desglose debajo
  function pintarResultLCD(resDiv, cifra, desglose) {
    if (!resDiv) return;
    let html = `<span class="cifra-lcd">${cifra}</span>`;
    if (desglose) html += `<span class="desglose-lcd">${desglose}</span>`;
    resDiv.innerHTML = html;
    resDiv.classList.remove('texto-error');
  }

  // FORMATO ESPAÑOL DE NÚMEROS Y EUROS
  const FORMATEADOR_EUR = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

  function formatearEuros(valor) {
    return FORMATEADOR_EUR.format(valor);
  }

  function formatearNumero(valor, decimalesMaximos) {
    const maximo = Number.isFinite(decimalesMaximos) ? decimalesMaximos : 2;
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: maximo }).format(valor);
  }

  function limpiarMarcasError(raiz) {
    (raiz || document).querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  }

  // HISTORIAL POR CALCULADORA
  function historialPintar(clave, ul) {
    if (!ul) return;
    const datos = JSON.parse(localStorage.getItem(clave)) || [];
    ul.innerHTML = datos.length === 0
      ? '<li>No hay operaciones recientes</li>'
      : datos.map(item => `<li>${item}</li>`).join('');
  }

  function historialGuardar(clave, textoOperacion, raiz) {
    if (modoVivo) return;
    let datos = JSON.parse(localStorage.getItem(clave)) || [];
    datos.unshift(textoOperacion);
    if (datos.length > 5) datos.pop();
    localStorage.setItem(clave, JSON.stringify(datos));
    const ul = raiz ? raiz.querySelector('[data-historial-clave]') : null;
    historialPintar(clave, ul);
  }

  function historialVaciar(clave, raiz) {
    localStorage.removeItem(clave);
    const ul = raiz ? raiz.querySelector('[data-historial-clave]') : document.querySelector(`[data-historial-clave="${clave}"]`);
    historialPintar(clave, ul);
  }

  // PORTAPAPELES
  function copiarAlPortapapeles(texto) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(texto);
    }
    return new Promise((resolve, reject) => {
      const area = document.createElement('textarea');
      area.value = texto;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand('copy') ? resolve() : reject(new Error('No se pudo copiar'));
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(area);
      }
    });
  }

  function copiarResultado(el, boton) {
    if (!el || !boton) return;
    const textoLimpio = el.innerText.trim().replace(/^[^\p{L}\p{N}]+/u, '');
    copiarAlPortapapeles(textoLimpio).then(() => {
      const original = boton.innerHTML;
      boton.innerHTML = '¡Copiado!';
      boton.disabled = true;
      setTimeout(() => {
        boton.innerHTML = original;
        boton.disabled = false;
      }, 1600);
    }).catch(() => {
      const original = boton.innerHTML;
      boton.innerHTML = 'Error';
      setTimeout(() => { boton.innerHTML = original; }, 1600);
    });
  }

  // TEMA VISUAL
  function cambiarTema(nuevoTema) {
    document.body.setAttribute('data-tema', nuevoTema);
    localStorage.setItem('tema_calculafacil', nuevoTema);
  }

  function cargarTemaGuardado() {
    const temaGuardado = localStorage.getItem('tema_calculafacil') || 'classic';
    document.body.setAttribute('data-tema', temaGuardado);
    const select = document.getElementById('selectTema');
    if (select) select.value = temaGuardado;
  }

  // BÚSQUEDA DEL MENÚ PRINCIPAL
  function filtrarCalculadoras() {
    const input = document.getElementById('buscadorCalculadoras');
    if (!input) return;
    const query = input.value.toLowerCase().trim();
    document.querySelectorAll('#gridMenuCalculadoras .mini-carcasa').forEach(tarjeta => {
      const texto = (tarjeta.innerText + ' ' + (tarjeta.dataset.keywords || '')).toLowerCase();
      tarjeta.style.display = texto.includes(query) ? 'flex' : 'none';
    });
    document.querySelectorAll('#gridMenuCalculadoras [data-categoria]').forEach(seccion => {
      const hayVisibles = Array.from(seccion.querySelectorAll('.mini-carcasa'))
        .some(tarjeta => tarjeta.style.display !== 'none');
      seccion.style.display = hayVisibles ? '' : 'none';
    });
  }

  // REDIRECCIÓN DE ENLACES ANTIGUOS CON HASH (#ponderada -> /media-ponderada/)
  const MAPA_HASH_ANTIGUO = {
    'necesaria': 'nota-necesaria/',
    'ponderada': 'media-ponderada/',
    'ebau': 'admision-ebau-pau/',
    'asistencia': 'asistencias-faltas/',
    'descuentos': 'descuentos/',
    'iva': 'iva/',
    'sueldo': 'sueldo-neto/'
  };

  function redirigirHashAntiguo() {
    const hash = window.location.hash.replace('#', '').trim().toLowerCase();
    if (!hash || !MAPA_HASH_ANTIGUO[hash]) return;

    const esRaiz = !!document.getElementById('pantalla-menu');
    const segmentos = window.location.pathname.split('/').filter(Boolean);
    let carpetaActual = segmentos[segmentos.length - 1] || '';
    if (carpetaActual === 'index.html') carpetaActual = segmentos[segmentos.length - 2] || '';

    const destino = MAPA_HASH_ANTIGUO[hash].replace(/\/$/, '');
    if (!esRaiz && carpetaActual === destino) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return;
    }
    window.location.replace(new URL((esRaiz ? '' : '../') + destino + '/', window.location.href).href);
  }

  // BARRA DE INSTALACIÓN PWA (aparece bajo la cabecera, sin solaparse)
  let eventoInstalar = null;
  const CLAVE_OCULTAR_INSTALAR = 'instalar_descartada_en';
  const DIAS_REAPARECER_INSTALAR = 7;

  function instalacionDescartadaRecientemente() {
    try {
      const marca = Number(localStorage.getItem(CLAVE_OCULTAR_INSTALAR));
      if (!marca) return false;
      return (Date.now() - marca) < DIAS_REAPARECER_INSTALAR * 24 * 60 * 60 * 1000;
    } catch (err) {
      return false;
    }
  }

  function pwaYaInstalada() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function esDispositivoIOS() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
  }

  function construirBarraInstalar(conBotonNativo) {
    const barra = document.createElement('div');
    barra.className = 'barra-instalar';

    const texto = document.createElement('span');
    texto.className = 'barra-instalar-texto';
    texto.textContent = conBotonNativo
      ? 'Lleva CalculaFácil contigo:'
      : 'Consejo para iPhone: pulsa Compartir y elige \u201CAñadir a pantalla de inicio\u201D';
    barra.appendChild(texto);

    if (conBotonNativo) {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'btn-barra-instalar';
      boton.textContent = '\uD83D\uDCF2 Instalar';
      boton.addEventListener('click', async () => {
        if (!eventoInstalar) return;
        eventoInstalar.prompt();
        await eventoInstalar.userChoice;
        eventoInstalar = null;
        barra.remove();
      });
      barra.appendChild(boton);
    }

    const cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.className = 'btn-cerrar-instalar';
    cerrar.setAttribute('aria-label', 'Cerrar aviso de instalación');
    cerrar.innerHTML = '&times;';
    cerrar.addEventListener('click', () => {
      barra.remove();
      try { localStorage.setItem(CLAVE_OCULTAR_INSTALAR, String(Date.now())); } catch (err) {}
    });
    barra.appendChild(cerrar);

    return barra;
  }

  function mostrarBarraInstalar(conBotonNativo) {
    if (instalacionDescartadaRecientemente()) return;
    const cabecera = document.querySelector('.banner-principal');
    if (!cabecera || document.querySelector('.barra-instalar')) return;
    cabecera.insertAdjacentElement('afterend', construirBarraInstalar(conBotonNativo));
  }

  function resolverRutaSw() {
    const canonico = document.querySelector('link[rel="canonical"]');
    if (canonico) {
      try {
        const urlCanon = new URL(canonico.href);
        if (urlCanon.origin === window.location.origin) {
          return urlCanon.pathname.replace(/[^/]*$/, '');
        }
      } catch (err) {}
    }
    return document.getElementById('pantalla-menu') ? './' : '../';
  }

  function configurarPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register(resolverRutaSw() + 'sw.js').catch(() => {});
      });
    }

    if (pwaYaInstalada()) return;

    window.addEventListener('beforeinstallprompt', evento => {
      evento.preventDefault();
      eventoInstalar = evento;
      mostrarBarraInstalar(true);
    });

    window.addEventListener('appinstalled', () => {
      const barra = document.querySelector('.barra-instalar');
      if (barra) barra.remove();
    });

    if (esDispositivoIOS()) {
      if (document.readyState === 'complete') mostrarBarraInstalar(false);
      else window.addEventListener('load', () => mostrarBarraInstalar(false));
    }
  }

  // ANIMACIÓN DEL LCD: destello luminoso en el MARCO de la pantalla.
  // El texto nunca cambia de tamaño, así que no pueden aparecer scrollbars.
  function dispararAnimacionLCD(lcd) {
    lcd.classList.remove('animar-lcd');
    void lcd.offsetWidth; // Reinicia la animación si aún estaba en curso
    lcd.classList.add('animar-lcd');
  }

  function observarCambiosLCD() {
    if (!('MutationObserver' in window)) return;
    const observador = new MutationObserver(mutaciones => {
      mutaciones.forEach(m => {
        const destino = m.target.nodeType === 3 ? m.target.parentElement : m.target;
        const marco = destino && destino.closest ? destino.closest('.pantalla-lcd') : null;
        if (marco) dispararAnimacionLCD(marco);
      });
    });
    document.querySelectorAll('.pantalla-lcd').forEach(marco => {
      observador.observe(marco, { childList: true, characterData: true, subtree: true });
    });
  }

  // ARRANQUE: CONECTA CADA CALCULADORA PRESENTE EN LA PÁGINA
  function arranque() {
    construirPlantillas();

    cargarTemaGuardado();

    observarCambiosLCD();

    const selectorTema = document.getElementById('selectTema');
    if (selectorTema) selectorTema.addEventListener('change', e => cambiarTema(e.target.value));

    const buscador = document.getElementById('buscadorCalculadoras');
    if (buscador) buscador.addEventListener('input', filtrarCalculadoras);

    // AÑO DEL FOOTER SIEMPRE ACTUALIZADO
    const anioActual = String(new Date().getFullYear());
    document.querySelectorAll('[data-anio]').forEach(el => { el.textContent = anioActual; });

    // COMPARTIR POR WHATSAPP: abre WhatsApp al hacer clic (sin enlace indexable)
    document.querySelectorAll('[data-share-whatsapp]').forEach(enlace => {
      enlace.addEventListener('click', () => {
        const mensaje = `${document.title} - ${window.location.href}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener');
      });
    });

    // COMPARTIR NATIVO: usa el menú del sistema y, si no existe, copia el enlace
    document.querySelectorAll('[data-share-nativo]').forEach(boton => {
      boton.addEventListener('click', async () => {
        if (navigator.share) {
          try {
            await navigator.share({ title: document.title, text: document.title, url: window.location.href });
          } catch (err) { /* El usuario canceló el diálogo */ }
          return;
        }
        try {
          await navigator.clipboard.writeText(window.location.href);
          const original = boton.innerHTML;
          boton.innerHTML = '¡Enlace copiado!';
          boton.disabled = true;
          setTimeout(() => {
            boton.innerHTML = original;
            boton.disabled = false;
          }, 1600);
        } catch (err) {}
      });
    });

    document.addEventListener('input', evento => {
      const input = evento.target;
      if (!input || input.type !== 'number') return;
      const min = input.min === '' ? -Infinity : parseFloat(input.min);
      const max = input.max === '' ? Infinity : parseFloat(input.max);
      const valor = parseFloat(String(input.value).replace(',', '.'));
      const vacio = String(input.value).trim() === '';
      marcarInputInvalido(input, !vacio && (!Number.isFinite(valor) || valor < min || valor > max));
    });

    document.querySelectorAll('[data-calculadora]').forEach(raiz => {
      const def = REGISTRO[raiz.dataset.calculadora];
      if (!def) return;

      // Delegación de eventos: un solo listener cubre también los
      // botones creados más tarde (filas dinámicas).
      raiz.addEventListener('click', evento => {
        const boton = evento.target.closest('[data-action]');
        if (!boton || !raiz.contains(boton)) return;
        if (boton.disabled) return;
        const accion = boton.dataset.action;
        switch (accion) {
          case 'calcular':
            def.calcular(raiz);
            break;
          case 'limpiar':
            def.limpiar(raiz);
            break;
          case 'agregar-fila':
            if (def.agregarFila) def.agregarFila(raiz);
            break;
          case 'eliminar-fila': {
            const fila = boton.closest('.fila-dinamica');
            if (def.eliminarFila) def.eliminarFila(raiz, fila);
            else if (fila) fila.remove();
            break;
          }
          case 'vaciar-historial':
            historialVaciar(boton.dataset.historialClave || def.historialClave, raiz);
            break;
          case 'copiar':
            copiarResultado(raiz.querySelector('#' + boton.dataset.copyTarget), boton);
            break;
          case 'cargar-ejemplo':
            cargarEjemplo(raiz);
            break;
        }
      });

      const listaHistorial = raiz.querySelector('[data-historial-clave]');
      if (listaHistorial && def.historialClave) historialPintar(def.historialClave, listaHistorial);

      raiz.addEventListener('input', () => {
        if (def.onInput) def.onInput(raiz);
      });

      // CÁLCULO EN VIVO: recalcula 200ms después de la última tecla,
      // sin registrar el resultado en el historial. Se puede desactivar
      // por calculadora con enTiempoReal: false.
      let temporizadorVivo = null;
      raiz.addEventListener('input', () => {
        clearTimeout(temporizadorVivo);
        temporizadorVivo = setTimeout(() => {
          if (!def.calcular || def.enTiempoReal === false) return;
          modoVivo = true;
          try {
            def.calcular(raiz);
          } finally {
            modoVivo = false;
          }
        }, 200);
      });

      if (def.iniciar) def.iniciar(raiz);

      inyectarBotonEjemplo(raiz);
      inyectarFormula(raiz);

      if (window.dataLayer) {
        window.dataLayer.push({ 'event': 'vista_calculadora', 'ruta': def.id });
      }
    });

    // Centra la pestaña activa si la barra es desplazable
    const tabActiva = document.querySelector('.pestanas .tab-btn.activa');
    if (tabActiva && tabActiva.scrollIntoView) {
      tabActiva.scrollIntoView({ inline: 'center', block: 'nearest' });
    }

    iniciarPestanas();

    redirigirHashAntiguo();

    configurarPWA();
  }

  document.addEventListener('DOMContentLoaded', arranque);

  // EJEMPLO PRECARGADO: rellena los campos con datos de ejemplo
  // y dispara el cálculo. Cada calculadora define su propia función
  // de ejemplo en la propiedad 'ejemplo' de su registro.
  function cargarEjemplo(raiz) {
    if (!raiz) return;
    const def = REGISTRO[raiz.dataset.calculadora];
    if (!def || !def.ejemplo) return;
    def.ejemplo(raiz);
    // Disparar eventos input para que el cálculo en vivo se active
    raiz.querySelectorAll('input[type="number"], select').forEach(input => {
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    if (def.calcular) def.calcular(raiz);
  }

  function inyectarBotonEjemplo(raiz) {
    if (!raiz) return;
    const def = REGISTRO[raiz.dataset.calculadora];
    if (!def || !def.ejemplo) return;
    const instruccion = raiz.querySelector('.instruccion-tab');
    if (!instruccion) return;
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'btn-ejemplo';
    boton.dataset.action = 'cargar-ejemplo';
    boton.innerHTML = '<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg> Probar con este ejemplo';
    instruccion.insertAdjacentElement('afterend', boton);
  }

  function inyectarFormula(raiz) {
    if (!raiz) return;
    const def = REGISTRO[raiz.dataset.calculadora];
    if (!def || !def.formula) return;
    const lcd = raiz.querySelector('.pantalla-lcd');
    if (!lcd) return;
    const details = document.createElement('details');
    details.className = 'formula-expandible';
    details.innerHTML = '<summary>¿Cómo se calcula?</summary><div class="formula-contenido">' + def.formula + '</div>';
    lcd.insertAdjacentElement('afterend', details);
  }

  // BARRA DE PESTAÑAS DESLIZABLE: muestra flechas y degradados en los
  // bordes solo cuando quedan pestañas fuera de la vista.
  function iniciarPestanas() {
    const UMBRAL = 6;
    document.querySelectorAll('.pestanas-envoltorio').forEach(envoltorio => {
      const barra = envoltorio.querySelector('.pestanas');
      const btnIzq = envoltorio.querySelector('.flecha-izq');
      const btnDer = envoltorio.querySelector('.flecha-der');
      if (!barra || !btnIzq || !btnDer) return;

      const actualizar = () => {
        const puedeIzq = barra.scrollLeft > UMBRAL;
        const maximo = barra.scrollWidth - barra.clientWidth;
        const puedeDer = barra.scrollLeft < maximo - UMBRAL;
        btnIzq.hidden = !puedeIzq;
        btnDer.hidden = !puedeDer;
        envoltorio.classList.toggle('puede-izq', puedeIzq);
        envoltorio.classList.toggle('puede-der', puedeDer);
      };

      btnIzq.addEventListener('click', () => {
        barra.scrollBy({ left: parseFloat(btnIzq.dataset.flecha) || -180, behavior: 'smooth' });
      });
      btnDer.addEventListener('click', () => {
        barra.scrollBy({ left: parseFloat(btnDer.dataset.flecha) || 180, behavior: 'smooth' });
      });
      barra.addEventListener('scroll', actualizar, { passive: true });
      window.addEventListener('resize', actualizar);

      actualizar();
    });
  }

  // ==========================================================
  // PLANTILLAS COMPARTIDAS
  // La cabecera, las pestañas, la sección de relacionadas y el
  // footer son iguales en todas las páginas, así que se generan
  // aquí una sola vez. Para añadir una calculadora nueva solo hay
  // que registrarla en la lista CALCULADORAS de aquí abajo y el
  // menú de pestañas, el footer y las relacionadas se actualizan
  // solos en toda la web.
  // ==========================================================

  const CALCULADORAS = Object.freeze([
    { id: 'nota-necesaria',     nombre: 'Nota Necesaria',      grupo: 'estudios' },
    { id: 'media-ponderada',    nombre: 'Media Ponderada',     grupo: 'estudios' },
    { id: 'admision-ebau-pau',  nombre: 'Admisión EBAU / PAU', grupo: 'estudios' },
    { id: 'nota-de-corte',      nombre: 'Nota de Corte',       grupo: 'estudios' },
    { id: 'asistencias-faltas', nombre: 'Asistencia y Faltas', grupo: 'estudios' },
    { id: 'porcentajes',        nombre: 'Porcentajes',         grupo: 'estudios' },
    { id: 'descuentos',         nombre: 'Descuentos',          grupo: 'dinero' },
    { id: 'iva',                nombre: 'IVA',                 grupo: 'dinero' },
    { id: 'sueldo-neto',        nombre: 'Sueldo Neto',         grupo: 'dinero' },
    { id: 'interes-compuesto',  nombre: 'Interés Compuesto',   grupo: 'dinero' },
    { id: 'interes-simple',     nombre: 'Interés Simple',      grupo: 'dinero' },
    { id: 'cuota-prestamo',     nombre: 'Cuota Préstamo',      grupo: 'dinero' },
    { id: 'hipoteca',           nombre: 'Hipoteca',            grupo: 'dinero' },
    { id: 'imc',                nombre: 'IMC (Índice de Masa)', grupo: 'salud' }
  ]);

  const ETIQUETA_GRUPO = {
    estudios: 'Calculadoras académicas',
    dinero: 'Calculadoras financieras',
    salud: 'Calculadoras de salud'
  };

  const TITULO_GRUPO = {
    estudios: 'Para tus estudios',
    dinero: 'Para tu dinero',
    salud: 'Para tu salud'
  };

  // GUIAS: datos compartidos por la columna del footer y por el bloque
  // "Guías relacionadas" que se pinta en cada página de calculadora.
  // `tema` indica la calculadora principal a la que enlaza cada guía.
  const GUIAS = Object.freeze([
    { id: 'calcular-nota-ebau',        nombre: 'Calcular la nota de EBAU',        tema: 'admision-ebau-pau' },
    { id: 'interes-simple-vs-compuesto', nombre: 'Interés simple vs compuesto',   tema: 'interes-compuesto' },
    { id: 'neto-20000-euros-brutos',   nombre: 'Neto de 20.000 € brutos',         tema: 'sueldo-neto' },
    { id: 'como-calcular-el-iva',      nombre: 'Cómo calcular el IVA',            tema: 'iva' },
    { id: 'como-calcular-porcentajes', nombre: 'Cómo calcular porcentajes',       tema: 'porcentajes' }
  ]);

  const ICONO_TEMA = '<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.6-1.4-.3-.4-.4-.8-.4-1.3 0-1.1.9-2 2-2h2.4A4.6 4.6 0 0 0 22 10.7C21.4 5.8 17.1 2 12 2Z"/><path d="M6.5 11.5h.01M10 7.5h.01M15 7.5h.01"/></svg>';

  function detectarPaginaActual() {
    const segmentos = window.location.pathname.split('/').filter(Boolean);
    let ultimo = segmentos[segmentos.length - 1] || '';
    if (!ultimo || /\.html?$/i.test(ultimo)) ultimo = segmentos[segmentos.length - 2] || '';
    return ultimo;
  }

  // CABECERA: cada página declara su título único con
  // <header class="banner-principal" data-titulo="..."></header>
  // y aquí se completa con logo, eslogan y selector de tema.
  function construirCabecera(prefijo) {
    const cabecera = document.querySelector('header.banner-principal[data-titulo]');
    if (!cabecera) return;

    // La cabecera ya viene escrita en el HTML (h1 estático, clave para el SEO):
    // solo completamos el selector de tema si falta, para no duplicar contenido.
    const titulo = cabecera.getAttribute('data-titulo') || '';
    const h1 = cabecera.querySelector('h1#titulo-header');
    if (!h1 || !h1.textContent.trim()) {
      cabecera.innerHTML =
        '<div class="contenido-banner">' +
          '<div class="banner-marca">' +
            '<a href="' + prefijo + '" class="banner-enlace">' +
              '<img src="' + prefijo + 'logo.svg" alt="Logo CalculaFácil" width="50" height="50" class="logo-header">' +
              '<div class="banner-texto">' +
                '<h1 id="titulo-header"></h1>' +
                '<p class="slogan" id="slogan-header">Tu calculadora online gratuita para exámenes, notas y finanzas.</p>' +
              '</div>' +
            '</a>' +
          '</div>' +
          '<div class="selector-tema-container">' +
            '<label for="selectTema" class="etiqueta-tema">' + ICONO_TEMA + 'Estilo:</label>' +
            '<select id="selectTema" aria-label="Seleccionar tema de carcasa">' +
              '<option value="classic">Gris Clásico</option>' +
              '<option value="cyberpunk">Cyberpunk (Neón)</option>' +
              '<option value="retro">Beige Retro 80s</option>' +
            '</select>' +
          '</div>' +
        '</div>';
      const h1Nuevo = cabecera.querySelector('h1');
      if (h1Nuevo) h1Nuevo.textContent = titulo;
      return;
    }

    // La cabecera es estática: garantizar el selector de tema si no existe.
    const h1Final = cabecera.querySelector('h1#titulo-header');
    if (h1Final && h1Final.textContent.trim()) {
      if (!document.getElementById('selectTema')) {
        const contenedor = cabecera.querySelector('.contenido-banner') || cabecera;
        const selector = document.createElement('div');
        selector.className = 'selector-tema-container';
        selector.innerHTML =
          '<label for="selectTema" class="etiqueta-tema">' + ICONO_TEMA + 'Estilo:</label>' +
          '<select id="selectTema" aria-label="Seleccionar tema de carcasa">' +
            '<option value="classic">Gris Clásico</option>' +
            '<option value="cyberpunk">Cyberpunk (Neón)</option>' +
            '<option value="retro">Beige Retro 80s</option>' +
          '</select>';
        contenedor.appendChild(selector);
      }
    }
  }

  // PESTAÑAS: <div class="pestanas-envoltorio" data-pestanas="estudios|dinero">
  function construirPestanas(prefijo, paginaActual) {
    document.querySelectorAll('[data-pestanas]').forEach(envoltorio => {
      const grupo = envoltorio.getAttribute('data-pestanas');
      const delGrupo = CALCULADORAS.filter(c => c.grupo === grupo);
      if (!delGrupo.length) return;
      const pestanas = delGrupo.map(c =>
        c.id === paginaActual
          ? '<span class="tab-btn activa" aria-current="page">' + c.nombre + '</span>'
          : '<a class="tab-btn" href="' + prefijo + c.id + '/">' + c.nombre + '</a>'
      ).join('');
      envoltorio.innerHTML =
        '<nav class="pestanas" aria-label="' + (ETIQUETA_GRUPO[grupo] || '') + '">' + pestanas + '</nav>' +
        '<button type="button" class="flecha-tab flecha-izq" data-flecha="-180" aria-label="Desplazar pestañas hacia la izquierda" hidden><svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg></button>' +
        '<button type="button" class="flecha-tab flecha-der" data-flecha="180" aria-label="Desplazar pestañas hacia la derecha" hidden><svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>';
    });
  }

  // RELACIONADAS: todas las calculadoras menos la actual
  function construirRelacionadas(prefijo, paginaActual) {
    document.querySelectorAll('.relacionadas-lista[data-relacionadas]').forEach(lista => {
      lista.innerHTML = CALCULADORAS
        .filter(c => c.id !== paginaActual)
        .map(c => '<a class="tab-btn" href="' + prefijo + c.id + '/">' + c.nombre + '</a>')
        .join('');
    });
  }

  // GUIAS RELACIONADAS: cada calculadora y cada guía muestran un bloque
  // de guías afines para repartir autoridad y mejorar el interlinking.
  // `guias` son las guías que enlaza cada calculadora; `calculadoras`
  // las calculadoras que enlaza cada guía (además de su tema principal).
  const GUIAS_POR_CALCULADORA = Object.freeze({
    'admision-ebau-pau':  ['calcular-nota-ebau'],
    'nota-de-corte':      ['calcular-nota-ebau'],
    'interes-simple':     ['interes-simple-vs-compuesto'],
    'interes-compuesto':  ['interes-simple-vs-compuesto'],
    'sueldo-neto':        ['neto-20000-euros-brutos'],
    'iva':                ['como-calcular-el-iva'],
    'porcentajes':        ['como-calcular-porcentajes'],
    'descuentos':         ['como-calcular-porcentajes', 'como-calcular-el-iva']
  });

  // Guías afines entre sí (para enlazar unas guías con otras).
  const GUIAS_RELACIONADAS = Object.freeze({
    'calcular-nota-ebau': ['como-calcular-porcentajes'],
    'como-calcular-porcentajes': ['como-calcular-el-iva'],
    'como-calcular-el-iva': ['como-calcular-porcentajes'],
    'neto-20000-euros-brutos': ['como-calcular-el-iva', 'como-calcular-porcentajes'],
    'interes-simple-vs-compuesto': ['como-calcular-porcentajes']
  });

  function construirGuiasRelacionadas(prefijo, paginaActual) {
    const envoltorio = document.querySelector('[data-relacionadas-guias]');
    if (!envoltorio) return;

    const ids = GUIAS_POR_CALCULADORA[paginaActual] || GUIAS_RELACIONADAS[paginaActual] || [];
    const guias = ids
      .map(id => GUIAS.find(g => g.id === id))
      .filter(Boolean);

    if (!guias.length) {
      envoltorio.style.display = 'none';
      return;
    }

    const items = guias
      .map(g => '<a class="tab-btn" href="' + prefijo + 'guias/' + g.id + '/">' + g.nombre + '</a>')
      .join('');

    envoltorio.innerHTML =
      '<section class="relacionadas-seccion guias-relacionadas">' +
        '<h3><svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>Guías relacionadas</h3>' +
        '<p class="subtitulo-menu">Aprende el método con una guía paso a paso antes de calcular.</p>' +
        '<div class="relacionadas-lista">' + items + '</div>' +
      '</section>';
    envoltorio.style.display = '';
  }

  // FOOTER: se rellena solo si la página lo dejó vacío, así una
  // página puede traer un footer propio distinto si algún día hace falta.
  function construirFooter(prefijo) {
    const footer = document.querySelector('footer.footer-sitio');
    if (!footer || footer.innerHTML.trim() !== '') return;
    const columna = grupo =>
      '<nav class="footer-nav" aria-label="' + ETIQUETA_GRUPO[grupo] + '">' +
        '<p class="footer-titulo">' + TITULO_GRUPO[grupo] + '</p>' +
        CALCULADORAS.filter(c => c.grupo === grupo)
          .map(c => '<a href="' + prefijo + c.id + '/">' + c.nombre + '</a>').join('') +
      '</nav>';
    const columnaGuias =
      '<nav class="footer-nav" aria-label="Guías">' +
        '<p class="footer-titulo">Guías</p>' +
        GUIAS.map(g => '<a href="' + prefijo + 'guias/' + g.id + '/">' + g.nombre + '</a>').join('') +
      '</nav>';
    footer.innerHTML =
      '<div class="footer-caja">' +
        '<div class="footer-columnas">' +
          '<div class="footer-marca">' +
            '<img src="' + prefijo + 'logo.svg" alt="Logo CalculaFácil" width="42" height="42">' +
            '<div><p class="footer-nombre">CalculaFácil</p>' +
            '<p class="footer-eslogan">Tu calculadora online gratuita para exámenes, notas y finanzas.</p></div>' +
          '</div>' +
          columna('estudios') +
          columna('dinero') +
          columna('salud') +
          columnaGuias +
        '</div>' +
        '<p class="footer-legal">© <span data-anio>2026</span> CalculaFácil · Calculadoras gratuitas, sin registro y sin instalar nada. ' +
        '<a href="' + prefijo + 'privacidad/">Privacidad</a> · <a href="' + prefijo + 'sobre-mi/">Sobre mí</a> · <a href="' + prefijo + 'glosario/">Glosario</a></p>' +
      '</div>';
  }

  // Prefijo relativo segun profundidad de la pagina: cada HTML escribe su
  // propio boton "Volver al Menú" con la ruta correcta (../ o ../../),
  // asi que lo usamos como fuente de verdad. Funciona igual da igual donde
  // se despliegue la web (subcarpeta de GitHub Pages o dominio propio).
  function calcularPrefijoRelativo() {
    const volver = document.querySelector('a.btn-volver[href]');
    const href = volver ? volver.getAttribute('href') : '';
    return href.indexOf('../') === 0 ? href : '../';
  }

  function construirPlantillas() {
    const prefijo = document.getElementById('pantalla-menu') ? './' : calcularPrefijoRelativo();
    const paginaActual = detectarPaginaActual();
    construirCabecera(prefijo);
    construirPestanas(prefijo, paginaActual);
    construirRelacionadas(prefijo, paginaActual);
    construirGuiasRelacionadas(prefijo, paginaActual);
    construirFooter(prefijo);
    actualizarContadores();
  }

  // Rellena contadores dinamicos (p.ej. "X calculadoras" en Sobre mí)
  // con el numero real de la lista CALCULADORAS, para que nunca se
  // quede obsoleto al añadir calculadoras nuevas.
  function actualizarContadores() {
    document.querySelectorAll('[data-total-calculadoras]').forEach(el => {
      el.textContent = CALCULADORAS.length;
    });
  }

  // ==========================================================
  // MINI-LIBRERÍA DE GRÁFICOS EN CANVAS
  // Sin dependencias externas. Nítidos en pantallas retina
  // y redibujados solos al girar o redimensionar la ventana.
  // ==========================================================

  const COLOR_VERDE_GRAF = '#10b981';
  const COLOR_ROJO_GRAF = '#ef4444';
  const COLOR_AMBAR_GRAF = '#f59e0b';
  const COLOR_AZUL_GRAF = '#38bdf8';
  const COLOR_EJE_GRAF = '#94a3b8';
  const FUENTE_GRAF = '"Courier New", monospace';

  const tareasRedimension = new Map();
  let resizeGraficosInstalado = false;

  // Registra un redibujo con nombre; un único listener de resize
  // reejecuta todos los registrados (con debounce).
  function alRedimensionar(nombre, funcionRedibujo) {
    tareasRedimension.set(nombre, funcionRedibujo);
    if (resizeGraficosInstalado) return;
    resizeGraficosInstalado = true;
    let temporizador = null;
    window.addEventListener('resize', () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => {
        tareasRedimension.forEach(ejecutar => ejecutar());
      }, 200);
    });
  }

  // Ajusta el canvas a su caja con soporte HiDPI y lo devuelve limpio
  function prepararLienzo(caja, canvas, altoPreferido) {
    if (!caja || !canvas || !canvas.getContext) return null;
    caja.style.display = '';
    const dpr = window.devicePixelRatio || 1;
    const anchoCss = Math.max(caja.clientWidth - 24, 160);
    const altoCss = altoPreferido || (anchoCss > 700 ? 280 : 230);
    canvas.width = Math.round(anchoCss * dpr);
    canvas.height = Math.round(altoCss * dpr);
    canvas.style.width = anchoCss + 'px';
    canvas.style.height = altoCss + 'px';
    canvas.style.display = 'block';
    const vacio = caja.querySelector('.grafico-vacio');
    if (vacio) vacio.style.display = 'none';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, anchoCss, altoCss);
    return { ctx, ancho: anchoCss, alto: altoCss };
  }

  function ocultarGrafico(caja) {
    if (!caja) return;
    caja.style.display = 'none';
  }

  // Devuelve la caja del gráfico a su estado inicial: canvas oculto
  // y mensaje de estado vacío visible (igual que al cargar la página).
  function reiniciarGrafico(caja) {
    if (!caja) return;
    caja.style.display = '';
    const canvas = caja.querySelector('canvas');
    if (canvas) canvas.style.display = 'none';
    const vacio = caja.querySelector('.grafico-vacio');
    if (vacio) vacio.style.display = '';
  }

  // TABLA DE DATOS compartida: muestra/oculta la caja, rellena el tbody
  // con las filas generadas por renderFila y gestiona el mensaje vacío.
  function pintarTablaGenerica(raiz, idCaja, idVacio, idCuerpo, filas, renderFila) {
    const caja = raiz.querySelector('#' + idCaja);
    const cuerpo = raiz.querySelector('#' + idCuerpo);
    if (!caja || !cuerpo) return;
    const hayFilas = !!filas && filas.length > 0;
    caja.hidden = !hayFilas;
    const vacio = raiz.querySelector('#' + idVacio);
    if (vacio) vacio.style.display = hayFilas ? 'none' : '';
    cuerpo.innerHTML = hayFilas ? filas.map(renderFila).join('') : '';
  }

  function trazarRectRedondeado(ctx, x, y, w, h, r) {
    const radio = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radio, y);
    ctx.arcTo(x + w, y, x + w, y + h, radio);
    ctx.arcTo(x + w, y + h, x, y + h, radio);
    ctx.arcTo(x, y + h, x, y, radio);
    ctx.arcTo(x, y, x + w, y, radio);
    ctx.closePath();
  }

  // ANILLO/GAUGE: {porcentaje, minimo, textoGrande, textoPequeno}
  // Dibuja el anillo de 0 a 100 con marca ámbar en el mínimo exigido
  // y el arco en verde si se cumple o rojo si no.
  function graficoAnillo(canvas, datos) {
    const lienzo = prepararLienzo(canvas.closest('.grafico-caja'), canvas);
    if (!lienzo) return;
    const { ctx, ancho, alto } = lienzo;

    const cx = ancho / 2;
    const cy = alto / 2;
    const radio = Math.min(ancho, alto) / 2 - 12;
    const grosor = Math.max(16, radio * 0.24);

    ctx.lineCap = 'round';

    ctx.lineWidth = grosor;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
    ctx.beginPath();
    ctx.arc(cx, cy, radio, 0, Math.PI * 2);
    ctx.stroke();

    const pct = Math.max(0, Math.min(datos.porcentaje, 100));
    const colorArco = pct >= datos.minimo ? COLOR_VERDE_GRAF : COLOR_ROJO_GRAF;
    if (pct > 0) {
      ctx.strokeStyle = colorArco;
      ctx.beginPath();
      ctx.arc(cx, cy, radio, -Math.PI / 2, -Math.PI / 2 + (pct / 100) * Math.PI * 2);
      ctx.stroke();
    }

    const anguloMin = -Math.PI / 2 + (Math.max(0, Math.min(datos.minimo, 100)) / 100) * Math.PI * 2;
    ctx.strokeStyle = COLOR_AMBAR_GRAF;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(anguloMin) * (radio - grosor / 2 - 4), cy + Math.sin(anguloMin) * (radio - grosor / 2 - 4));
    ctx.lineTo(cx + Math.cos(anguloMin) * (radio + grosor / 2 + 4), cy + Math.sin(anguloMin) * (radio + grosor / 2 + 4));
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = colorArco;
    ctx.font = 'bold ' + Math.round(radio * 0.42) + 'px ' + FUENTE_GRAF;
    ctx.fillText(datos.textoGrande, cx, cy - radio * 0.10);
    ctx.fillStyle = COLOR_EJE_GRAF;
    ctx.font = 'bold ' + Math.round(Math.min(radio * 0.17, 13)) + 'px ' + FUENTE_GRAF;
    ctx.fillText(datos.textoPequeno, cx, cy + radio * 0.32);
  }

  // BARRAS HORIZONTALES: filas [{etiqueta, valor, maximo, texto, color}]
  function graficoBarras(canvas, filas) {
    const lienzo = prepararLienzo(canvas.closest('.grafico-caja'), canvas);
    if (!lienzo || !filas.length) return;
    const { ctx, ancho, alto } = lienzo;

    const visibles = filas.slice(-14);
    const padIzq = 30;
    const padDer = 96;
    const padSup = 8;
    const zonaH = alto - padSup - 8;
    const paso = zonaH / visibles.length;
    const altoBarra = Math.min(26, paso * 0.62);
    const anchoUtil = ancho - padIzq - padDer;

    visibles.forEach((fila, i) => {
      const y = padSup + paso * i + (paso - altoBarra) / 2;
      const centroY = y + altoBarra / 2;

      ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
      trazarRectRedondeado(ctx, padIzq, y, anchoUtil, altoBarra, 6);
      ctx.fill();

      const largo = Math.max(4, anchoUtil * Math.min(fila.valor / fila.maximo, 1));
      ctx.fillStyle = fila.color;
      trazarRectRedondeado(ctx, padIzq, y, largo, altoBarra, 6);
      ctx.fill();

      ctx.font = 'bold 11px ' + FUENTE_GRAF;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = COLOR_EJE_GRAF;
      ctx.textAlign = 'right';
      ctx.fillText(fila.etiqueta, padIzq - 7, centroY);
      ctx.textAlign = 'left';
      ctx.fillStyle = fila.color;
      ctx.fillText(fila.texto, padIzq + anchoUtil + 7, centroY);
    });
  }

  // BARRA APILADA: segmentos [{etiqueta, valor, texto, color}]
  // Una barra única dividida en proporciones + leyenda con importes.
  function graficoApilada(canvas, segmentos) {
    const lienzo = prepararLienzo(canvas.closest('.grafico-caja'), canvas);
    if (!lienzo || !segmentos.length) return;
    const { ctx, ancho, alto } = lienzo;

    const total = segmentos.reduce((suma, seg) => suma + seg.valor, 0) || 1;
    const yBarra = alto * 0.18;
    const altoBarra = Math.min(44, alto * 0.34);
    const anchoUtil = ancho - 12;

    let x = 6;
    ctx.save();
    trazarRectRedondeado(ctx, 6, yBarra, anchoUtil, altoBarra, 9);
    ctx.clip();
    segmentos.forEach(seg => {
      const w = anchoUtil * (seg.valor / total);
      ctx.fillStyle = seg.color;
      ctx.fillRect(x, yBarra, w + 1, altoBarra);
      x += w;
    });
    ctx.restore();

    const pasoColumna = ancho / segmentos.length;
    segmentos.forEach((seg, i) => {
      const cxCol = pasoColumna * i + pasoColumna / 2;
      const yCuadro = yBarra + altoBarra + 16;

      ctx.fillStyle = seg.color;
      ctx.fillRect(cxCol - 58, yCuadro - 4, 10, 10);

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 11px ' + FUENTE_GRAF;
      ctx.fillStyle = COLOR_EJE_GRAF;
      ctx.fillText(seg.etiqueta, cxCol - 44, yCuadro + 1);
      ctx.fillStyle = seg.color;
      ctx.fillText(seg.texto, cxCol - 44, yCuadro + 15);
    });
  }

  // API PÚBLICA
  return {
    registrar,
    RANGO_NOTA,
    RANGO_PORCENTAJE,
    validarNumero,
    validarRangoInputs,
    mostrarErrorLCD,
    prepararLCD,
    pintarResultLCD,
    formatearEuros,
    formatearNumero,
    limpiarMarcasError,
    historialGuardar,
    cambiarTema,
    filtrarCalculadoras,
    copiarResultado,
    alRedimensionar,
    ocultarGrafico,
    reiniciarGrafico,
    graficoAnillo,
    graficoBarras,
    graficoApilada,
    pintarTablaGenerica,
    cargarEjemplo
  };

})();
