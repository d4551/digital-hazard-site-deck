# Digital Hazard Studio - Static Version

This is a static, gamified version of the Digital Hazard Studio website and pitch deck that can run without a build process.

## Features

- **Gamified Experience**: Earn points, unlock achievements, find easter eggs
- **Interactive Elements**: Particle systems, 3D backgrounds, mini-games
- **Static Files**: No build process required - works directly from file system
- **Responsive Design**: Works on desktop and mobile devices

## How to Use

1. Open `index.html` in your web browser
2. Navigate through the site and pitch deck
3. Click on interactive elements to earn points
4. Find hidden easter eggs and complete quests
5. Try the mini-game at the end of the pitch deck

## File Structure

- `index.html` - Main website
- `present.html` - Interactive pitch deck
- `css/styles.css` - Combined CSS styles
- `js/` - JavaScript libraries and application code
  - `gsap.min.js` - Animation library
  - `ScrollTrigger.min.js` - GSAP scroll plugin
  - `anime.min.js` - Additional animation library
  - `three.module.js` - 3D graphics library
  - `index.js` - Main site JavaScript
  - `present.js` - Pitch deck JavaScript
  - Other supporting JS files

## Browser Compatibility

Works in modern browsers that support ES6 modules and WebGL.

## Development

This static version was created from the built version of the main project. To make changes:

1. Modify the source files in the main project
2. Run `npm run build` to generate new CSS
3. Copy the updated files to this static folder

## Credits

Built with:
- GSAP for animations
- Three.js for 3D graphics
- Anime.js for additional animations
- Tailwind CSS + DaisyUI for styling
- Custom gamification system
