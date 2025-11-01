// Gamification System with DaisyUI-friendly iconography

const ICONS = {
  success: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m9 12.75 2.25 2.25L15 9.75"/></svg>',
  badge: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3.75 2.286 4.636 5.118.744-3.702 3.61.874 5.098L12 15.75l-4.576 2.088.874-5.098-3.702-3.61 5.118-.744L12 3.75z"/></svg>',
  discovery: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/></svg>',
  info: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 10.5v4"/><circle cx="12" cy="8" r="0.75" fill="currentColor" stroke="none"/></svg>',
  warning: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 20 18H4L12 4z"/><path d="M12 10v4"/><path d="M12 17h.01"/></svg>',
};

class GamificationManager {
  constructor() {
    this.points = parseInt(localStorage.getItem('points') || '0', 10);
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
    const detail = reason ? ` • ${reason}` : '';
    this.showNotification(`+${amount} points${detail}`, 'success', ICONS.success);
    this.checkBadges();
  }

  earnBadge(badgeId, badgeName) {
    if (!this.badges.includes(badgeId)) {
      this.badges.push(badgeId);
      localStorage.setItem('badges', JSON.stringify(this.badges));
      this.showNotification(`Badge earned: ${badgeName}`, 'warning', ICONS.badge);
      this.updateDisplay();
    }
  }

  foundEasterEgg(eggId, eggName) {
    if (!this.easterEggsFound.includes(eggId)) {
      this.easterEggsFound.push(eggId);
      localStorage.setItem('easterEggs', JSON.stringify(this.easterEggsFound));
      this.showNotification(`Discovery unlocked: ${eggName}`, 'info', ICONS.discovery);
      this.addPoints(100, `Discovery: ${eggName}`);
      this.earnBadge(`egg-${eggId}`, `${eggName} Hunter`);
    }
  }

  checkBadges() {
    if (this.points >= 100 && !this.badges.includes('points-100')) {
      this.earnBadge('points-100', 'Century Club');
    }
    if (this.points >= 500 && !this.badges.includes('points-500')) {
      this.earnBadge('points-500', 'Point Master');
    }
    if (this.easterEggsFound.length >= 3 && !this.badges.includes('egg-collector')) {
      this.earnBadge('egg-collector', 'Discovery Specialist');
    }
  }

  showNotification(message, type = 'info', icon = ICONS.info) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} fixed top-4 right-4 w-auto z-50 shadow-lg backdrop-blur`;
    alert.innerHTML = `
      <span class="flex items-center gap-3">
        ${icon}
        <span class="font-medium">${message}</span>
      </span>
    `;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
  }

  updateDisplay() {
    const pointsDisplay = document.getElementById('points-display');
    const pointsSecondary = document.getElementById('points-display-2');
    const finalPoints = document.getElementById('final-points');
    const badgesDisplay = document.getElementById('badges-display');
    const badgesCount = document.getElementById('badges-count');
    const badgesSecondary = document.getElementById('badges-display-2');
    const finalBadges = document.getElementById('final-badges');

    if (pointsDisplay) pointsDisplay.textContent = this.points;
    if (pointsSecondary) pointsSecondary.textContent = this.points;
    if (finalPoints) finalPoints.textContent = this.points;

    const badgeTotal = this.badges.length;
    if (badgesDisplay) badgesDisplay.setAttribute('data-count', String(badgeTotal));
    if (badgesCount) badgesCount.textContent = badgeTotal;
    if (badgesSecondary) badgesSecondary.textContent = badgeTotal;
    if (finalBadges) finalBadges.textContent = badgeTotal;
  }

  updateProgress() {
    const progressBar = document.getElementById('slide-progress');
    if (progressBar && this.totalSlides > 0) {
      const progress = ((this.currentSlide + 1) / this.totalSlides) * 100;
      progressBar.style.width = `${progress}%`;
    }
  }

  reset() {
    const modal = document.createElement('div');
    modal.className = 'modal modal-open';
    modal.innerHTML = `
      <div class="modal-box space-y-4">
        <div class="flex items-center gap-3 text-warning">
          ${ICONS.warning}
          <h3 class="font-bold text-lg text-base-content">Reset Progress?</h3>
        </div>
        <p>This will delete all saved points, badges, and discoveries. This action cannot be undone.</p>
        <div class="modal-action">
          <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">Cancel</button>
          <button class="btn btn-error" onclick="localStorage.clear(); location.reload();">Reset Everything</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
}

const game = new GamificationManager();

export { game };
