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
src/components/ header.js · cursor.js · preloader.js · hero.js · trail.js · ring.js · persistent.js · timeline.js
src/styles/    tokens.css · base.css · header.css · home.css · project.css · about.css
```

## Convenciones

- **Toda animación se crea dentro de un `gsap.context()` y se limpia con `ctx.revert()` al desmontar la vista.** Además `unmount()` mata los ScrollTriggers de la vista y quita sus listeners.
- Todo valor de animación (duración, easing, radio, umbral) vive en un objeto de configuración al inicio del módulo o en `src/config.js`. Sin números mágicos.
- Animar solo `transform`, `opacity`, `clip-path`. `will-change` solo mientras anima.
- **Los commits y tags los hace el usuario, no Claude** (desde la fase 4). Al cerrar cada fase, Claude deja los cambios sin commitear y sugiere un mensaje en conventional commits (`feat:`, `fix:`, `chore:`) y el comando de tag. Un tag por fase (`phase-0`, `phase-1`, ...) sobre el commit que la cierra.
- Una fase a la vez: dev server, verificación en navegador, consola limpia, commit, tag, y esperar el OK antes de la siguiente.
- Dirección visual: limpia, blanco/negro, un solo acento `--accent`. Labels en mono 11px uppercase; corchetes `[ ]` solo en botones. Prácticamente sin ASCII decorativo.
- URLs sin prefijo de idioma. Rutas: `/`, `/projects/:slug`, `/about`.

## Router y vistas (fase 1)

- `src/router.js`: History API propia. Rutas `/`, `/projects` (alias de home), `/projects/:slug` (slug validado contra `projects.json`) y `/about`; rutas desconocidas redirigen a `/` con `replaceState`. Intercepta clicks en `<a href>` internos (sin modificadores, sin `target`/`download`, anclas de la misma página y `mailto:` se dejan al navegador). `popstate` usa el mismo `swap()`; si llega durante una transición queda en `pending` y se ejecuta al terminar.
- `swap(match, mode)` con `mode` `first | nav | lang`: bloquea input (`pointer-events: none` en `#app` + `lenis.stop()`), `leave` → `unmount` → scroll a 0 (`force: true`, porque Lenis está parado) → `mount` → título + `aria-live` → `enter` → foco al `h1` (después de `enter`: en `visibility: hidden` el navegador pierde el foco) → `lenis.start()` + `ScrollTrigger.refresh()`.
- Contrato de vista: `{ name, getTitle(params), mount({ root }, params), unmount(), enter(from), leave(to) }`; `enter/leave` devuelven una animación de GSAP. `views/view-utils.js › makeView()` crea el contexto (`gsap.context`) y los fades por defecto; las vistas reales sobreescriben `enter/leave`. `from`/`to` es el nombre de la ruta o `'lang'` (`LANG_SWAP`) cuando solo cambia el idioma.
- **Alias de la misma vista** (`/` ↔ `/projects`): `swap()` no remonta; solo actualiza ruta activa, título, `aria-live` y notifica a `onRouteChange` (y hace `scrollTo(0)` en `home`). La vista decide qué hacer con `/projects` (fase 5: llevar el scroll al anillo).
- Cambio de idioma: `i18n.js` emite `change`; el router remonta la vista con fade corto, conservando scroll y foco; el header se re-renderiza en sitio.
- Header: `mix-blend-mode: difference` con texto blanco (por eso ya no existe `--header-ink`). Hover con `SplitText` por letras. El cursor custom usa dos elementos (punto y etiqueta) para que cada uno haga `difference` por separado.
- `window.__app = { lenis, navigate, ScrollTrigger }` solo existe en DEV (para pruebas con Playwright).

## Hero y entrada (fase 2)

- **Modo de montaje.** El router pasa `mode` (`first | nav | lang`) a `mount()` y `makeView` lo entrega a `setup(el, params, rc)`. `setup` puede devolver `{ enter, leave, destroy }` para sobrescribir las animaciones por defecto y limpiar listeners (`destroy` corre antes de `ctx.revert()`).
- **Compuerta de arranque.** `initRouter({ ready })`: en la primera carga la vista se monta (oculta por su estado inicial) y el router espera `ready` antes de llamar a `enter()`. `ready` = preloader (si toca) + fuentes (`PRELOAD_FONTS`) + imágenes críticas (`PRELOAD_ASSETS`), ambos en `config.js`.
- **Preloader** (`components/preloader.js`): solo la primera visita de la sesión (`sessionStorage`, con `try/catch`) y sin reduced-motion. Mientras está activo `#app` es `inert` y el botón `skip` recibe el foco. Libera el hero `exit.heroLead` segundos después de empezar a subir la cortina.
- **Hero** (`components/hero.js`, `HERO_CONFIG`): la ventana es un `clip-path` sobre `.window-layer` ajustado al rect de `.capsule-ghost` (div invisible solo para medir). El estado inicial oculto se fija al montar; la entrada abre la cápsula **desde su propio centro** (inset en px, mismo formato que el destino para que GSAP no mezcle `%` con `px`). El header solo se oculta/baja en `mode === 'first'`. En `lang` y con reduced-motion no hay secuencia: estado final + fade.
- **Layout.** ≥1024px grid de 3 columnas (titular · cápsula · párrafo, como la referencia); <1024px una columna centrada. `--fs-hero` bajó a `clamp(3rem, 5.1vw, 6.2rem)` porque "soy wakeupfern" (~7.4em) no cabe en su columna con el 6.2vw del brief.
- Al terminar la entrada: `data-intro="done"` en la vista y evento `hero:intro-complete` en `document` (la fase 4 activa el trail ahí).

