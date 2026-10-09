import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/inter-tight';
import '@fontsource-variable/jetbrains-mono';

import './styles/tokens.css';
import './styles/base.css';
import './styles/header.css';
import './styles/home.css';
import './styles/project.css';
import './styles/about.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(ScrollTrigger, Flip, SplitText, DrawSVGPlugin, MotionPathPlugin);

import { initI18n } from './i18n.js';
import { initScroll } from './scroll.js';
import { initCursor } from './components/cursor.js';
import { initHeader } from './components/header.js';
import { runPreloader } from './components/preloader.js';
import { initRouter, navigate } from './router.js';
import { PRELOAD_ASSETS, PRELOAD_FONTS } from './config.js';

initI18n();
const lenis = initScroll();
initCursor();
initHeader(document.getElementById('header'));
const app = document.getElementById('app');
const decode = (src) => {
  const img = new Image();
  img.src = src;
  return img.decode().catch(() => {});
};

// El hero no arranca hasta que el preloader (si toca), las fuentes y la foto crítica estén listos.
const ready = Promise.all([
  runPreloader({ app }),
  ...PRELOAD_FONTS.map((f) => document.fonts.load(f).catch(() => {})),
  ...PRELOAD_ASSETS.map(decode)
]);

initRouter({
  root: document.getElementById('view-root'),
  app,
  announcer: document.getElementById('announcer'),
  ready
});

if (import.meta.env.DEV) window.__app = { lenis, navigate, ScrollTrigger };
