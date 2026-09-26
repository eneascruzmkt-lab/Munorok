import { describe, it, expect, beforeEach } from 'vitest';
import { NpcManager } from '../../server/NpcManager.js';
import { WorldState } from '../../server/WorldState.js';

describe('NpcManager', () => {
  let npcs;

  beforeEach(() => {
    const world = new WorldState();
    npcs = new NpcManager(world);
  });

  it('should load NPCs from world data', () => {
    const all = npcs.getAllNpcs();
    expect(all.length).toBeGreaterThan(0);
  });

  it('should return dialogue for NPC', () => {
    const dialogue = npcs.getDialogue('npc_elder', 'p1');
    expect(dialogue).toBeDefined();
    expect(dialogue.text).toBeTruthy();
    expect(dialogue.options).toBeDefined();
  });

  it('should check interaction range', () => {
    const npc = npcs.getAllNpcs()[0];
    expect(npcs.isInRange({ x: npc.x + 1, z: npc.z }, 'npc_elder')).toBe(true);
    expect(npcs.isInRange({ x: npc.x + 50, z: npc.z }, 'npc_elder')).toBe(false);
  });

  it('should offer a quest', () => {
    const dialogue = npcs.getDialogue('npc_elder', 'p1');
    expect(dialogue.questAvailable).toBe(true);
    expect(dialogue.quest).toBeDefined();
    expect(dialogue.quest.id).toBeTruthy();
  });

  it('should accept quest and track progress', () => {
    const result = npcs.acceptQuest('p1', 'quest_wolves');
    expect(result.accepted).toBe(true);
    const progress = npcs.getQuestProgress('p1', 'quest_wolves');
    expect(progress.current).toBe(0);
  });

  it('should update quest progress on monster kill', () => {
    npcs.acceptQuest('p1', 'quest_wolves');
    npcs.onMonsterKill('p1', 'corrupted_wolf');
    const progress = npcs.getQuestProgress('p1', 'quest_wolves');
    expect(progress.current).toBe(1);
  });

  it('should complete quest when objective met', () => {
    npcs.acceptQuest('p1', 'quest_wolves');
    for (let i = 0; i < 3; i++) {
      npcs.onMonsterKill('p1', 'corrupted_wolf');
    }
    const progress = npcs.getQuestProgress('p1', 'quest_wolves');
    expect(progress.completed).toBe(true);
  });
});