## Ventana y scroll del home (fase 3)

- **Un solo ScrollTrigger maestro** (`components/hero.js › buildScroll`) sobre `.hero-wrap`, `scrub: 0.6`, con la línea de tiempo medida en **unidades de vh** (`HOME_SCROLL`): `0 → open` abre la ventana (clip-path cápsula → `inset(0 round 0)` con `power2.inOut`), parallax de la foto (scale 1.35 → 1), cruce de fotos (foto 2 al 35 %, foto 3 al 70 %) y sale el contenido del hero; `open → open+statement` revela el statement. Reversible. La zona `ring` de `HOME_SCROLL` aún no se usa: la fase 5 la añade (y el footer).
- **Se construye al terminar la entrada** (`onComplete` del intro), no al montar: si no, el `fromTo` de la cápsula pisaría el estado colapsado del intro. Vive en su propio `gsap.context` (`scrollCtx`), que `destroy()` revierte (0 ScrollTriggers tras salir del home).
- **La cápsula se mide relativa a `.hero-content`**, no al stage: el contenido se desplaza durante el scroll y medir contra el stage contaminaría el inset al hacer resize a mitad del recorrido. `invalidateOnRefresh: true` + valores en función.
- **El recorrido (`--hero-runway`) va en el HTML de la vista desde el montaje** (`calc(250 * 1svh)`; px exactos en `refreshInit`). Si el documento fuera más corto aunque sea un instante (remonte por idioma), el navegador recorta el scroll a 0. Tras construir, `tl.progress(st.progress)` evita que el scrub "alcance" el progreso.
- **Header:** con `mix-blend-mode: difference` ya es legible sobre la ventana abierta; no hace falta el cambio de color del brief.
- **Ocultar con máscara:** con `line-height < 1` las puntas de las letras sobresalen de la caja y asoman si se oculta con 110 %. Titular y statement usan `yPercent: 150`.
- **Statement:** `h2` con `display: flex` (en grid cada palabra sería una fila), palabras en máscaras manuales `.word-mask > .word`, blanco con `difference`.
- **Reduced-motion:** sin runway ni ScrollTrigger; botón `[ ver proyectos ]` / `[ volver ]` (`.hero-actions`, `aria-expanded`) abre y cierra la ventana con fade de `HERO_CONFIG.reduced.duration`.
- `[hidden]` se fuerza con `display: none !important` en `base.css` (los `display` de autor lo anulaban).

## Trail del mouse (fase 4)

- `components/trail.js` + `TRAIL_CONFIG` (`config.js`). **Pool global y persistente** de 12 `<img>` en `#trail` (fuera de `#app`, `position: fixed`, `z-index: 50`: sobre la vista y bajo el header), creado una sola vez en `initTrail()`. No se crean ni destruyen nodos en runtime. Está fuera de `#app` para que no lo afecte ninguna transformación de la vista (un ancestro con `transform` rompería `position: fixed`).
- **Dos condiciones independientes**: `trail.setArmed()` (la vista lo arma al terminar la entrada del hero y lo desarma en `destroy`) y `trail.setInRange()` (ScrollTrigger del hero, `TRAIL_CONFIG.activeRange`, `onLeave`/`onEnterBack`). Además: puntero fino, sin reduced-motion y solo `pointerType === 'mouse'`. `sync()` reconcilia todo con un único listener `pointermove` en `window`.
- El estado inicial del rango se calcula con `range.progress < 1`: `ScrollTrigger.isActive` es `false` con el scroll exactamente en el inicio.
- Spawn: distancia mínima `clamp(min, innerWidth * vw, max)`; cada imagen hace pop → hold → fade con una timeline; si hay `maxActive` activas, la más antigua se desvanece de golpe (`quickFade`). `will-change` solo mientras anima. Las imágenes se decodifican (`img.decode()`) antes de la primera activación.
- Home tiene ahora **3 ScrollTriggers** (el maestro, el del rango del trail y el de inicio del anillo); al salir quedan 0.

## Anillo de proyectos (fase 5)

