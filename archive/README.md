Digital Hazard Studio — Static Site

Overview
- Two pages: `index.html` (studio site) and `present.html` (Project Cobalt pitch deck)
- Shared styles: `styles.css`
- Scripts:
  - `index.js` — site interactions, animations, gamification demo
  - `present.js` — deck navigation, gamification, mini‑game, background
  - `threejs-background.js` — Three.js background for the home page
  - Three.js (v0.170.0) via CDN import maps on both pages
  - GSAP (v3.13.0) + ScrollTrigger plugin included consistently

What I changed (UI/UX and cohesion)
- Added a mobile nav toggle to `index.html` for small screens
- Connected the site and deck: new nav item and a Cobalt section CTA; added a back‑to‑site button in the deck
- Improved accessibility: theme/color‑scheme meta, aria roles, aria‑live for achievement notifications, noscript fallbacks
- Respect reduced motion: animations and Three.js particle counts now adapt to `prefers-reduced-motion`
- Performance: pause Three.js animation when the tab is hidden; lighter animations on low‑motion settings
- Normalized libraries: GSAP + ScrollTrigger same version across pages

Run locally
- Recommended: run a static server (module scripts avoid file:// CORS):
  - Python: `python3 -m http.server 8080` → http://localhost:8080/
  - Node: `npx http-server -p 8080` → http://localhost:8080/
- Direct file open: supported with fallbacks. The pages auto-detect `file://` and load non‑module Three.js and legacy scripts (`threejs-background.legacy.js`, `present.legacy.js`).

Keyboard shortcuts (index.html)
- Ctrl+Shift+D — Developer stats overlay
- Ctrl+Shift+H — HazardForge animation
- Ctrl+Shift+P — Particle explosion

Keyboard shortcuts (present.html)
- Arrow keys / Space — Navigate slides
- A — Toggle achievements gallery
- ? — Show keyboard help
- ESC — Close open overlays (gallery/help)

Reduced motion support
- If your OS is set to “Reduce Motion”, the site lowers animation intensities and particle counts. You can test by toggling the OS setting.

Files
- `index.html` — Main site
- `present.html` — Pitch deck
- `styles.css` — Shared theme and components
- `index.js` — Site scripts
- `present.js` — Deck scripts
- `threejs-background.js` — Home background scene
 - `threejs-background.legacy.js` — file:// fallback (uses global THREE)
 - `present.legacy.js` — file:// fallback (uses global THREE + GSAP)
 - Three.js version unified across pages via import maps at `0.170.0`
 - GSAP + ScrollTrigger pinned to `3.13.0`
