import gsap from 'gsap';
import { prefersReducedMotion } from '../motion.js';

export const VIEW_CONFIG = {
  leave: { duration: 0.35, ease: 'power2.out' },
  enter: { duration: 0.6, y: 16, ease: 'power3.out' },
  // Cambio de idioma: fade corto, sin desplazamiento
  lang: { leave: 0.2, enter: 0.35 },
  // prefers-reduced-motion: crossfade simple
  reduced: { duration: 0.3 }
};

/** Nombre de "destino" que el router pasa a leave()/enter() cuando solo cambia el idioma. */
export const LANG_SWAP = 'lang';

/** @param {Element} el @param {string} to */
export function fadeLeave(el, to) {
  const { leave, lang, reduced } = VIEW_CONFIG;
  const duration = prefersReducedMotion() ? reduced.duration : to === LANG_SWAP ? lang.leave : leave.duration;
  return gsap.to(el, { autoAlpha: 0, duration, ease: leave.ease });
}

/** @param {Element} el @param {string | null} from */
export function fadeEnter(el, from) {
  const { enter, lang, reduced } = VIEW_CONFIG;
  const calm = prefersReducedMotion() || from === LANG_SWAP;
  const duration = prefersReducedMotion() ? reduced.duration : from === LANG_SWAP ? lang.enter : enter.duration;
  return gsap.fromTo(
    el,
    { autoAlpha: 0, y: calm ? 0 : enter.y },
    { autoAlpha: 1, y: 0, duration, ease: enter.ease, clearProps: 'transform,opacity,visibility' }
  );
}

/**
 * Fábrica de vistas con el contrato { mount, unmount, enter, leave }.
 * Las animaciones de la vista se crean dentro de un gsap.context() y se limpian con ctx.revert() en unmount().
 *
 * @param {object} opts
 * @param {string} opts.name
 * @param {(params: Record<string, string>) => string} opts.render  HTML de la vista (debe incluir un único h1)
 * @param {(params: Record<string, string>) => string} [opts.title] título del documento (sin sufijo)
 * @param {(el: HTMLElement, params: Record<string, string>) => void} [opts.setup]  animaciones/listeners dentro del contexto
 */
export function makeView({ name, render, title, setup }) {
  /** @type {gsap.Context | null} */
  let ctx = null;
  /** @type {HTMLElement | null} */
  let el = null;

  return {
    name,
    getTitle: (params) => title?.(params) ?? '',

    /** @param {{ root: HTMLElement }} rc @param {Record<string, string>} params */
    mount(rc, params) {
      el = document.createElement('section');
      el.className = `view view-${name}`;
      el.innerHTML = render(params);
      rc.root.append(el);
      ctx = gsap.context(() => setup?.(el, params), el);
      return el;
    },

    unmount() {
      ctx?.revert();
      el?.remove();
      ctx = null;
      el = null;
    },

    /** @param {string | null} from nombre de la ruta anterior (o LANG_SWAP) */
    enter(from) {
      let tl;
      ctx.add(() => {
        tl = fadeEnter(el, from);
      });
      return tl;
    },

    /** @param {string} to nombre de la ruta siguiente (o LANG_SWAP) */
    leave(to) {
      let tl;
      ctx.add(() => {
        tl = fadeLeave(el, to);
      });
      return tl;
    }
  };
}
