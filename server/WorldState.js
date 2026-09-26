class WorldState {
  constructor() {
    this.bounds = { minX: -50, maxX: 50, minZ: -50, maxZ: 50 };
    this.playerSpawn = { x: 0, y: 0, z: 0 };
    this.monsterSpawns = [
      { x: 15, y: 0, z: 15, type: 'corrupted_wolf' },
      { x: -20, y: 0, z: 10, type: 'corrupted_wolf' },
      { x: 25, y: 0, z: -15, type: 'shadow_spider' },
      { x: -10, y: 0, z: -25, type: 'shadow_spider' },
      { x: 30, y: 0, z: 30, type: 'hollow_knight' },
    ];
    this.npcLocations = [
      { id: 'npc_elder', x: 5, y: 0, z: -5, name: 'Ancião Korrath' },
    ];
  }

  clampPosition(x, y, z) {
    return {
      x: Math.max(this.bounds.minX, Math.min(this.bounds.maxX, x)),
      y,
      z: Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, z)),
    };
  }

  getPlayerSpawn() {
    return { ...this.playerSpawn };
  }

  getMonsterSpawns() {
    return this.monsterSpawns.map(s => ({ ...s }));
  }

  getTerrainHeight(x, z) {
    return Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2;
  }

  getNpcLocations() {
    return this.npcLocations.map(n => ({ ...n }));
  }
}

export { WorldState };
