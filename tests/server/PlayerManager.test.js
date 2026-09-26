import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerManager } from '../../server/PlayerManager.js';
import { WorldState } from '../../server/WorldState.js';

describe('PlayerManager', () => {
  let pm;
  let world;

  beforeEach(() => {
    world = new WorldState();
    pm = new PlayerManager(world);
  });

  it('should add a player at spawn position', () => {
    const player = pm.addPlayer('p1', 'Guerreiro1');
    expect(player.id).toBe('p1');
    expect(player.name).toBe('Guerreiro1');
    expect(player.hp).toBe(100);
    const spawn = world.getPlayerSpawn();
    expect(player.x).toBe(spawn.x);
    expect(player.z).toBe(spawn.z);
  });

  it('should remove a player', () => {
    pm.addPlayer('p1', 'Guerreiro1');
    pm.removePlayer('p1');
    expect(pm.getPlayer('p1')).toBeUndefined();
  });

  it('should return all players', () => {
    pm.addPlayer('p1', 'A');
    pm.addPlayer('p2', 'B');
    expect(pm.getAllPlayers()).toHaveLength(2);
  });

  it('should process movement input with speed validation', () => {
    pm.addPlayer('p1', 'A');
    pm.processInput('p1', { dx: 0.1, dz: 0.1 });
    const player = pm.getPlayer('p1');
    expect(player.x).not.toBe(0);
  });

  it('should reject movement exceeding max speed', () => {
    pm.addPlayer('p1', 'A');
    pm.processInput('p1', { dx: 999, dz: 999 });
    const player = pm.getPlayer('p1');
    expect(player.x).toBeLessThan(10);
  });

  it('should clamp player within world bounds', () => {
    pm.addPlayer('p1', 'A');
    const player = pm.getPlayer('p1');
    player.x = 49;
    pm.processInput('p1', { dx: 5, dz: 0 });
    expect(pm.getPlayer('p1').x).toBeLessThanOrEqual(50);
  });
});
