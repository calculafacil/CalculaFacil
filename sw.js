// ==========================================================
// SERVICE WORKER - CalculaFácil
// Para actualizar la caché tras cambiar archivos: sube VERSION.
// ==========================================================

// Sube la VERSION en cuanto toques este archivo o cambies una página: es lo
// único que purga las cachés viejas de los visitantes que ya tienen la web
// abierta. Sin esto, un error cacheado se queda sirviéndose para siempre.
const VERSION = 'v41';
const CACHE = 'calculafacil-' + VERSION;

const PRECACHE = [
  './',
  'index.html',
  'estilos.css',
  'js/core.js',
  'js/calculadoras.js',
  'logo.svg',
  'iconos/icon-48.png',
  'manifest.json',
  'iconos/academico.svg',
  'iconos/finanzas.svg',
  'iconos/salud.svg',
  'iconos/icon-192.png',
  'iconos/icon-512.png',
  'nota-necesaria/',
  'media-ponderada/',
  'admision-ebau-pau/',
  'nota-de-corte/',
  'asistencias-faltas/',
  'descuentos/',
  'iva/',
  'sueldo-neto/',
  'interes-compuesto/',
  'interes-simple/',
  'cuota-prestamo/',
  'porcentajes/',
  'privacidad/',
  'sobre-mi/',
  'glosario/',
  'guias/neto-20000-euros-brutos/',
  'guias/interes-simple-vs-compuesto/',
  'guias/calcular-nota-ebau/',
  'guias/como-calcular-el-iva/',
  'guias/como-calcular-porcentajes/',
  'guias/como-calcular-faltas-asistencia/',
  'guias/como-calcular-media-ponderada/',
  'imc/',
  'hipoteca/',
  'organizador-estudios/',
  'organizador-estudios/gracias.html',
  'organizador-estudios/img/1.png',
  'organizador-estudios/img/2.png',
  'organizador-estudios/img/3.png',
  'organizador-estudios/img/4.png',
  'descarga-gratuita/',
  'descarga-gratuita/Control-Notas-2026-2027.xlsx'
];

self.addEventListener('install', evento => {
  // addAll() es todo-o-nada: si un único archivo falla, TODO el install
  // revienta y el service worker no se instala nunca. Se precachea uno a uno
  // tolerando los que fallen, que es lo que queremos: un icono que no exista
  // no puede dejar la web entera sin service worker.
  evento.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.allSettled(
        PRECACHE.map(url => cache.add(new Request(url, { cache: 'reload' })))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys()
      .then(claves => Promise.all(
        claves.filter(clave => clave.startsWith('calculafacil-') && clave !== CACHE)
          .map(vieja => caches.delete(vieja))
      ))
      .then(() => self.clients.claim())
  );
});

// AUTOREPARACIÓN.
// Si la red falla y la copia que tenemos guardada tampoco es una página
// válida, significa que la caché está envenenada (un 500 guardado en
// versiones antiguas de este archivo). En ese caso el service worker se
// desinstala solo y recarga la página: es la única forma de que un visitante
// se recupere sin tener que buscar los ajustes del navegador, que en móvil es
// casi imposible. En la siguiente visita js/core.js lo vuelve a registrar.
function autoreparar() {
  return self.registration.unregister()
    .catch(() => {})
    .then(() => new Response(
      '<!doctype html><html lang="es"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Actualizando…</title><style>body{font-family:system-ui,sans-serif;' +
      'text-align:center;padding:60px 20px;color:#0f172a;background:#f8fafc}' +
      'a{color:#0d9488}</style></head><body>' +
      '<p><b>Actualizando la página…</b></p>' +
      '<p><a href="">Si no se recarga sola, pulsa aquí</a></p>' +
      '<script>location.replace(location.pathname+location.search)</script>' +
      '</body></html>',
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
      }
    ));
}

self.addEventListener('fetch', evento => {
  const peticion = evento.request;
  if (peticion.method !== 'GET') return;
  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return;

  // PÁGINAS HTML: internet primero, copia local solo sin conexión
  if (peticion.mode === 'navigate' || (peticion.headers.get('accept') || '').includes('text/html')) {
    evento.respondWith(
      fetch(peticion)
        .then(respuesta => {
          // Nunca se cachea una respuesta de error. Cachear un 500 era lo que
          // dejaba la página rota para siempre: el error se quedaba guardado
          // y se servía aunque el servidor ya estuviera bien.
          if (!respuesta.ok) throw new Error('http-' + respuesta.status);
          const copia = respuesta.clone();
          caches.open(CACHE).then(cache => cache.put(peticion, copia));
          return respuesta;
        })
        // Si la red falla O devuelve un error, se sirve la copia local buena.
        // Si la copia guardada tampoco es válida, la caché está envenenada y
        // el service worker se autorepara en vez de pintar un error.
        .catch(() => caches.match(peticion).then(encontrada => {
          if (!encontrada) return caches.match('./') || autoreparar();
          return encontrada.ok ? encontrada : autoreparar();
        }))
    );
    return;
  }

  // ARCHIVOS ESTÁTICOS: copia al instante, refresco en segundo plano
  evento.respondWith(
    caches.match(peticion).then(enCache => {
      const red = fetch(peticion).then(respuesta => {
        if (respuesta && respuesta.status === 200) {
          const copia = respuesta.clone();
          caches.open(CACHE).then(cache => cache.put(peticion, copia));
        }
        return respuesta;
      }).catch(() => enCache);
      // Si no hay copia y la red falla hay que devolver una Response válida:
      // devolver una promesa rechazada hace que respondWith lance y la petición
      // muera con un error de red en lugar de degradarse sola.
      return enCache || red.then(respuesta => respuesta || new Response('', { status: 504 }));
    })
  );
});
