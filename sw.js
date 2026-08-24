// ==========================================================
// SERVICE WORKER - CalculaFácil
// Para actualizar la caché tras cambiar archivos: sube VERSION.
// ==========================================================

const VERSION = 'v15';
const CACHE = 'calculafacil-' + VERSION;

const PRECACHE = [
  './',
  'index.html',
  'estilos.css',
  'js/core.js',
  'js/calculadoras.js',
  'logo.svg',
  'manifest.json',
  'iconos/academico.svg',
  'iconos/finanzas.svg',
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
  'sobre-mi/'
];

self.addEventListener('install', evento => {
  evento.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
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
          const copia = respuesta.clone();
          caches.open(CACHE).then(cache => cache.put(peticion, copia));
          return respuesta;
        })
        .catch(() => caches.match(peticion).then(encontrada => encontrada || caches.match('./')))
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
      return enCache || red;
    })
  );
});
