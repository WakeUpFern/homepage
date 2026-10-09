# BRIEF: Portafolio web personal (Vite + GSAP + Lenis)

> Cómo usar este archivo: guárdalo en la raíz del repo como [`BRIEF.md`](http://BRIEF.md) y dile a Claude Code: "Lee [BRIEF.md](http://BRIEF.md) completo. NO escribas código todavía: primero entra en modo plan, hazme las preguntas de la sección 0.3 y entrégame el plan por fases. Después implementamos fase por fase." Las partes marcadas con `TODO(yo)` son datos míos que debes reemplazar o preguntarme.

---

## 0. Reglas de trabajo (léelas primero)

### 0.1 Rol

Eres un desarrollador frontend senior especializado en animación web con GSAP. Vamos a construir mi portafolio personal desde cero, en este repo, trabajando por fases pequeñas y verificables.

### 0.2 Reglas no negociables

1. **Plan primero.** Antes de escribir código, presenta un plan por fases (ver sección 12) y espera mi aprobación.
2. **Una fase a la vez.** Al terminar cada fase: corre el dev server, verifica en navegador (Playwright o similar, con capturas si puedes), revisa la consola sin errores, haz commit y dime qué probar manualmente. No avances a la siguiente fase sin mi OK.
3. **Originalidad.** Las referencias de la sección 1 son inspiración de *comportamiento*, no se copia código, assets, textos, nombres de clases ni marcas. Todo nombre, copy, colores y recursos son míos o genéricos.
4. **Sin dependencias extra** más allá de las permitidas en la sección 2. Si crees que necesitas otra, pregúntame antes.
5. **Rendimiento y accesibilidad son requisitos**, no extras (sección 10).
6. **Constantes ajustables.** Todo valor de animación (duraciones, easings, radios, umbrales) va en un objeto de configuración al inicio de cada módulo (por ejemplo `RING_CONFIG`, `TRAIL_CONFIG`) para que yo los afine sin buscar números mágicos.
7. **Crea un** [`CLAUDE.md`](http://CLAUDE.md) en la raíz con: comandos (dev, build, preview), estructura de carpetas, convenciones, y la regla "toda animación se crea dentro de un `gsap.context()` y se limpia con `ctx.revert()` al desmontar la vista".
8. Commits pequeños en formato conventional commits (`feat:`, `fix:`, `chore:`), uno por fase como mínimo.

### 0.3 Preguntas que debes hacerme antes del plan

- ¿Nombre/handle a mostrar en el header y textos de hero? `TODO(yo)`
- ¿Cuántas fotos reales tengo para hero, trail y proyectos? (Mientras tanto genera placeholders, ver sección 4.)
- ¿Qué idioma de interfaz: español, inglés o bilingüe?
- ¿Dirección visual final? (sección 3 trae un default que puedo cambiar)
- ¿Dónde se va a desplegar (Vercel, Netlify, GitHub Pages, Cloudflare Pages)? Afecta el manejo de rutas (fallback a `index.html`).

---

## 1. Referencias (qué se toma de cada una)

No tienes que visitar los sitios. Aquí está todo lo observado.

### Referencia 1: [https://artemartemartem.com/](https://artemartemartem.com/) → HERO

Stack observado: GSAP + ScrollTrigger + Lenis (sobre un contenedor propio), Three.js para un fondo de video "TV vieja" (NO lo replicamos).

- Hero blanco con titular en dos líneas, peso 900, `letter-spacing` muy apretado (~ -0.08em), `line-height` menor a 1 (~0.73). Color casi negro `#0e0e0e`.
- Garabato verde fosforescente dibujado a mano sobre una palabra del titular, animado como trazo SVG.
- Debajo del titular, una **cápsula vertical** (aprox. 12.5vw × 35vh, `border-radius` totalmente redondeado) con una imagen dentro. Esa cápsula es una **ventana**: no es un elemento real, es un `clip-path: inset(...)` aplicado a la sección siguiente que está apilada debajo del hero, con el inset ajustado al rectángulo exacto de la cápsula.
- Al scrollear, un tween con `scrub` lleva el `clip-path` a `inset(0 round 0)`: la cápsula crece hasta cubrir toda la pantalla y revela la sección de proyectos (con las esquinas redondeadas al principio y rectas al final). Mientras se abre, el header se mantiene visible (cambia a color claro con `mix-blend-mode: difference` o clase).
- Un wrapper de ~3000px de alto con un hijo `position: sticky; top: 0; height: 100vh` actúa como "recorrido de scroll" de esa apertura.
- **Trail del mouse:** `<img>` normales en el DOM (PNG recortados sin fondo de ~240px de ancho), precargados en un contenedor oculto. Al mover el mouse, aparecen en la posición del cursor cada cierta distancia, se quedan un instante y se desvanecen. Se ven 5 o 6 a la vez. No es WebGL.
- Header de 3 elementos: izquierda, centro (nombre) y derecha; tipografía condensada y grande.

### Referencia 2: [https://www.gionatannese.com/](https://www.gionatannese.com/) → SECCIÓN DE PROYECTOS + TRANSICIONES

Stack observado: todo el sitio es un único `<canvas>` WebGL persistente entre rutas (0 `<img>` en el DOM), scroll virtual. NOSOTROS lo haremos con DOM + GSAP + Flip, no con WebGL.

- Home ("Creative Space"): tarjetas de proyecto flotando en un **anillo** irregular alrededor del centro. Al cargar vuelan al anillo; el scroll las rota y reordena; el movimiento general es radio → 0 (se juntan) y de vuelta (se expanden).
- **Click en una tarjeta:** las demás se desvanecen, la elegida se centra y crece, aparece debajo el título (`Nombre` + `Categoría`) y el cursor muestra la etiqueta "View".
- **Segundo click ("View"):** cambia la URL a `/projects/<slug>` y esa misma imagen se convierte en el hero del proyecto, sin corte ni recarga (el fondo/escena persiste).
- Página de proyecto: título centrado arriba, hero a todo el ancho, galería en grillas de 1 o 2 columnas con 8px de separación, bloques de texto pequeños, botón "Project Info" arriba a la izquierda, footer simple al final.
- Navegación superior pequeña: `GN.D` (logo) + links con superíndice numérico (1, 2, 3).
- El final del proyecto NO regresa solo a proyectos (eso lo diseñamos nosotros, sección 7).

### Referencia 3: [https://www.mikes.cv/](https://www.mikes.cv/) → TIMELINE PARA "ABOUT"

Stack observado: JS propio, sin GSAP detectado (lo haremos con GSAP). Metáfora de vuelo (avión, ventanilla, boarding pass); NO la copiamos, usaremos metáfora propia.

- Columna estrecha centrada (~40rem). Texto introductorio; debajo, una línea vertical de progreso.
- Línea de fondo punteada gris; encima una barra de color de acento que se **llena con el scroll**. Un ícono (avión) abre la línea con la etiqueta "FLIGHT PLAN" en mono diminuto, y una curva SVG lo conecta con la barra.
- Cada entrada: año en mono diminuto a la izquierda (con código de ciudad arriba en gris), un punto en la línea que se **ilumina** al llegar, fila de logos circulares (28px, ligeramente solapados), nombre en 16px, cargo, descripción en gris, y una lista de casos con miniatura (56px, tarjetas apiladas con rotación) + título + subtítulo.
- Las entradas aparecen con fade + desplazamiento vertical corto, en cascada.
- Un degradado fijo en la parte inferior de la ventana difumina lo que sale de pantalla.
- Cierre: texto de despedida + 5 fotos apiladas en abanico.
- Paleta: fondo crema `#faf5f5`, texto `#17160f`, un solo acento azul. Tipografías: sans, mono (fechas/labels) y una tipo LCD para detalles.

---

## 2. Stack y restricciones

- **Vite** + **JavaScript vanilla con ES modules** (sin React/Vue). JSDoc para tipos donde ayude.
- **GSAP** (paquete `gsap`; desde la 3.13 todos los plugins son gratis): `ScrollTrigger`, `Flip`, `SplitText`, `DrawSVGPlugin`, `MotionPathPlugin`. Verifica la versión instalada y que esos plugins vengan en el paquete de npm antes de importarlos.
- **Lenis** para scroll suave, sincronizado con `gsap.ticker`.
- CSS: archivos CSS planos con variables (sin Tailwind, sin preprocesadores).
- Fuentes: autohospedadas con `@fontsource` (permitido). Propuesta inicial, editable en `tokens.css`:
  - Display: una grotesca pesada (p. ej. "Archivo" 800/900 o "Familjen Grotesk")
  - Sans de texto: "Inter Tight"
  - Mono: "JetBrains Mono"
- Dev dependencies permitidas: `sharp` (script de optimización de imágenes), `playwright` (verificación).
- Nada de WebGL/Three.js. Nada de librerías de carrusel o de transición de páginas (el router es propio, ver sección 5).
- Navegadores objetivo: últimos 2 de Chrome, Firefox, Safari (incl. iOS).

---

## 3. Dirección visual y tokens `TODO(yo)`

Dirección por defecto (cámbiala si quiero otra): **Y2K / ASCII / collage**, con aire de terminal. Mucho espacio en blanco, tipografía grande, detalles en mono, un color de acento fosforescente.

Crea `src/styles/tokens.css` con, como mínimo:

```css
:root {
  --bg: #f4f1ea;           /* TODO(yo) */
  --ink: #0e0e0e;
  --ink-soft: #5a5a55;
  --rule: #cfcac0;
  --accent: #00e676;       /* acento fosforescente; TODO(yo) */
  --accent-ink: #00351a;

  --font-display: "Archivo", system-ui, sans-serif;
  --font-text: "Inter Tight", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --fs-hero: clamp(3rem, 6.2vw, 7rem);     /* titular del hero */
  --fs-title: clamp(2.2rem, 5vw, 5rem);    /* títulos de proyecto */
  --fs-body: clamp(0.95rem, 1.05vw, 1.05rem);
  --fs-mono: 0.6875rem;                    /* 11px, labels */

  --ls-display: -0.08em;
  --lh-display: 0.78;

  --gutter: clamp(12px, 2vw, 28px);
  --header-h: 56px;

  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out-expo: cubic-bezier(0.87, 0, 0.13, 1);
}

```

Reglas de estilo:

- Titulares en minúsculas, peso 800–900, `letter-spacing: var(--ls-display)`, `line-height: var(--lh-display)`.
- Labels y fechas en mono 11px, `text-transform: uppercase`, `letter-spacing: .08em`.
- Bordes redondeados solo en la cápsula/ventana y botones pequeños (radio 6px). Sin sombras fuertes.
- Detalle ASCII: separadores tipo `────`, corchetes `[ ]` en botones y labels, un cursor parpadeante `▍` en un par de lugares.

---

## 4. Estructura del proyecto y contenido

```
/
├─ BRIEF.md
├─ CLAUDE.md
├─ index.html
├─ vite.config.js
├─ package.json
├─ scripts/
│  ├─ make-placeholders.mjs   # genera imágenes placeholder con sharp
│  └─ optimize-images.mjs     # redimensiona y convierte a webp/avif
├─ public/
│  └─ assets/
│     ├─ hero/                # foto(s) de la cápsula/ventana
│     ├─ trail/               # 10–12 recortes con fondo transparente (.webp/.png)
│     ├─ projects/<slug>/     # cover.webp + galería
│     └─ about/               # logos, miniaturas de casos, fotos del abanico
└─ src/
   ├─ main.js                 # bootstrap: Lenis, ticker, router, cursor, header
   ├─ config.js               # configs de animación (RING_CONFIG, TRAIL_CONFIG, ...)
   ├─ router.js               # router con History API (sección 5)
   ├─ scroll.js               # Lenis + sync con ScrollTrigger + helpers de overscroll
   ├─ cursor.js               # cursor custom con estados/etiquetas
   ├─ data/
   │  ├─ projects.json
   │  └─ timeline.json
   ├─ views/
   │  ├─ home.js              # hero + (ventana) → proyectos (anillo)
   │  ├─ project.js           # vista de proyecto
   │  └─ about.js             # timeline
   ├─ components/
   │  ├─ header.js
   │  ├─ trail.js
   │  ├─ ring.js              # anillo de tarjetas
   │  └─ timeline.js
   └─ styles/
      ├─ tokens.css
      ├─ base.css
      ├─ header.css
      ├─ home.css
      ├─ project.css
      └─ about.css

```

### 4.1 Placeholders

Mientras no tenga mis fotos, `scripts/make-placeholders.mjs` debe generar con `sharp`:

- 3 imágenes de hero (1600×2000, degradados + ruido, con texto "HERO 1/2/3").
- 12 recortes para trail (PNG/WebP con transparencia, 480×640, formas simples tipo sticker con número).
- 8 proyectos con `cover.webp` (900×1200, ratios variados: 3:4, 4:5, 1:1, 5:4) y 6 imágenes de galería cada uno. El sitio debe funcionar completo con placeholders; luego solo reemplazo archivos con los mismos nombres.

### 4.2 `projects.json` (esquema)

```json
[
  {
    "slug": "proyecto-uno",
    "title": "proyecto uno",
    "category": "Web / Seguridad",
    "year": 2026,
    "role": "Desarrollo",
    "cover": "/assets/projects/proyecto-uno/cover.webp",
    "coverRatio": 0.75,
    "info": "Texto corto para el panel Project Info.",
    "blocks": [
      { "type": "full", "src": "..." },
      { "type": "pair", "src": ["...", "..."] },
      { "type": "text", "text": "Párrafo corto." },
      { "type": "full", "src": "..." }
    ]
  }
]

```

Crea 8 entradas de ejemplo. `TODO(yo)`: yo reemplazo con proyectos reales.

### 4.3 `timeline.json` (esquema y contenido inicial `TODO(yo)`)

```json
[
  {
    "year": 2026, "code": "MX", "current": true,
    "org": "UPIITA-IPN", "role": "Proyecto Terminal",
    "text": "Cierre de Ingeniería en Telemática (graduación prevista dic 2026).",
    "logos": [], "cases": []
  },
  {
    "year": 2024, "code": "MX", "current": false,
    "org": "RyR", "role": "Developer",
    "text": "Consultoría de seguridad. Desarrollo y herramientas internas.",
    "logos": [], "cases": []
  },
  {
    "year": 2023, "code": "MX", "current": false,
    "org": "Mácara Café", "role": "Backend / Infra (freelance)",
    "text": "Backend e infraestructura para un negocio local.",
    "logos": [], "cases": []
  }
]

```

Los `cases` son opcionales; cada uno: `{ "title", "desc", "thumbs": ["..."] }`. Debe soportar entradas con 0, 1 o varios casos.

---

## 5. Arquitectura (la parte más importante)

**Una sola página (SPA) con router propio sobre la History API.** El objetivo es que NUNCA se perciba una recarga y que la vista de proyectos (anillo) siga viva debajo cuando abro un proyecto.

- Rutas: `/` (home: hero + ventana + anillo de proyectos), `/projects/:slug`, `/about`. Opcional: `/projects` como alias que hace scroll al anillo dentro de home.
- Capas persistentes en `#app`: `header`, `cursor`, `#layer-ring` (anillo) y `#view-root` (donde se monta la vista actual). **El anillo no se destruye al abrir un proyecto**: se pausa (animaciones en pausa, `visibility: hidden` al final de la transición) y conserva su estado (rotación actual, tarjeta enfocada).
- Cada vista exporta `{ mount(ctx, params), unmount(), enter(from), leave(to) }`. `enter/leave` devuelven una timeline de GSAP. El router orquesta: bloquea input (`pointer-events: none` en `#app` y `lenis.stop()`), corre `leave` y `enter`, actualiza `document.title`, anuncia la ruta en un `aria-live="polite"`, hace `lenis.start()` y `ScrollTrigger.refresh()`.
- `popstate` (botón atrás/adelante) debe reproducir las mismas transiciones en sentido inverso.
- Los links son `<a href>` reales; el router intercepta el click (sin modificadores) y respeta `target`, `download` y links externos.
- Si el usuario entra directo a `/projects/<slug>` (refresh), se monta esa vista con una animación de entrada simple (sin Flip), y el anillo se prepara en segundo plano.
- `vite.config.js` con fallback a `index.html` y un `_redirects`/`vercel.json` según el hosting que elija.

### Scroll global (`scroll.js`)

- `new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.2 })`.
- Sincronización estándar: `lenis.on('scroll', ScrollTrigger.update)`, `gsap.ticker.add(t => lenis.raf(t * 1000))`, `gsap.ticker.lagSmoothing(0)`.
- Exporta helpers: `stop()`, `start()`, `scrollTo(target, opts)`, `onScroll(cb)` y `getVelocity()`.
- En cada cambio de vista: `lenis.scrollTo(0, { immediate: true })`.
- Respeta `prefers-reduced-motion`: desactiva suavizado (`lerp: 1`) y reduce todas las animaciones (sección 10).

---

## 6. HOME, parte 1: HERO (referencia 1)

### 6.1 Layout

- Sección `.hero` de `100vh` dentro de un `.hero-wrap` que mide \~`400vh` (es el recorrido del scroll). `.hero-stage` es `position: sticky; top: 0; height: 100vh; overflow: hidden`.
- Capas dentro de `.hero-stage` (de atrás hacia adelante):
  1. `.window-layer`: capa a pantalla completa con la foto/fotos de la ventana. Su `clip-path` define la cápsula.
  2. `.hero-content`: titular, cápsula "fantasma" (solo para medir) y texto "about".
  3. `#trail`: contenedor `position: fixed; inset: 0; pointer-events: none; z-index` por encima del hero y debajo del header.
- Titular: dos líneas, centrado, `--fs-hero`, display, minúsculas. Línea 1: saludo corto. Línea 2: mi nombre. `TODO(yo)`.
- Un SVG de garabato (trazo grueso, color `--accent`) sobre una palabra del titular. Créalo como `<path>` simple dibujado a mano (tú genera uno razonable) con `stroke-linecap: round`.
- Debajo del titular, un párrafo corto centrado (max 38ch) con mi rol. `TODO(yo)`: "Desarrollador enfocado en seguridad y cloud..." y un indicador "scroll" en mono con un ícono de mouse que flota (loop `y: 0 → 6`, 1.2s, `sine.inOut`, yoyo).
- Cápsula fantasma `.capsule-ghost`: `width: 12.5vw` (mín. 120px, máx. 220px), `height: 35vh` (mín. 220px), centrada horizontalmente, `border-radius: 999px`. Es un `div` invisible solo para medir el rectángulo; la imagen real se ve a través del `clip-path` de `.window-layer`.

### 6.2 Cómo funciona la ventana (implementar exactamente así)

1. `.window-layer` es `position: absolute; inset: 0` con la(s) foto(s) en `object-fit: cover`.
2. Función `getCapsuleInset()` lee `getBoundingClientRect()` de `.capsule-ghost` relativo al stage y devuelve el string: `inset(${top}px ${vw - right}px ${vh - bottom}px ${left}px round 999px)`.
3. Estado inicial: `gsap.set('.window-layer', { clipPath: getCapsuleInset() })`.
4. Timeline con ScrollTrigger sobre `.hero-wrap`: 
   ```js
   const open = gsap.timeline({  scrollTrigger: {    trigger: '.hero-wrap', start: 'top top', end: '+=150%',    scrub: 0.6, invalidateOnRefresh: true  }});open  .fromTo('.window-layer',    { clipPath: () => getCapsuleInset() },    { clipPath: 'inset(0px 0px 0px 0px round 0px)', ease: 'power2.inOut', duration: 1 }, 0)  .fromTo('.window-photo', { scale: 1.35 }, { scale: 1, ease: 'none', duration: 1 }, 0)  .to('.hero-content', { yPercent: -12, autoAlpha: 0, ease: 'none', duration: 0.5 }, 0)  .to('.header', { '--header-ink': 'var(--bg)' }, 0.55);
   
   ```
5. Foto(s): si hay más de una, hacer crossfade escalonado según el progreso (foto 2 entra a 35%, foto 3 a 70%), con `opacity` y un leve `scale`.
6. Tras abrir la ventana por completo (progreso 1) debe aparecer encima de la foto un **statement grande** (3–4 palabras, display, blanco con `mix-blend-mode: difference`) que luego da paso al anillo de proyectos (sección 7): el anillo se monta DENTRO de la ventana abierta, es decir, el fondo de la sección de proyectos es la foto/color de la ventana.
7. `ScrollTrigger.addEventListener('refreshInit', ...)` para recalcular el inset en resize.

### 6.3 Animación de entrada (primera carga)

Preloader mínimo (solo en la primera visita de la sesión, guardar flag en `sessionStorage` dentro de `try/catch`): pantalla `--bg` con contador 0→100 centrado en mono, 1.2s, `power2.inOut`; al terminar, sube con `yPercent: -100` (0.7s `--ease-in-out-expo`). Botón "skip" accesible.

Secuencia del hero (`gsap.timeline({ defaults: { ease: 'expo.out' } })`):

1. Titular: cada línea con `overflow: hidden` en su contenedor; el texto sube de `yPercent: 110` a `0`, `duration: 1.0`, `stagger: 0.08`.
2. Cápsula/ventana: `clip-path` de `inset(50% 45% 50% 45% round 999px)` al inset de la cápsula, `duration: 1.1`, empezando a `-=0.6`.
3. Garabato: `DrawSVGPlugin` de `0%` a `100%`, `duration: 0.9`, `ease: 'power2.inOut'`, a `-=0.4`.
4. Párrafo "about" e indicador de scroll: `autoAlpha 0→1`, `y: 16→0`, `duration: 0.8`, `stagger: 0.12`.
5. Header: baja desde `yPercent: -100`, `duration: 0.7`, al final.
6. Solo cuando termina la secuencia: activar el trail.

### 6.4 Trail con mis fotos (`components/trail.js`)

```js
export const TRAIL_CONFIG = {
  size: 220,            // ancho px en desktop
  sizeMobile: 0,        // 0 = desactivado en táctil
  minDist: 90,          // distancia mínima entre apariciones (px); escalar: clamp(70, innerWidth*0.08, 120)
  popDuration: 0.45,
  popEase: 'back.out(1.7)',
  hold: 0.5,
  fadeDuration: 0.55,
  fadeEase: 'power2.in',
  rotationRange: 10,    // grados +/-
  startScale: 0.6,
  endScale: 0.85,
  drift: -24,           // px hacia arriba al desaparecer
  maxActive: 8,
  pool: 12
};

```

Comportamiento:

- Pool de `pool` elementos `<img>` reutilizados en ciclo (no crear/destruir nodos). `position: absolute; left: 0; top: 0; will-change: transform, opacity`, con `xPercent: -50, yPercent: -50` y la posición con `x/y` de GSAP.
- Listener `pointermove` (solo `pointerType === 'mouse'`). Calcular distancia desde el último spawn; si `< minDist`, ignorar. Actualizar `last` y spawnear el siguiente del pool: 
  ```js
  gsap.killTweensOf(img);gsap.timeline()  .set(img, { x, y, rotation: gsap.utils.random(-R, R), scale: startScale, autoAlpha: 1, zIndex: ++z })  .to(img, { scale: 1, duration: popDuration, ease: popEase })  .to(img, { autoAlpha: 0, scale: endScale, y: `+=${drift}`, duration: fadeDuration, ease: fadeEase }, `+=${hold}`);
  
  ```
- Las imágenes son recortes con transparencia (mis fotos sin fondo o con bordes redondeados); si una foto es rectangular, aplicar `border-radius: 6px` por CSS.
- El trail solo está activo mientras el hero es visible: `ScrollTrigger.create({ trigger: '.hero-wrap', start: 'top top', end: '+=40%', onLeave: disable, onEnterBack: enable })`. Al desactivar, termina los tweens activos con un fade rápido de 0.2s.
- Desactivado por completo en `pointer: coarse` y en `prefers-reduced-motion`.
- Precarga todas las imágenes del trail antes de activarlo (`img.decode()`).

---

## 7. HOME, parte 2: PROYECTOS en anillo (referencia 2)

### 7.1 Layout y datos

- Sección `.work` ocupa `100vh` (dentro de la ventana ya abierta). El anillo es el contenido principal.
- Una tarjeta por proyecto de `projects.json`. Cada `.card`: `position: absolute; left: 50%; top: 50%`, `height: clamp(110px, 16vh, 190px)` y ancho según `coverRatio`; la imagen cubre la tarjeta (`object-fit: cover`), sin borde, `border-radius: 2px`. Cada tarjeta es un `<a href="/projects/<slug>">` (accesible por teclado) con `aria-label` = título.
- Título del proyecto y categoría NO se ven en reposo.

### 7.2 Motor del anillo (`components/ring.js`)

Un **objeto proxy** compartido y una función `place()` que reposiciona todas las tarjetas. Los tweens animan el proxy, nunca las tarjetas una por una.

```js
export const RING_CONFIG = {
  radius: () => Math.min(innerWidth, innerHeight) * 0.34,
  ellipse: 1.15,             // rx = r * ellipse, ry = r
  floatAmp: [6, 12],         // px de flotación por tarjeta (aleatorio por tarjeta)
  floatSpeed: [0.15, 0.35],  // ciclos/seg por tarjeta
  idleSpin: 0.0006,          // rad/frame de giro lento
  scrollSpin: 0.0004,        // rad por unidad de velocidad de Lenis
  jitter: 0.18,              // variación de ángulo por tarjeta (rad)
  radialJitter: 0.12,        // variación del radio por tarjeta (±12%)
  depth: [0.85, 1.1],        // escala por tarjeta según su "profundidad"
  intro: { fly: 1.4, hold: 0.8, gather: 0.9, expand: 1.3 }
};
const s = { r: 0, rot: 0, spread: 1 };

```

- Cada tarjeta guarda: `phase = i / N * 2π + jitterAngle`, `rJit`, `depth`, `floatAmp`, `floatSpeed`, `floatSeed`.
- `place()` para cada tarjeta: `a = s.rot + phase`; `r = s.r * rJit`; `x = cos(a) * r * ellipse`; `y = sin(a) * r`; sumar flotación `sin(t*floatSpeed*2π + seed) * floatAmp` en `y` y un poco en `x`; `scale = depth * s.spread`; aplicar con `gsap.set(el, { x, y, scale, xPercent: -50, yPercent: -50 })`. Usar `gsap.quickSetter` por tarjeta para rendimiento.
- Loop en `gsap.ticker`: `s.rot += idleSpin + lenisVelocity * scrollSpin` (suavizar la velocidad con `gsap.quickTo`), llamar `place()`. Pausable (`ring.pause()` / `ring.resume()`).
- Opcional (nice to have): `skewY` leve proporcional a la velocidad de scroll, máx. 6°, regresando a 0.

### 7.3 Secuencia "flotan → se juntan → se expanden"

Timeline replicable `ring.playIntro()` (también expuesta en dev como `window.__replayRing()`):

1. **Entrada:** estado inicial `s.r = 0`, cada tarjeta con `autoAlpha: 0`. Las tarjetas hacen fade-in con `stagger: { each: 0.05, from: 'random' }` mientras `s.r` va de `0` a `radius()` en `fly` segundos, `expo.out`. Resultado: flotan en círculo.
2. **Hold:** `hold` segundos de flotación visible.
3. **Se juntan:** `s.r` → `radius() * 0.12`, `s.spread` → `0.7`, `gather` segundos, `power3.inOut`. Las tarjetas quedan casi apiladas al centro, con la rotación continuando.
4. **Se expanden:** `s.r` → `radius()`, `s.spread` → `1`, `expand` segundos, `expo.out` con ligero overshoot (`back.out(1.2)` sobre `r`). Termina en el anillo estable.

- Esta secuencia corre una vez cuando la ventana termina de abrirse (progreso 1 del hero) y también se usa (versión corta: solo pasos 3–4, 0.9s en total) al regresar de un proyecto.
- Debe ser **interrumpible**: si el usuario hace scroll o click a mitad, se completa instantáneamente con `timeline.progress(1)` y se entrega el control.

### 7.4 Hover

- En hover de una tarjeta (solo `pointer: fine`): la tarjeta `scale *= 1.12` (tween del multiplicador individual, 0.35s `power3.out`), las demás bajan a `autoAlpha: 0.35` (0.3s). El cursor custom muestra una etiqueta mono con el título (`[ proyecto uno ]`).
- Al salir, todo regresa.

### 7.5 Click 1: enfocar tarjeta

`ring.focus(card)` (primer click sobre una tarjeta; `preventDefault` al link):

1. Pausar el giro del anillo (`ring.pause()` con un fade del `idleSpin` a 0 en 0.4s).
2. Las demás tarjetas: `autoAlpha: 0`, `scale: 0.8`, `duration: 0.5`, `power2.out`, `stagger: { amount: 0.25, from: <índice de la elegida> }`.
3. La elegida va al centro: `x: 0, y: -2vh`, escala para que su alto sea `60vh` (calcular `scale = 0.6*innerHeight / cardHeight`), `duration: 0.9`, `--ease-in-out-expo`.
4. Debajo aparece un bloque: `title` (display, 28–36px) + `category` (mono, uppercase) con `y: 12→0`, `autoAlpha 0→1`, 0.5s, a `-=0.4`.
5. El cursor cambia a la etiqueta `View`. Un click fuera de la tarjeta o `Esc` ejecuta `ring.unfocus()` (la timeline inversa, 0.7s) y reanuda el giro.
6. Teclado: Enter en una tarjeta enfocada (tab) = click 1; Enter otra vez = click 2.

### 7.6 Click 2: abrir el proyecto (transición con Flip)

1. `const state = Flip.getState(focusedCard.img)`.
2. El router monta la vista `project` con un `<img class="project-hero">` en el lugar del hero (misma `src`), oculta temporalmente (la imagen del anillo se mantiene visible hasta que Flip termine).
3. `Flip.from(state, { targets: heroImg, duration: 1.1, ease: 'expo.inOut', absolute: true, scale: false })` transforma la tarjeta en el hero a todo el ancho. Mientras tanto: header cambia a modo "proyecto" (aparece el botón `[ project info ]` a la izquierda, `x: -12→0`, 0.5s), el título del proyecto sube a su posición (SplitText por líneas, `yPercent: 100→0`, `stagger: 0.06`), y el anillo hace `autoAlpha: 0` al final y se pausa.
4. URL: `history.pushState({}, '', '/projects/<slug>')`.
5. `lenis.start()`, `ScrollTrigger.refresh()` al terminar.

---

## 8. VISTA DE PROYECTO (`views/project.js`)

### 8.1 Layout

- Bloque superior: espacio `~22vh`, luego título (display, `--fs-title`, centrado) y categoría + año en mono.
- Hero: imagen a todo el ancho, respetando el ratio de la imagen, margen lateral `var(--gutter)`.
- Galería: grilla de `blocks` con separación `8px` (variable `--gap-media`):
  - `full`: ocupa todo el ancho.
  - `pair`: 2 columnas iguales; en móvil, 1 columna.
  - `text`: bloque de texto pequeño (mono o sans 12–13px), `max-width: 28ch`, alineado a la derecha o izquierda alternando.
- Botón `[ project info ]` (fijo arriba izquierda) abre un panel lateral de 360px (desktop) o bottom sheet (móvil) con `info`, `role`, `year`; apertura con `xPercent: -100 → 0`, 0.6s `expo.out`; cierra con Esc o click fuera. Foco atrapado en el panel mientras está abierto.
- Footer mínimo al final (copyright en mono).

### 8.2 Animaciones de scroll

- Cada medio de la galería: contenedor con `overflow: hidden`; al entrar (`start: 'top 85%'`) revela con `clipPath: inset(0 0 100% 0)` → `inset(0 0 0% 0)` (0.9s `expo.out`) y la imagen interna `scale: 1.18 → 1` con `scrub: true` mientras cruza el viewport (parallax suave, `yPercent: -6 → 6`).
- Textos: `autoAlpha` + `y: 20 → 0`, 0.7s, `power3.out`.
- Todo dentro de un `gsap.context()` ligado a la vista.

### 8.3 Regreso natural a Proyectos ("pull to continue") `TODO(yo): quiero que se sienta sin recarga`

Objetivo: al llegar al final del proyecto y **seguir scrolleando**, el contenido sube y se revela el anillo de proyectos que ya estaba esperando debajo, como si el scroll no se hubiera detenido nunca.

Diseño:

1. Al final de la vista de proyecto hay una zona `.return-zone` de `~30vh` con una barra de progreso fina (2px, ancho 160px, centrada) y un label mono: `[ sigue scrolleando → proyectos ]`. Aparece con fade cuando se llega al final del scroll (`lenis.scroll >= lenis.limit - 2`).
2. **Acumulador de overscroll** (`scroll.js › createOverscroll({ onProgress, onComplete, threshold })`):
   - `wheel`: si `atEnd && e.deltaY > 0` → `pull = clamp(pull + e.deltaY / 1400, 0, 1)`.
   - `touchmove`: igual con el delta del dedo (`/ 600`).
   - Teclado: `PageDown`, `End`, `ArrowDown`, `Space` cuando `atEnd` suman `+0.25` por pulsación.
   - Decaimiento: si pasan `450ms` sin input, o el usuario scrollea hacia arriba, `pull` regresa a 0 con `[gsap.to](http://gsap.to)(state, { pull: 0, duration: 0.4, ease: 'power3.out' })`.
   - Mientras `pull > 0` NO se hace scroll nativo extra: es solo el acumulador (Lenis ya está en el límite).
3. **Feedback progresivo** según `pull` (0→1, aplicado con `gsap.quickTo` para suavizar):
   - Barra de progreso: `scaleX = pull`.
   - Contenido del proyecto: `y = -pull * 48px`, `opacity = 1 - pull * 0.35`.
   - Anillo (capa persistente debajo): `autoAlpha = pull * 0.6`, `scale = 1.06 - pull * 0.06`, para que se "asome".
4. **Al completar (**`pull >= 1`**)**, `leave` de proyecto + `enter` de home en una sola timeline (`~1.1s`):
   - Vista de proyecto: `yPercent: -100` (sale hacia arriba), `--ease-in-out-expo`.
   - Anillo: `autoAlpha: 1`, `scale: 1`, y `ring.playIntro({ short: true })` (juntarse → expandirse, 0.9s) para que "reaparezca vivo".
   - Header vuelve al modo home; botón `project info` sale.
   - `history.pushState({}, '', '/')` (o `/projects`), `ScrollTrigger.refresh()`, y `lenis` se posiciona en la sección de proyectos (`immediate`), no al inicio del hero.
5. Debe cancelarse limpiamente si el usuario hace scroll hacia arriba antes de completar. Un botón visible `[ proyectos ]` en el header siempre hace la misma transición como alternativa. Con `prefers-reduced-motion`: crossfade simple de 0.3s.
6. Atrás del navegador desde `/` hacia `/projects/<slug>` y viceversa deben reutilizar estas mismas timelines.

---

## 9. ABOUT con timeline (referencia 3) (`views/about.js`, `components/timeline.js`)

### 9.1 Layout

- Columna centrada `max-width: 40rem`, padding lateral `var(--gutter)`.
- Cabecera: `[ about ]` en mono + frase de presentación (display grande, 2–3 líneas) + párrafo corto. Entra con SplitText por líneas, `yPercent: 100 → 0`, `stagger: 0.08`.
- Debajo, `.timeline-track` con:
  - **Riel de fondo** (`.rail`): línea vertical de 1px a la izquierda, punteada (`border-left: 1px dashed var(--rule)`).
  - **Riel iluminado** (`.rail-lit`): línea de 2px, color `--accent`, misma posición, `transform-origin: top`, `scaleY` animado por scroll.
  - **Ícono guía** (`.rail-icon`): glifo ASCII/Y2K propio (p. ej. `▲`, `>_` o un cursor `▍`) que viaja en la punta de la barra iluminada. Etiqueta `[ log ]` en mono 10px arriba.
  - **Curva de conexión** (SVG `<path>`) entre el párrafo y el inicio del riel: se dibuja con `DrawSVGPlugin` (0% → 100%) al entrar en viewport, 0.9s `power2.inOut`.
- Cada `.tl-entry` (flex, 2 columnas):
  - Izquierda (ancho 64px, alineado a la derecha): `code` (mono 9px, gris) sobre `year` (mono 13px).
  - Punto (`.tl-dot`, 10px, borde 1px, fondo `--bg`) centrado sobre el riel; estado `.is-active` = relleno `--accent` + halo animado (pulso: `scale 1 → 2.2`, `opacity .5 → 0`, 1.6s infinito).
  - Derecha: fila de `logos` (circulares 28px, solape `-8px`), `org` (16px) + etiqueta `CURRENT` si aplica (mono, color acento), `role` (16px, `--ink-soft`), `text` (gris, 15px), y `cases`.
  - `case`: miniaturas apiladas (56px con rotaciones `-6°, 0°, 6°`), título (14px) y descripción (13px, gris).

### 9.2 Animaciones

```js
const track = document.querySelector('.timeline-track');
const trig = { trigger: track, start: 'top 60%', end: 'bottom 60%', scrub: 0.4, invalidateOnRefresh: true };

// 1. Barra iluminada
gsap.fromTo('.rail-lit', { scaleY: 0 }, { scaleY: 1, ease: 'none', transformOrigin: 'top', scrollTrigger: trig });

// 2. Ícono en la punta de la barra
gsap.to('.rail-icon', { y: () => track.offsetHeight, ease: 'none', scrollTrigger: trig });

// 3. Entradas en cascada
ScrollTrigger.batch('.tl-entry', {
  start: 'top 82%',
  onEnter: els => gsap.fromTo(els,
    { autoAlpha: 0, y: 28 },
    { autoAlpha: 1, y: 0, stagger: 0.12, duration: 0.8, ease: 'power3.out', overwrite: true })
});

// 4. Punto activo por entrada
gsap.utils.toArray('.tl-entry').forEach(el => ScrollTrigger.create({
  trigger: el, start: 'top 60%', end: 'bottom 60%',
  toggleClass: { targets: el, className: 'is-active' }
}));

```

- Sub-animaciones por entrada: logos con `scale 0 → 1`, `stagger 0.06`, `back.out(2)`; cases con miniaturas que se "abren" de apiladas a rotaciones finales (`rotation` y `x`), 0.6s `power3.out`.
- **Velo inferior:** `<div class="veil">` `position: fixed; bottom: 0; left: 0; right: 0; height: 160px; pointer-events: none; background: linear-gradient(to top, var(--bg), transparent)`. Opcional: `backdrop-filter: blur(6px)` con `mask-image: linear-gradient(to top, black, transparent)`.
- **Cierre:** texto de despedida + `.memories` con 5 fotos apiladas en abanico. Al entrar al viewport, pasan de apiladas (`rotation: 0`, `x: 0`) a abanico (`rotation: -10, -5, 0, 5, 10`, `x: -60 … +60`), `stagger: 0.07`, `0.8s`, `back.out(1.4)`. En hover el abanico se abre más (`x ±90`).
- Todo en `gsap.context()`; `ctx.revert()` en `unmount`.

---

## 10. Global: header, cursor, a11y, rendimiento

### 10.1 Header (`components/header.js`)

- `position: fixed; top: 0; width: 100%; height: var(--header-h)`; 3 zonas: izquierda (`[ project info ]` en vistas de proyecto, vacío en el resto), centro (nombre + links `home¹ · projects² · about³` con superíndice numérico), derecha (toggle de sonido NO; en su lugar: `[ contact ]` que abre un `mailto:` o panel).
- Color de texto con `mix-blend-mode: difference` y fondo transparente, para que se lea sobre cualquier foto.
- Link activo: subrayado animado (`scaleX 0 → 1`, 0.4s). Hover: cada letra baja y sube (SplitText chars, `yPercent`, `stagger: 0.02`), sutil.
- Polish opcional (fase final): botones con efecto "gooey" mediante filtro SVG (`feGaussianBlur` + `feColorMatrix`) al hacer hover.

### 10.2 Cursor (`cursor.js`)

- Punto de 10px (`--ink`, `mix-blend-mode: difference`) que sigue al mouse con `gsap.quickTo(x/y, { duration: 0.35, ease: 'power3' })`.
- Estados: `default`, `link` (escala 2.2), `view` (círculo de 72px con texto `View`), `label` (texto libre en mono, usado en hover de tarjeta), `hidden` (en inputs). Solo en `pointer: fine`; oculta el cursor nativo únicamente cuando el custom está activo.

### 10.3 Accesibilidad

- Estructura semántica: `header`, `nav`, `main`, `footer`; solo un `h1` por vista; los títulos de tarjetas son `aria-label` del link.
- Foco visible siempre (`:focus-visible` con outline `2px var(--accent)`); orden de tab lógico; `Esc` cierra paneles y desenfoca tarjeta.
- `aria-live="polite"` que anuncia el nombre de la vista tras cada navegación; mover el foco al `h1` de la nueva vista.
- Skip link "ir al contenido".
- `prefers-reduced-motion: reduce` (con `gsap.matchMedia()`): sin trail, sin giro del anillo ni flotación, sin parallax, sin scrub de clip-path (la ventana se abre con un fade de 0.4s al hacer click en un botón `[ ver proyectos ]`), transiciones de vista = crossfade de 0.3s. Lenis con `lerp: 1`.
- Contraste mínimo AA en texto sobre fotos (usa overlay o `mix-blend-mode` donde haga falta).
- Todas las imágenes con `alt` útil (decorativas: `alt=""`).

### 10.4 Responsive (`gsap.matchMedia()`)

- Desktop ≥ 1024px: todo lo descrito.
- Tablet 640–1023px: anillo con radio `0.3*min(vw,vh)`, tarjetas más pequeñas, capsula `18vw`; trail desactivado si es táctil.
- Móvil &lt; 640px: titular `--fs-hero` mínimo 3rem; cápsula `34vw × 30vh`; anillo con 8 tarjetas visibles máximo (las demás en `display: none`), radio `0.36*vw`; timeline con año arriba de la entrada (1 columna); `pair` de galería en 1 columna; cursor y trail desactivados; el pull-to-continue usa `touchmove`.
- Usar `100svh`/`dvh` (con fallback a `vh`) por la barra del navegador móvil.

### 10.5 Rendimiento

- Animar solo `transform`, `opacity`, `clip-path` (y `filter` con cuidado). Nada de `top/left/width/height` en loops.
- `will-change` solo durante animaciones activas; quítalo al terminar.
- Imágenes: `scripts/optimize-images.mjs` genera `webp` (y `avif` si el peso baja) en 2–3 tamaños; usar `srcset`/`sizes`; `loading="lazy"` y `decoding="async"` salvo hero/primera pantalla (preload).
- Pool de nodos (trail), `quickSetter` y `quickTo` en loops; un solo `ticker` compartido; los loops se pausan cuando la capa no es visible (`IntersectionObserver` o estados del router).
- Tras cargar imágenes: `ScrollTrigger.refresh()` (usar `ScrollTrigger.addEventListener('refresh')` solo para recalcular medidas, nunca para disparar animaciones).
- Meta: Lighthouse performance ≥ 85 en móvil con imágenes optimizadas; CLS &lt; 0.05; sin long tasks &gt; 100 ms durante las animaciones en un laptop normal.
- Limpieza: toda vista implementa `unmount()` con `ctx.revert()`, `ScrollTrigger.getAll().forEach(t => t.kill())` de la vista, y removal de listeners.

---

## 11. Criterios de aceptación globales

1. Sin errores ni warnings en consola en ninguna ruta.
2. Navegar entre `/`, `/projects/:slug` y `/about` NUNCA recarga la página ni parpadea en blanco. El botón atrás/adelante reproduce las transiciones.
3. La ventana del hero se abre de forma continua y reversible al scrollear (subir cierra la ventana de nuevo hasta la cápsula, sin saltos).
4. El trail se activa solo con mouse, no deja tarjetas "colgadas" y no baja de 55 fps en un laptop medio.
5. La secuencia flotar → juntarse → expandirse se ve igual en cada visita, es interrumpible y no deja tarjetas en estados intermedios.
6. Click 1 enfoca y click 2 abre el proyecto con la misma imagen transformándose (sin parpadeo). `Esc` o click fuera desenfoca.
7. El pull-to-continue funciona con rueda, trackpad, táctil y teclado; se cancela al subir; y al completarse deja el anillo vivo, en la misma rotación, y la URL correcta.
8. El timeline: la barra se llena de forma proporcional al scroll, el ícono sigue su punta, los puntos se iluminan al pasar, y todo es reversible al subir.
9. Con `prefers-reduced-motion` activado el sitio completo es usable sin ninguna animación de movimiento.
10. `npm run build` pasa sin errores y `npm run preview` se comporta igual que dev.

---

## 12. Plan sugerido por fases (propón ajustes en tu plan)


| Fase | Entregable                                                                                                                                                               | Verificación                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| 0    | Scaffold: Vite, estructura de carpetas, [`CLAUDE.md`](http://CLAUDE.md), tokens, fuentes, placeholders (`make-placeholders`), `projects.json`/`timeline.json` de ejemplo | `npm run dev` abre sin errores; placeholders generados        |
| 1    | Núcleo: Lenis + ticker, router con vistas vacías, header, cursor, transición básica de vistas, `aria-live`, reduced-motion base                                          | Navegar entre 3 rutas sin recarga; atrás/adelante funcionan   |
| 2    | HERO: preloader, tipografía, garabato SVG, cápsula, secuencia de entrada                                                                                                 | Entrada correcta, responsive básico                           |
| 3    | VENTANA: clip-path scrub, foto(s) con parallax, statement                                                                                                                | Abre y cierra sin saltos, resize recalcula inset              |
| 4    | TRAIL con pool y activación/desactivación por scroll                                                                                                                     | 55+ fps, sin nodos creados en runtime                         |
| 5    | ANILLO: motor con proxy, flotación, giro con scroll, intro (flotar→juntar→expandir), hover                                                                               | Secuencia interrumpible; replay con `__replayRing()`          |
| 6    | Enfocar tarjeta (click 1) + Flip a proyecto (click 2) + vista de proyecto (layout, reveals, panel info)                                                                  | Transición sin parpadeo; refresh directo en `/projects/:slug` |
| 7    | PULL-TO-CONTINUE: acumulador, feedback progresivo, regreso al anillo, cancelación, botón alterno                                                                         | Probar rueda, trackpad, táctil, teclado, y cancelar           |
| 8    | ABOUT: timeline completo, velo, cierre con abanico                                                                                                                       | Barra e ícono sincronizados; reversible                       |
| 9    | Responsive/móvil, `matchMedia`, reduced-motion, a11y pass, optimización de imágenes, Lighthouse                                                                          | Checklist de la sección 11                                    |
| 10   | Polish: gooey nav, microinteracciones, ajuste fino de tiempos con mis valores                                                                                            | Revisión conmigo                                              |


Al final de cada fase entrégame: (a) qué hiciste, (b) cómo probarlo, (c) qué constantes de config conviene afinar, (d) riesgos o decisiones pendientes.

**Empieza ahora: haz las preguntas de la sección 0.3 y entrégame el plan. No escribas código todavía.**