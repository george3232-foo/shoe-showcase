# AIR SERIES — 3D Scroll Shoe Showcase

A scroll-driven 3D sneaker landing page. A real 3D shoe rotates, recolors, and
zooms as you scroll, floating in a calm "botanical drift" scene of backlit
petals with cinematic depth of field. Built with React + react-three-fiber.

## 🔗 Live demo

**https://george3232-foo.github.io/shoe-showcase/**

Works on any device — open it on desktop or mobile. The shoe auto-fits narrow
screens, and text stays legible over the model on phones.

## Features

- **Scroll-driven 3D** — `@react-three/drei` `ScrollControls` + `useScroll`
  drive rotation, scale and pose across 5 sections (hero → 360° → color → Zoom
  Air → CTA).
- **Live color configurator** — tap swatches to recolor individual shoe parts
  (laces, mesh, sole, stripes) in real time.
- **Botanical Drift background** — translucent backlit petals + bokeh in a dark
  void; season palette shifts spring-pink → dusk-lilac on scroll; petals catch a
  warm glint and drift in a breeze near the cursor.
- **Real depth of field** — post-process DoF keeps the shoe sharp while petals
  fall naturally out of focus by their true depth.
- **Responsive** — shoe scales to fit portrait viewports; mobile-tuned typography.

## Tech

React 19 · three.js · @react-three/fiber · @react-three/drei ·
@react-three/postprocessing · Vite.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build -> dist/
```

## Deploy

Pushing to `main` builds and deploys to GitHub Pages via
`.github/workflows/deploy.yml`.

## Credits

- 3D model: **shoe-draco.glb** from [drcmda/floating-shoe](https://github.com/drcmda/floating-shoe) (MIT).
- Built with the [Poimandres](https://pmnd.rs) (pmndrs) ecosystem.
