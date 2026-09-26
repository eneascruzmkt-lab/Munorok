export class PlayerController {
  constructor(renderer) {
    this.renderer = renderer;
    this.mesh = null;
    this.model = null; // modelo 3D carregado (ou null pra fallback geométrico)
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = 0;
    this.hp = 100;
    this.maxHp = 100;
    this.mp = 50;
    this.maxMp = 50;
    this.walkTime = 0;
    this.attackTimer = 0;
    this.lastMoveTime = 0;
    this.currentAnim = 'idle';
  }

  async init(playerData) {
    this.position = { x: playerData.x, y: playerData.y, z: playerData.z };
    this.hp = playerData.hp;
    this.maxHp = playerData.maxHp;
    this.mp = playerData.mp;
    this.maxMp = playerData.maxMp;

    // Tentar carregar modelo 3D
    const result = await this.renderer.createPlayerMeshWithModel(0x3366aa);
    this.mesh = result.mesh;
    this.model = result.model;

    if (this.model) {
      console.log('Modelo do jogador carregado! Animações:', this.model.getAnimationNames());
    }

    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    this.renderer.scene.add(this.mesh);
  }

  applyInput(movement) {
    this.position.x += movement.dx;
    this.position.z += movement.dz;

    if (movement.dx !== 0 || movement.dz !== 0) {
      this.lastMoveTime = performance.now();
      this.rotation = Math.atan2(movement.dx, movement.dz);
    }

    if (this.mesh) {
      this.mesh.position.set(this.position.x, this.position.y, this.position.z);
      this.mesh.rotation.y = this.rotation;
    }
  }

  reconcile(serverState) {
    const lerp = 0.15;
    this.position.x += (serverState.x - this.position.x) * lerp;
    this.position.y = serverState.y;
    this.position.z += (serverState.z - this.position.z) * lerp;
    this.hp = serverState.hp;
    this.maxHp = serverState.maxHp;
    this.mp = serverState.mp;
    this.maxMp = serverState.maxMp;

    if (this.mesh) {
      this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    }
  }

  playAttack() {
    this.attackTimer = 0.4;
    if (this.mesh) {
      this.renderer.createAttackFlash(this.mesh.position);
    }

    // Animação de ataque do modelo 3D
    if (this.model) {
      this.model.playAnimation('attack', { loop: false, fadeTime: 0.1 });
      this.currentAnim = 'attack';
    }
  }

  playSkill() {
    if (this.model && this.model.actions.cast) {
      this.model.playAnimation('cast', { loop: false, fadeTime: 0.1 });
      this.currentAnim = 'cast';
    }
  }

  animate(deltaTime) {
    if (!this.mesh) return;

    const isMoving = (performance.now() - this.lastMoveTime) < 300;

    // Se tem modelo 3D, usar animações do modelo
    if (this.model) {
      // Ataque tem prioridade — não interrompe
      if (this.attackTimer > 0) {
        this.attackTimer -= deltaTime;
        return; // Deixa a animação de ataque terminar sozinha
      }

      // Quando ataque terminou, voltar pra idle/walk
      if (this.currentAnim === 'attack') {
        this.currentAnim = isMoving ? 'walk' : 'idle';
        this.model.playAnimation(this.currentAnim, { fadeTime: 0.3 });
        return;
      }

      const targetAnim = isMoving ? 'walk' : 'idle';
      if (this.currentAnim !== targetAnim) {
        this.model.playAnimation(targetAnim, { fadeTime: 0.25 });
        this.currentAnim = targetAnim;
      }
      return;
    }

    // ===== Fallback: animação geométrica =====
    const leftLeg = this.mesh.getObjectByName('leftLeg');
    const rightLeg = this.mesh.getObjectByName('rightLeg');
    const leftArm = this.mesh.getObjectByName('leftArm');
    const rightArm = this.mesh.getObjectByName('rightArm');

    if (this.attackTimer > 0) {
      this.attackTimer -= deltaTime;
      const t = 1 - (this.attackTimer / 0.4);
      if (rightArm) {
        if (t < 0.4) {
          rightArm.rotation.x = -(t / 0.4) * 2.0;
        } else {
          rightArm.rotation.x = -2.0 + ((t - 0.4) / 0.6) * 2.0;
        }
      }
      return;
    }

    if (isMoving) {
      this.walkTime += deltaTime * 8;
      const swing = Math.sin(this.walkTime) * 0.5;
      if (leftLeg) leftLeg.rotation.x = swing;
      if (rightLeg) rightLeg.rotation.x = -swing;
      if (leftArm) leftArm.rotation.x = -swing * 0.7;
      if (rightArm) rightArm.rotation.x = swing * 0.7;
    } else {
      this.walkTime = 0;
      if (leftLeg) leftLeg.rotation.x *= 0.85;
      if (rightLeg) rightLeg.rotation.x *= 0.85;
      if (leftArm) leftArm.rotation.x *= 0.85;
      if (rightArm) rightArm.rotation.x *= 0.85;
    }
  }

  destroy() {
    if (this.model) this.model.dispose();
    if (this.mesh) {
      this.renderer.scene.remove(this.mesh);
      this.mesh = null;
    }
  }
}
