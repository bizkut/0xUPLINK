import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Game state
const gameState = {
  players: new Map(),
  servers: new Map(),
  contracts: [],
  factions: {
    syndicate: { members: [], treasury: 0 },
    ghost: { members: [], treasury: 0 },
    ironwall: { members: [], treasury: 0 },
    chaos: { members: [], treasury: 0 },
  },
};

// Serve static files
app.use(express.static(join(__dirname, '../client')));
app.use('/shared', express.static(join(__dirname, '../shared')));

// API routes
app.get('/api/status', (req, res) => {
  res.json({
    players: gameState.players.size,
    servers: gameState.servers.size,
    uptime: process.uptime(),
  });
});

// WebSocket handling
wss.on('connection', (ws) => {
  const playerId = uuidv4();
  
  console.log(`Player connected: ${playerId}`);

  // Initialize player
  const player = {
    id: playerId,
    ws,
    ip: generateIP(),
    credits: 1000,
    reputation: 0,
    heat: 0,
    faction: null,
    online: true,
    server: generatePlayerServer(playerId),
  };

  gameState.players.set(playerId, player);
  gameState.servers.set(player.ip, player.server);

  // Send initial state
  ws.send(JSON.stringify({
    type: 'INIT',
    payload: {
      playerId,
      ip: player.ip,
      credits: player.credits,
      server: player.server,
    },
  }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleMessage(player, message);
    } catch (e) {
      console.error('Invalid message:', e);
    }
  });

  ws.on('close', () => {
    console.log(`Player disconnected: ${playerId}`);
    const p = gameState.players.get(playerId);
    if (p) {
      p.online = false;
      // Keep server active for raids
    }
  });
});

function handleMessage(player, message) {
  const { type, payload } = message;

  switch (type) {
    case 'SCAN':
      handleScan(player, payload);
      break;
    case 'CONNECT':
      handleConnect(player, payload);
      break;
    case 'HACK':
      handleHack(player, payload);
      break;
    case 'DISCONNECT':
      handleDisconnect(player, payload);
      break;
    case 'UPGRADE':
      handleUpgrade(player, payload);
      break;
    case 'JOIN_FACTION':
      handleJoinFaction(player, payload);
      break;
    default:
      console.log('Unknown message type:', type);
  }
}

function handleScan(player, { targetIp }) {
  const targetServer = gameState.servers.get(targetIp);
  
  if (!targetServer) {
    player.ws.send(JSON.stringify({
      type: 'SCAN_RESULT',
      payload: { error: 'Server not found' },
    }));
    return;
  }

  // Don't reveal full structure, just overview
  player.ws.send(JSON.stringify({
    type: 'SCAN_RESULT',
    payload: {
      ip: targetIp,
      owner: targetServer.owner,
      securityRating: targetServer.securityRating,
      nodeCount: targetServer.nodes.length,
      iceCount: targetServer.nodes.filter(n => n.ice).length,
      online: isPlayerOnline(targetServer.ownerId),
    },
  }));
}

function handleConnect(player, { targetIp }) {
  const targetServer = gameState.servers.get(targetIp);
  
  if (!targetServer) {
    player.ws.send(JSON.stringify({
      type: 'CONNECT_RESULT',
      payload: { error: 'Server not found' },
    }));
    return;
  }

  // Notify target if online
  const targetPlayer = gameState.players.get(targetServer.ownerId);
  if (targetPlayer && targetPlayer.online) {
    targetPlayer.ws.send(JSON.stringify({
      type: 'INTRUSION_ALERT',
      payload: {
        attackerIp: player.ip,
        timestamp: Date.now(),
      },
    }));
  }

  player.ws.send(JSON.stringify({
    type: 'CONNECT_RESULT',
    payload: {
      success: true,
      network: targetServer,
      defenderOnline: targetPlayer?.online || false,
    },
  }));
}

function handleHack(player, { action, nodeId, targetIp }) {
  const targetServer = gameState.servers.get(targetIp);
  if (!targetServer) return;

  // Process hack action and update server state
  // This would include breach, download, etc.
  
  // Broadcast to target if online
  const targetPlayer = gameState.players.get(targetServer.ownerId);
  if (targetPlayer && targetPlayer.online) {
    targetPlayer.ws.send(JSON.stringify({
      type: 'HACK_ACTIVITY',
      payload: { action, nodeId, attackerIp: player.ip },
    }));
  }
}

