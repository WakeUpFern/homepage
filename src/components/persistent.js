import gsap from 'gsap';

const ctx = gsap.context(() => {});

/**
 * Envuelve una función para que corra SIN contexto activo de GSAP.
 *
 * Los callbacks de un ScrollTrigger (o de una animación) creado dentro de un gsap.context() se ejecutan dentro de
 * ese contexto: todo tween que creen queda registrado en él, y `ctx.revert()` (al desmontar la vista) lo DESHACE.
 * Para componentes persistentes (anillo, trail), cuyas capas sobreviven a las vistas, eso restablecería sus
 * elementos a un estado anterior. Toda API pública que pueda llamarse desde una vista debe pasar por aquí.
 *
 * @template {(...args: any[]) => any} F
 * @param {F} fn
 * @returns {F}
 */
export function detached(fn) {
  return /** @type {F} */ (
    (...args) => {
      let out;
      ctx.ignore(() => {
        out = fn(...args);
      });
      return out;
    }
  );
}
