# CLAUDE.md

Portafolio personal de **wakeupfern**. Especificación completa en [`BRIEF.md`](BRIEF.md); este archivo recoge comandos, convenciones y las decisiones que modifican o completan el brief.

## Comandos

**Gestor de paquetes: pnpm. Nunca uses npm ni yarn.** Versión fijada en `packageManager` (`pnpm@12.10.1`); lockfile `pnpm-lock.yaml`. Donde `BRIEF.md` diga npm, léase pnpm. Dependencias: `pnpm add` / `pnpm add -D`.

```bash
pnpm dev           # Vite en http://localhost:5173
pnpm build         # build de producción en dist/
pnpm preview       # sirve dist/ en http://localhost:4173 (debe comportarse igual que dev)
pnpm placeholders  # genera placeholders en public/assets (lee src/data/projects.json). Sobrescribe archivos: NO correrlo sobre fotos reales
```

Verificación en navegador con Playwright (solo Chromium: `pnpm exec playwright install chromium`). Scripts de verificación en la carpeta temporal de la sesión, no en el repo.

## Stack

Vite + JS vanilla (ES modules, JSDoc donde ayude) · GSAP 3.15 (ScrollTrigger, Flip, SplitText, DrawSVGPlugin, MotionPathPlugin, registrados en `src/main.js`) · Lenis · CSS plano con variables · fuentes con `@fontsource-variable` (Archivo con eje `wdth`, Inter Tight, JetBrains Mono). Sin Tailwind, sin React, sin WebGL, sin más dependencias sin preguntar.

## Estructura

```
index.html · vite.config.js · vercel.json
scripts/       make-placeholders.mjs (optimize-images.mjs llega en la fase 9)
public/assets/ hero/ trail/ projects/<slug>/ about/
src/main.js    bootstrap (Lenis, ticker, router, cursor, header)
src/config.js  constantes de animación (HOME_SCROLL, RING_CONFIG, TRAIL_CONFIG, PULL_CONFIG, LENIS_CONFIG)
src/router.js · scroll.js · i18n.js · motion.js
src/data/      projects.json · timeline.json   (textos como { es, en }; `title` y `org` no se traducen)
src/i18n/      es.json · en.json               (textos de interfaz)
src/views/     home.js · project.js · about.js
src/components/ header.js · cursor.js · preloader.js · hero.js · trail.js · ring.js · timeline.js
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

## Router y vistas (fase 1)

- `src/router.js`: History API propia. Rutas `/`, `/projects` (alias de home), `/projects/:slug` (slug validado contra `projects.json`) y `/about`; rutas desconocidas redirigen a `/` con `replaceState`. Intercepta clicks en `<a href>` internos (sin modificadores, sin `target`/`download`, anclas de la misma página y `mailto:` se dejan al navegador). `popstate` usa el mismo `swap()`; si llega durante una transición queda en `pending` y se ejecuta al terminar.
- `swap(match, mode)` con `mode` `first | nav | lang`: bloquea input (`pointer-events: none` en `#app` + `lenis.stop()`), `leave` → `unmount` → scroll a 0 (`force: true`, porque Lenis está parado) → `mount` → título + `aria-live` → `enter` → foco al `h1` (después de `enter`: en `visibility: hidden` el navegador pierde el foco) → `lenis.start()` + `ScrollTrigger.refresh()`.
- Contrato de vista: `{ name, getTitle(params), mount({ root }, params), unmount(), enter(from), leave(to) }`; `enter/leave` devuelven una animación de GSAP. `views/view-utils.js › makeView()` crea el contexto (`gsap.context`) y los fades por defecto; las vistas reales sobreescriben `enter/leave`. `from`/`to` es el nombre de la ruta o `'lang'` (`LANG_SWAP`) cuando solo cambia el idioma.
- Cambio de idioma: `i18n.js` emite `change`; el router remonta la vista con fade corto, conservando scroll y foco; el header se re-renderiza en sitio.
- Header: `mix-blend-mode: difference` con texto blanco (por eso ya no existe `--header-ink`). Hover con `SplitText` por letras. El cursor custom usa dos elementos (punto y etiqueta) para que cada uno haga `difference` por separado.
- `window.__app = { lenis }` solo existe en DEV (para pruebas con Playwright).

