/**
 * Constantes de animación ajustables. Ningún módulo debe tener números mágicos:
 * si una duración, easing, radio o umbral se afina, vive aquí o en un objeto
 * de configuración al inicio del módulo.
 */

/** Distancias de scroll del home, en vh. El alto de .hero-wrap = 100vh (stage) + suma. */
export const HOME_SCROLL = {
  open: 150,      // la ventana pasa de cápsula a pantalla completa (scrub)
  statement: 100, // statement + intro del anillo (por tiempo, no por scrub)
  ring: 150       // (aún sin usar; la fase 5 lo añade) el anillo gira con el scroll; al final se desvanece y aparece el footer
};

export const RING_CONFIG = {
  radius: () => Math.min(innerWidth, innerHeight) * 0.34,
  ellipse: 1.15,             // rx = r * ellipse, ry = r
  floatAmp: [6, 12],         // px de flotación por tarjeta (aleatorio por tarjeta)
  floatSpeed: [0.15, 0.35],  // ciclos/seg por tarjeta
  idleSpin: 0.0006,          // rad/frame de giro lento
  scrollSpin: 0.0004,        // rad por unidad de velocidad de Lenis
  jitter: 0.18,              // variación de ángulo por tarjeta (rad)
  radialJitter: 0.12,        // variación del radio por tarjeta (±12%)
  depth: [0.85, 1.1],        // escala por tarjeta según su "profundidad"
  intro: { fly: 1.4, hold: 0.8, gather: 0.9, expand: 1.3 }
};

export const TRAIL_CONFIG = {
  size: 220,            // ancho px en desktop
  sizeMobile: 0,        // 0 = desactivado en táctil
  minDist: 90,          // distancia mínima entre apariciones (px); escalar: clamp(70, innerWidth*0.08, 120)
  popDuration: 0.45,
  popEase: 'back.out(1.7)',
  hold: 0.5,
  fadeDuration: 0.55,
  fadeEase: 'power2.in',
  rotationRange: 10,    // grados +/-
  startScale: 0.6,
  endScale: 0.85,
  drift: -24,           // px hacia arriba al desaparecer
  maxActive: 8,
  pool: 12
};

/** Pull-to-continue (vista de proyecto -> anillo). */
export const PULL_CONFIG = {
  wheelDivisor: 1400,
  touchDivisor: 600,
  keyStep: 0.25,
  idleReset: 450,        // ms sin input antes de decaer a 0
  decayDuration: 0.4,
  ignoreAfterComplete: 600 // ms que se ignora wheel tras completar (inercia de trackpad)
};

/** Smooth scroll. */
export const LENIS_CONFIG = {
  lerp: 0.09,
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 1.2
};

export const LANGS = ['es', 'en'];
export const DEFAULT_LANG = 'es';

/** TODO(yo): correo real para el botón [ contact ] del header. */
export const CONTACT_EMAIL = 'tu-correo@example.com';

/** Recursos críticos que deben estar listos antes de la primera animación de entrada. */
export const PRELOAD_ASSETS = ['/assets/hero/hero-1.webp'];
export const PRELOAD_FONTS = ['900 1em "Archivo Variable"', '1em "Inter Tight Variable"', '1em "JetBrains Mono Variable"'];
