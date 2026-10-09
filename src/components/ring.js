import gsap from 'gsap';
import projects from '../data/projects.json';
import { RING_CONFIG as C } from '../config.js';
import { l, t, onLangChange } from '../i18n.js';
import { getVelocity } from '../scroll.js';
import { hasFinePointer, prefersReducedMotion, onMotionChange } from '../motion.js';
import { detached } from './persistent.js';

/**
 * Anillo de tarjetas de proyecto. Capa PERSISTENTE (#layer-ring): se crea una sola vez y no se destruye al
 * cambiar de vista ni de idioma (al cambiar de idioma solo se actualizan sus textos).
 *
 * Motor: un objeto proxy compartido (`s`) y una función `place()` que reposiciona todas las tarjetas.
 * Los tweens animan el proxy, nunca las tarjetas una por una.
 */

const TAU = Math.PI * 2;
const clamp = (min, v, max) => Math.max(min, Math.min(v, max));
const lerp = ([a, b], k) => a + (b - a) * k;

/** PRNG con semilla (mulberry32): el anillo se ve igual en cada visita. */
function mulberry32(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Proxy compartido. r: radio · rot: rotación · spread: escala global · spin: multiplicador del giro (pausa/hover). */
const s = { r: 0, rot: 0, spread: 1, spin: 1 };
const vel = { v: 0 }; // velocidad de scroll suavizada

/**
 * @typedef {object} Card
 * @property {HTMLLIElement} li
 * @property {HTMLAnchorElement} a
 * @property {HTMLImageElement} img
 * @property {typeof projects[number]} project
 * @property {number} jitter @property {number} rJit @property {number} depth
 * @property {number} amp @property {number} speed @property {number} seed
 * @property {number} phase @property {number} m  multiplicador individual de escala (hover)
 */
/** @type {Card[]} */
let cards = [];
/** @type {Card[]} */
let visibleCards = [];
/** @type {HTMLElement} */
let layer;
/** @type {HTMLUListElement} */
let listEl;
let L = C.layout.desktop; // layout del breakpoint actual
let introTl = null;
let hoverCard = null;
let running = false;
let shown = false;
let played = false;  // la intro completa ya se lanzó en esta visita
let settled = false; // sin intro en curso: ya se puede interactuar
let primed = null;
let velTo = null;

const breakpoint = () => (innerWidth < 640 ? 'mobile' : innerWidth < 1024 ? 'tablet' : 'desktop');
const radius = () => L.radius();
const lis = () => cards.map((c) => c.li);

function scaleSetter(li) {
  const sx = gsap.quickSetter(li, 'scaleX');
  const sy = gsap.quickSetter(li, 'scaleY');
  return { setS: (v) => (sx(v), sy(v)) };
}

/** Reposiciona todas las tarjetas a partir del proxy. `time` en segundos (flotación). */
function place(time = 0) {
  const calm = prefersReducedMotion();
  for (const c of visibleCards) {
    const a = s.rot + c.phase;
    const r = s.r * c.rJit;
    const float = calm ? 0 : Math.sin(time * c.speed * TAU + c.seed) * c.amp;
    c.setX(Math.cos(a) * r * L.ellipse + float * 0.4);
    c.setY(Math.sin(a) * r + float);
    c.setS(c.depth * s.spread * c.m);
  }
}

function tick(time, deltaTime) {
  velTo(clamp(-C.maxScrollVel, getVelocity(), C.maxScrollVel));
  const frames = deltaTime / 16.667;
  s.rot += (C.idleSpin * frames + vel.v * C.scrollSpin * frames) * s.spin;
  place(time);
}

/** Arranca el loop (un solo ticker compartido). Con reduced-motion no hay loop: se coloca una vez. */
function wake() {
  if (prefersReducedMotion()) return place(0);
  if (running) return;
  running = true;
  gsap.ticker.add(tick);
}

function suspend() {
  if (!running) return;
  running = false;
  gsap.ticker.remove(tick);
}

function applyLayout() {
  L = C.layout[breakpoint()];
  const [min, k, max] = L.cardH;
  layer.style.setProperty('--ring-card-h', `${clamp(min, innerHeight * k, max)}px`);
  visibleCards = cards.slice(0, L.maxCards ?? cards.length);
  cards.forEach((c) => (c.li.hidden = !visibleCards.includes(c)));
  visibleCards.forEach((c, i) => (c.phase = (i / visibleCards.length) * TAU + c.jitter));
  if (!running) place(0);
}

/** Carga las portadas la primera vez (no antes: así no compiten con la foto del hero). */
function prime() {
  primed ??= (() => {
    cards.forEach((c) => (c.img.src = c.project.cover));
    const all = Promise.all(cards.map((c) => c.img.decode().catch(() => {})));
    return Promise.race([all, new Promise((r) => setTimeout(r, 1500))]);
  })();
  return primed;
}

function refreshLabels() {
  listEl.setAttribute('aria-label', t('ring.label'));
  cards.forEach((c) => c.a.setAttribute('aria-label', `${c.project.title} — ${l(c.project.category)}`));
}

/* ---------------- Hover ---------------- */

function hover(card) {
  if (!settled || hoverCard === card) return;
  hoverCard = card;
  const calm = prefersReducedMotion();
  const H = C.hover;
  cards.forEach((o) => {
    const on = o === card;
    if (!calm) gsap.to(o, { m: on ? H.scale : 1, duration: H.scaleDuration, ease: H.ease, overwrite: true });
    gsap.to(o.li, { autoAlpha: on ? 1 : H.dim, duration: H.fadeDuration, overwrite: true });
  });
  // Con hover el giro casi se detiene: la tarjeta no se escapa de debajo del cursor.
  if (!calm) gsap.to(s, { spin: H.spin, duration: 0.4, overwrite: 'auto' });
}

function unhover() {
  if (!hoverCard) return;
  hoverCard = null;
  const H = C.hover;
  cards.forEach((o) => {
    gsap.to(o, { m: 1, duration: H.scaleDuration, ease: H.ease, overwrite: true });
    gsap.to(o.li, { autoAlpha: 1, duration: H.fadeDuration, overwrite: true });
  });
  gsap.to(s, { spin: 1, duration: 0.4, overwrite: 'auto' });
}

const cardOf = (node) => {
  const li = node?.closest?.('.ring-card');
  return cards.find((c) => c.li === li);
};

/* ---------------- API ---------------- */

function finishSettled() {
  settled = true;
  introTl = null;
}

/**
 * Secuencia "flotan → se juntan → se expanden". Interrumpible (`interrupt()`).
 * `short`: solo juntarse y expandirse (0.9 s en total), para volver de un proyecto.
 */
function playIntro({ short = false } = {}) {
  introTl?.kill();
  unhover();
  settled = false;
  played = true;
  const I = C.intro;

  if (prefersReducedMotion()) {
    s.r = radius();
    s.spread = 1;
    place(0);
    gsap.to(lis(), { autoAlpha: 1, duration: 0.3, onComplete: finishSettled });
    return null;
  }

  const tl = (introTl = gsap.timeline({ onComplete: finishSettled }));
  if (short) {
    const S = C.introShort;
    gsap.set(lis(), { autoAlpha: 1 });
    tl.to(s, { r: () => radius() * I.gatherRadius, spread: I.gatherSpread, duration: S.gather, ease: 'power3.inOut' }, 0)
      .to(s, { r: radius, duration: S.expand, ease: I.expandEase }, '>')
      .to(s, { spread: 1, duration: S.expand, ease: 'expo.out' }, '<');
    return tl;
  }

  s.r = 0;
  s.spread = 1;
  gsap.set(lis(), { autoAlpha: 0 });
  tl.to(lis(), { autoAlpha: 1, duration: I.cardFade, stagger: { each: I.cardStagger, from: 'random' } }, 0) // entran mientras vuelan
    .to(s, { r: radius, duration: I.fly, ease: 'expo.out' }, 0)                                              // 1. entrada: flotan en círculo
    .to(s, { r: () => radius() * I.gatherRadius, spread: I.gatherSpread, duration: I.gather, ease: 'power3.inOut' }, `+=${I.hold}`) // 2-3. hold + se juntan
    .to(s, { r: radius, duration: I.expand, ease: I.expandEase }, '>')                                       // 4. se expanden
    .to(s, { spread: 1, duration: I.expand, ease: 'expo.out' }, '<');
  return tl;
}

/** Completa la intro al instante (si el usuario interactúa a mitad): nunca deja tarjetas en estados intermedios. */
function interrupt() {
  introTl?.progress(1, false);
}

function show({ instant = false } = {}) {
  shown = true;
  gsap.killTweensOf(layer);
  gsap.to(layer, { autoAlpha: 1, duration: instant ? 0 : C.layerFade, overwrite: true });
  wake();
}

function hide({ instant = false } = {}) {
  shown = false;
  unhover();
  // Si la intro iba a medias, se descarta: al volver se reproduce completa.
  if (introTl) {
    introTl.kill();
    introTl = null;
    played = false;
    settled = false;
    gsap.set(lis(), { autoAlpha: 0 });
    s.r = 0;
    s.spread = 1;
    place(0);
  }
  gsap.killTweensOf(layer);
  gsap.to(layer, { autoAlpha: 0, duration: instant ? 0 : C.layerFade, overwrite: true, onComplete: () => !shown && suspend() });
  if (instant) suspend();
}

// Toda la API pasa por `detached`: se llama desde callbacks de ScrollTrigger de la vista y sus tweens no deben
// registrarse en el contexto de esa vista (ctx.revert() al desmontar los deshacería). Ver components/persistent.js.
export const ring = {
  /** Elemento del anillo (lo usa el scroll del hero para desvanecerlo al final). */
  get el() {
    return listEl;
  },

  /** Estado inicial de una visita nueva al home: oculto y con la intro pendiente. */
  reset: detached(function reset() {
    introTl?.kill();
    introTl = null;
    unhover();
    played = false;
    settled = false;
    s.r = 0;
    s.spread = 1;
    s.spin = 1;
    gsap.set(lis(), { autoAlpha: 0 });
    gsap.set(listEl, { autoAlpha: 1 });
    place(0);
    hide({ instant: true });
  }),

  /** La ventana terminó de abrirse: muestra la capa y, si toca, reproduce la intro completa. */
  reveal: detached(function reveal() {
    show();
    if (played) return;
    played = true; // evita lanzarla dos veces mientras se decodifican las imágenes
    prime().then(() => {
      if (shown) playIntro();
      else played = false;
    });
  }),

  conceal: detached(function conceal(opts) {
    hide(opts);
  }),

  prime,
  playIntro: detached(playIntro),
  interrupt,
  pause: detached(() => void gsap.to(s, { spin: 0, duration: 0.4, overwrite: 'auto' })),
  resume: detached(() => void gsap.to(s, { spin: 1, duration: 0.4, overwrite: 'auto' })),
  refreshLabels,
  /** Para pruebas. */
  debug: () => ({ r: s.r, rot: s.rot, spread: s.spread, spin: s.spin, vel: vel.v, shown, played, settled, running, hover: hoverCard?.project.slug ?? null, ms: cards.map((c) => +c.m.toFixed(3)) })
};

export function initRing(container) {
  if (!container || cards.length) return;
  layer = container;
  listEl = document.createElement('ul');
  listEl.className = 'ring';
  layer.append(listEl);

  const rnd = mulberry32(C.seed);
  cards = projects.map((p) => {
    const li = document.createElement('li');
    li.className = 'ring-card';
    li.style.setProperty('--ratio', String(p.coverRatio));
    gsap.set(li, { xPercent: -50, yPercent: -50 });
    li.innerHTML = `<a href="/projects/${p.slug}" data-cursor="label" data-cursor-label="[ ${p.title} ]"><img alt="" decoding="async"></a>`;
    listEl.append(li);
    return {
      li,
      a: li.firstElementChild,
      img: li.querySelector('img'),
      project: p,
      jitter: (rnd() * 2 - 1) * C.jitter,
      rJit: 1 + (rnd() * 2 - 1) * C.radialJitter,
      depth: lerp(C.depth, rnd()),
      amp: lerp(C.floatAmp, rnd()),
      speed: lerp(C.floatSpeed, rnd()),
      seed: rnd() * TAU,
      phase: 0,
      m: 1,
      setX: gsap.quickSetter(li, 'x', 'px'),
      setY: gsap.quickSetter(li, 'y', 'px'),
      // OJO: quickSetter(el, 'scale') no escribe nada en GSAP 3.15 (su setter está pensado para tweens); scaleX/scaleY sí.
      ...scaleSetter(li)
    };
  });

  gsap.set(layer, { autoAlpha: 0 });
  gsap.set(lis(), { autoAlpha: 0 });
  velTo = gsap.quickTo(vel, 'v', { duration: C.velSmooth, ease: 'power2' });
  applyLayout();
  refreshLabels();

  // Hover y foco por teclado (solo ratón; en táctil no hay hover)
  listEl.addEventListener('pointerover', (e) => e.pointerType === 'mouse' && hasFinePointer() && cardOf(e.target) && hover(cardOf(e.target)));
  listEl.addEventListener('pointerout', (e) => {
    if (e.pointerType !== 'mouse') return;
    const to = cardOf(e.relatedTarget);
    if (to) hover(to);
    else unhover();
  });
  listEl.addEventListener('focusin', (e) => cardOf(e.target) && hover(cardOf(e.target)));
  listEl.addEventListener('focusout', (e) => !cardOf(e.relatedTarget) && unhover());

  // Cualquier click o tecla completa la intro en curso.
  window.addEventListener('pointerdown', interrupt, { capture: true, passive: true });
  window.addEventListener('keydown', interrupt, { capture: true, passive: true });

  let raf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(applyLayout);
  });

  onLangChange(refreshLabels);
  onMotionChange(() => {
    if (prefersReducedMotion()) suspend();
    else if (shown) wake();
    place(0);
  });

  if (import.meta.env.DEV) {
    // No devuelve la timeline: es thenable y `await window.__replayRing()` esperaría a que terminara.
    window.__replayRing = () => {
      show();
      prime().then(() => void playIntro());
    };
  }
}