## Hero y entrada (fase 2)

- **Modo de montaje.** El router pasa `mode` (`first | nav | lang`) a `mount()` y `makeView` lo entrega a `setup(el, params, rc)`. `setup` puede devolver `{ enter, leave, destroy }` para sobrescribir las animaciones por defecto y limpiar listeners (`destroy` corre antes de `ctx.revert()`).
- **Compuerta de arranque.** `initRouter({ ready })`: en la primera carga la vista se monta (oculta por su estado inicial) y el router espera `ready` antes de llamar a `enter()`. `ready` = preloader (si toca) + fuentes (`PRELOAD_FONTS`) + imágenes críticas (`PRELOAD_ASSETS`), ambos en `config.js`.
- **Preloader** (`components/preloader.js`): solo la primera visita de la sesión (`sessionStorage`, con `try/catch`) y sin reduced-motion. Mientras está activo `#app` es `inert` y el botón `skip` recibe el foco. Libera el hero `exit.heroLead` segundos después de empezar a subir la cortina.
- **Hero** (`components/hero.js`, `HERO_CONFIG`): la ventana es un `clip-path` sobre `.window-layer` ajustado al rect de `.capsule-ghost` (div invisible solo para medir). El estado inicial oculto se fija al montar; la entrada abre la cápsula **desde su propio centro** (inset en px, mismo formato que el destino para que GSAP no mezcle `%` con `px`). El header solo se oculta/baja en `mode === 'first'`. En `lang` y con reduced-motion no hay secuencia: estado final + fade.
- **Layout.** ≥1024px grid de 3 columnas (titular · cápsula · párrafo, como la referencia); <1024px una columna centrada. `--fs-hero` bajó a `clamp(3rem, 5.1vw, 6.2rem)` porque "soy wakeupfern" (~7.4em) no cabe en su columna con el 6.2vw del brief.
- `.hero-wrap` solo mide 100svh por ahora (`--hero-runway` = 0): sin scroll hasta la fase 3, que lo fija con `HOME_SCROLL`.
- Al terminar la entrada: `data-intro="done"` en la vista y evento `hero:intro-complete` en `document` (la fase 4 activa el trail ahí).
- `window.__app = { lenis, navigate }` en DEV.

## Decisiones de arquitectura (complementan el brief)

1. **Idioma.** El idioma vive en `localStorage` (con `try/catch`) y en `<html lang>`. Al cambiarlo, **el anillo NO se remonta** (es una capa persistente): solo se actualizan sus textos y `aria-label`. Las demás vistas sí se remontan, con un fade corto.
2. **Scroll del home.** Medidas en `HOME_SCROLL` (vh): `open` 150 (scrub de la ventana) + `statement` 100 (statement e intro del anillo, por tiempo) + `ring` 150 (el anillo gira con el scroll). `.hero-wrap` = 100vh + esa suma. En los últimos ~150vh el stage sigue fijo y el anillo gira; al final el anillo se desvanece y el documento termina en un `.site-footer` en flujo normal (contacto + copyright).
3. **Volver a home desde un proyecto.** En el mismo tick del salto de Lenis (`scrollTo(..., { immediate: true })` al inicio de la zona del statement/anillo) se fuerza `openTl.progress(1)` y `ScrollTrigger.update()`, para que no se vea la ventana rebobinando.
4. **Pull-to-continue.** `overscroll-behavior: none` en `html` y `body` (ya en `base.css`). Tras completar la transición se ignora `wheel` durante `PULL_CONFIG.ignoreAfterComplete` (~600 ms) por la inercia del trackpad.
5. **Flip con tarjetas del anillo.** Se intenta primero `Flip.getState` / `Flip.from` sobre la imagen de la tarjeta. **Plan B si da saltos:** clon fijo (`position: fixed`) de la imagen animado con GSAP desde el rect de la tarjeta hasta el rect del hero, y se retira el clon al terminar. Pausar el loop de `place()` del anillo antes de medir.
6. **Hosting.** Vercel: `vercel.json` reescribe todo a `index.html`.
