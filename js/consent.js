/* ============================================================
   consent.js - Gestor de consentimiento de cookies (RGPD)
   ------------------------------------------------------------
   QUÉ HACE ESTE ARCHIVO:
   1. Muestra un aviso de cookies (banner) la primera vez que
      alguien visita la web.
   2. Dependiendo de lo que elija el visitante, decide si Google
      Analytics (GA4) y los anuncios de AdSense pueden usar datos.

   - Si NO acepta   -> solo medimos lo esencial (seguridad).
   - Si ACEPTA      -> se activa GA4 y los anuncios personalizados.

   NOTA PARA TI (el dueño):
   - Este archivo se carga en todas las páginas de la web.
   - Si algún día activas el aviso de GDPR que trae AdSense
     (en el panel de AdSense -> Privacidad y mensajes), este banner
     NO se mostrará para no duplicar el mensaje al visitante.
   ============================================================ */

(function () {
  'use strict';

  var CLAVE = 'calculafacil_consent';
  var GUARDADO = null;
  try { GUARDADO = window.localStorage.getItem(CLAVE); } catch (err) { /* sin almacenamiento */ }

  // Avisa a gtag (GA4/AdSense) de la decisión del visitante.
  // 'granted' = permitido, 'denied' = prohibido.
  function enviarConsentimiento(aceptado) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('consent', 'update', {
      'ad_storage': aceptado ? 'granted' : 'denied',
      'analytics_storage': aceptado ? 'granted' : 'denied',
      'ad_user_data': aceptado ? 'granted' : 'denied',
      'ad_personalization': aceptado ? 'granted' : 'denied',
      'personalization_storage': aceptado ? 'granted' : 'denied',
      'functionality_storage': 'granted',
      'security_storage': 'granted'
    });
  }

  function ocultarBanner() {
    var banner = document.getElementById('cf-banner-cookies');
    if (!banner) return;
    banner.style.opacity = '0';
    window.setTimeout(function () {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 300);
  }

  function guardarDecision(decision, aceptado) {
    try { window.localStorage.setItem(CLAVE, decision); } catch (err) { /* no pasa nada */ }
    GUARDADO = decision;
    enviarConsentimiento(aceptado);
    ocultarBanner();
    try {
      window.gtag('event', 'consent_decision', { 'decision': decision });
    } catch (err) { /* sin seguimiento aún */ }
  }

  function crearBanner() {
    var estilos = document.createElement('style');
    estilos.textContent =
      '#cf-banner-cookies{position:fixed;left:0;right:0;bottom:0;z-index:99999;' +
      'background:#0f172a;color:#e2e8f0;padding:14px 16px;font-family:Arial,Helvetica,sans-serif;' +
      'font-size:14px;line-height:1.45;box-shadow:0 -4px 20px rgba(0,0,0,.35);opacity:1;' +
      'transition:opacity .3s ease;}' +
      '#cf-banner-cookies .cf-banner-contenido{max-width:1100px;margin:0 auto;' +
      'display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:center;text-align:center;}' +
      '#cf-banner-cookies p{margin:0;flex:1 1 320px;min-width:240px;}' +
      '#cf-banner-cookies a{color:#7dd3fc;}' +
      '#cf-banner-cookies button{border:none;border-radius:8px;padding:9px 16px;font-size:14px;' +
      'font-weight:600;cursor:pointer;}' +
      '#cf-boton-aceptar{background:#22c55e;color:#052e16;}' +
      '#cf-boton-esenciales{background:#334155;color:#e2e8f0;}' +
      '#cf-banner-cookies a.cf-enlace-politica{background:transparent;color:#7dd3fc;' +
      'padding:9px 10px;text-decoration:none;}';

    var texto = document.createElement('p');
    texto.innerHTML =
      'Usamos cookies para medir el tráfico y mostrar anuncios. ' +
      'Puedes aceptarlas o usar solo las esenciales. ' +
      '<a class="cf-enlace-politica" href="/privacidad/" target="_blank" rel="noopener">Más información</a>';

    var botonAceptar = document.createElement('button');
    botonAceptar.id = 'cf-boton-aceptar';
    botonAceptar.type = 'button';
    botonAceptar.textContent = 'Aceptar';
    botonAceptar.addEventListener('click', function () { guardarDecision('aceptado', true); });

    var botonEsenciales = document.createElement('button');
    botonEsenciales.id = 'cf-boton-esenciales';
    botonEsenciales.type = 'button';
    botonEsenciales.textContent = 'Solo lo esencial';
    botonEsenciales.addEventListener('click', function () { guardarDecision('esenciales', false); });

    var contenedor = document.createElement('div');
    contenedor.className = 'cf-banner-contenido';
    contenedor.appendChild(texto);
    contenedor.appendChild(botonAceptar);
    contenedor.appendChild(botonEsenciales);

    var banner = document.createElement('div');
    banner.id = 'cf-banner-cookies';
    banner.appendChild(contenedor);

    document.head.appendChild(estilos);
    document.body.appendChild(banner);
  }

  // Decide si hace falta mostrar el banner:
  // - Si el visitante ya eligió antes -> NO se muestra nunca más.
  // - Si AdSense tiene activado su propio aviso de GDPR -> NO lo duplicamos.
  function iniciar() {
    if (GUARDADO) {
      enviarConsentimiento(GUARDADO === 'aceptado');
      return;
    }

    var milisegundos = 0;
    var comprobacion = window.setInterval(function () {
      milisegundos += 500;
      var adsenseConAvisoPropio = window.googlefcPresent === true ||
        (window.googlefc && (window.googlefc.askConsent || window.googlefc.getConsentStatus));
      if (adsenseConAvisoPropio) {
        window.clearInterval(comprobacion);
        return;
      }
      if (milisegundos >= 2000) {
        window.clearInterval(comprobacion);
        crearBanner();
      }
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();