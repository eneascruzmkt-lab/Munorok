import { PLAYER_SPEED, MAX_SPEED_PER_TICK } from './protocol.js';

class PlayerManager {
  constructor(world) {
    this.players = new Map();
    this.world = world;
  }

  addPlayer(id, name) {
    const spawn = this.world.getPlayerSpawn();
    const player = {
      id,
      name,
      x: spawn.x,
      y: spawn.y,
      z: spawn.z,
      rotation: 0,
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      speed: PLAYER_SPEED,
      targetId: null,
      weapon: 'sword_shield',
      essence: 'fire',
      alive: true,
    };
    this.players.set(id, player);
    return player;
  }

  removePlayer(id) {
    this.players.delete(id);
  }

  getPlayer(id) {
    return this.players.get(id);
  }

  getAllPlayers() {
    return Array.from(this.players.values());
  }

  processInput(id, input) {
    const player = this.players.get(id);
    if (!player || !player.alive) return;

    let { dx, dz } = input;

    const magnitude = Math.sqrt(dx * dx + dz * dz);
    if (magnitude > MAX_SPEED_PER_TICK) {
      const scale = MAX_SPEED_PER_TICK / magnitude;
      dx *= scale;
      dz *= scale;
    }

    const newX = player.x + dx;
    const newZ = player.z + dz;
    const clamped = this.world.clampPosition(newX, player.y, newZ);

    player.x = clamped.x;
    player.y = this.world.getTerrainHeight(clamped.x, clamped.z);
    player.z = clamped.z;

    if (dx !== 0 || dz !== 0) {
      player.rotation = Math.atan2(dx, dz);
    }
  }

  setTarget(playerId, targetId) {
    const player = this.players.get(playerId);
    if (player) {
      player.targetId = targetId;
    }
  }

  takeDamage(playerId, amount) {
    const player = this.players.get(playerId);
    if (!player || !player.alive) return;
    player.hp = Math.max(0, player.hp - amount);
    if (player.hp <= 0) {
      player.alive = false;
    }
  }

  respawn(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;
    const spawn = this.world.getPlayerSpawn();
    player.x = spawn.x;
    player.y = spawn.y;
    player.z = spawn.z;
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    player.alive = true;
    player.targetId = null;
  }
}

export { PlayerManager };
