# Digital Hazard Site Deck

A gamified, interactive presentation website built with DaisyUI, Tailwind CSS, and Three.js. Features a slide deck presentation system with integrated gamification elements and hidden easter eggs.

## 🚀 Features

### 🎮 Gamification System
- **Points System**: Earn points for exploring slides and interacting with content
- **Badges**: Unlock achievements as you progress through the site
- **Easter Eggs**: Hidden interactive elements that reward curious users
- **Progress Tracking**: Visual progress bar and statistics display
- **Persistent Storage**: Your progress is saved in localStorage

### 🎨 Design & Styling
- **DaisyUI Components**: Beautiful, accessible UI components
- **Tailwind CSS**: Modern utility-first CSS framework
- **Multiple Themes**: 9 different color themes to choose from
  - Light, Dark, Cupcake, Cyberpunk, Synthwave, Retro, Valentine, Halloween, Forest
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Smooth Animations**: CSS animations and transitions throughout

### 📊 Presentation System
- **7 Interactive Slides**: Complete presentation deck
- **Keyboard Navigation**: Use arrow keys or spacebar to navigate
- **Touch Support**: Swipe gestures on mobile devices
- **Slide Counter**: Always know where you are in the presentation
- **Auto-save Progress**: Resume where you left off

### 🎯 Three.js 3D Graphics
- **Rotating 3D Objects**: Animated cubes and spheres
- **Particle System**: Colorful floating particles background
- **Real-time Rendering**: Smooth 60fps animations
- **Multiple Scenes**: Different 3D elements on different slides

### 🥚 Easter Eggs
- **Konami Code**: Try the classic cheat code (↑↑↓↓←→←→BA)
- **Logo Secret**: Click the logo 5 times
- **Theme Easter Egg**: Double-click the theme button 3 times
- More hidden surprises to discover!

## 🛠️ Technology Stack

- **Build Tool**: Vite
- **Styling**: Tailwind CSS v3.4.1
- **UI Components**: DaisyUI v4.4.19
- **3D Graphics**: Three.js v0.159.0
- **JavaScript**: ES6+ Modules

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎮 How to Play

1. **Navigate**: Use arrow keys, spacebar, or the navigation buttons to move through slides
2. **Explore**: Click around and interact with elements to discover easter eggs
3. **Earn Points**: Each action rewards you with points
4. **Unlock Badges**: Reach milestones to earn special badges
5. **Change Themes**: Click the 🎨 button to cycle through themes
6. **Track Progress**: Watch your points and badges grow in the header

## 🏆 Achievements

- **Century Club**: Earn 100+ points
- **Point Master**: Reach 500 points
- **Egg Collector**: Find 3 or more easter eggs
- **Logo Master Hunter**: Discover the logo secret
- **Konami Code**: Enter the legendary cheat code
- **Theme Hunter**: Find the theme easter egg

## 📱 Features by Slide

1. **Hero/Welcome**: 3D animated objects, gradient text, call-to-action buttons
2. **About**: Feature cards with hover effects
3. **Key Features**: Alert components showcasing capabilities
4. **3D Graphics Demo**: Live Three.js scene with rotating cube
5. **Gamification Stats**: Real-time progress statistics
6. **Themes Showcase**: Demonstration of DaisyUI color themes
7. **Thank You**: Final stats and completion celebration

## 🔧 Development

### Project Structure
```
digital-hazard-site-deck/
├── src/
│   ├── main.js           # Main application entry
│   ├── gamification.js   # Points & badges system
│   ├── presentation.js   # Slide deck logic
│   ├── threejs.js       # 3D graphics components
│   └── style.css        # Tailwind styles
├── index.html           # Main HTML file
├── package.json         # Dependencies
├── tailwind.config.js   # Tailwind configuration
├── postcss.config.js    # PostCSS configuration
└── vite.config.js       # Vite configuration
```

### Key Components

**Gamification Manager** (`src/gamification.js`)
- Tracks points, badges, and easter eggs
- Persists data in localStorage
- Shows toast notifications for achievements

**Presentation Deck** (`src/presentation.js`)
- Handles slide navigation
- Keyboard and touch support
- Progress tracking

**Three.js Scenes** (`src/threejs.js`)
- Creates 3D objects and animations
- Particle system effects
- Responsive canvas sizing

## 🎨 Customization

### Adding New Themes
Edit `tailwind.config.js` to add more DaisyUI themes:
```javascript
daisyui: {
  themes: ["light", "dark", "your-theme"],
}
```

### Creating New Easter Eggs
Add to `src/main.js`:
```javascript
game.foundEasterEgg('your-egg-id', 'Easter Egg Name');
```

### Adding More Slides
Add new sections to `index.html` with the `.slide` class:
```html
<section class="slide">
  <!-- Your content -->
</section>
```

## 🚀 Deployment

The site is a static website and can be deployed to:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

Build the project first:
```bash
npm run build
```

Then deploy the `dist/` folder.

## 📄 License

MIT License - Feel free to use this project for your own purposes!

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## ⚠️ About Digital Hazard Studio

This project was created for Digital Hazard Studio, showcasing modern web development techniques with gamification and interactive 3D elements.

---

**Enjoy exploring! 🎉**