- `components/ring.js` + `RING_CONFIG` (`config.js`). **Capa persistente** `#layer-ring` (fixed, `z-index: 1`: sobre la vista y bajo trail/header), creada una sola vez en `initRing()`. No se remonta al cambiar de idioma (solo `refreshLabels()`: `aria-label` = "título — categoría").
- **Motor**: un proxy `s = { r, rot, spread, spin }` y `place()` que reposiciona las tarjetas (`quickSetter` de `x`, `y`, `scaleX`, `scaleY`). Posiciones, flotación y profundidad salen de un PRNG con semilla (`RING_CONFIG.seed`): el anillo se ve igual en cada visita. Un solo ticker, que se detiene cuando la capa se oculta. Geometría por breakpoint en `RING_CONFIG.layout` (móvil: elipse vertical).
- **Giro**: `idleSpin` + velocidad de Lenis (suavizada con `quickTo`, con tope) × `spin` (multiplicador que baja con hover/`pause()`). Es aditivo sobre `rot`, así que no choca con la intro (`r`, `spread`).
- **Intro** `playIntro()` (flotan → hold → se juntan → se expanden) arranca al **cruzar `open`** (ScrollTrigger `ringStart` en `buildScroll`) y es **interrumpible por click o tecla** (`pointerdown`/`keydown` → `progress(1, false)`), NO por scroll: la ventana termina de abrirse con la rueda en movimiento y un scroll cualquiera la cancelaría casi siempre. `playIntro({ short: true })` es la versión de 0.9 s para volver de un proyecto (fase 7). `reset()` (visita nueva al home) la deja pendiente; si el usuario solo sube y baja de `open`, el anillo se oculta/muestra sin repetirla.
- **Scroll del home** (`HOME_SCROLL`, ya completo): `open` 150 + `statement` 100 + `ring` 150 = 400vh → `hero-wrap` = 500vh, y el documento termina en `.site-footer`. El statement sale al 60 % de su zona; en los últimos 15 % de `ring` el anillo se desvanece (`autoAlpha`, para no interceptar clicks) y llega el footer.
- **Hover** (solo ratón, y solo con la intro terminada): la tarjeta ×1.12, el resto a 0.35, `spin` a 0.15 y etiqueta `[ título ]` en el cursor (`data-cursor="label"`). El foco por teclado hace lo mismo. En reduced-motion solo atenúa (sin escala).
- **`/projects`** (alias de home): evento `route:alias` → el hero lleva el scroll a `open + 0.35·statement` (`goRing`); en carga directa lo hace tras la intro. En reduced-motion abre la ventana con el botón.
- **Provisional (fase 6):** el click en una tarjeta navega directo a `/projects/<slug>` y al salir del home el anillo se oculta (`leave` del hero). La fase 6 lo cambia por enfocar → Flip, y mantiene el anillo vivo bajo el proyecto.
- `window.__app = { lenis, navigate, ScrollTrigger, ring }` y `window.__replayRing()` solo en DEV.

### Trampas de GSAP encontradas (aplican a cualquier componente persistente)

- **Los callbacks de un ScrollTrigger creado dentro de un `gsap.context()` corren dentro de ese contexto**: los tweens que creen se registran en él y `ctx.revert()` (al desmontar la vista) los **deshace**. Para anillo y trail (que sobreviven a las vistas) toda API pública pasa por `detached()` (`components/persistent.js`). Si añades otra capa persistente, haz lo mismo.
- **`gsap.quickSetter(el, 'scale')` no escribe nada en GSAP 3.15** (su setter está pensado para tweens). Usa `scaleX` y `scaleY`.
- Una función que devuelve una animación de GSAP es *thenable*: `await` espera a que termine (afecta a `page.evaluate`). Los helpers de dev no devuelven la timeline.
- `ScrollTrigger.isActive` es `false` con el scroll exactamente en el inicio; para "dentro del rango" usa `progress < 1`.

## Decisiones de arquitectura (complementan el brief)

1. **Idioma.** El idioma vive en `localStorage` (con `try/catch`) y en `<html lang>`. Al cambiarlo, **el anillo NO se remonta** (es una capa persistente): solo se actualizan sus textos y `aria-label`. Las demás vistas sí se remontan, con un fade corto.
2. **Scroll del home.** Medidas en `HOME_SCROLL` (vh): `open` 150 (scrub de la ventana) + `statement` 100 (statement e intro del anillo, por tiempo) + `ring` 150 (el anillo gira con el scroll). `.hero-wrap` = 100vh + esa suma. En los últimos ~150vh el stage sigue fijo y el anillo gira; al final el anillo se desvanece y el documento termina en un `.site-footer` en flujo normal (contacto + copyright).
3. **Volver a home desde un proyecto.** En el mismo tick del salto de Lenis (`scrollTo(..., { immediate: true })` al inicio de la zona del statement/anillo) se fuerza `openTl.progress(1)` y `ScrollTrigger.update()`, para que no se vea la ventana rebobinando.
4. **Pull-to-continue.** `overscroll-behavior: none` en `html` y `body` (ya en `base.css`). Tras completar la transición se ignora `wheel` durante `PULL_CONFIG.ignoreAfterComplete` (~600 ms) por la inercia del trackpad.
5. **Flip con tarjetas del anillo.** Se intenta primero `Flip.getState` / `Flip.from` sobre la imagen de la tarjeta. **Plan B si da saltos:** clon fijo (`position: fixed`) de la imagen animado con GSAP desde el rect de la tarjeta hasta el rect del hero, y se retira el clon al terminar. Pausar el loop de `place()` del anillo antes de medir.
6. **Hosting.** Vercel: `vercel.json` reescribe todo a `index.html`.
