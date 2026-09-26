const QUESTS = {
  quest_wolves: {
    id: 'quest_wolves',
    name: 'A Ameaça Corrompida',
    description: 'Lobos corrompidos estão atacando viajantes. Elimine 3 deles.',
    objective: { type: 'kill', target: 'corrupted_wolf', required: 3 },
    rewards: { xp: 100 },
  },
};

const NPC_DIALOGUES = {
  npc_elder: {
    default: {
      text: 'Viajante... você sente? A Corrosão está mais forte a cada dia. Essas terras já foram prósperas, mas agora as criaturas enlouquecem e atacam qualquer um que se aproxime.',
      options: [
        { id: 'quest', label: 'Como posso ajudar?' },
        { id: 'lore', label: 'O que é a Corrosão?' },
      ],
      questAvailable: true,
      quest: QUESTS.quest_wolves,
    },
    quest_active: {
      text: 'Ainda há lobos corrompidos rondando. Tenha cuidado, viajante.',
      options: [{ id: 'close', label: 'Entendido.' }],
      questAvailable: false,
    },
    quest_complete: {
      text: 'Você conseguiu! As estradas estão mais seguras agora. Tome, você merece esta recompensa. Mas saiba que isso é apenas o começo... a fonte da Corrosão ainda está lá fora.',
      options: [{ id: 'close', label: 'Obrigado.' }],
      questAvailable: false,
    },
    lore: {
      text: 'A Grande Corrosão surgiu há séculos. Ninguém sabe ao certo o que a causou. Alguns dizem que foi um ritual proibido, outros culpam os Filhos de Drokmur. A Ordem de Solwyn busca reverter seus efeitos, enquanto o Pacto de Ashvern apenas tenta sobreviver.',
      options: [
        { id: 'quest', label: 'Posso fazer algo?' },
        { id: 'close', label: 'Interessante.' },
      ],
      questAvailable: true,
      quest: QUESTS.quest_wolves,
    },
  },
};

const INTERACT_RANGE = 5;

class NpcManager {
  constructor(world) {
    this.npcs = new Map();
    this.playerQuests = new Map();

    for (const loc of world.getNpcLocations()) {
      this.npcs.set(loc.id, {
        id: loc.id,
        name: loc.name,
        x: loc.x,
        y: loc.y,
        z: loc.z,
      });
    }
  }

  getAllNpcs() {
    return Array.from(this.npcs.values());
  }

  isInRange(playerPos, npcId) {
    const npc = this.npcs.get(npcId);
    if (!npc) return false;
    const dx = playerPos.x - npc.x;
    const dz = playerPos.z - npc.z;
    return Math.sqrt(dx * dx + dz * dz) <= INTERACT_RANGE;
  }

  getDialogue(npcId, playerId) {
    const dialogues = NPC_DIALOGUES[npcId];
    if (!dialogues) return null;

    const quests = this.playerQuests.get(playerId);
    if (quests) {
      const wolfQuest = quests.get('quest_wolves');
      if (wolfQuest?.completed) return { ...dialogues.quest_complete };
      if (wolfQuest) return { ...dialogues.quest_active };
    }

    return { ...dialogues.default };
  }

  acceptQuest(playerId, questId) {
    const quest = QUESTS[questId];
    if (!quest) return { accepted: false, reason: 'unknown_quest' };

    if (!this.playerQuests.has(playerId)) {
      this.playerQuests.set(playerId, new Map());
    }

    const quests = this.playerQuests.get(playerId);
    if (quests.has(questId)) return { accepted: false, reason: 'already_accepted' };

    quests.set(questId, { current: 0, required: quest.objective.required, completed: false });
    return { accepted: true, quest };
  }

  getQuestProgress(playerId, questId) {
    const quests = this.playerQuests.get(playerId);
    if (!quests) return null;
    return quests.get(questId) || null;
  }

  onMonsterKill(playerId, monsterType) {
    const quests = this.playerQuests.get(playerId);
    if (!quests) return [];

    const updates = [];
    for (const [questId, progress] of quests) {
      const quest = QUESTS[questId];
      if (quest.objective.type === 'kill' && quest.objective.target === monsterType && !progress.completed) {
        progress.current = Math.min(progress.current + 1, progress.required);
        if (progress.current >= progress.required) {
          progress.completed = true;
        }
        updates.push({ questId, ...progress });
      }
    }
    return updates;
  }

  removePlayer(playerId) {
    this.playerQuests.delete(playerId);
  }
}

export { NpcManager };
