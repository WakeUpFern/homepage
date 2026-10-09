import gsap from 'gsap';
import { TRAIL_CONFIG } from '../config.js';
import { hasFinePointer, prefersReducedMotion, onMotionChange } from '../motion.js';

/**
 * Trail del mouse: pool fijo de <img> reutilizados en ciclo (no se crean ni destruyen nodos en runtime).
 *
 * Está activo solo si se cumplen dos condiciones independientes:
 *   - armado:   el hero terminó su entrada (lo decide la vista con `trail.setArmed`)
 *   - en rango: el scroll está dentro de TRAIL_CONFIG.activeRange (lo decide un ScrollTrigger del hero con `trail.setInRange`)
 * Además exige puntero fino y sin prefers-reduced-motion. Solo reacciona a `pointerType === 'mouse'`.
 */

const START_Z = 10;

/** @type {HTMLImageElement[]} */
let pool = [];
/** Imágenes con animación en curso, de más antigua a más reciente (Set conserva el orden de inserción). */
const active = new Set();
let next = 0;
let z = START_Z;
let last = null; // posición del último spawn
let armed = false;
let inRange = true;
let listening = false;
/** @type {Promise<void> | null} */
let ready = null;

const clamp = (min, v, max) => Math.max(min, Math.min(v, max));
const minDist = () => {
  const { min, vw, max } = TRAIL_CONFIG.minDist;
  return clamp(min, innerWidth * vw, max);
};

const canRun = () => hasFinePointer() && !prefersReducedMotion() && TRAIL_CONFIG.size > 0;

/** Crea el pool una sola vez. */
export function initTrail(container) {
  if (!container || pool.length) return;
  const urls = gsap.utils.shuffle([...TRAIL_CONFIG.images]).slice(0, TRAIL_CONFIG.pool);
  pool = urls.map((src) => {
    const img = new Image();
    img.src = src;
    img.alt = '';
    img.decoding = 'async';
    img.style.width = `${TRAIL_CONFIG.size}px`;
    container.append(img);
    return img;
  });
  gsap.set(pool, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
  // Si cambia a reduced-motion en caliente, se apaga.
  onMotionChange(sync);
}

/** Decodifica todas las imágenes antes de activar el trail (una sola vez). */
function preload() {
  ready ??= Promise.all(pool.map((img) => img.decode().catch(() => {}))).then(() => {});
  return ready;
}

function release(img) {
  active.delete(img);
  img.style.willChange = '';
}

function quickFade(img) {
  gsap.killTweensOf(img);
  gsap.to(img, { autoAlpha: 0, duration: TRAIL_CONFIG.quickFade, ease: 'power1.out', overwrite: true, onComplete: () => release(img) });
}

/** @param {number} x @param {number} y */
function spawn(x, y) {
  const c = TRAIL_CONFIG;
  // Si hay demasiadas a la vez, la más antigua desaparece de golpe.
  if (active.size >= c.maxActive) quickFade(active.values().next().value);

  const img = pool[next];
  next = (next + 1) % pool.length;
  if (active.has(img)) release(img); // con pool > maxActive no debería ocurrir

  gsap.killTweensOf(img);
  img.style.willChange = 'transform, opacity';
  active.add(img);

  gsap
    .timeline({ onComplete: () => release(img) })
    .set(img, { x, y, rotation: gsap.utils.random(-c.rotationRange, c.rotationRange), scale: c.startScale, autoAlpha: 1, zIndex: ++z })
    .to(img, { scale: 1, duration: c.popDuration, ease: c.popEase })
    .to(img, { autoAlpha: 0, scale: c.endScale, y: `+=${c.drift}`, duration: c.fadeDuration, ease: c.fadeEase }, `+=${c.hold}`);
}

/** @param {PointerEvent} e */
function onMove(e) {
  if (e.pointerType !== 'mouse') return;
  if (last && Math.hypot(e.clientX - last.x, e.clientY - last.y) < minDist()) return;
  last = { x: e.clientX, y: e.clientY };
  spawn(e.clientX, e.clientY);
}

function attach() {
  if (listening) return;
  listening = true;
  last = null;
  window.addEventListener('pointermove', onMove, { passive: true });
}

function detach() {
  if (!listening) return;
  listening = false;
  window.removeEventListener('pointermove', onMove);
  // Termina las animaciones activas con un fade rápido.
  [...active].forEach(quickFade);
}

/** Reconcilia el estado deseado (armado + en rango + dispositivo) con los listeners. */
function sync() {
  if (armed && inRange && canRun()) {
    preload().then(() => armed && inRange && canRun() && attach());
  } else {
    detach();
  }
}

export const trail = {
  /** La vista lo activa cuando termina la entrada del hero y lo desactiva al desmontarse. */
  setArmed(value) {
    armed = value;
    sync();
  },
  /** Lo gobierna el ScrollTrigger del hero. */
  setInRange(value) {
    inRange = value;
    sync();
  }
};
