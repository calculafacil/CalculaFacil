/* ============================================================
   registro-compras.js - Aviso de cada venta del Organizador
   ------------------------------------------------------------
   QUÉ PROBLEMA RESUELVE

   La página de gracias (organizador-estudios/gracias.html) mide la compra
   con Google Analytics, pero Analytics solo funciona si el visitante ha
   aceptado cookies. Con un bloqueador de anuncios, en modo incógnito o
   sin aceptar el aviso, la venta NO aparece en ningún sitio: se pierde.

   Además, los datos de Analytics se pueden cambiar o borrar. Para saber
   cuanto has ganado de verdad necesitas una copia propia.

   QUÉ HACE ESTE ARCHIVO

   Cada vez que alguien llega a la página de gracias, envía un aviso a tu
   propio correo con los datos de la venta. Así tienes un libro de ventas
   en tu bandeja de entrada, aunque el visitante haya bloqueado todo.

   CÓMO FUNCIONA

   Usa FormSubmit (formsubmit.co), el mismo servicio que ya usa el
   formulario de la plantilla gratuita. No cuesta nada y no hay que
   registrarse en nada nuevo. Solo necesitas que el correo destino esté
   confirmado en FormSubmit (basta con haber confirmado el primer envío).

   El POST se hace en segundo plano. Si falla, no molesta al visitante ni
   rompe nada de la pagina.
   ============================================================ */

(function () {
  'use strict';

  var CORREO_DESTINO = 'calculafacil.web@gmail.com';
  var CLAVE_ANTIDUPLICADO = 'cf_venta_registrada';

  /* Evita enviar dos veces la misma venta si el visitante recarga o
     vuelve atras en la pagina. */
  function yaRegistrado() {
    try {
      return window.sessionStorage.getItem(CLAVE_ANTIDUPLICADO) === '1';
    } catch (err) {
      return false;
    }
  }

  function marcarRegistrado() {
    try {
      window.sessionStorage.setItem(CLAVE_ANTIDUPLICADO, '1');
    } catch (err) { /* sin almacenamiento: se reintentara en la recarga */ }
  }

  function avisar(venta) {
    var ahora = new Date();
    var datos = {
      _subject: 'Venta: Organizador de Estudios 2026-2027 (' + venta.precio + ' EUR)',
      _template: 'table',
      _noautoresponse: '1',
      producto: 'Organizador de Estudios 2026-2027',
      pedido: venta.pedido,
      correo_cliente: venta.correo || '(no informado por LemonSqueezy)',
      precio: venta.precio + ' EUR',
      origen: venta.origen,
      fecha: ahora.toISOString(),
      pagina: 'organizador-estudios/gracias.html',
      forma_pago: 'LemonSqueezy',
      enlace_libro_mayor: 'https://app.lemonsqueezy.com'
    };

    if (window.gtag) {
      window.gtag('event', 'venta_registrada', {
        'pedido': venta.pedido,
        'valor': venta.precio,
        'moneda': 'EUR'
      });
    }

    try {
      window.fetch('https://formsubmit.co/ajax/' + CORREO_DESTINO, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(datos)
      }).then(function (respuesta) {
        if (respuesta && respuesta.ok) marcarRegistrado();
      }).catch(function () {
        /* Sin red, sin FormSubmit o con reCAPTCHA molesto:
           no pasa nada, la compra sigue siendo real. */
      });
    } catch (err) { /* igual */ }
  }

  function iniciar() {
    if (yaRegistrado()) return;

    // LemonSqueezy puede pasar datos en la query (?order_id=...) o en el
    // fragmento (#order_id=... si redirige por hash). Se miran los dos.
    var crud = {};
    try {
      new URLSearchParams(window.location.search).forEach(function (valor, clave) {
        crud[clave] = valor;
      });
    } catch (err) {}
    if (window.location.hash && window.location.hash.length > 1) {
      try {
        new URLSearchParams(window.location.hash.slice(1)).forEach(function (valor, clave) {
          if (!crud[clave]) crud[clave] = valor;
        });
      } catch (err) {}
    }

    var pedido = crud.order_id || crud['order-id'] || crud.checkout_id || null;

    if (!pedido) {
      // LemonSqueezy no devolvió identificador. Aun asi registramos la visita
      // como venta sin referencia para no perderla, y lo indicamos.
      try {
        var marca = window.localStorage.getItem('cf_intento_compra');
        if (!marca) return; // no hubo clic de compra: pagina abierta a mano
        pedido = 'sin-id-' + marca;
      } catch (err) {
        return;
      }
    }

    avisar({
      pedido: String(pedido).slice(0, 120),
      correo: crud.email ? String(crud.email).slice(0, 200) : '',
      precio: 5.99,
      origen: crud.coupon_code ? 'cupon-' + crud.coupon_code : 'lemon-squeezy'
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
