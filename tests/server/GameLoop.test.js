import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameLoop } from '../../server/GameLoop.js';

describe('GameLoop', () => {
  let game;
  let broadcastMock;

  beforeEach(() => {
    broadcastMock = vi.fn();
    game = new GameLoop(broadcastMock);
  });

  it('should add and remove players', () => {
    game.addPlayer('p1', 'TestPlayer');
    expect(game.getState().players).toHaveLength(1);
    game.removePlayer('p1');
    expect(game.getState().players).toHaveLength(0);
  });

  it('should process player input', () => {
    game.addPlayer('p1', 'TestPlayer');
    game.handleInput('p1', { dx: 0.1, dz: 0 });
    const state = game.getState();
    expect(state.players[0].x).not.toBe(0);
  });

  it('should run a tick and call broadcast', () => {
    game.addPlayer('p1', 'TestPlayer');
    game.tick();
    expect(broadcastMock).toHaveBeenCalled();
  });

  it('should include monsters in state', () => {
    const state = game.getState();
    expect(state.monsters.length).toBeGreaterThan(0);
  });

  it('should include npcs in state', () => {
    const state = game.getState();
    expect(state.npcs.length).toBeGreaterThan(0);
  });

  it('should handle attack on monster', () => {
    game.addPlayer('p1', 'TestPlayer');
    const monsters = game.getState().monsters;
    const monster = monsters[0];
    const player = game.getState().players[0];
    player.x = monster.x;
    player.z = monster.z;
    const result = game.handleAttack('p1', monster.id);
    expect(result).toBeDefined();
  });
});
