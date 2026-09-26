// Message types between client and server
const MSG = {
  // Client -> Server
  PLAYER_INPUT: 'player_input',
  ATTACK: 'attack',
  USE_SKILL: 'use_skill',
  CHAT: 'chat',
  INTERACT_NPC: 'interact_npc',
  QUEST_ACCEPT: 'quest_accept',
  RESPAWN: 'respawn',

  // Server -> Client
  STATE_UPDATE: 'state_update',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  COMBAT_EVENT: 'combat_event',
  CHAT_BROADCAST: 'chat_broadcast',
  NPC_DIALOGUE: 'npc_dialogue',
  QUEST_UPDATE: 'quest_update',
  WELCOME: 'welcome',
};

// Game constants
const TICK_RATE = 20;
const TICK_INTERVAL = 1000 / TICK_RATE; // 50ms
const PLAYER_SPEED = 5; // units per second
const MAX_SPEED_PER_TICK = (PLAYER_SPEED / TICK_RATE) * 1.5; // tolerance for validation

export { MSG, TICK_RATE, TICK_INTERVAL, PLAYER_SPEED, MAX_SPEED_PER_TICK };
