import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HOME_SCROLL, TRAIL_CONFIG } from '../config.js';
import { t } from '../i18n.js';
import { prefersReducedMotion } from '../motion.js';
import { scrollTo } from '../scroll.js';
import { LANG_SWAP, fadeEnter, fadeLeave } from '../views/view-utils.js';
import { ring } from './ring.js';
import { trail } from './trail.js';

const HERO_CONFIG = {
  photoScale: 1.35, // zoom inicial de la foto de la ventana; el scroll lo lleva a 1
  intro: {
    ease: 'expo.out',
    title: { yPercent: 150, duration: 1.0, stagger: 0.08 }, // 150: con line-height < 1 las puntas de las letras asoman si se oculta con 110
    capsule: { duration: 1.1, offset: '-=0.6' },
    scribble: { duration: 0.9, ease: 'power2.inOut', offset: '-=0.4' },
    texts: { y: 16, duration: 0.8, stagger: 0.12, offset: '-=0.5' },
    header: { duration: 0.7, offset: '-=0.3' }
  },
  hint: { y: 6, duration: 1.2, ease: 'sine.inOut' }, // flotación del ícono de scroll
  // Scroll: la línea de tiempo se mide en unidades de vh (HOME_SCROLL). `at`/`span` son fracciones de `open`.
  scroll: {
    scrub: 0.6,
    openEase: 'power2.inOut',
    content: { yPercent: -12, span: 0.5 },                                  // titular + párrafo se van antes de que la ventana llene la pantalla
    crossfade: [{ at: 0.35, span: 0.15 }, { at: 0.7, span: 0.15 }],         // foto 2 y foto 3
    photoEnterScale: 1.08,
    statement: {
      yPercent: 150, span: 0.45, ease: 'power3.out', spread: 0.6, // span: fracción de `statement`; spread: fracción de ese span repartida en stagger
      exit: { at: 0.6, span: 0.3, yPercent: -150, ease: 'power3.in', spread: 0.5 } // el statement sale antes de que el anillo gire sobre la foto limpia
    },
    ringFade: 0.15,        // fracción de `ring` (al final del recorrido) en que el anillo se desvanece antes del footer
    gotoStatement: 0.35,   // /projects lleva el scroll a open + esta fracción de `statement` (el anillo arranca al cruzar `open`)
    gotoDuration: 1.8
  },
  reduced: { duration: 0.4 } // abrir/cerrar la ventana con el botón
};

const FULL_INSET = 'inset(0px 0px 0px 0px round 0px)';

/**
 * Hero del home: titular, garabato, cápsula-ventana, párrafo, indicador de scroll y statement.
 * Debe llamarse dentro del gsap.context() de la vista (makeView lo hace en setup).
 *
 * La "ventana" no es un elemento: es un clip-path sobre `.window-layer` ajustado al rectángulo de
 * `.capsule-ghost`, un div invisible que solo sirve para medir. Con el scroll el clip-path crece
 * hasta cubrir el stage y revela la sección siguiente (fase 5: el anillo de proyectos).
 *
 * @param {HTMLElement} el sección de la vista
 * @param {{ mode: 'first' | 'nav' | 'lang' }} rc
 * @returns {import('../views/view-utils.js').ViewHooks}
 */
