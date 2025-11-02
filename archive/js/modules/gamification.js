let gameState = {
  score: 0,
  level: 1,
  achievements: [],
  combo: 0,
  particlesCreated: 0,
  highScore: localStorage.getItem('dhHighScore') || 0
};

function loadGameState() {
  const saved = localStorage.getItem('dhGameState');
  if (saved) {
    gameState = { ...gameState, ...JSON.parse(saved) };
  }
}

function saveGameState() {
  localStorage.setItem('dhGameState', JSON.stringify(gameState));
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    localStorage.setItem('dhHighScore', gameState.highScore);
  }
}

function addScore(points, showPopup = true) {
  gameState.score += points * (1 + gameState.combo * 0.1);
  gameState.combo++;
  if (showPopup) {
    showScorePopup(points * (1 + gameState.combo * 0.1));
  }
  updateHUD();
  saveGameState();
  checkHighScore();
}

function levelUp() {
  gameState.level++;
  showAchievement('Level Up!', `Reached Level ${gameState.level}`);
  updateHUD();
  saveGameState();
}

function unlockAchievement(name, desc, bonusPoints = 0) {
  if (!gameState.achievements.includes(name)) {
    gameState.achievements.push(name);
    addScore(bonusPoints, false);
    showAchievement(name, desc);
    updateHUD();
    saveGameState();
  }
}

function showScorePopup(points) {
  const popup = document.getElementById('scorePopup');
  if (popup) {
    popup.querySelector('#scoreNumber').textContent = `+${Math.round(points)}`;
    popup.classList.add('active');
    setTimeout(() => popup.classList.remove('active'), 1000);
  }
}

function showAchievement(title, desc) {
  const notif = document.getElementById('achievementNotification');
  if (notif) {
    notif.querySelector('#achievementTitle').textContent = title;
    notif.querySelector('#achievementDesc').textContent = desc;
    notif.classList.add('show');
    setTimeout(() => notif.classList.remove('show'), 3000);
  }
}

function showCombo(combo) {
  const counter = document.getElementById('comboCounter');
  if (counter) {
    counter.querySelector('#comboNumber').textContent = combo;
    counter.classList.add('active');
    setTimeout(() => counter.classList.remove('active'), 1500);
  }
}

function updateHUD() {
  // Update level
  const levelEl = document.getElementById('levelNumber');
  if (levelEl) levelEl.textContent = gameState.level;

  // Update score
  const scoreEl = document.getElementById('discoveryScore');
  if (scoreEl) scoreEl.textContent = Math.round(gameState.score);

  // Update particles
  const particlesEl = document.getElementById('particleCount');
  if (particlesEl) particlesEl.textContent = gameState.particlesCreated;

  // Update badge
  const badgeEl = document.getElementById('badgeText');
  if (badgeEl) {
    if (gameState.achievements.length >= 5) badgeEl.textContent = 'Master';
    else if (gameState.achievements.length >= 3) badgeEl.textContent = 'Explorer';
    else badgeEl.textContent = 'Rookie';
  }

  // Update level fill (example: 100 points per level)
  const levelFill = document.getElementById('levelFill');
  if (levelFill) {
    const pointsForNextLevel = gameState.level * 100;
    const progress = ((gameState.score % pointsForNextLevel) / pointsForNextLevel) * 100;
    levelFill.style.width = `${progress}%`;
  }
}

function checkHighScore() {
  if (gameState.score > gameState.highScore) {
    const badge = document.getElementById('highscoreBadge');
    if (badge) {
      badge.classList.add('show');
      setTimeout(() => badge.classList.remove('show'), 3000);
    }
  }
}

function resetCombo() {
  gameState.combo = 0;
  showCombo(0);
}

function incrementParticles() {
  gameState.particlesCreated++;
  updateHUD();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    gameState,
    loadGameState,
    saveGameState,
    addScore,
    levelUp,
    unlockAchievement,
    showScorePopup,
    showAchievement,
    showCombo,
    updateHUD,
    checkHighScore,
    resetCombo,
    incrementParticles
  };
} else {
  // Global for non-module environments
  window.gamification = {
    gameState,
    loadGameState,
    saveGameState,
    addScore,
    levelUp,
    unlockAchievement,
    showScorePopup,
    showAchievement,
    showCombo,
    updateHUD,
    checkHighScore,
    resetCombo,
    incrementParticles
  };
}
