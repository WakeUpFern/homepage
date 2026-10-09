const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointerMq = window.matchMedia('(pointer: fine) and (hover: hover)');

export const prefersReducedMotion = () => reducedMq.matches;
export const hasFinePointer = () => finePointerMq.matches;

/** @param {() => void} cb @returns {() => void} función para desuscribirse */
export function onMotionChange(cb) {
  reducedMq.addEventListener('change', cb);
  return () => reducedMq.removeEventListener('change', cb);
}
