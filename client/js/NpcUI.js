export class NpcUI {
  constructor(network) {
    this.network = network;
    this.container = document.getElementById('npc-dialogue');
    this.nameEl = document.getElementById('npc-name');
    this.textEl = document.getElementById('npc-text');
    this.optionsEl = document.getElementById('npc-options');
    this.isOpen = false;
  }

  show(dialogue, npcName) {
    this.isOpen = true;
    this.container.classList.remove('hidden');
    this.nameEl.textContent = npcName || 'NPC';
    this.textEl.textContent = dialogue.text;
    this.optionsEl.innerHTML = '';

    if (dialogue.questAvailable && dialogue.quest) {
      const questBtn = document.createElement('button');
      questBtn.textContent = `Aceitar: ${dialogue.quest.name}`;
      questBtn.addEventListener('click', () => {
        this.network.send('quest_accept', { questId: dialogue.quest.id });
        this.close();
      });
      this.optionsEl.appendChild(questBtn);
    }

    if (dialogue.options) {
      for (const option of dialogue.options) {
        if (option.id === 'quest' && dialogue.questAvailable) continue;
        const btn = document.createElement('button');
        btn.textContent = option.label;
        btn.addEventListener('click', () => {
          if (option.id === 'close') {
            this.close();
          } else if (option.id === 'lore') {
            this.close();
          }
        });
        this.optionsEl.appendChild(btn);
      }
    }

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Fechar';
    closeBtn.addEventListener('click', () => this.close());
    this.optionsEl.appendChild(closeBtn);
  }

  close() {
    this.isOpen = false;
    this.container.classList.add('hidden');
  }
}
