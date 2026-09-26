import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { MSG } from './protocol.js';
import { GameLoop } from './GameLoop.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.fbx': 'application/octet-stream',
  '.bin': 'application/octet-stream',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, '..', 'client', req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });
const clients = new Map();

function broadcast(state, monsterAttacks) {
  const stateMsg = JSON.stringify({ type: MSG.STATE_UPDATE, data: state });
  for (const [ws] of clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(stateMsg);
    }
  }

  for (const atk of monsterAttacks) {
    const targetWs = [...clients.entries()].find(([, id]) => id === atk.targetId);
    if (targetWs && targetWs[0].readyState === targetWs[0].OPEN) {
      targetWs[0].send(JSON.stringify({
        type: MSG.COMBAT_EVENT,
        data: { source: atk.monsterId, damage: atk.damage },
      }));
    }
  }
}

const game = new GameLoop(broadcast);
let playerCounter = 0;

wss.on('connection', (ws) => {
  const playerId = `player_${++playerCounter}`;
  const playerName = `Aventureiro ${playerCounter}`;
  clients.set(ws, playerId);

  const player = game.addPlayer(playerId, playerName);

  ws.send(JSON.stringify({
    type: MSG.WELCOME,
    data: { playerId, player, state: game.getState() },
  }));

  for (const [otherWs, otherId] of clients) {
    if (otherId !== playerId && otherWs.readyState === otherWs.OPEN) {
      otherWs.send(JSON.stringify({
        type: MSG.PLAYER_JOINED,
        data: { player },
      }));
    }
  }

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    switch (msg.type) {
      case MSG.PLAYER_INPUT:
        game.handleInput(playerId, msg.data);
        break;

      case MSG.ATTACK: {
        const result = game.handleAttack(playerId, msg.data.targetId);
        ws.send(JSON.stringify({ type: MSG.COMBAT_EVENT, data: result }));
        if (result.questUpdates?.length) {
          ws.send(JSON.stringify({ type: MSG.QUEST_UPDATE, data: result.questUpdates }));
        }
        break;
      }

      case MSG.USE_SKILL: {
        const result = game.handleSkill(playerId, msg.data.targetId);
        ws.send(JSON.stringify({ type: MSG.COMBAT_EVENT, data: result }));
        if (result.questUpdates?.length) {
          ws.send(JSON.stringify({ type: MSG.QUEST_UPDATE, data: result.questUpdates }));
        }
        break;
      }

      case MSG.CHAT: {
        const chatMsg = String(msg.data.text).slice(0, 200);
        const chatPayload = JSON.stringify({
          type: MSG.CHAT_BROADCAST,
          data: { playerId, name: playerName, text: chatMsg },
        });
        for (const [otherWs] of clients) {
          if (otherWs.readyState === otherWs.OPEN) {
            otherWs.send(chatPayload);
          }
        }
        break;
      }

      case MSG.INTERACT_NPC: {
        const dialogue = game.handleNpcInteract(playerId, msg.data.npcId);
        if (dialogue) {
          ws.send(JSON.stringify({ type: MSG.NPC_DIALOGUE, data: dialogue }));
        }
        break;
      }

      case MSG.QUEST_ACCEPT: {
        const result = game.handleQuestAccept(playerId, msg.data.questId);
        ws.send(JSON.stringify({ type: MSG.QUEST_UPDATE, data: result }));
        break;
      }

      case MSG.RESPAWN: {
        game.respawnPlayer(playerId);
        break;
      }
    }
  });

  ws.on('close', () => {
    game.removePlayer(playerId);
    clients.delete(ws);
    for (const [otherWs] of clients) {
      if (otherWs.readyState === otherWs.OPEN) {
        otherWs.send(JSON.stringify({
          type: MSG.PLAYER_LEFT,
          data: { playerId },
        }));
      }
    }
  });
});

game.start();
server.listen(PORT, () => {
  console.log(`Munorok server running on http://localhost:${PORT}`);
});
