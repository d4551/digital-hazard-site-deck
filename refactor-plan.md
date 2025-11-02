# Refactor Plan - Digital Hazard Static Site

## Goal
Create a fully portable static site that works anywhere without local dependencies.

## Changes Required

### 1. Fonts
**Before**: Local font files (Rajdhani, Inter, Orbitron)
**After**: Google Fonts CDN
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

### 2. Images
**Before**: Local .jpg files for slides
**After**: CSS gradients with overlay text/icons

Replace:
```html
<img src="assets/slide-intro.jpg">
```

With:
```html
<div class="slide-visual-gradient" data-slide="intro">
  <div class="gradient-overlay"></div>
  <i class="fas fa-rocket slide-icon"></i>
</div>
```

### 3. CSS
**Before**: 19 separate CSS files, only 1 imported
**After**: Single consolidated inline CSS in <style> tag OR single optimized CSS file

### 4. JavaScript
**Before**: Complex module loader with 40+ JS files
**After**: Simplified loading, essential files only, preferring CDN

Keep only:
- game.js (consolidated game engine)
- main.js (site initialization)
- CDN: Three.js, GSAP

### 5. Icons
**Using**: Font Awesome CDN (already included)
**Add**: More semantic icons matching brand

### 6. Canvas
**Fix**: Standardize to `id="three-canvas"` everywhere

### 7. Duplicate IDs
**Fix**: Ensure all IDs are unique
- Remove duplicate `demo-canvas` from index.html hero section
- Keep only in modal

## Files to Modify
1. present.html - Main presentation deck
2. index.html - Landing page
3. Create: css/unified.css - Single CSS file
4. Create: js/app.js - Unified JavaScript

## Files to Remove
- fonts/ directory (use CDN)
- static/ directory (outdated)
- Most css/ files (consolidate)
- Most js/ files (consolidate essential only)
- assets/*.jpg (use CSS)

## Testing Checklist
- [ ] Site loads without local font files
- [ ] All slides render with CSS gradients
- [ ] Three.js background works
- [ ] Game loads and runs
- [ ] Gamification works
- [ ] All animations work
- [ ] Mobile responsive
- [ ] Works on file:// protocol
- [ ] Works on http://
- [ ] Works on https://
