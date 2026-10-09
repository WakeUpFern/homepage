# CLAUDE.md

Portafolio personal de **wakeupfern**. Especificación completa en [`BRIEF.md`](BRIEF.md); este archivo recoge comandos, convenciones y las decisiones que modifican o completan el brief.

## Comandos

```bash
npm run dev           # Vite en http://localhost:5173
npm run build         # build de producción en dist/
npm run preview       # sirve dist/ en http://localhost:4173 (debe comportarse igual que dev)
npm run placeholders  # regenera imágenes placeholder en public/assets (lee src/data/projects.json)
```

Verificación en navegador con Playwright (solo Chromium instalado). Scripts de verificación en la carpeta temporal de la sesión, no en el repo.

## Stack

Vite + JS vanilla (ES modules, JSDoc donde ayude) · GSAP 3.15 (ScrollTrigger, Flip, SplitText, DrawSVGPlugin, MotionPathPlugin, registrados en `src/main.js`) · Lenis · CSS plano con variables · fuentes con `@fontsource-variable` (Archivo con eje `wdth`, Inter Tight, JetBrains Mono). Sin Tailwind, sin React, sin WebGL, sin más dependencias sin preguntar.

## Estructura

```
index.html · vite.config.js · vercel.json
scripts/       make-placeholders.mjs (optimize-images.mjs llega en la fase 9)
public/assets/ hero/ trail/ projects/<slug>/ about/
src/main.js    bootstrap (Lenis, ticker, router, cursor, header)
src/config.js  constantes de animación (HOME_SCROLL, RING_CONFIG, TRAIL_CONFIG, PULL_CONFIG, LENIS_CONFIG)
src/router.js · scroll.js · cursor.js
src/data/      projects.json · timeline.json   (textos como { es, en }; `title` y `org` no se traducen)
src/i18n/      es.json · en.json               (textos de interfaz)
src/views/     home.js · project.js · about.js
src/components/ header.js · trail.js · ring.js · timeline.js
src/styles/    tokens.css · base.css · header.css · home.css · project.css · about.css
```

## Convenciones

- **Toda animación se crea dentro de un `gsap.context()` y se limpia con `ctx.revert()` al desmontar la vista.** Además `unmount()` mata los ScrollTriggers de la vista y quita sus listeners.
- Todo valor de animación (duración, easing, radio, umbral) vive en un objeto de configuración al inicio del módulo o en `src/config.js`. Sin números mágicos.
- Animar solo `transform`, `opacity`, `clip-path`. `will-change` solo mientras anima.
- Commits en conventional commits (`feat:`, `fix:`, `chore:`), al menos uno por fase. **Un tag de git por fase** (`phase-0`, `phase-1`, ...) sobre el commit que cierra la fase.
- Una fase a la vez: dev server, verificación en navegador, consola limpia, commit, tag, y esperar el OK antes de la siguiente.
- Dirección visual: limpia, blanco/negro, un solo acento `--accent`. Labels en mono 11px uppercase; corchetes `[ ]` solo en botones. Prácticamente sin ASCII decorativo.
- URLs sin prefijo de idioma. Rutas: `/`, `/projects/:slug`, `/about`.

## Decisiones de arquitectura (complementan el brief)

1. **Idioma.** El idioma vive en `localStorage` (con `try/catch`) y en `<html lang>`. Al cambiarlo, **el anillo NO se remonta** (es una capa persistente): solo se actualizan sus textos y `aria-label`. Las demás vistas sí se remontan, con un fade corto.
2. **Scroll del home.** Medidas en `HOME_SCROLL` (vh): `open` 150 (scrub de la ventana) + `statement` 100 (statement e intro del anillo, por tiempo) + `ring` 150 (el anillo gira con el scroll). `.hero-wrap` = 100vh + esa suma. En los últimos ~150vh el stage sigue fijo y el anillo gira; al final el anillo se desvanece y el documento termina en un `.site-footer` en flujo normal (contacto + copyright).
3. **Volver a home desde un proyecto.** En el mismo tick del salto de Lenis (`scrollTo(..., { immediate: true })` al inicio de la zona del statement/anillo) se fuerza `openTl.progress(1)` y `ScrollTrigger.update()`, para que no se vea la ventana rebobinando.
4. **Pull-to-continue.** `overscroll-behavior: none` en `html` y `body` (ya en `base.css`). Tras completar la transición se ignora `wheel` durante `PULL_CONFIG.ignoreAfterComplete` (~600 ms) por la inercia del trackpad.
5. **Flip con tarjetas del anillo.** Se intenta primero `Flip.getState` / `Flip.from` sobre la imagen de la tarjeta. **Plan B si da saltos:** clon fijo (`position: fixed`) de la imagen animado con GSAP desde el rect de la tarjeta hasta el rect del hero, y se retira el clon al terminar. Pausar el loop de `place()` del anillo antes de medir.
6. **Hosting.** Vercel: `vercel.json` reescribe todo a `index.html`.
