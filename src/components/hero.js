import gsap from 'gsap';
import { prefersReducedMotion } from '../motion.js';
import { fadeEnter } from '../views/view-utils.js';

const HERO_CONFIG = {
  photoScale: 1.35, // zoom inicial de la foto de la ventana (la fase 3 lo lleva a 1 con el scroll)
  intro: {
    ease: 'expo.out',
    title: { yPercent: 110, duration: 1.0, stagger: 0.08 },
    capsule: { duration: 1.1, offset: '-=0.6' },
    scribble: { duration: 0.9, ease: 'power2.inOut', offset: '-=0.4' },
    texts: { y: 16, duration: 0.8, stagger: 0.12, offset: '-=0.5' },
    header: { duration: 0.7, offset: '-=0.3' }
  },
  hint: { y: 6, duration: 1.2, ease: 'sine.inOut' } // flotación del ícono de scroll
};

/**
 * Hero del home: titular, garabato, cápsula-ventana, párrafo e indicador de scroll.
 * Debe llamarse dentro del gsap.context() de la vista (makeView lo hace en setup).
 *
 * La "ventana" no es un elemento: es un clip-path sobre `.window-layer` ajustado al rectángulo de
 * `.capsule-ghost`, un div invisible que solo sirve para medir.
 *
 * @param {HTMLElement} el sección de la vista
 * @param {{ mode: 'first' | 'nav' | 'lang' }} rc
 * @returns {import('../views/view-utils.js').ViewHooks}
 */
export function createHero(el, { mode }) {
  const $ = (sel) => el.querySelector(sel);
  const stage = $('.hero-stage');
  const layer = $('.window-layer');
  const photos = el.querySelectorAll('.window-photo');
  const ghost = $('.capsule-ghost');
  const lines = el.querySelectorAll('.line-inner');
  const scribble = $('.scribble path');
  const about = $('.hero-about');
  const hint = $('.scroll-hint');
  const hintIcon = $('.scroll-hint__icon');
  const header = document.getElementById('header');

  const first = mode === 'first';
  let introDone = false;

  /** Rectángulo de la cápsula relativo al stage, como inset() con esquinas totalmente redondeadas. */
  function rect() {
    const s = stage.getBoundingClientRect();
    const g = ghost.getBoundingClientRect();
    return { top: g.top - s.top, left: g.left - s.left, right: g.right - s.left, bottom: g.bottom - s.top, w: s.width, h: s.height };
  }
  const inset = (top, right, bottom, left) => `inset(${top}px ${right}px ${bottom}px ${left}px round 999px)`;

  function capsuleInset() {
    const r = rect();
    return inset(r.top, r.w - r.right, r.h - r.bottom, r.left);
  }

  /** La cápsula colapsada en su centro: mismo formato en px que el destino, así GSAP interpola sin mezclar unidades. */
  function centerInset() {
    const r = rect();
    const cx = (r.left + r.right) / 2;
    const cy = (r.top + r.bottom) / 2;
    return inset(cy, r.w - cx, r.h - cy, cx);
  }

  // Si cambia el tamaño de la ventana, la cápsula debe seguir al fantasma.
  let raf = 0;
  const onResize = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => introDone && gsap.set(layer, { clipPath: capsuleInset() }));
  };
  window.addEventListener('resize', onResize);

  const destroy = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
  };

  gsap.set(photos, { scale: HERO_CONFIG.photoScale });

  // Remonte por cambio de idioma o reduced-motion: estado final, sin secuencia de entrada.
  if (mode === 'lang' || prefersReducedMotion()) {
    gsap.set(layer, { clipPath: capsuleInset() });
    introDone = true;
    el.dataset.intro = 'done';
    if (!prefersReducedMotion()) {
      gsap.to(hintIcon, { y: HERO_CONFIG.hint.y, duration: HERO_CONFIG.hint.duration, ease: HERO_CONFIG.hint.ease, yoyo: true, repeat: -1 });
    }
    return { enter: (from) => fadeEnter(el, from), destroy };
  }

  // Estado inicial oculto (se fija al montar, para que nada se vea mientras corre el preloader).
  gsap.set(lines, { yPercent: HERO_CONFIG.intro.title.yPercent });
  gsap.set(layer, { clipPath: centerInset() });
  gsap.set(scribble, { drawSVG: '0%' });
  gsap.set([about, hint], { autoAlpha: 0, y: HERO_CONFIG.intro.texts.y });
  if (first) gsap.set(header, { yPercent: -100 });

  gsap.to(hintIcon, { y: HERO_CONFIG.hint.y, duration: HERO_CONFIG.hint.duration, ease: HERO_CONFIG.hint.ease, yoyo: true, repeat: -1 });

  function enter() {
    const c = HERO_CONFIG.intro;
    const tl = gsap.timeline({
      defaults: { ease: c.ease },
      onComplete: () => {
        introDone = true;
        el.dataset.intro = 'done';
        // La fase 4 activa aquí el trail del mouse.
        document.dispatchEvent(new CustomEvent('hero:intro-complete'));
      }
    });

    tl.to(lines, { yPercent: 0, duration: c.title.duration, stagger: c.title.stagger })
      .fromTo(layer, { clipPath: () => centerInset() }, { clipPath: () => capsuleInset(), duration: c.capsule.duration }, c.capsule.offset)
      .to(scribble, { drawSVG: '100%', duration: c.scribble.duration, ease: c.scribble.ease }, c.scribble.offset)
      .to([about, hint], { autoAlpha: 1, y: 0, duration: c.texts.duration, stagger: c.texts.stagger }, c.texts.offset);
    if (first) tl.to(header, { yPercent: 0, duration: c.header.duration }, c.header.offset);
    return tl;
  }

  return { enter, destroy };
}