function handleDisconnect(player, { targetIp, cleanLogs }) {
  // Handle disconnect logic
  if (!cleanLogs) {
    player.heat += 5;
  }
}

function handleUpgrade(player, { item, type }) {
  // Handle purchases
}

function handleJoinFaction(player, { factionId }) {
  if (player.faction) {
    // Leave old faction
    const oldFaction = gameState.factions[player.faction];
    if (oldFaction) {
      oldFaction.members = oldFaction.members.filter(id => id !== player.id);
    }
  }

  player.faction = factionId;
  const faction = gameState.factions[factionId];
  if (faction) {
    faction.members.push(player.id);
  }

  player.ws.send(JSON.stringify({
    type: 'FACTION_JOINED',
    payload: { factionId },
  }));
}

// Helper functions
function generateIP() {
  return [
    Math.floor(Math.random() * 223) + 1,
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
  ].join('.');
}

function generatePlayerServer(ownerId) {
  return {
    ownerId,
    owner: `Player_${ownerId.substr(0, 6)}`,
    securityRating: 'LOW',
    traceRate: 2,
    nodes: [
      {
        id: 'gateway',
        type: 'gateway',
        connections: ['firewall_1'],
        ice: null,
        files: [],
      },
      {
        id: 'firewall_1',
        type: 'firewall',
        connections: ['gateway', 'storage_1'],
        ice: { id: 'firewall', name: 'Firewall', strength: 100 },
        files: [],
      },
      {
        id: 'storage_1',
        type: 'database',
        connections: ['firewall_1'],
        ice: null,
        files: [
          { name: 'personal.db', size: 1024, value: 100 },
        ],
      },
    ],
  };
}

function isPlayerOnline(playerId) {
  const player = gameState.players.get(playerId);
  return player?.online || false;
}

// Generate some NPC servers
function generateNPCServers() {
  const npcs = [
    { name: 'CyberCorp HQ', security: 'HIGH', nodeCount: 8 },
    { name: 'DataVault Inc', security: 'MEDIUM', nodeCount: 6 },
    { name: 'NeoTech Labs', security: 'MEDIUM', nodeCount: 5 },
    { name: 'Axiom Systems', security: 'LOW', nodeCount: 4 },
    { name: 'Ghost Protocol Safe House', security: 'HIGH', nodeCount: 7 },
  ];

  npcs.forEach(npc => {
    const ip = generateIP();
    gameState.servers.set(ip, {
      ownerId: 'npc',
      owner: npc.name,
      securityRating: npc.security,
      traceRate: npc.security === 'HIGH' ? 4 : npc.security === 'MEDIUM' ? 2.5 : 1.5,
      nodes: generateNPCNodes(npc.nodeCount, npc.security),
    });
  });
}

function generateNPCNodes(count, security) {
  const nodes = [
    {
      id: 'gateway',
      type: 'gateway',
      connections: ['firewall_1'],
      ice: null,
      files: [],
    },
    {
      id: 'firewall_1',
      type: 'firewall',
      connections: ['gateway', 'database_1'],
      ice: { 
        id: 'firewall', 
        name: 'Firewall', 
        strength: security === 'HIGH' ? 300 : security === 'MEDIUM' ? 200 : 100 
      },
      files: [],
    },
    {
      id: 'database_1',
      type: 'database',
      connections: ['firewall_1', 'vault_1'],
      ice: security !== 'LOW' ? { id: 'tracker', name: 'Tracker ICE' } : null,
      password: security !== 'LOW',
      files: [
        { name: 'records.db', size: 1024 * 256, value: 500 },
        { name: 'emails.txt', size: 1024 * 10, value: 100 },
      ],
    },
    {
      id: 'vault_1',
      type: 'vault',
      connections: ['database_1'],
      ice: { 
        id: 'black_ice', 
        name: 'Black ICE', 
        strength: security === 'HIGH' ? 400 : 250,
        damage: security === 'HIGH' ? 40 : 20,
      },
      password: true,
      files: [
        { 
          name: 'financial_records.enc', 
          size: 1024 * 1024, 
          value: security === 'HIGH' ? 5000 : security === 'MEDIUM' ? 2000 : 1000,
          encrypted: true,
        },
      ],
    },
  ];

  return nodes.slice(0, Math.max(count, 4));
}

// Initialize
generateNPCServers();

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║     UPLINK // Netrunner Server v0.1      ║
║                                          ║
║     Running on port ${PORT}                  ║
║     http://localhost:${PORT}                 ║
╚══════════════════════════════════════════╝
  `);
});
