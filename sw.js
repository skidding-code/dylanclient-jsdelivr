const VERSION = "e7cfcd1f361d6c8b";
const CHUNKED = {"classes.wasm":{"parts":6,"size":113486190,"type":"application/wasm"},"music.dylan":{"parts":3,"size":40641269,"type":"application/octet-stream"},"server-worker.wasm":{"parts":3,"size":44551516,"type":"application/wasm"},"sounds.dylan":{"parts":2,"size":26404673,"type":"application/octet-stream"},"via-worker.wasm":{"parts":2,"size":20216359,"type":"application/wasm"}};
function dylanJoin(base, name, info, fetcher) {
  var queue = [];
  var next = 1;
  var reader = null;
  var get = function (index) {
    var p = fetcher(new URL(name + '.part' + index + '.dylan', base).href).then(function (response) {
      if (!response.ok) throw new Error(name + ' part ' + index + ': HTTP ' + response.status);
      return response;
    });
    p.catch(function () {});
    return p;
  };
  var fill = function () { while (queue.length < 3 && next <= info.parts) queue.push(get(next++)); };
  fill();
  var body = new ReadableStream({
    pull: function (controller) {
      var step = function () {
        if (!reader) {
          if (!queue.length) { controller.close(); return; }
          return queue.shift().then(function (response) { fill(); reader = response.body.getReader(); return step(); });
        }
        return reader.read().then(function (chunk) {
          if (chunk.done) { reader = null; return step(); }
          controller.enqueue(chunk.value);
        });
      };
      return Promise.resolve(step()).catch(function (error) { controller.error(error); });
    }
  });
  return new Response(body, { status: 200, headers: { 'Content-Type': info.type, 'Content-Length': String(info.size) } });
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const scope = () => new URL(self.registration.scope);

async function page(url) {
  const response = await fetch(url, { cache: 'no-cache' });
  return new Response(response.body, { status: response.status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Dylan-Page': VERSION } });
}

async function typed(request, type) {
  const response = await fetch(request);
  if ((response.headers.get('Content-Type') || '').startsWith(type)) return response;
  return new Response(response.body, { status: response.status, headers: { 'Content-Type': type } });
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const base = scope();
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return;
  const name = decodeURIComponent(url.pathname.slice(base.pathname.length));
  if (event.request.mode === 'navigate' && (name === '' || name.endsWith('.html'))) { event.respondWith(page(new URL(name || 'index.html', base))); return; }
  if (event.request.method !== 'GET') return;
  if (Object.prototype.hasOwnProperty.call(CHUNKED, name)) { event.respondWith(dylanJoin(base, name, CHUNKED[name], fetch)); return; }
  if (name.endsWith('.wasm')) event.respondWith(typed(event.request, 'application/wasm'));
});
