import * as THREE from 'three';

export class EntityManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.entities = new Map();
  }

  updatePlayers(players, localPlayerId) {
    const currentIds = new Set();

    for (const player of players) {
      if (player.id === localPlayerId) continue;
      currentIds.add(player.id);

      if (!this.entities.has(player.id)) {
        // Tenta carregar modelo 3D em background, usa geométrico enquanto isso
        const mesh = this.renderer.createPlayerMesh(0xcc6644);
        mesh.position.set(player.x, player.y, player.z);
        this.renderer.scene.add(mesh);

        // Carregar modelo async (substitui quando pronto)
        this.renderer.createPlayerMeshWithModel(0xcc6644).then(result => {
          if (result.model && this.entities.has(player.id)) {
            const entity = this.entities.get(player.id);
            this.renderer.scene.remove(entity.mesh);
            result.mesh.position.copy(entity.mesh.position);
            this.renderer.scene.add(result.mesh);
            entity.mesh = result.mesh;
            entity.model = result.model;
          }
        });

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.font = 'bold 28px sans-serif';
        ctx.fillStyle = '#e0e0e0';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, 128, 40);
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(2, 0.5, 1);
        sprite.position.y = 2.8;
        mesh.add(sprite);

        this.entities.set(player.id, {
          mesh,
          targetPos: { x: player.x, y: player.y, z: player.z },
          type: 'player',
        });
      } else {
        const entity = this.entities.get(player.id);
        entity.targetPos = { x: player.x, y: player.y, z: player.z };
      }
    }

    for (const [id, entity] of this.entities) {
      if (entity.type === 'player' && !currentIds.has(id)) {
        this.renderer.scene.remove(entity.mesh);
        this.entities.delete(id);
      }
    }
  }

  updateMonsters(monsters) {
    for (const monster of monsters) {
      const id = monster.id;

      if (!this.entities.has(id)) {
        const mesh = this.renderer.createMonsterMesh(monster.type);
        mesh.position.set(monster.x, monster.y, monster.z);
        mesh.visible = monster.alive;
        this.renderer.scene.add(mesh);
        this.entities.set(id, {
          mesh,
          model: null,
          targetPos: { x: monster.x, y: monster.y, z: monster.z },
          type: 'monster',
          monsterType: monster.type,
          alive: monster.alive,
          hp: monster.hp,
          maxHp: monster.maxHp,
        });

        // Carregar modelo async
        this.renderer.createMonsterMeshWithModel(monster.type).then(result => {
          if (result.model && this.entities.has(id)) {
            const entity = this.entities.get(id);
            this.renderer.scene.remove(entity.mesh);
            result.mesh.position.copy(entity.mesh.position);
            result.mesh.visible = entity.alive;
            this.renderer.scene.add(result.mesh);
            entity.mesh = result.mesh;
            entity.model = result.model;
          }
        });
      } else {
        const entity = this.entities.get(id);
        entity.targetPos = { x: monster.x, y: monster.y, z: monster.z };
        entity.alive = monster.alive;
        entity.hp = monster.hp;
        entity.maxHp = monster.maxHp;
        entity.mesh.visible = monster.alive;
      }
    }
  }

  updateNpcs(npcs) {
    for (const npc of npcs) {
      const id = npc.id;
      if (!this.entities.has(id)) {
        const mesh = this.renderer.createNpcMesh();
        mesh.position.set(npc.x, npc.y, npc.z);
        this.renderer.scene.add(mesh);
        this.entities.set(id, {
          mesh,
          model: null,
          targetPos: { x: npc.x, y: npc.y, z: npc.z },
          type: 'npc',
          npcId: npc.id,
          name: npc.name,
        });

        // Carregar modelo async
        this.renderer.createNpcMeshWithModel().then(result => {
          if (result.model && this.entities.has(id)) {
            const entity = this.entities.get(id);
            this.renderer.scene.remove(entity.mesh);
            result.mesh.position.copy(entity.mesh.position);
            this.renderer.scene.add(result.mesh);
            entity.mesh = result.mesh;
            entity.model = result.model;
          }
        });
      }
    }
  }

  interpolate() {
    const lerp = 0.15;
    for (const entity of this.entities.values()) {
      const pos = entity.mesh.position;
      pos.x += (entity.targetPos.x - pos.x) * lerp;
      pos.y += (entity.targetPos.y - pos.y) * lerp;
      pos.z += (entity.targetPos.z - pos.z) * lerp;

      if (entity.type === 'npc') {
        const marker = entity.mesh.getObjectByName('questMarker');
        if (marker) marker.rotation.y += 0.03;
      }
    }
  }

  getEntity(id) {
    return this.entities.get(id);
  }

  getClickedEntity(raycaster, camera) {
    const meshes = [];
    const idMap = new Map();
    for (const [id, entity] of this.entities) {
      if ((entity.type === 'monster' && entity.alive) || entity.type === 'npc') {
        entity.mesh.traverse((child) => {
          if (child.isMesh) {
            meshes.push(child);
            idMap.set(child.uuid, id);
          }
        });
      }
    }

    const intersects = raycaster.intersectObjects(meshes);
    if (intersects.length > 0) {
      const uuid = intersects[0].object.uuid;
      const id = idMap.get(uuid);
      return this.entities.get(id) ? { id, ...this.entities.get(id) } : null;
    }
    return null;
  }
}
