import * as THREE from 'three';

export class CombatUI {
  constructor(network, entityManager, camera) {
    this.network = network;
    this.entities = entityManager;
    this.camera = camera;
    this.targetId = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    document.addEventListener('click', (e) => this.onClick(e));
    document.addEventListener('keydown', (e) => this.onKey(e));
  }

  onClick(e) {
    if (e.target.closest('#chat-container, #npc-dialogue, #hud button, #death-screen')) return;

    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera.camera);
    const clicked = this.entities.getClickedEntity(this.raycaster, this.camera.camera);

    if (clicked) {
      if (clicked.type === 'monster') {
        this.targetId = clicked.id;
        this.updateTargetUI(clicked);
      } else if (clicked.type === 'npc') {
        this.network.send('interact_npc', { npcId: clicked.npcId });
      }
    } else {
      this.clearTarget();
    }
  }

  onKey(e) {
    if (!this.targetId) return;

    if (e.code === 'Digit1') {
      this.network.send('attack', { targetId: this.targetId });
    } else if (e.code === 'Digit2') {
      this.network.send('use_skill', { targetId: this.targetId });
    }
  }

  updateTargetUI(entity) {
    const targetInfo = document.getElementById('target-info');
    const targetName = document.getElementById('target-name');
    const targetHpText = document.getElementById('target-hp-text');
    const targetHpFill = document.querySelector('.target-hp-fill');

    targetInfo.classList.remove('hidden');
    targetName.textContent = entity.monsterType
      ? entity.monsterType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : entity.name || 'Alvo';

    if (entity.hp !== undefined) {
      const pct = (entity.hp / entity.maxHp) * 100;
      targetHpFill.style.width = pct + '%';
      targetHpText.textContent = `${Math.ceil(entity.hp)}/${entity.maxHp}`;
    }
  }

  clearTarget() {
    this.targetId = null;
    document.getElementById('target-info').classList.add('hidden');
  }

  update() {
    if (!this.targetId) return;
    const entity = this.entities.getEntity(this.targetId);
    if (!entity || !entity.alive) {
      this.clearTarget();
      return;
    }
    this.updateTargetUI(entity);
  }
}
