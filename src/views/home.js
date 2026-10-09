import { t } from '../i18n.js';
import { createHero } from '../components/hero.js';
import { makeView } from './view-utils.js';

const PHOTOS = ['/assets/hero/hero-1.webp', '/assets/hero/hero-2.webp', '/assets/hero/hero-3.webp'];

// Garabato dibujado a mano: trazos en zigzag. Se anima con DrawSVGPlugin.
const SCRIBBLE_PATH =
  'M10 150 C70 110 150 50 250 12 C200 60 130 120 60 196 C150 140 260 70 360 24 C310 80 240 140 190 204 C260 160 340 100 412 60';

// FASE 2: hero y entrada. La ventana al hacer scroll (fase 3), el trail (4) y el anillo (5) llegan después.
export default makeView({
  name: 'home',
  title: () => '',
  render: () => `
    <div class="hero-wrap">
      <div class="hero-stage">
        <div class="window-layer">
          ${PHOTOS.map(
            (src, i) =>
              `<img class="window-photo" src="${src}" alt="" decoding="async" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}>`
          ).join('')}
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
        </div>
        <div class="scroll-hint mono" aria-hidden="true">
          <span class="scroll-hint__icon">
            <svg width="14" height="22" viewBox="0 0 14 22" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="1" y="1" width="12" height="20" rx="6"/><path d="M7 5v4" stroke-linecap="round"/>
            </svg>
          </span>
          <span>${t('hero.scroll')}</span>
        </div>
      </div>
    </div>`,
  setup: (el, params, rc) => createHero(el, rc)
});