export function createHero(el, { mode, route }) {
  const $ = (sel) => el.querySelector(sel);
  const wrap = $('.hero-wrap');
  const stage = $('.hero-stage');
  const layer = $('.window-layer');
  const photoWrap = $('.window-photos');
  const photos = el.querySelectorAll('.window-photo');
  const content = $('.hero-content');
  const ghost = $('.capsule-ghost');
  const lines = el.querySelectorAll('.line-inner');
  const scribble = $('.scribble path');
  const about = $('.hero-about');
  const hint = $('.scroll-hint');
  const hintIcon = $('.scroll-hint__icon');
  const statement = $('.statement');
  const statementWords = el.querySelectorAll('.statement .word');
  const actions = $('.hero-actions');
  const openBtn = $('.hero-open');
  const header = document.getElementById('header');

  const first = mode === 'first';
  const reduced = prefersReducedMotion();
  let scrollCtx = null; // contexto del ScrollTrigger (se crea al terminar la entrada)
  let reducedOpen = false;
  let reducedTl = null;

  /**
   * Rectángulo de la cápsula en coordenadas del stage. Se mide relativo a `.hero-content` (que cubre el
   * stage) y no al stage, así el desplazamiento del contenido durante el scroll no contamina la medida.
   */
  function rect() {
    const s = stage.getBoundingClientRect();
    const c = content.getBoundingClientRect();
    const g = ghost.getBoundingClientRect();
    const left = g.left - c.left;
    const top = g.top - c.top;
    return { top, left, right: left + g.width, bottom: top + g.height, w: s.width, h: s.height };
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

  /** Alto del recorrido de scroll (open + statement + ring), en px. 1 unidad de la línea de tiempo = 1vh del stage. */
  const vh = () => stage.offsetHeight / 100;
  const runwayUnits = HOME_SCROLL.open + HOME_SCROLL.statement + HOME_SCROLL.ring;
  const setRunway = () => wrap.style.setProperty('--hero-runway', `${vh() * runwayUnits}px`);

  // Sin ScrollTrigger (reduced-motion o antes de terminar la entrada) la cápsula sigue al fantasma al redimensionar.
  let raf = 0;
  const onResize = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (!scrollCtx && !reducedOpen && layer.dataset.ready) gsap.set(layer, { clipPath: capsuleInset() });
    });
  };
  window.addEventListener('resize', onResize);

  /** Scroll al anillo (alias /projects). */
  const goRing = () => scrollTo(vh() * (HOME_SCROLL.open + HOME_SCROLL.statement * HERO_CONFIG.scroll.gotoStatement), { duration: HERO_CONFIG.scroll.gotoDuration });
  const onAlias = (e) => {
    if (reduced) return setReducedOpen(e.detail.name === 'projects');
    if (e.detail.name === 'projects') goRing();
    else scrollTo(0, { duration: HERO_CONFIG.scroll.gotoDuration });
  };
  document.addEventListener('route:alias', onAlias);

  /** Al salir del home el anillo se oculta; al cambiar solo de idioma permanece (capa persistente). */
  const leave = (to) => {
    if (to !== LANG_SWAP) ring.conceal();
    return fadeLeave(el, to);
  };

  const destroy = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    document.removeEventListener('route:alias', onAlias);
    ScrollTrigger.removeEventListener('refreshInit', setRunway);
    trail.setArmed(false);
    scrollCtx?.revert();
  };

  /**
   * Scroll: UN solo ScrollTrigger con scrub sobre `.hero-wrap` y una línea de tiempo en unidades de vh.
   *   0 → open:                la ventana crece de cápsula a pantalla completa (clip-path), la foto hace
   *                            parallax (scale 1.35 → 1), se cruzan las fotos y se va el contenido del hero.
   *   open → open + statement: aparece el statement y, al cruzar `open`, arranca la intro del anillo (por
   *                            tiempo); el statement sale después.
   *   … → total:               el anillo gira con el scroll (velocidad de Lenis) y al final se desvanece;
   *                            el documento termina en el footer.
   * Es reversible: al subir, la ventana vuelve a ser cápsula sin saltos.
   */
  function buildScroll() {
    const S = HOME_SCROLL;
    const C = HERO_CONFIG.scroll;
    setRunway();
    ScrollTrigger.addEventListener('refreshInit', setRunway);

    scrollCtx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: wrap,
          start: 'top top',
          end: () => `+=${vh() * runwayUnits}`,
          scrub: C.scrub,
          invalidateOnRefresh: true // la cápsula se vuelve a medir en cada refresh/resize
        }
      });

      tl.fromTo(layer, { clipPath: () => capsuleInset() }, { clipPath: FULL_INSET, ease: C.openEase, duration: S.open }, 0)
        .fromTo(photoWrap, { scale: HERO_CONFIG.photoScale }, { scale: 1, duration: S.open }, 0)
        .fromTo(content, { yPercent: 0, autoAlpha: 1 }, { yPercent: C.content.yPercent, autoAlpha: 0, duration: S.open * C.content.span }, 0);

      C.crossfade.forEach(({ at, span }, i) => {
        const photo = photos[i + 1];
        if (!photo) return;
        tl.fromTo(photo, { autoAlpha: 0, scale: C.photoEnterScale }, { autoAlpha: 1, scale: 1, duration: S.open * span }, S.open * at);
      });

      const st = C.statement;
      const revealSpan = S.statement * st.span;
      tl.fromTo(
        statementWords,
        { yPercent: st.yPercent },
        { yPercent: 0, ease: st.ease, duration: revealSpan * (1 - st.spread), stagger: { amount: revealSpan * st.spread } },
        S.open
      );

      // El statement sale (reversible): el anillo gira sobre la foto limpia.
      const ex = st.exit;
      const exitSpan = S.statement * ex.span;
      tl.fromTo(
        statementWords,
        { yPercent: 0 },
        { yPercent: ex.yPercent, ease: ex.ease, duration: exitSpan * (1 - ex.spread), stagger: { amount: exitSpan * ex.spread }, immediateRender: false },
        S.open + S.statement * ex.at
      );

      // Al final del recorrido el anillo se desvanece (autoAlpha: sin hit-testing cuando ya no se ve) y llega el footer.
      const total = S.open + S.statement + S.ring;
      const fadeSpan = S.ring * C.ringFade;
      tl.fromTo(ring.el, { autoAlpha: 1 }, { autoAlpha: 0, duration: fadeSpan, immediateRender: false }, total - fadeSpan);

      // Fija la duración total de la línea de tiempo (= recorrido completo del ScrollTrigger).
      tl.to({}, { duration: 0.001 }, total - 0.001);

      // Si se monta con el scroll ya avanzado (cambio de idioma), salta directo a ese progreso sin "alcanzarlo" con el scrub.
      tl.progress(tl.scrollTrigger.progress);

      // El trail solo funciona mientras el hero es visible: durante el primer tramo del scroll.
      const range = ScrollTrigger.create({
        trigger: wrap,
        start: 'top top',
        end: TRAIL_CONFIG.activeRange,
        onLeave: () => trail.setInRange(false),
        onEnterBack: () => trail.setInRange(true)
      });
      // Estado inicial. OJO: `isActive` es false con el scroll exactamente en el inicio (progress 0), por eso se usa progress < 1.
      trail.setInRange(range.progress < 1);

      // El anillo aparece al terminar de abrirse la ventana (cruzar `open`) y se oculta si se vuelve a cerrar.
      const ringStart = ScrollTrigger.create({
        trigger: wrap,
        start: () => `top+=${vh() * S.open} top`,
        onEnter: () => ring.reveal(),
        onLeaveBack: () => ring.conceal()
      });
      // Estado inicial (p. ej. remonte por idioma con el scroll ya dentro de la zona del anillo)
      if (ringStart.scroll() >= ringStart.start) ring.reveal();
      else ring.conceal({ instant: true });
      ring.prime();
    }, el);
  }

  /** Reduced-motion: sin scrub. La ventana se abre/cierra con un botón y un fade. */
  function setupReduced() {
    const R = HERO_CONFIG.reduced;
    actions.hidden = false;
    hint.hidden = true;
    gsap.set(layer, { clipPath: capsuleInset() });
    gsap.set(statementWords, { yPercent: 0 });
    gsap.set(statement, { autoAlpha: 0 });
    layer.dataset.ready = '1';

    const tl = gsap.timeline({ paused: true, defaults: { duration: R.duration, ease: 'none' } });
    tl.to(layer, { clipPath: FULL_INSET }, 0)
      .to(photoWrap, { scale: 1 }, 0)
      .to(content, { autoAlpha: 0 }, 0)
      .to(statement, { autoAlpha: 1 }, 0);

    reducedTl = tl;
    openBtn.addEventListener('click', () => setReducedOpen(!reducedOpen));
  }

  /** Reduced-motion: abre/cierra la ventana (y muestra el anillo, estático). */
  function setReducedOpen(open) {
    if (!reducedTl || open === reducedOpen) return;
    reducedOpen = open;
    reducedTl[open ? 'play' : 'reverse']();
    openBtn.setAttribute('aria-expanded', String(open));
    openBtn.textContent = `[ ${t(open ? 'hero.closeProjects' : 'hero.openProjects')} ]`;
    if (open) ring.reveal();
    else ring.conceal();
  }

  gsap.set(photoWrap, { scale: HERO_CONFIG.photoScale });
  gsap.set(statementWords, { yPercent: HERO_CONFIG.scroll.statement.yPercent });

  // Visita nueva al home: el anillo empieza oculto y con la intro pendiente (si solo cambia el idioma, se conserva).
  if (mode !== 'lang') ring.reset();

  if (reduced) {
    setupReduced();
    el.dataset.intro = 'done';
    return { enter: (from) => fadeEnter(el, from), leave, destroy };
  }

  // Remonte por cambio de idioma: estado final inmediato y el scroll se reconstruye en el progreso actual.
  if (mode === 'lang') {
    gsap.set(layer, { clipPath: capsuleInset() });
    layer.dataset.ready = '1';
    gsap.to(hintIcon, { y: HERO_CONFIG.hint.y, duration: HERO_CONFIG.hint.duration, ease: HERO_CONFIG.hint.ease, yoyo: true, repeat: -1 });
    buildScroll();
    trail.setArmed(true);
    el.dataset.intro = 'done';
    return { enter: (from) => fadeEnter(el, from), leave, destroy };
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
        layer.dataset.ready = '1';
        el.dataset.intro = 'done';
        // El scroll se activa al terminar la entrada: así no pisa la cápsula colapsada de la secuencia.
        buildScroll();
        trail.setArmed(true);
        document.dispatchEvent(new CustomEvent('hero:intro-complete'));
        // Entrada directa por /projects: tras la intro, lleva el scroll al anillo (cuando el router ya soltó el bloqueo).
        if (route === 'projects') gsap.delayedCall(0.15, goRing);
      }
    });

    tl.to(lines, { yPercent: 0, duration: c.title.duration, stagger: c.title.stagger })
      .fromTo(layer, { clipPath: () => centerInset() }, { clipPath: () => capsuleInset(), duration: c.capsule.duration }, c.capsule.offset)
      .to(scribble, { drawSVG: '100%', duration: c.scribble.duration, ease: c.scribble.ease }, c.scribble.offset)
      .to([about, hint], { autoAlpha: 1, y: 0, duration: c.texts.duration, stagger: c.texts.stagger }, c.texts.offset);
    if (first) tl.to(header, { yPercent: 0, duration: c.header.duration }, c.header.offset);
    return tl;
  }

  return { enter, leave, destroy };
}
