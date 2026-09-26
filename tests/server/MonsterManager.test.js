import { describe, it, expect, beforeEach } from 'vitest';
import { MonsterManager } from '../../server/MonsterManager.js';
import { WorldState } from '../../server/WorldState.js';

describe('MonsterManager', () => {
  let mm;

  beforeEach(() => {
    const world = new WorldState();
    mm = new MonsterManager(world);
  });

  it('should spawn monsters from world spawn points', () => {
    const monsters = mm.getAllMonsters();
    expect(monsters.length).toBeGreaterThan(0);
  });

  it('should return monster by id', () => {
    const all = mm.getAllMonsters();
    const found = mm.getMonster(all[0].id);
    expect(found).toBeDefined();
    expect(found.id).toBe(all[0].id);
  });

  it('should take damage and die at 0 hp', () => {
    const all = mm.getAllMonsters();
    const monster = all[0];
    mm.takeDamage(monster.id, monster.maxHp);
    expect(mm.getMonster(monster.id).hp).toBe(0);
    expect(mm.getMonster(monster.id).alive).toBe(false);
  });

  it('should respawn dead monsters after delay', () => {
    const all = mm.getAllMonsters();
    const monster = all[0];
    mm.takeDamage(monster.id, monster.maxHp);
    for (let i = 0; i < 200; i++) {
      mm.update([]);
    }
    expect(mm.getMonster(monster.id).alive).toBe(true);
    expect(mm.getMonster(monster.id).hp).toBe(monster.maxHp);
  });

  it('should aggro on nearby players', () => {
    const all = mm.getAllMonsters();
    const monster = all[0];
    const fakePlayers = [{
      id: 'p1', x: monster.x + 1, y: 0, z: monster.z + 1, alive: true,
    }];
    mm.update(fakePlayers);
    expect(mm.getMonster(monster.id).targetId).toBe('p1');
  });

  it('should not aggro on distant players', () => {
    const all = mm.getAllMonsters();
    const monster = all[0];
    const fakePlayers = [{
      id: 'p1', x: monster.x + 100, y: 0, z: monster.z + 100, alive: true,
    }];
    mm.update(fakePlayers);
    expect(mm.getMonster(monster.id).targetId).toBeNull();
  });
});
