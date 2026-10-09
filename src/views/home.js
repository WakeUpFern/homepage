import { HOME_SCROLL } from '../config.js';
import { t } from '../i18n.js';
import { prefersReducedMotion } from '../motion.js';
import { createHero } from '../components/hero.js';
import { makeView } from './view-utils.js';

const PHOTOS = ['/assets/hero/hero-1.webp', '/assets/hero/hero-2.webp', '/assets/hero/hero-3.webp'];

// Garabato dibujado a mano: trazos en zigzag. Se anima con DrawSVGPlugin.
const SCRIBBLE_PATH =
  'M10 150 C70 110 150 50 250 12 C200 60 130 120 60 196 C150 140 260 70 360 24 C310 80 240 140 190 204 C260 160 340 100 412 60';

// FASE 3: la ventana se abre con el scroll (components/hero.js). El trail (4) y el anillo (5) llegan después.
const words = (text) =>
  text
    .split(' ')
    .map((w) => `<span class="word-mask"><span class="word">${w}</span></span>`)
    .join(' ');

export default makeView({
  name: 'home',
  title: () => '',
  // El recorrido de scroll va en el HTML desde el montaje: si el documento fuera más corto aunque sea un instante
  // (p. ej. al remontar por cambio de idioma), el navegador recortaría el scroll a 0 y se perdería la posición.
  render: () => `
    <div class="hero-wrap"${prefersReducedMotion() ? '' : ` style="--hero-runway: calc(${HOME_SCROLL.open + HOME_SCROLL.statement} * 1svh)"`}>
      <div class="hero-stage">
        <div class="window-layer">
          <div class="window-photos">
            ${PHOTOS.map(
              (src, i) =>
                `<img class="window-photo" src="${src}" alt="" decoding="async" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}>`
            ).join('')}
          </div>
        </div>
        <div class="hero-content">
          <h1 class="hero-title">
            <span class="line-wrap line-wrap--scribble">
              <span class="line"><span class="line-inner">${t('hero.line1')}</span></span>
              <svg class="scribble" viewBox="0 0 420 220" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                <path d="${SCRIBBLE_PATH}"/>
              </svg>
            </span>
            <span class="line-wrap">
              <span class="line"><span class="line-inner">${t('hero.line2')}</span></span>
            </span>
          </h1>
          <div class="capsule-ghost" aria-hidden="true"></div>
          <p class="hero-about">${t('hero.about')}</p>
          <div class="scroll-hint mono" aria-hidden="true">
            <span class="scroll-hint__icon">
              <svg width="14" height="22" viewBox="0 0 14 22" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="1" y="1" width="12" height="20" rx="6"/><path d="M7 5v4" stroke-linecap="round"/>
              </svg>
            </span>
            <span>${t('hero.scroll')}</span>
          </div>
        </div>
        <h2 class="statement">${words(t('hero.statement'))}</h2>
        <div class="hero-actions" hidden>
          <button class="hero-open mono" type="button" aria-expanded="false">[ ${t('hero.openProjects')} ]</button>
        </div>
      </div>
    </div>`,
  setup: (el, params, rc) => createHero(el, rc)
});
