import gsap from 'gsap';
import { t } from '../i18n.js';
import { hasFinePointer } from '../motion.js';

const CURSOR_CONFIG = {
  dot: 10,                                      // px, debe coincidir con --cursor-dot en base.css
  follow: { duration: 0.35, ease: 'power3' },   // quickTo de x/y
  scale: { duration: 0.35, ease: 'power3.out' },
  labelFade: 0.2,
  // Escala del punto por estado. view = círculo de 72px; label = sin punto, solo texto.
  states: { default: 1, link: 2.2, view: 72 / 10, label: 0 },
  interactive: 'a, button, [role="button"], summary',
  hideOn: 'input, textarea, select'
};

/**
 * Cursor custom: un punto y una etiqueta (elementos separados para que cada uno haga
 * mix-blend-mode: difference contra la página). Solo con puntero fino.
 * Estados: default | link | view | label | hidden. Se controlan por delegación con
 * `data-cursor="view|label|hidden"` y `data-cursor-label="texto"` en el elemento.
 */
export function initCursor() {
  const dot = document.getElementById('cursor-dot');
  const label = document.getElementById('cursor-label');
  if (!dot || !label || !hasFinePointer()) return null;

  document.documentElement.classList.add('has-custom-cursor');

  let state = 'default';
  let text = '';
  let visible = false;

  const ctx = gsap.context(() => {
    gsap.set([dot, label], { xPercent: -50, yPercent: -50, autoAlpha: 0 });
    gsap.set(dot, { scale: CURSOR_CONFIG.states.default });

    const { follow } = CURSOR_CONFIG;
    const qx = [dot, label].map((n) => gsap.quickTo(n, 'x', follow));
    const qy = [dot, label].map((n) => gsap.quickTo(n, 'y', follow));

    function setVisible(show) {
      if (visible === show) return;
      visible = show;
      gsap.to(dot, { autoAlpha: show && state !== 'hidden' && state !== 'label' ? 1 : 0, duration: 0.2, overwrite: 'auto' });
      gsap.to(label, { autoAlpha: show && text ? 1 : 0, duration: 0.2, overwrite: 'auto' });
    }

    function setState(next, nextText = '') {
      if (next === state && nextText === text) return;
      state = next;
      text = nextText;
      label.textContent = text;
      const showDot = visible && next !== 'hidden' && next !== 'label';
      gsap.to(dot, {
        scale: CURSOR_CONFIG.states[next] ?? 1,
        autoAlpha: showDot ? 1 : 0,
        duration: CURSOR_CONFIG.scale.duration,
        ease: CURSOR_CONFIG.scale.ease,
        overwrite: 'auto'
      });
      gsap.to(label, { autoAlpha: visible && text ? 1 : 0, duration: CURSOR_CONFIG.labelFade, overwrite: 'auto' });
    }

    function resolve(target) {
      if (!(target instanceof Element)) return ['default', ''];
      if (target.closest(CURSOR_CONFIG.hideOn)) return ['hidden', ''];
      const marked = target.closest('[data-cursor]');
      if (marked) {
        const kind = marked.dataset.cursor;
        if (kind === 'view') return ['view', marked.dataset.cursorLabel ?? t('cursor.view')];
        if (kind === 'label') return ['label', marked.dataset.cursorLabel ?? ''];
        if (kind === 'hidden') return ['hidden', ''];
      }
      if (target.closest(CURSOR_CONFIG.interactive)) return ['link', ''];
      return ['default', ''];
    }

    let firstMove = true;
    document.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (firstMove) {
        // Primera posición sin interpolar desde (0,0)
        gsap.set([dot, label], { x: e.clientX, y: e.clientY });
        firstMove = false;
      }
      qx.forEach((q) => q(e.clientX));
      qy.forEach((q) => q(e.clientY));
      setVisible(true);
    });

    document.addEventListener('pointerover', (e) => {
      if (e.pointerType !== 'mouse') return;
      setState(...resolve(e.target));
    });

    // Solo se oculta al salir; reaparece con el siguiente pointermove (así nunca se ve en (0,0) antes de moverse).
    document.documentElement.addEventListener('mouseleave', () => setVisible(false));
  });

  return ctx;
}
