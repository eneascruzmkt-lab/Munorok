import { describe, it, expect } from 'vitest';
import { WorldState } from '../../server/WorldState.js';

describe('WorldState', () => {
  it('should initialize with zone boundaries', () => {
    const world = new WorldState();
    expect(world.bounds).toEqual({ minX: -50, maxX: 50, minZ: -50, maxZ: 50 });
  });

  it('should clamp position within bounds', () => {
    const world = new WorldState();
    const clamped = world.clampPosition(100, 0, -200);
    expect(clamped).toEqual({ x: 50, y: 0, z: -50 });
  });

  it('should return spawn points', () => {
    const world = new WorldState();
    const spawn = world.getPlayerSpawn();
    expect(spawn).toHaveProperty('x');
    expect(spawn).toHaveProperty('y');
    expect(spawn).toHaveProperty('z');
  });

  it('should return monster spawn locations', () => {
    const world = new WorldState();
    const spawns = world.getMonsterSpawns();
    expect(spawns.length).toBeGreaterThan(0);
    spawns.forEach(s => {
      expect(s.x).toBeGreaterThanOrEqual(world.bounds.minX);
      expect(s.x).toBeLessThanOrEqual(world.bounds.maxX);
    });
  });

  it('should get terrain height at position', () => {
    const world = new WorldState();
    const height = world.getTerrainHeight(0, 0);
    expect(typeof height).toBe('number');
  });
});
