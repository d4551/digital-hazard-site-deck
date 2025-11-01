// Gamification System
class GamificationManager {
  constructor() {
    this.points = parseInt(localStorage.getItem('points') || '0');
    this.badges = JSON.parse(localStorage.getItem('badges') || '[]');
    this.easterEggsFound = JSON.parse(localStorage.getItem('easterEggs') || '[]');
    this.currentSlide = 0;
    this.totalSlides = 0;
    this.updateDisplay();
  }

  addPoints(amount, reason = '') {
    this.points += amount;
    localStorage.setItem('points', this.points.toString());
    this.updateDisplay();
    this.showNotification(`+${amount} points! ${reason}`, 'success');
    this.checkBadges();
  }

  earnBadge(badgeId, badgeName, badgeIcon) {
    if (!this.badges.includes(badgeId)) {
      this.badges.push(badgeId);
      localStorage.setItem('badges', JSON.stringify(this.badges));
      this.showNotification(`🏆 Badge Earned: ${badgeName}`, 'warning');
      this.updateDisplay();
    }
  }

  foundEasterEgg(eggId, eggName) {
    if (!this.easterEggsFound.includes(eggId)) {
      this.easterEggsFound.push(eggId);
      localStorage.setItem('easterEggs', JSON.stringify(this.easterEggsFound));
      this.addPoints(100, `Found: ${eggName}`);
      this.earnBadge(`egg-${eggId}`, `${eggName} Hunter`, '🥚');
    }
  }

  checkBadges() {
    if (this.points >= 100 && !this.badges.includes('points-100')) {
      this.earnBadge('points-100', 'Century Club', '💯');
    }
    if (this.points >= 500 && !this.badges.includes('points-500')) {
      this.earnBadge('points-500', 'Point Master', '⭐');
    }
    if (this.easterEggsFound.length >= 3 && !this.badges.includes('egg-collector')) {
      this.earnBadge('egg-collector', 'Egg Collector', '🎯');
    }
  }

  showNotification(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} fixed top-4 right-4 w-auto z-50 shadow-lg animate-bounce`;
    alert.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
  }

  updateDisplay() {
    const pointsDisplay = document.getElementById('points-display');
    const badgesDisplay = document.getElementById('badges-display');
    
    if (pointsDisplay) {
      pointsDisplay.textContent = this.points;
    }
    
    if (badgesDisplay) {
      badgesDisplay.textContent = this.badges.length;
    }
  }

  updateProgress() {
    const progressBar = document.getElementById('slide-progress');
    if (progressBar && this.totalSlides > 0) {
      const progress = ((this.currentSlide + 1) / this.totalSlides) * 100;
      progressBar.style.width = `${progress}%`;
    }
  }

  reset() {
    if (confirm('Reset all progress? This cannot be undone.')) {
      localStorage.clear();
      location.reload();
    }
  }
}

// Initialize gamification
const game = new GamificationManager();

export { game };
