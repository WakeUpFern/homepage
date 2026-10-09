import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { CONTACT_EMAIL } from '../config.js';
import { t, getLang, setLang, onLangChange } from '../i18n.js';
import { onRouteChange } from '../router.js';
import { prefersReducedMotion } from '../motion.js';

const HEADER_CONFIG = {
  hover: { yPercent: 22, duration: 0.18, ease: 'power2.out', stagger: 0.02 } // cada letra baja y sube
};

/** Qué link del nav queda activo según el nombre de ruta. */
const ACTIVE_LINK = { home: 'home', projects: 'projects', project: 'projects', about: 'about' };

/** @type {HTMLElement} */
let el;
/** @type {gsap.Context | null} */
let ctx = null;
let activeRoute = null;

function template() {
  const lang = getLang();
  const other = lang === 'es' ? 'en' : 'es';
  const link = (key, href, n) =>
    `<li><a class="nav-link" href="${href}" data-link="${key}"><span class="split">${t(`nav.${key}`)}</span><sup aria-hidden="true">${n}</sup></a></li>`;

  return `
    <div class="header__left" data-slot="left"></div>
    <nav class="header__center" aria-label="${t('a11y.mainNav')}">
      <a class="header__name" href="/" aria-label="wakeupfern, ${t('a11y.viewHome')}"><span class="split">wakeupfern</span></a>
      <ul class="header__links">
        ${link('home', '/', 1)}
        ${link('projects', '/projects', 2)}
        ${link('about', '/about', 3)}
      </ul>
    </nav>
    <div class="header__right">
      <a class="mono hover-link" href="mailto:${CONTACT_EMAIL}"><span class="split">[ ${t('nav.contact')} ]</span></a>
      <button class="mono hover-link lang-toggle" type="button" aria-label="${t('nav.langSwitch')}" data-lang="${other}">
        [ <span class="${lang === 'es' ? 'is-on' : ''}">es</span> / <span class="${lang === 'en' ? 'is-on' : ''}">en</span> ]
      </button>
    </div>`;
}

function setActive(route) {
  activeRoute = route;
  const key = route ? ACTIVE_LINK[route.route.name] : null;
  el.querySelectorAll('.nav-link').forEach((a) => {
    if (a.dataset.link === key) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

function render() {
  const hadFocus = document.activeElement?.classList.contains('lang-toggle');
  ctx?.revert();
  el.innerHTML = template();

  ctx = gsap.context(() => {
    // Hover: cada letra baja y sube (solo ratón, sin reduced-motion).
    el.querySelectorAll('.header__name, .nav-link, .hover-link').forEach((link) => {
      const target = link.querySelector('.split');
      if (!target) return;
      const { chars } = SplitText.create(target, { type: 'chars' });
      const { hover } = HEADER_CONFIG;
      link.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse' || prefersReducedMotion()) return;
        gsap.killTweensOf(chars);
        gsap.set(chars, { yPercent: 0 });
        gsap.to(chars, { yPercent: hover.yPercent, duration: hover.duration, ease: hover.ease, yoyo: true, repeat: 1, stagger: hover.stagger });
      });
    });
  }, el);

  el.querySelector('.lang-toggle').addEventListener('click', (e) => setLang(e.currentTarget.dataset.lang));
  setActive(activeRoute);
  if (hadFocus) el.querySelector('.lang-toggle').focus();
}

/** @param {HTMLElement} element */
export function initHeader(element) {
  el = element;
  render();
  onRouteChange(setActive);
  onLangChange(render);
}
