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
import { initRouter } from './router.js';

initI18n();
const lenis = initScroll();
initCursor();
initHeader(document.getElementById('header'));
initRouter({
  root: document.getElementById('view-root'),
  app: document.getElementById('app'),
  announcer: document.getElementById('announcer')
});

if (import.meta.env.DEV) window.__app = { lenis };
