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

// Fase 0: página de verificación del scaffold. El router y las vistas llegan en la fase 1.
const app = document.getElementById('app');
app.innerHTML = `
  <main id="view-root" tabindex="-1" style="padding: var(--gutter); min-height: 100svh; display: grid; place-content: center; gap: 1.5rem;">
    <p class="mono">[ fase 0 · scaffold ]</p>
    <h1 style="font-size: var(--fs-hero)">wakeupfern</h1>
    <p>Inter Tight para texto. <span class="mono">JetBrains Mono para labels</span></p>
  </main>
`;
