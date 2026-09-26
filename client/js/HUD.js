export class HUD {
  constructor() {
    this.hpFill = document.querySelector('.hp-fill');
    this.hpText = document.querySelector('#hp-bar .bar-text');
    this.mpFill = document.querySelector('.mp-fill');
    this.mpText = document.querySelector('#mp-bar .bar-text');
    this.fpsCounter = document.getElementById('fps-counter');
    this.deathScreen = document.getElementById('death-screen');
    this.questTracker = document.getElementById('quest-tracker');
    this.questTitle = document.getElementById('quest-title');
    this.questProgress = document.getElementById('quest-progress');

    this.frames = 0;
    this.lastFpsUpdate = performance.now();
    this.currentFps = 0;
  }

  updateBars(hp, maxHp, mp, maxMp) {
    const hpPct = (hp / maxHp) * 100;
    const mpPct = (mp / maxMp) * 100;
    this.hpFill.style.width = hpPct + '%';
    this.hpText.textContent = `${Math.ceil(hp)}/${maxHp}`;
    this.mpFill.style.width = mpPct + '%';
    this.mpText.textContent = `${Math.ceil(mp)}/${maxMp}`;
  }

  updateFps() {
    this.frames++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 1000) {
      this.currentFps = this.frames;
      this.frames = 0;
      this.lastFpsUpdate = now;
      this.fpsCounter.textContent = `FPS: ${this.currentFps}`;
    }
  }

  showDeath() {
    this.deathScreen.classList.remove('hidden');
  }

  hideDeath() {
    this.deathScreen.classList.add('hidden');
  }

  updateQuest(quest) {
    if (!quest) {
      this.questTracker.classList.add('hidden');
      return;
    }
    this.questTracker.classList.remove('hidden');
    this.questTitle.textContent = quest.name || 'Missão';
    this.questProgress.textContent = quest.completed
      ? 'Concluída! Fale com o NPC.'
      : `${quest.current}/${quest.required}`;
  }
}
