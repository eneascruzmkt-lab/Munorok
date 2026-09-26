import { Renderer } from './Renderer.js';
import { Camera } from './Camera.js';
import { InputHandler } from './InputHandler.js';
import { PlayerController } from './PlayerController.js';
import { NetworkClient } from './NetworkClient.js';
import { EntityManager } from './EntityManager.js';
import { CombatUI } from './CombatUI.js';
import { HUD } from './HUD.js';
import { Chat } from './Chat.js';
import { NpcUI } from './NpcUI.js';

const canvas = document.getElementById('game-canvas');
const renderer = new Renderer(canvas);
const camera = new Camera();
const input = new InputHandler();
const player = new PlayerController(renderer);
const network = new NetworkClient();
const entities = new EntityManager(renderer);
const hud = new HUD();
const chat = new Chat(network);
const npcUI = new NpcUI(network);

let localPlayerId = null;
let activeQuest = null;

network.on('welcome', async (data) => {
  localPlayerId = data.playerId;
  await player.init(data.player);
  entities.updateMonsters(data.state.monsters);
  entities.updateNpcs(data.state.npcs);
  entities.updatePlayers(data.state.players, localPlayerId);
  chat.addSystemMessage('Bem-vindo a Munorok, viajante.');
});

network.on('state_update', (data) => {
  const serverPlayer = data.players.find(p => p.id === localPlayerId);
  if (serverPlayer) {
    player.reconcile(serverPlayer);
    hud.updateBars(serverPlayer.hp, serverPlayer.maxHp, serverPlayer.mp, serverPlayer.maxMp);
    if (!serverPlayer.alive) {
      hud.showDeath();
    }
  }
  entities.updatePlayers(data.players, localPlayerId);
  entities.updateMonsters(data.monsters);
});

network.on('player_joined', (data) => {
  chat.addSystemMessage(`${data.player.name} entrou no mundo.`);
});

network.on('player_left', () => {
  chat.addSystemMessage('Um aventureiro partiu.');
});

network.on('combat_event', (data) => {
  if (data.source && data.damage) {
    chat.addSystemMessage(`Você recebeu ${data.damage} de dano!`);
    // Flash de dano no jogador
    if (player.mesh) {
      renderer.createDamageFlash(player.mesh.position);
    }
  }
  if (data.success && data.damage) {
    // Ataque bem sucedido - animação
    player.playAttack();
    chat.addSystemMessage(`Causou ${data.damage} de dano!`);

    // Flash no monstro alvo
    const target = entities.getEntity(data.monsterId);
    if (target && target.mesh) {
      renderer.createAttackFlash(target.mesh.position);
    }
  }
  if (data.success === false && data.reason === 'out_of_range') {
    chat.addSystemMessage('Alvo fora de alcance.');
  }
  if (data.success === false && data.reason === 'cooldown') {
    chat.addSystemMessage('Aguarde o cooldown.');
  }
  if (data.killed) {
    chat.addSystemMessage('Inimigo derrotado!');
  }
});

network.on('chat_broadcast', (data) => {
  chat.addMessage(data.name, data.text);
});

network.on('npc_dialogue', (data) => {
  npcUI.show(data, 'Ancião Korrath');
});

network.on('quest_update', (data) => {
  if (data.accepted) {
    activeQuest = {
      name: data.quest.name,
      current: 0,
      required: data.quest.objective.required,
      completed: false,
    };
    chat.addSystemMessage(`Missão aceita: ${data.quest.name}`);
    hud.updateQuest(activeQuest);
  } else if (Array.isArray(data)) {
    for (const update of data) {
      activeQuest = { ...activeQuest, ...update };
      hud.updateQuest(activeQuest);
      if (update.completed) {
        chat.addSystemMessage('Missão concluída! Volte ao NPC.');
      }
    }
  }
});

document.getElementById('respawn-btn').addEventListener('click', () => {
  network.send('respawn', {});
  hud.hideDeath();
});

const combatUI = new CombatUI(network, entities, camera);
network.connect();

const SEND_RATE = 50;
let lastSendTime = 0;
let lastFrameTime = 0;

function gameLoop(time) {
  requestAnimationFrame(gameLoop);

  const deltaTime = Math.min((time - lastFrameTime) / 1000, 0.1);
  lastFrameTime = time;

  // Input + envio ao servidor
  if (time - lastSendTime >= SEND_RATE) {
    const movement = input.getMovement(camera.getYaw());
    if (movement.dx !== 0 || movement.dz !== 0) {
      player.applyInput(movement);
      network.send('player_input', movement);
    }
    lastSendTime = time;
  }

  // Tab target
  if (input.isKeyPressed('Tab')) {
    input.keys['Tab'] = false;
    const monsters = [];
    for (const [id, entity] of entities.entities) {
      if (entity.type === 'monster' && entity.alive) {
        const dx = entity.mesh.position.x - player.position.x;
        const dz = entity.mesh.position.z - player.position.z;
        monsters.push({ id, dist: Math.sqrt(dx * dx + dz * dz), entity });
      }
    }
    monsters.sort((a, b) => a.dist - b.dist);
    if (monsters.length > 0) {
      combatUI.targetId = monsters[0].id;
      combatUI.updateTargetUI(monsters[0].entity);
    }
  }

  // Animações
  player.animate(deltaTime);
  entities.interpolate();
  renderer.updateModels(deltaTime); // Atualizar AnimationMixers dos modelos 3D

  // Câmera, UI, render
  camera.update(player.position);
  combatUI.update();
  hud.updateFps();
  renderer.update(time);
  renderer.render(camera.camera);
}

requestAnimationFrame(gameLoop);
