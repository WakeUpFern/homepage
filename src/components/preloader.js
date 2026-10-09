import gsap from 'gsap';
import { t } from '../i18n.js';
import { prefersReducedMotion } from '../motion.js';

const PRELOADER_CONFIG = {
  storageKey: 'preloaded',
  count: { duration: 1.2, ease: 'power2.inOut' },
  // heroLead: segundos tras empezar la salida en que se libera la animación del hero
  exit: { yPercent: -100, duration: 0.7, ease: 'expo.inOut', heroLead: 0.25 }
};

function alreadySeen() {
  try {
    return sessionStorage.getItem(PRELOADER_CONFIG.storageKey) === '1';
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(PRELOADER_CONFIG.storageKey, '1');
  } catch {
    /* sin sessionStorage: el preloader volverá a salir al recargar */
  }
}

/**
 * Preloader mínimo: contador 0→100 y cortina que sube. Solo en la primera visita de la sesión
 * y sin prefers-reduced-motion. Mientras está activo, #app queda `inert` (el botón skip es lo único enfocable).
 *
 * @param {{ app: HTMLElement }} opts
 * @returns {Promise<void>} se resuelve cuando el hero puede empezar su entrada
 */
export function runPreloader({ app }) {
  if (prefersReducedMotion() || alreadySeen()) return Promise.resolve();
  markSeen();

  const el = document.createElement('div');
  el.className = 'preloader';
  el.innerHTML = `
    <span class="preloader__count" aria-hidden="true">000</span>
    <button class="preloader__skip mono" type="button">[ ${t('preloader.skip')} ]</button>`;
  document.body.append(el);
  app.inert = true;
  const count = el.querySelector('.preloader__count');
  const skip = el.querySelector('.preloader__skip');
  skip.focus({ preventScroll: true });

  return new Promise((resolve) => {
    const { count: cfg, exit: out } = PRELOADER_CONFIG;
    let exiting = false;

    const ctx = gsap.context(() => {
      const state = { n: 0 };

      const leave = () => {
        if (exiting) return;
        exiting = true;
        skip.disabled = true;
        gsap.to(el, {
          yPercent: out.yPercent,
          duration: out.duration,
          ease: out.ease,
          onComplete: () => {
            app.inert = false;
            ctx.revert();
            el.remove();
          }
        });
        gsap.delayedCall(out.heroLead, resolve);
      };

      const counter = gsap.to(state, {
        n: 100,
        duration: cfg.duration,
        ease: cfg.ease,
        onUpdate: () => {
          count.textContent = String(Math.round(state.n)).padStart(3, '0');
        },
        onComplete: leave
      });

      // Skip: salta al final del contador y deja que la cortina suba con normalidad.
      skip.addEventListener('click', () => counter.progress(1));
    }, el);
  });
}
