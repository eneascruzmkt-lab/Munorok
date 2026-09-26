// Shared test helpers
function createMockPlayer(overrides = {}) {
  return {
    id: 'test-player-1',
    x: 0, y: 0, z: 0,
    rotation: 0,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    speed: 5,
    targetId: null,
    ...overrides,
  };
}

function createMockMonster(overrides = {}) {
  return {
    id: 'monster-1',
    type: 'corrupted_wolf',
    x: 10, y: 0, z: 10,
    hp: 50,
    maxHp: 50,
    damage: 8,
    attackRange: 2,
    aggroRange: 8,
    ...overrides,
  };
}

export { createMockPlayer, createMockMonster };
