const MONSTER_TYPES = {
  corrupted_wolf: { maxHp: 50, damage: 8, attackRange: 2, aggroRange: 8, attackCooldown: 40 },
  shadow_spider: { maxHp: 35, damage: 12, attackRange: 1.5, aggroRange: 6, attackCooldown: 30 },
  hollow_knight: { maxHp: 120, damage: 15, attackRange: 2.5, aggroRange: 10, attackCooldown: 60 },
};

const RESPAWN_TICKS = 200; // 10 seconds at 20 ticks/s

class MonsterManager {
  constructor(world) {
    this.monsters = new Map();
    this.respawnTimers = new Map();
    const spawns = world.getMonsterSpawns();
    spawns.forEach((spawn, i) => {
      const type = MONSTER_TYPES[spawn.type];
      const id = `monster_${i}`;
      this.monsters.set(id, {
        id,
        type: spawn.type,
        x: spawn.x,
        y: 0,
        z: spawn.z,
        spawnX: spawn.x,
        spawnZ: spawn.z,
        hp: type.maxHp,
        maxHp: type.maxHp,
        damage: type.damage,
        attackRange: type.attackRange,
        aggroRange: type.aggroRange,
        attackCooldown: type.attackCooldown,
        cooldownTimer: 0,
        targetId: null,
        alive: true,
      });
    });
  }

  getMonster(id) {
    return this.monsters.get(id);
  }

  getAllMonsters() {
    return Array.from(this.monsters.values());
  }

  takeDamage(id, amount) {
    const monster = this.monsters.get(id);
    if (!monster || !monster.alive) return null;
    monster.hp = Math.max(0, monster.hp - amount);
    if (monster.hp <= 0) {
      monster.alive = false;
      monster.targetId = null;
      this.respawnTimers.set(id, RESPAWN_TICKS);
      return { killed: true, monsterId: id, type: monster.type };
    }
    return { killed: false, monsterId: id, damage: amount };
  }

  update(players) {
    for (const [id, monster] of this.monsters) {
      if (!monster.alive) {
        const timer = this.respawnTimers.get(id);
        if (timer !== undefined) {
          const remaining = timer - 1;
          if (remaining <= 0) {
            monster.hp = monster.maxHp;
            monster.alive = true;
            monster.x = monster.spawnX;
            monster.z = monster.spawnZ;
            monster.targetId = null;
            this.respawnTimers.delete(id);
          } else {
            this.respawnTimers.set(id, remaining);
          }
        }
        continue;
      }

      if (monster.cooldownTimer > 0) monster.cooldownTimer--;

      let nearestDist = monster.aggroRange;
      let nearestPlayer = null;

      for (const player of players) {
        if (!player.alive) continue;
        const dx = player.x - monster.x;
        const dz = player.z - monster.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestPlayer = player;
        }
      }

      monster.targetId = nearestPlayer ? nearestPlayer.id : null;

      if (nearestPlayer && nearestDist > monster.attackRange) {
        const dx = nearestPlayer.x - monster.x;
        const dz = nearestPlayer.z - monster.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const moveSpeed = 0.1;
        monster.x += (dx / dist) * moveSpeed;
        monster.z += (dz / dist) * moveSpeed;
      }
    }
  }

  getAttacks(players) {
    const attacks = [];
    for (const monster of this.monsters.values()) {
      if (!monster.alive || !monster.targetId || monster.cooldownTimer > 0) continue;

      const target = players.find(p => p.id === monster.targetId && p.alive);
      if (!target) continue;

      const dx = target.x - monster.x;
      const dz = target.z - monster.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= monster.attackRange) {
        attacks.push({ monsterId: monster.id, targetId: target.id, damage: monster.damage });
        monster.cooldownTimer = monster.attackCooldown;
      }
    }
    return attacks;
  }
}

export { MonsterManager };
