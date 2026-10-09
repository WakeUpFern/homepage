import { ScrollTrigger } from 'gsap/ScrollTrigger';
import projects from './data/projects.json';
import { t, onLangChange } from './i18n.js';
import { scrollTo, start as startScroll, stop as stopScroll } from './scroll.js';
import { LANG_SWAP } from './views/view-utils.js';
import homeView from './views/home.js';
import projectView from './views/project.js';
import aboutView from './views/about.js';

const SITE_NAME = 'wakeupfern';

/**
 * Rutas. `/projects` es un alias de home (más adelante hará scroll al anillo).
 * `valid` descarta slugs inexistentes.
 */
const ROUTES = [
  { name: 'home', re: /^\/$/, keys: [], view: homeView },
  { name: 'projects', re: /^\/projects\/?$/, keys: [], view: homeView },
  {
    name: 'project',
    re: /^\/projects\/([^/]+)\/?$/,
    keys: ['slug'],
    view: projectView,
    valid: (p) => projects.some((x) => x.slug === p.slug)
  },
  { name: 'about', re: /^\/about\/?$/, keys: [], view: aboutView }
];

/** @typedef {{ route: typeof ROUTES[number], params: Record<string, string>, path: string }} Match */

/** @type {{ root: HTMLElement, app: HTMLElement, announcer: HTMLElement, ready: Promise<unknown> } | null} */
let dom = null;
/** @type {Match | null} */
let current = null;
let busy = false;
/** @type {{ type: 'nav', match: Match } | { type: 'lang' } | null} */
let pending = null;
const listeners = new Set();

/** @param {string} pathname @returns {Match | null} */
function match(pathname) {
  for (const route of ROUTES) {
    const m = pathname.match(route.re);
    if (!m) continue;
    const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    if (route.valid && !route.valid(params)) return null;
    return { route, params, path: pathname };
  }
  return null;
}

/** Resuelve la promesa cuando termina la animación (o de inmediato si no hay). */
function play(anim) {
  if (!anim || anim.duration() === 0) return Promise.resolve();
  return new Promise((resolve) => anim.then(() => resolve()));
}

function lockInput() {
  dom.app.style.pointerEvents = 'none';
  stopScroll();
}

function unlockInput() {
  dom.app.style.pointerEvents = '';
  startScroll();
}

function documentTitle(m) {
  const title = m.route.view.getTitle(m.params);
  return title ? `${title} — ${SITE_NAME}` : SITE_NAME;
}

function announce(m) {
  dom.announcer.textContent = m.route.view.getTitle(m.params) || t('a11y.viewHome');
}

function focusHeading() {
  const h1 = dom.root.querySelector('h1');
  if (!h1) return;
  h1.setAttribute('tabindex', '-1');
  h1.focus({ preventScroll: true });
}

/**
 * Orquesta un cambio de vista: leave → unmount → mount → enter.
 * @param {Match} next
 * @param {'first' | 'nav' | 'lang'} mode  'lang' remonta la misma ruta conservando scroll y foco
 */
async function swap(next, mode) {
  // Alias de la misma vista (/ ↔ /projects): no se remonta. Solo cambia la ruta activa (header, título, aria-live).
    if (mode === 'nav' && current && current.route.view === next.route.view && JSON.stringify(current.params) === JSON.stringify(next.params)) {
    current = next;
    document.title = documentTitle(next);
    announce(next);
    listeners.forEach((cb) => cb(current));
    // La vista decide qué hacer (home: volver arriba; projects: ir al anillo).
    document.dispatchEvent(new CustomEvent('route:alias', { detail: { name: next.route.name } }));
    return;
  }

  busy = true;
  lockInput();
  try {
    const prev = current;
    if (prev) await play(prev.route.view.leave(mode === 'lang' ? LANG_SWAP : next.route.name));
    prev?.route.view.unmount();

    // Con lock activo hace falta `force` para mover el scroll.
    if (mode !== 'lang') scrollTo(0, { immediate: true, force: true });

    next.route.view.mount({ root: dom.root, mode, route: next.route.name }, next.params);
    current = next;
    document.title = documentTitle(next);
    if (mode !== 'lang') announce(next);
    listeners.forEach((cb) => cb(current));

    // Primera carga: la vista queda montada (y oculta por su estado inicial) hasta que el preloader,
    // las fuentes y las imágenes críticas estén listos.
    if (mode === 'first') await dom.ready;

    await play(next.route.view.enter(mode === 'lang' ? LANG_SWAP : prev?.route.name ?? null));
    // El foco va al h1 al terminar enter(): mientras la vista está en visibility:hidden el navegador no lo conserva.
    if (mode === 'nav') focusHeading();
  } finally {
    unlockInput();
    ScrollTrigger.refresh();
    busy = false;
    flushPending();
  }
}

function flushPending() {
  if (!pending) return;
  const job = pending;
  pending = null;
  if (job.type === 'nav') swap(job.match, 'nav');
  else swap(current, 'lang');
}

/** Navega a una ruta interna con pushState. Devuelve false si la ruta no existe. */
export function navigate(path, { replace = false } = {}) {
  const url = new URL(path, location.origin);
  const m = match(url.pathname);
  if (!m) return false;
  if (busy) return true; // input bloqueado: ignora clicks/teclas durante la transición
  if (url.pathname === location.pathname && !replace) return true;
  history[replace ? 'replaceState' : 'pushState']({}, '', url.pathname + url.search + url.hash);
  swap(m, 'nav');
  return true;
}

function onPopState() {
  const m = match(location.pathname) ?? match('/');
  if (!match(location.pathname)) history.replaceState({}, '', '/');
  if (busy) {
    pending = { type: 'nav', match: m };
    return;
  }
  swap(m, 'nav');
}

/** @param {MouseEvent} e */
function onClick(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest?.('a[href]');
  if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download') || a.rel.includes('external')) return;

  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || !match(url.pathname)) return;
  // Ancla dentro de la misma página (p. ej. skip link): comportamiento nativo.
  if (url.pathname === location.pathname && url.hash) return;

  e.preventDefault();
  if (url.pathname === location.pathname) {
    scrollTo(0);
    return;
  }
  navigate(url.pathname + url.search + url.hash);
}

/** Remonta la vista actual tras un cambio de idioma (el anillo, al ser capa persistente, no se toca). */
export function remount() {
  if (!current) return;
  if (busy) {
    pending ??= { type: 'lang' };
    return;
  }
  swap(current, 'lang');
}

/** @param {(m: Match) => void} cb @returns {() => void} */
export function onRouteChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export const getRoute = () => current;

/** @param {{ root: HTMLElement, app: HTMLElement, announcer: HTMLElement, ready?: Promise<unknown> }} elements */
export function initRouter(elements) {
  dom = { ready: Promise.resolve(), ...elements };
  let m = match(location.pathname);
  if (!m) {
    history.replaceState({}, '', '/');
    m = match('/');
  }
  window.addEventListener('popstate', onPopState);
  document.addEventListener('click', onClick);
  onLangChange(remount);
  swap(m, 'first');
}
