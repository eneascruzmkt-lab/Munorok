import { TICK_INTERVAL } from './protocol.js';
import { WorldState } from './WorldState.js';
import { PlayerManager } from './PlayerManager.js';
import { MonsterManager } from './MonsterManager.js';
import { CombatSystem } from './CombatSystem.js';
import { NpcManager } from './NpcManager.js';

class GameLoop {
  constructor(broadcast) {
    this.broadcast = broadcast;
    this.world = new WorldState();
    this.players = new PlayerManager(this.world);
    this.monsters = new MonsterManager(this.world);
    this.combat = new CombatSystem();
    this.npcs = new NpcManager(this.world);
    this.intervalId = null;
  }

  start() {
    this.intervalId = setInterval(() => this.tick(), TICK_INTERVAL);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  addPlayer(id, name) {
    return this.players.addPlayer(id, name);
  }

  removePlayer(id) {
    this.players.removePlayer(id);
    this.combat.removePlayer(id);
    this.npcs.removePlayer(id);
  }

  handleInput(playerId, input) {
    this.players.processInput(playerId, input);
  }

  handleAttack(playerId, targetId) {
    const player = this.players.getPlayer(playerId);
    if (!player || !player.alive) return { success: false, reason: 'dead' };

    const cooldownCheck = this.combat.tryAttack(playerId);
    if (!cooldownCheck.allowed) return { success: false, reason: 'cooldown' };

    const monster = this.monsters.getMonster(targetId);
    if (!monster || !monster.alive) return { success: false, reason: 'invalid_target' };

    if (!this.combat.isInRange(player, monster, player.weapon)) {
      return { success: false, reason: 'out_of_range' };
    }

    const attack = this.combat.calculateAttack(player.weapon, player.essence);
    const result = this.monsters.takeDamage(targetId, attack.damage);

    if (result && result.killed) {
      const questUpdates = this.npcs.onMonsterKill(playerId, monster.type);
      return { success: true, ...attack, ...result, questUpdates };
    }

    return { success: true, ...attack, ...result };
  }

  handleSkill(playerId, targetId) {
    const player = this.players.getPlayer(playerId);
    if (!player || !player.alive) return { success: false, reason: 'dead' };

    const result = this.combat.useSkill(player.essence, player.mp);
    if (!result.success) return result;

    player.mp -= result.manaCost;

    const monster = this.monsters.getMonster(targetId);
    if (monster && monster.alive) {
      const dmgResult = this.monsters.takeDamage(targetId, result.damage);
      if (dmgResult && dmgResult.killed) {
        const questUpdates = this.npcs.onMonsterKill(playerId, monster.type);
        return { ...result, ...dmgResult, questUpdates };
      }
      return { ...result, ...dmgResult };
    }

    return result;
  }

  handleNpcInteract(playerId, npcId) {
    const player = this.players.getPlayer(playerId);
    if (!player) return null;

    if (!this.npcs.isInRange(player, npcId)) {
      return { error: 'out_of_range' };
    }

    return this.npcs.getDialogue(npcId, playerId);
  }

  handleQuestAccept(playerId, questId) {
    return this.npcs.acceptQuest(playerId, questId);
  }

  respawnPlayer(playerId) {
    this.players.respawn(playerId);
  }

  tick() {
    const allPlayers = this.players.getAllPlayers();

    this.monsters.update(allPlayers);

    const monsterAttacks = this.monsters.getAttacks(allPlayers);
    for (const atk of monsterAttacks) {
      this.players.takeDamage(atk.targetId, atk.damage);
    }

    this.combat.tick();

    for (const player of allPlayers) {
      if (player.alive && player.mp < player.maxMp) {
        player.mp = Math.min(player.maxMp, player.mp + 0.05);
      }
    }

    this.broadcast(this.getState(), monsterAttacks);
  }

  getState() {
    return {
      players: this.players.getAllPlayers(),
      monsters: this.monsters.getAllMonsters(),
      npcs: this.npcs.getAllNpcs(),
    };
  }
}

export { GameLoop };
