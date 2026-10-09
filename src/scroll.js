import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LENIS_CONFIG } from './config.js';
import { prefersReducedMotion, onMotionChange } from './motion.js';

/** @type {Lenis | null} */
let lenis = null;
const listeners = new Set();

const currentLerp = () => (prefersReducedMotion() ? 1 : LENIS_CONFIG.lerp);

/** Crea Lenis y lo sincroniza con el ticker de GSAP y ScrollTrigger. */
export function initScroll() {
  history.scrollRestoration = 'manual';

  lenis = new Lenis({ ...LENIS_CONFIG, lerp: currentLerp() });
  lenis.on('scroll', ScrollTrigger.update);
  lenis.on('scroll', (l) => listeners.forEach((cb) => cb(l)));
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // prefers-reduced-motion: sin suavizado (lerp 1), también si cambia en caliente.
  onMotionChange(() => {
    lenis.options.lerp = currentLerp();
  });

  return lenis;
}

export const getLenis = () => lenis;
export const stop = () => lenis?.stop();
export const start = () => lenis?.start();

/** @param {Parameters<Lenis['scrollTo']>[0]} target @param {Parameters<Lenis['scrollTo']>[1]} [opts] */
export const scrollTo = (target, opts) => lenis?.scrollTo(target, opts);

/** @param {(l: Lenis) => void} cb @returns {() => void} */
export function onScroll(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export const getVelocity = () => lenis?.velocity ?? 0;
