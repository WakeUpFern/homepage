/**
 * Constantes de animación ajustables. Ningún módulo debe tener números mágicos:
 * si una duración, easing, radio o umbral se afina, vive aquí o en un objeto
 * de configuración al inicio del módulo.
 */

/** Distancias de scroll del home, en vh. El alto de .hero-wrap = 100vh (stage) + suma. */
export const HOME_SCROLL = {
  open: 150,      // la ventana pasa de cápsula a pantalla completa (scrub)
  statement: 100, // statement; al terminar de abrirse la ventana arranca la intro del anillo (por tiempo, no por scrub)
  ring: 150       // el anillo gira con el scroll; al final se desvanece y el documento termina en el footer
};

export const RING_CONFIG = {
  seed: 7,                   // semilla del PRNG: el anillo se ve igual en cada visita
  // Geometría por breakpoint. radius = radio vertical (ry); rx = radius * ellipse. cardH = [min px, fracción de innerHeight, max px]
  layout: {
    desktop: { radius: () => Math.min(innerWidth, innerHeight) * 0.34, ellipse: 1.15, cardH: [110, 0.16, 190] },
    tablet: { radius: () => Math.min(innerWidth, innerHeight) * 0.3, ellipse: 1.1, cardH: [96, 0.13, 150] },
    mobile: { radius: () => innerWidth * 0.5, ellipse: 0.58, cardH: [84, 0.12, 120], maxCards: 8 }
  },
  floatAmp: [6, 12],         // px de flotación por tarjeta (aleatorio por tarjeta)
  floatSpeed: [0.15, 0.35],  // ciclos/seg por tarjeta
  idleSpin: 0.0006,          // rad/frame (a 60fps) de giro lento
  scrollSpin: 0.0004,        // rad por unidad de velocidad de Lenis
  maxScrollVel: 90,          // tope de la velocidad de Lenis que se convierte en giro
  velSmooth: 0.3,            // s: suavizado de esa velocidad
  jitter: 0.18,              // variación de ángulo por tarjeta (rad)
  radialJitter: 0.12,        // variación del radio por tarjeta (±12%)
  depth: [0.85, 1.1],        // escala por tarjeta según su "profundidad"
  intro: {
    fly: 1.4, hold: 0.8, gather: 0.9, expand: 1.3,
    cardFade: 0.4, cardStagger: 0.05,            // aparición de las tarjetas mientras vuelan
    gatherRadius: 0.12, gatherSpread: 0.7,       // "se juntan": radio y escala relativos
    expandEase: 'back.out(1.2)'                  // ligero overshoot en el radio
  },
  introShort: { gather: 0.35, expand: 0.55 },    // versión corta (0.9 s) al volver de un proyecto
  hover: { scale: 1.12, scaleDuration: 0.35, ease: 'power3.out', dim: 0.35, fadeDuration: 0.3, spin: 0.15 }, // spin: fracción del giro mientras hay hover
  layerFade: 0.25            // s: mostrar/ocultar la capa
};

export const TRAIL_CONFIG = {
  size: 220,            // ancho px en desktop
  sizeMobile: 0,        // 0 = desactivado en táctil
  minDist: { min: 70, vw: 0.08, max: 120 }, // distancia mínima entre apariciones (px) = clamp(min, innerWidth * vw, max)
  popDuration: 0.45,
  popEase: 'back.out(1.7)',
  hold: 0.5,
  fadeDuration: 0.55,
  fadeEase: 'power2.in',
  rotationRange: 10,    // grados +/-
  startScale: 0.6,
  endScale: 0.85,
  drift: -24,           // px hacia arriba al desaparecer
  maxActive: 8,         // si hay más, la más antigua se desvanece de golpe
  pool: 12,
  activeRange: '+=40%', // el trail solo funciona durante este tramo de scroll del hero
  quickFade: 0.2,       // s: al desactivar, o al superar maxActive
  images: Array.from({ length: 12 }, (_, i) => `/assets/trail/trail-${String(i + 1).padStart(2, '0')}.webp`)
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
