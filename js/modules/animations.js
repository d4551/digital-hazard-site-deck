function animateNumber(element, target, duration = 1000) {
  const start = parseInt(element.textContent) || 0;
  const increment = target > start ? 1 : -1;
  let current = start;
  const timer = setInterval(() => {
    current += increment;
    element.textContent = current;
    if (current === target) {
      clearInterval(timer);
    }
  }, duration / Math.abs(target - start));
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function createGSAPTimeline(targets, vars) {
  return gsap.timeline(vars).to(targets, { duration: 1, opacity: 1, y: 0, stagger: 0.1 });
}

function animateDemo() {
  // Example demo animation using GSAP
  gsap.to('.demo-canvas', { duration: 2, rotation: 360, repeat: -1, ease: "none" });
}

function simulateLoading() {
  const progress = document.getElementById('loadingProgress');
  const percentage = document.getElementById('loadingPercentage');
  let width = 0;
  const interval = setInterval(() => {
    width += Math.random() * 5;
    if (width >= 100) {
      width = 100;
      clearInterval(interval);
      setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
      }, 500);
    }
    progress.style.width = width + '%';
    percentage.textContent = Math.round(width) + '%';
  }, 50);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    animateNumber,
    debounce,
    createGSAPTimeline,
    animateDemo,
    simulateLoading
  };
} else {
  window.animations = {
    animateNumber,
    debounce,
    createGSAPTimeline,
    animateDemo,
    simulateLoading
  };
}
