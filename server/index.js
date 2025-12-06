import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  generateUniverse,
  findNetworkByIP,
  getNetworksByZone,
  getStartingLocation,
  findRoute,
  getSecurityZone,
  generateGhostNetwork,
  isGhostExpired,
  getGhostTimeRemaining,
} from '../shared/universe.js';
import { SECURITY_ZONES, SECTORS, FACTIONS, GHOST_NETWORK_CONFIG, SAFE_HOUSE_TYPES, COUNTER_PROGRAMS, INTRUSION_CONFIG, MARKET_CONFIG, TRADEABLE_RESOURCES, DEATH_CONFIG, CHAT_CONFIG, REPUTATION_CONFIG, SPECIALIZATION_CONFIG } from '../shared/constants.js';
import {
  generateNPCSafeHouse,
  findSafeHouseAtNetwork,
  canDock,
  getEmptyAssetStorage,
  createRig,
} from '../shared/safehouses.js';
import {
  createIntrusion,
  shouldAlertOwner,
  markDetected,
  updateAttackerNode,
  applyCounterProgram,
  processCounterMeasures,
  getIntrusionInfo,
} from '../shared/defender.js';
import {
  registerUser,
  loginUser,
  savePlayerState,
  loadPlayerState
} from './db.js';
import { getRigById, getModuleById } from '../shared/computerModels.js';
import { initializeNpcMarket, loadMarketOrdersFromDb, updateOrderQuantityInDb, deleteOrderFromDb, startNpcTradingSimulation } from './npcMarket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Game state
const gameState = {
  players: new Map(),
  servers: new Map(), // Legacy - for player servers
  universe: null, // The persistent world
  ghostNetworks: new Map(), // Active ghost networks
  safeHouses: new Map(), // Safe Houses for docking and storage
  intrusions: new Map(), // Active intrusions { networkId -> [intrusions] }
  lockedNetworks: new Map(), // Networks in lockdown { networkId -> unlockTime }
  marketOrders: new Map(), // Player market orders { orderId -> order }
  contracts: [],
  factions: {
    syndicate: { members: [], treasury: 0 },
    ghost: { members: [], treasury: 0 },
    ironwall: { members: [], treasury: 0 },
    chaos: { members: [], treasury: 0 },
  },
  organizations: new Map(), // Player-created orgs
  authenticatedSessions: new Map(), // Map of authenticated userId -> playerId (for single session enforcement)
};

// Serve static files
app.use(express.static(join(__dirname, '../client')));
app.use('/shared', express.static(join(__dirname, '../shared')));

// API routes
app.get('/api/status', (req, res) => {
  res.json({
    players: gameState.players.size,
    servers: gameState.servers.size,
    networks: gameState.universe?.totalNetworks || 0,
    sectors: Object.keys(gameState.universe?.sectors || {}).length,
    uptime: process.uptime(),
  });
});

app.get('/api/universe/sectors', (req, res) => {
  if (!gameState.universe) {
    return res.status(503).json({ error: 'Universe not initialized' });
  }
  res.json(gameState.universe.sectors);
});

app.get('/api/universe/networks/:zone', (req, res) => {
  if (!gameState.universe) {
    return res.status(503).json({ error: 'Universe not initialized' });
  }
  const networks = getNetworksByZone(gameState.universe, req.params.zone);
  res.json(networks.map(n => ({
    id: n.id,
    ip: n.ip,
    owner: n.owner,
    security: n.security,
    zone: n.zone,
    zoneName: n.zoneName,
  })));
});

// WebSocket handling
wss.on('connection', (ws) => {
  const playerId = uuidv4();

  console.log(`Player connected: ${playerId}`);

  // Get starting location in the universe
  const startingNetwork = getStartingLocation(gameState.universe);
  const startingSector = Object.values(gameState.universe.sectors)
    .find(s => s.clusters.some(c =>
      gameState.universe.clusters[c]?.networks.includes(startingNetwork.id)
    ));

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
    location: {
      networkId: startingNetwork.id,
      networkIp: startingNetwork.ip,
      clusterId: startingNetwork.clusterId,
      sectorId: startingSector?.id || 'commercial_ring',
      zone: startingNetwork.zone,
    },
    resources: {
      data_packets: 0,
      bandwidth_tokens: 0,
      encryption_keys: 0,
      access_tokens: 0,
      zero_days: 0,
      quantum_cores: 0,
    },
    // Default Rig
    rig: {
      class: { id: 'burner' }, // Minimal ref, hydrated later or simple storage
      equippedModules: {
        core: [],
        memory: [],
        expansion: []
      }
    },
    files: [], // For local storage tracking
    // Death/Loss system
    rigIntegrity: DEATH_CONFIG.rigIntegrity.max,
    homeSafeHouse: null,
    respawnProtection: 0, // Timestamp when protection ends
    // Specialization
    specialization: null, // infiltrator, sentinel, broker
    skills: [],           // Array of unlocked skill IDs
  };

  gameState.players.set(playerId, player);
  gameState.servers.set(player.ip, player.server);

  // Send initial state with universe info
  ws.send(JSON.stringify({
    type: 'INIT',
    payload: {
      playerId,
      ip: player.ip,
      credits: player.credits,
      server: player.server,
      location: player.location,
      resources: player.resources,
      currentNetwork: {
        id: startingNetwork.id,
        ip: startingNetwork.ip,
        owner: startingNetwork.owner,
        security: startingNetwork.security,
        zone: startingNetwork.zone,
        zoneName: startingNetwork.zoneName,
        zoneColor: startingNetwork.zoneColor,
      },
      universe: {
        sectors: Object.keys(gameState.universe.sectors),
        totalNetworks: gameState.universe.totalNetworks,
      },
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

  ws.on('close', async () => {
    console.log(`Player disconnected: ${playerId}`);
    const p = gameState.players.get(playerId);
    if (p) {
      p.online = false;
      // Keep server active for raids

      // Clean up authenticated session tracking
      if (p.authenticatedUserId) {
        gameState.authenticatedSessions.delete(p.authenticatedUserId);
      }

      // Save state (will transparently fail if guest not in profiles)
      await savePlayerState(p.id, p);
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
    case 'NAVIGATE':
      handleNavigate(player, payload);
      break;
    case 'EXPLORE':
      handleExplore(player, payload);
      break;
    case 'HARVEST':
      handleHarvest(player, payload);
      break;
    case 'CREW_ACTION':
      handleCrewAction(player, payload);
      break;
    case 'DEPLOY_STRUCTURE':
      handleDeployStructure(player, payload);
      break;
    case 'SIEGE_START':
      handleSiegeStart(player, payload);
      break;
    case 'GHOST_SCAN':
      handleGhostScan(player);
      break;
    case 'GHOST_ENTER':
      handleGhostEnter(player, payload);
      break;
    case 'DOCK':
      handleDock(player);
      break;
    case 'UNDOCK':
      handleUndock(player);
      break;
    case 'HANGAR':
      handleHangar(player);
      break;
    case 'STORE_ITEM':
      handleStoreItem(player, payload);
      break;
    case 'RETRIEVE_ITEM':
      handleRetrieveItem(player, payload);
      break;
    case 'SWAP_RIG':
      handleSwapRig(player, payload);
      break;
    case 'SET_HOME':
      handleSetHome(player);
      break;
    case 'DEFEND_VIEW':
      handleDefendView(player);
      break;
    case 'DEFEND_BACKTRACE':
      handleDefendBacktrace(player, payload);
      break;
    case 'DEFEND_COUNTERICE':
      handleDefendCounterIce(player, payload);
      break;
    case 'DEFEND_LOCKDOWN':
      handleDefendLockdown(player, payload);
      break;
    case 'MARKET_LIST':
      handleMarketList(player, payload);
      break;
    case 'MARKET_SELL':
      handleMarketSell(player, payload);
      break;
    case 'MARKET_BUY':
      handleMarketBuy(player, payload);
      break;
    case 'MARKET_CANCEL':
      handleMarketCancel(player, payload);
      break;
    case 'MARKET_MODIFY':
      handleMarketModify(player, payload);
      break;
    case 'REPAIR':
      handleRepair(player);
      break;
    case 'RIG_STATUS':
      handleRigStatus(player);
      break;
    case 'CHAT_SEND':
      handleChatSend(player, payload);
      break;
    case 'GET_REPUTATION':
      handleGetReputation(player, payload);
      break;
    case 'GET_SKILLS':
      handleGetSkills(player);
      break;
    case 'LEARN_SKILL':
      handleLearnSkill(player, payload);
      break;
    case 'CHOOSE_SPEC':
      handleChooseSpec(player, payload);
      break;
    case 'REGISTER':
      handleRegister(player, payload);
      break;
    case 'LOGIN':
      handleLogin(player, payload);
      break;
    default:
      console.log('Unknown message type:', type);
  }
}

function handleSiegeStart(player, { structureId, networkId }) {
  console.log(`Player ${player.id} started siege on ${structureId} at ${networkId}`);
  // Broadcast to defenders would go here
}

function handleDeployStructure(player, { type, networkId }) {
  // In a real implementation, we would:
  // 1. Validate player organization (must be officer+)
  // 2. Validate location (must be in DarkNet or allowed zone)
  // 3. Validate treasury/credits
  // 4. Update universe state

  // For now, we'll just acknowledge the deployment
  // The client handles the credit deduction and local state update for the prototype

  // Find the network in the universe
  const network = gameState.universe.networks[networkId];
  if (network) {
    if (!network.structures) {
      network.structures = [];
    }
    network.structures.push({
      id: `${type}_${Date.now()}`,
      type: type,
      ownerId: player.id,
      ownerOrg: player.organization
    });
  }

  console.log(`Player ${player.id} deployed ${type} on ${networkId}`);
}

function handleCrewAction(player, { action, name }) {
  switch (action) {
    case 'create':
      if (player.organization) {
        player.ws.send(JSON.stringify({
          type: 'CREW_RESULT',
          payload: { error: 'Already in an organization' }
        }));
        return;
      }
      if (player.credits < 1000) {
        player.ws.send(JSON.stringify({
          type: 'CREW_RESULT',
          payload: { error: 'Insufficient credits (1000 CR required)' }
        }));
        return;
      }

      player.credits -= 1000;
      const crewId = `crew_${Date.now()}`;
      const crew = {
        id: crewId,
        name: name,
        type: 'CREW',
        leader: player.id,
        members: [{ id: player.id, name: `Player_${player.id.substr(0, 6)}`, role: 'LEADER' }],
        treasury: 0
      };

      gameState.organizations.set(crewId, crew);
      player.organization = crewId;

      player.ws.send(JSON.stringify({
        type: 'CREW_RESULT',
        payload: { success: true, crew }
      }));
      break;

    case 'info':
      if (!player.organization) {
        player.ws.send(JSON.stringify({
          type: 'CREW_RESULT',
          payload: { error: 'Not in an organization' }
        }));
        return;
      }

      const org = gameState.organizations.get(player.organization);
      player.ws.send(JSON.stringify({
        type: 'CREW_RESULT',
        payload: { success: true, crew: org }
      }));
      break;

    case 'leave':
      if (!player.organization) {
        player.ws.send(JSON.stringify({
          type: 'CREW_RESULT',
          payload: { error: 'Not in an organization' }
        }));
        return;
      }

      const currentOrg = gameState.organizations.get(player.organization);
      // Simple leave logic
      currentOrg.members = currentOrg.members.filter(m => m.id !== player.id);
      player.organization = null;

      player.ws.send(JSON.stringify({
        type: 'CREW_RESULT',
        payload: { success: true, left: true }
      }));
      break;
  }
}

function handleScan(player, { targetIp }) {
  const targetServer = findTarget(targetIp);

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
  const targetServer = findTarget(targetIp);

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
  const targetServer = findTarget(targetIp);
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

function handleNavigate(player, { targetNetworkId }) {
  const targetNetwork = gameState.universe.networks[targetNetworkId];

  if (!targetNetwork) {
    player.ws.send(JSON.stringify({
      type: 'NAVIGATE_RESULT',
      payload: { error: 'Network not found' },
    }));
    return;
  }

  // Find route from current location
  const route = findRoute(gameState.universe, player.location.networkId, targetNetworkId);

  if (!route) {
    player.ws.send(JSON.stringify({
      type: 'NAVIGATE_RESULT',
      payload: { error: 'No route to target network' },
    }));
    return;
  }

  // Update player location
  const cluster = gameState.universe.clusters[targetNetwork.clusterId];
  const sector = Object.values(gameState.universe.sectors)
    .find(s => s.clusters.includes(targetNetwork.clusterId));

  player.location = {
    networkId: targetNetwork.id,
    networkIp: targetNetwork.ip,
    clusterId: targetNetwork.clusterId,
    sectorId: sector?.id || player.location.sectorId,
    zone: targetNetwork.zone,
  };

  player.ws.send(JSON.stringify({
    type: 'NAVIGATE_RESULT',
    payload: {
      success: true,
      route: route,
      jumps: route.length - 1,
      location: player.location,
      currentNetwork: {
        id: targetNetwork.id,
        ip: targetNetwork.ip,
        owner: targetNetwork.owner,
        security: targetNetwork.security,
        zone: targetNetwork.zone,
        zoneName: targetNetwork.zoneName,
        zoneColor: targetNetwork.zoneColor,
        connections: targetNetwork.connections,
      },
    },
  }));
}

function handleExplore(player, { clusterId, sectorId }) {
  let networks = [];

  if (clusterId) {
    const cluster = gameState.universe.clusters[clusterId];
    if (cluster) {
      networks = cluster.networks.map(nId => {
        const n = gameState.universe.networks[nId];
        return {
          id: n.id,
          ip: n.ip,
          owner: n.owner,
          security: n.security,
          zone: n.zone,
          zoneName: n.zoneName,
          connections: n.connections.length,
        };
      });
    }
  } else if (sectorId) {
    const sector = gameState.universe.sectors[sectorId.toUpperCase()];
    if (sector) {
      player.ws.send(JSON.stringify({
        type: 'EXPLORE_RESULT',
        payload: {
          type: 'sector',
          sector: {
            id: sector.id,
            name: sector.name,
            description: sector.description,
            zone: sector.zone,
            securityRange: sector.securityRange,
            clusterCount: sector.clusters.length,
            clusters: sector.clusters.map(cId => ({
              id: cId,
              name: gameState.universe.clusters[cId]?.name,
              networkCount: gameState.universe.clusters[cId]?.networks.length,
            })),
          },
        },
      }));
      return;
    }
  } else {
    // Explore current cluster
    const cluster = gameState.universe.clusters[player.location.clusterId];
    if (cluster) {
      networks = cluster.networks.map(nId => {
        const n = gameState.universe.networks[nId];
        return {
          id: n.id,
          ip: n.ip,
          owner: n.owner,
          security: n.security,
          zone: n.zone,
          zoneName: n.zoneName,
          connections: n.connections.length,
          isCurrent: n.id === player.location.networkId,
        };
      });
    }
  }

  player.ws.send(JSON.stringify({
    type: 'EXPLORE_RESULT',
    payload: {
      type: 'cluster',
      clusterId: clusterId || player.location.clusterId,
      networks,
    },
  }));
}

function handleHarvest(player, { nodeId }) {
  // Get current network from universe
  const network = gameState.universe.networks[player.location.networkId];
  if (!network) {
    player.ws.send(JSON.stringify({
      type: 'HARVEST_RESULT',
      payload: { error: 'Invalid location' },
    }));
    return;
  }

  const node = network.nodes.find(n => n.id === nodeId);
  if (!node) {
    player.ws.send(JSON.stringify({
      type: 'HARVEST_RESULT',
      payload: { error: 'Node not found' },
    }));
    return;
  }

  if (!node.resources || node.resources.length === 0) {
    player.ws.send(JSON.stringify({
      type: 'HARVEST_RESULT',
      payload: { error: 'No resources to harvest' },
    }));
    return;
  }

  // Harvest resources
  const harvested = [];
  for (const resource of node.resources) {
    if (player.resources[resource.type] !== undefined) {
      player.resources[resource.type] += resource.amount;
      harvested.push({ type: resource.type, amount: resource.amount });
    }
  }

  // Clear resources from node (they respawn over time - TODO)
  node.resources = [];

  player.ws.send(JSON.stringify({
    type: 'HARVEST_RESULT',
    payload: {
      success: true,
      harvested,
      resources: player.resources,
    },
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

function findTarget(ip) {
  // Check legacy/player servers first
  let target = gameState.servers.get(ip);

  // If not found, check universe networks
  if (!target && gameState.universe) {
    const network = findNetworkByIP(gameState.universe, ip);
    if (network) {
      target = network;
      // Map security rating if missing (legacy client compatibility)
      if (!target.securityRating) {
        if (target.security >= 0.7) target.securityRating = 'HIGH';
        else if (target.security >= 0.4) target.securityRating = 'MEDIUM';
        else target.securityRating = 'LOW';
      }
    }
  }

  return target;
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

// Initialize universe
function initializeUniverse() {
  console.log('Generating universe...');
  const startTime = Date.now();

  gameState.universe = generateUniverse();

  const elapsed = Date.now() - startTime;
  console.log(`Universe generated in ${elapsed}ms`);
  console.log(`  Sectors: ${Object.keys(gameState.universe.sectors).length}`);
  console.log(`  Clusters: ${Object.keys(gameState.universe.clusters).length}`);
  console.log(`  Networks: ${gameState.universe.totalNetworks}`);

  // Log zone distribution
  const zoneCount = { clearnet: 0, greynet: 0, darknet: 0 };
  for (const network of Object.values(gameState.universe.networks)) {
    zoneCount[network.zone]++;
  }
  console.log(`  ClearNet: ${zoneCount.clearnet} | GreyNet: ${zoneCount.greynet} | DarkNet: ${zoneCount.darknet}`);
}

// Initialize
initializeUniverse();
generateNPCServers(); // Legacy NPC servers for backwards compatibility
spawnNPCSafeHouses(); // Spawn Safe Houses in the universe
spawnInitialGhostNetworks(); // Spawn some ghost networks on startup
seedNpcMarket(); // Seed NPC market with computer and module orders
startGhostSpawnLoop(); // Start periodic ghost spawning
startIntrusionProcessingLoop(); // Process intrusions and alerts
startMarketCleanupLoop(); // Clean expired market orders

// Seed NPC Market Orders (async - loads from DB or seeds new)
async function seedNpcMarket() {
  const result = await initializeNpcMarket();

  if (result.orders) {
    for (const order of result.orders) {
      gameState.marketOrders.set(order.id, order);
    }
    console.log(`  NPC Market: ${result.orders.length} orders ${result.fromDb ? 'loaded from DB' : 'seeded to DB'}`);
  }

  // Start the NPC trading simulation (runs every 24 hours)
  startNpcTradingSimulation();
}

// Chat & Communications Handlers
function handleChatSend(player, { channel, message }) {
  if (!message || message.length === 0) return;

  // Validate and truncate message
  const cleanMessage = message.slice(0, CHAT_CONFIG.maxMessageLength);

  // Get recipients based on channel
  const recipients = getChatRecipients(player, channel);

  // Get sender's title
  const title = getPlayerTitle(player.reputation || 0);

  // Broadcast message
  const chatMessage = {
    type: 'CHAT_MESSAGE',
    payload: {
      channel,
      sender: player.ip,
      title: title.title,
      titleColor: title.color,
      message: cleanMessage,
      timestamp: Date.now(),
    },
  };

  for (const recipient of recipients) {
    if (recipient.online && recipient.ws) {
      recipient.ws.send(JSON.stringify(chatMessage));
    }
  }

  console.log(`[CHAT:${channel.toUpperCase()}] ${player.ip}: ${cleanMessage.slice(0, 50)}...`);
}

function getChatRecipients(sender, channel) {
  const recipients = [];

  for (const [, player] of gameState.players) {
    if (!player.online) continue;

    switch (channel) {
      case 'local':
        // Same cluster
        if (player.location?.clusterId === sender.location?.clusterId) {
          recipients.push(player);
        }
        break;
      case 'global':
        // Everyone
        recipients.push(player);
        break;
      case 'crew':
        // Same organization (if implemented)
        if (player.organization && player.organization === sender.organization) {
          recipients.push(player);
        }
        break;
      case 'darknet':
        // Only in DarkNet zone
        if (player.location?.zone === 'darknet') {
          recipients.push(player);
        }
        break;
      default:
        // Default to global
        recipients.push(player);
    }
  }

  return recipients;
}

function getPlayerTitle(reputation) {
  const titles = REPUTATION_CONFIG.titles;
  for (let i = titles.length - 1; i >= 0; i--) {
    if (reputation >= titles[i].minRep) {
      return titles[i];
    }
  }
  return titles[0];
}

function handleGetReputation(player, { targetIp }) {
  const target = targetIp
    ? Array.from(gameState.players.values()).find(p => p.ip === targetIp)
    : player;

  if (!target) {
    player.ws.send(JSON.stringify({
      type: 'REPUTATION_RESULT',
      payload: { error: 'Player not found.' },
    }));
    return;
  }

  const title = getPlayerTitle(target.reputation || 0);

  player.ws.send(JSON.stringify({
    type: 'REPUTATION_RESULT',
    payload: {
      ip: target.ip,
      reputation: target.reputation || 0,
      title: title.title,
      titleColor: title.color,
      successfulHacks: target.stats?.hacks || 0,
      tracedCount: target.stats?.traced || 0,
      trades: target.stats?.trades || 0,
    },
  }));
}

function adjustReputation(player, action) {
  const amount = REPUTATION_CONFIG.actions[action];
  if (amount !== undefined) {
    player.reputation = (player.reputation || 0) + amount;
    console.log(`[REP] ${player.ip}: ${action} (${amount > 0 ? '+' : ''}${amount})`);
  }
}

// Specialization Handlers
function handleGetSkills(player) {
  const paths = Object.values(SPECIALIZATION_CONFIG.paths).map(path => ({
    id: path.id,
    name: path.name,
    description: path.description,
    icon: path.icon,
    skills: path.skills.map(s => ({
      ...s,
      unlocked: player.skills.includes(s.id),
    })),
  }));

  player.ws.send(JSON.stringify({
    type: 'SKILLS_RESULT',
    payload: {
      specialization: player.specialization,
      unlockedSkills: player.skills,
      paths,
      respecCost: SPECIALIZATION_CONFIG.respecCost,
    },
  }));
}

function handleChooseSpec(player, { specId }) {
  if (player.specialization) {
    player.ws.send(JSON.stringify({
      type: 'CHOOSE_SPEC_RESULT',
      payload: { error: `Already specialized as ${player.specialization}. Use respec to change.` },
    }));
    return;
  }

  const spec = SPECIALIZATION_CONFIG.paths[specId.toUpperCase()];
  if (!spec) {
    player.ws.send(JSON.stringify({
      type: 'CHOOSE_SPEC_RESULT',
      payload: { error: 'Invalid specialization. Choose: infiltrator, sentinel, or broker.' },
    }));
    return;
  }

  player.specialization = spec.id;

  player.ws.send(JSON.stringify({
    type: 'CHOOSE_SPEC_RESULT',
    payload: {
      success: true,
      specialization: spec.id,
      name: spec.name,
      description: spec.description,
    },
  }));

  console.log(`[SPEC] ${player.ip} chose ${spec.name}`);
}

function handleLearnSkill(player, { skillId }) {
  if (!player.specialization) {
    player.ws.send(JSON.stringify({
      type: 'LEARN_SKILL_RESULT',
      payload: { error: 'Choose a specialization first with "spec choose <type>".' },
    }));
    return;
  }

  // Find the skill
  const spec = SPECIALIZATION_CONFIG.paths[player.specialization.toUpperCase()];
  if (!spec) {
    player.ws.send(JSON.stringify({
      type: 'LEARN_SKILL_RESULT',
      payload: { error: 'Invalid specialization state.' },
    }));
    return;
  }

  const skill = spec.skills.find(s => s.id === skillId);
  if (!skill) {
    player.ws.send(JSON.stringify({
      type: 'LEARN_SKILL_RESULT',
      payload: { error: 'Skill not found in your specialization.' },
    }));
    return;
  }

  // Check if already learned
  if (player.skills.includes(skillId)) {
    player.ws.send(JSON.stringify({
      type: 'LEARN_SKILL_RESULT',
      payload: { error: 'Skill already learned.' },
    }));
    return;
  }

  // Check prerequisites (must have previous level skills)
  const prereqSkills = spec.skills.filter(s => s.level < skill.level);
  for (const prereq of prereqSkills) {
    if (!player.skills.includes(prereq.id)) {
      player.ws.send(JSON.stringify({
        type: 'LEARN_SKILL_RESULT',
        payload: { error: `Learn "${prereq.name}" first (level ${prereq.level}).` },
      }));
      return;
    }
  }

  // Check credits
  if (player.credits < skill.cost) {
    player.ws.send(JSON.stringify({
      type: 'LEARN_SKILL_RESULT',
      payload: { error: `Insufficient credits. Need ${skill.cost} CR.` },
    }));
    return;
  }

  // Learn skill
  player.credits -= skill.cost;
  player.skills.push(skillId);

  player.ws.send(JSON.stringify({
    type: 'LEARN_SKILL_RESULT',
    payload: {
      success: true,
      skill: skill.name,
      effect: skill.effect,
      cost: skill.cost,
      credits: player.credits,
    },
  }));

  console.log(`[SKILL] ${player.ip} learned ${skill.name}`);
}

// Death/Loss Handlers
function handlePlayerTraced(player, hunter = null) {
  const config = DEATH_CONFIG.traceConsequences;

  // Calculate losses
  const creditLost = Math.floor(player.credits * config.creditLoss);
  const resourcesLost = {};

  // Lose 50% of carried resources
  for (const [type, amount] of Object.entries(player.resources)) {
    const lost = Math.floor(amount * config.cargoLoss);
    if (lost > 0) {
      resourcesLost[type] = lost;
      player.resources[type] -= lost;
    }
  }

  // Apply consequences
  player.credits -= creditLost;
  player.heat += config.heatGain;
  player.rigIntegrity = Math.max(0, player.rigIntegrity - config.rigDamage);

  // Reward hunter if applicable
  let bountyPaid = 0;
  if (hunter) {
    bountyPaid = Math.floor(creditLost * config.bountyReward);
    hunter.credits += bountyPaid;

    if (hunter.online) {
      hunter.ws.send(JSON.stringify({
        type: 'BOUNTY_RECEIVED',
        payload: {
          target: player.ip,
          reward: bountyPaid,
        },
      }));
    }
  }

  // Get respawn location
  const respawnLocation = getRespawnLocation(player);
  player.location = respawnLocation;
  player.respawnProtection = Date.now() + DEATH_CONFIG.respawn.protectionTime;

  // Notify player
  player.ws.send(JSON.stringify({
    type: 'TRACED',
    payload: {
      message: 'TRACE COMPLETE! You have been caught.',
      creditLost,
      resourcesLost,
      heatGain: config.heatGain,
      rigDamage: config.rigDamage,
      rigIntegrity: player.rigIntegrity,
      respawnLocation: respawnLocation.networkIp,
      protectionTime: DEATH_CONFIG.respawn.protectionTime / 1000,
    },
  }));

  console.log(`[DEATH] ${player.ip} was traced. Lost ${creditLost} CR, rig at ${player.rigIntegrity}%`);
}

function getRespawnLocation(player) {
  // If player has a home Safe House set, respawn there
  if (player.homeSafeHouse) {
    const safeHouse = gameState.safeHouses.get(player.homeSafeHouse);
    if (safeHouse) {
      const network = gameState.universe.networks[safeHouse.networkId];
      if (network) {
        return {
          networkId: network.id,
          networkIp: network.ip,
          clusterId: network.clusterId,
          sectorId: network.sectorId,
          zone: network.zone,
        };
      }
    }
  }

  // Otherwise, respawn in random ClearNet location
  return getStartingLocation(gameState.universe);
}

function handleRepair(player) {
  const maxIntegrity = DEATH_CONFIG.rigIntegrity.max;
  const costPerPoint = DEATH_CONFIG.rigIntegrity.repairCostPerPoint;

  const damageToRepair = maxIntegrity - player.rigIntegrity;

  if (damageToRepair === 0) {
    player.ws.send(JSON.stringify({
      type: 'REPAIR_RESULT',
      payload: { error: 'Rig is at full integrity.' },
    }));
    return;
  }

  const totalCost = damageToRepair * costPerPoint;

  if (player.credits < totalCost) {
    // Partial repair
    const pointsAffordable = Math.floor(player.credits / costPerPoint);
    if (pointsAffordable === 0) {
      player.ws.send(JSON.stringify({
        type: 'REPAIR_RESULT',
        payload: { error: `Insufficient credits. Full repair costs ${totalCost} CR.` },
      }));
      return;
    }

    player.rigIntegrity += pointsAffordable;
    player.credits -= pointsAffordable * costPerPoint;

    player.ws.send(JSON.stringify({
      type: 'REPAIR_RESULT',
      payload: {
        success: true,
        repaired: pointsAffordable,
        cost: pointsAffordable * costPerPoint,
        rigIntegrity: player.rigIntegrity,
        credits: player.credits,
        partial: true,
      },
    }));
  } else {
    player.rigIntegrity = maxIntegrity;
    player.credits -= totalCost;

    player.ws.send(JSON.stringify({
      type: 'REPAIR_RESULT',
      payload: {
        success: true,
        repaired: damageToRepair,
        cost: totalCost,
        rigIntegrity: player.rigIntegrity,
        credits: player.credits,
      },
    }));
  }

  console.log(`[REPAIR] ${player.ip} repaired rig to ${player.rigIntegrity}%`);
}

function handleRigStatus(player) {
  const integrity = player.rigIntegrity;
  const degradedThreshold = DEATH_CONFIG.rigIntegrity.degradedThreshold;
  const isDegraded = integrity <= degradedThreshold;

  player.ws.send(JSON.stringify({
    type: 'RIG_STATUS_RESULT',
    payload: {
      integrity,
      maxIntegrity: DEATH_CONFIG.rigIntegrity.max,
      isDegraded,
      degradedPenalty: isDegraded ? DEATH_CONFIG.rigIntegrity.degradedPenalty : 0,
      repairCost: (DEATH_CONFIG.rigIntegrity.max - integrity) * DEATH_CONFIG.rigIntegrity.repairCostPerPoint,
    },
  }));
}

// Market Handlers
function handleMarketList(player, { resourceType, itemType }) {
  let orders = Array.from(gameState.marketOrders.values());

  // Filter expired orders
  const now = Date.now();
  orders = orders.filter(o => o.expiresAt > now);

  // Filter by item type if specified (computer, module, resource)
  if (itemType) {
    orders = orders.filter(o => o.itemType === itemType);
  }

  // Filter by resource type if specified (legacy support)
  if (resourceType && TRADEABLE_RESOURCES.includes(resourceType)) {
    orders = orders.filter(o => o.resourceType === resourceType);
  }

  // Don't show player's own orders in market view (they use separate command)
  const marketOrders = orders.filter(o => o.sellerId !== player.id);
  const myOrders = orders.filter(o => o.sellerId === player.id);

  player.ws.send(JSON.stringify({
    type: 'MARKET_LIST_RESULT',
    payload: {
      success: true,
      // Map orders but HIDE seller names (anonymous market like Eve Online)
      orders: marketOrders.map(o => ({
        id: o.id,
        // Anonymous: never reveal seller identity
        seller: 'Anonymous',
        isNpc: o.isNpc || false,
        // Item info
        itemType: o.itemType || 'resource',
        itemId: o.itemId,
        itemName: o.itemName || o.resourceType,
        itemTier: o.itemTier,
        itemCategory: o.itemCategory,
        // Resource legacy fields
        resource: o.resourceType,
        amount: o.amount || o.quantity,
        quantity: o.quantity || o.amount,
        // Pricing
        price: o.price || o.pricePerUnit,
        pricePerUnit: o.pricePerUnit || o.price,
        total: o.totalPrice || o.price,
        expiresIn: Math.floor((o.expiresAt - now) / 60000), // minutes
      })),
      myOrders: myOrders.map(o => ({
        id: o.id,
        resource: o.resourceType,
        amount: o.amount,
        pricePerUnit: o.pricePerUnit,
        total: o.totalPrice,
      })),
    },
  }));
}

function handleMarketSell(player, { resourceType, amount, pricePerUnit }) {
  // Validate resource type
  if (!TRADEABLE_RESOURCES.includes(resourceType)) {
    player.ws.send(JSON.stringify({
      type: 'MARKET_SELL_RESULT',
      payload: { error: `Invalid resource type. Tradeable: ${TRADEABLE_RESOURCES.join(', ')}` },
    }));
    return;
  }

  // Validate amount
  const available = player.resources?.[resourceType] || 0;
  if (amount <= 0 || amount > available) {
    player.ws.send(JSON.stringify({
      type: 'MARKET_SELL_RESULT',
      payload: { error: `Invalid amount. You have ${available} ${resourceType}.` },
    }));
    return;
  }

  // Validate price
  if (pricePerUnit < MARKET_CONFIG.minPrice || pricePerUnit > MARKET_CONFIG.maxPrice) {
    player.ws.send(JSON.stringify({
      type: 'MARKET_SELL_RESULT',
      payload: { error: `Price must be between ${MARKET_CONFIG.minPrice} and ${MARKET_CONFIG.maxPrice} CR.` },
    }));
    return;
  }

  // Check listing fee
  if (player.credits < MARKET_CONFIG.listingFee) {
    player.ws.send(JSON.stringify({
      type: 'MARKET_SELL_RESULT',
      payload: { error: `Insufficient credits for listing fee (${MARKET_CONFIG.listingFee} CR).` },
    }));
    return;
  }

  // Check max active orders
  const playerOrders = Array.from(gameState.marketOrders.values()).filter(o => o.sellerId === player.id);
  if (playerOrders.length >= MARKET_CONFIG.maxActiveOrders) {
    player.ws.send(JSON.stringify({
      type: 'MARKET_SELL_RESULT',
      payload: { error: `Max active orders reached (${MARKET_CONFIG.maxActiveOrders}).` },
    }));
    return;
  }

  // Create order
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const order = {
    id: orderId,
    sellerId: player.id,
    sellerName: player.ip, // Use IP as identifier
    orderType: 'sell',     // Sell order (player selling resources)
    resourceType,
    amount,
    originalAmount: amount, // Track original for modification rules
    pricePerUnit,
    totalPrice: amount * pricePerUnit,
    createdAt: Date.now(),
    lastModified: Date.now(), // Track for modification cooldown
    expiresAt: Date.now() + MARKET_CONFIG.orderExpiry,
  };

  // Deduct resources and listing fee
  player.resources[resourceType] -= amount;
  player.credits -= MARKET_CONFIG.listingFee;

  gameState.marketOrders.set(orderId, order);

  player.ws.send(JSON.stringify({
    type: 'MARKET_SELL_RESULT',
    payload: {
      success: true,
      orderId,
      listed: { resource: resourceType, amount, pricePerUnit },
      fee: MARKET_CONFIG.listingFee,
      credits: player.credits,
    },
  }));

  console.log(`[MARKET] ${player.ip} listed ${amount}x ${resourceType} @ ${pricePerUnit} CR each`);
}

function handleMarketBuy(player, { orderId }) {
  const order = gameState.marketOrders.get(orderId);

  if (!order) {
    player.ws.send(JSON.stringify({
      type: 'MARKET_BUY_RESULT',
      payload: { error: 'Order not found or expired.' },
    }));
    return;
  }

  // Can't buy own order
  if (order.sellerId === player.id) {
    player.ws.send(JSON.stringify({
      type: 'MARKET_BUY_RESULT',
      payload: { error: 'Cannot buy your own order.' },
    }));
    return;
  }

  // Check buyer credits
  if (player.credits < order.totalPrice) {
    player.ws.send(JSON.stringify({
      type: 'MARKET_BUY_RESULT',
      payload: { error: `Insufficient credits. Need ${order.totalPrice} CR.` },
    }));
    return;
  }

  // Execute trade
  const fee = Math.floor(order.totalPrice * MARKET_CONFIG.transactionFee);
  const sellerReceives = order.totalPrice - fee;

  // Deduct from buyer
  player.credits -= order.totalPrice;
  player.resources[order.resourceType] = (player.resources[order.resourceType] || 0) + order.amount;

  // Credit seller
  const seller = gameState.players.get(order.sellerId);
  if (seller) {
    seller.credits += sellerReceives;

    // Notify seller if online
    if (seller.online) {
      seller.ws.send(JSON.stringify({
        type: 'MARKET_SALE_NOTIFICATION',
        payload: {
          resource: order.resourceType,
          amount: order.amount,
          received: sellerReceives,
          buyer: player.ip,
        },
      }));
    }
  }

  // Remove order
  gameState.marketOrders.delete(orderId);

  player.ws.send(JSON.stringify({
    type: 'MARKET_BUY_RESULT',
    payload: {
      success: true,
      bought: { resource: order.resourceType, amount: order.amount },
      paid: order.totalPrice,
      credits: player.credits,
    },
  }));

  console.log(`[MARKET] ${player.ip} bought ${order.amount}x ${order.resourceType} from ${order.sellerName}`);
}

function handleMarketCancel(player, { orderId }) {
  const order = gameState.marketOrders.get(orderId);

  if (!order || order.sellerId !== player.id) {
    player.ws.send(JSON.stringify({
      type: 'MARKET_CANCEL_RESULT',
      payload: { error: 'Order not found or not yours.' },
    }));
    return;
  }

  // Return resources to seller (for sell orders) or credits (for buy orders)
  if (order.orderType === 'buy') {
    player.credits += order.totalPrice;
  } else {
    player.resources[order.resourceType] = (player.resources[order.resourceType] || 0) + order.amount;
  }

  gameState.marketOrders.delete(orderId);

  player.ws.send(JSON.stringify({
    type: 'MARKET_CANCEL_RESULT',
    payload: {
      success: true,
      returned: order.orderType === 'buy'
        ? { credits: order.totalPrice }
        : { resource: order.resourceType, amount: order.amount },
    },
  }));
}

// Modify an existing order (Eve-style bid/ask rules)
// Sell orders: quantity can only DECREASE
// Buy orders: quantity can only INCREASE
// 2-minute cooldown on modifications
// Modification charged same as new listing
function handleMarketModify(player, { orderId, newAmount, newPrice }) {
  const order = gameState.marketOrders.get(orderId);

  if (!order || order.sellerId !== player.id) {
    player.ws.send(JSON.stringify({
      type: 'MARKET_MODIFY_RESULT',
      payload: { error: 'Order not found or not yours.' },
    }));
    return;
  }

  const now = Date.now();

  // Check 2-minute cooldown
  if (order.lastModified && (now - order.lastModified) < MARKET_CONFIG.modifyCooldown) {
    const remainingSeconds = Math.ceil((MARKET_CONFIG.modifyCooldown - (now - order.lastModified)) / 1000);
    player.ws.send(JSON.stringify({
      type: 'MARKET_MODIFY_RESULT',
      payload: { error: `Order on cooldown. Wait ${remainingSeconds} seconds.` },
    }));
    return;
  }

  // Validate new amount based on order type (Eve-style bid/ask)
  if (newAmount !== undefined && newAmount !== order.amount) {
    if (order.orderType === 'sell') {
      // Sell orders: can only DECREASE quantity
      if (newAmount > order.amount) {
        player.ws.send(JSON.stringify({
          type: 'MARKET_MODIFY_RESULT',
          payload: { error: 'Sell orders can only decrease quantity, not increase.' },
        }));
        return;
      }
      if (newAmount <= 0) {
        player.ws.send(JSON.stringify({
          type: 'MARKET_MODIFY_RESULT',
          payload: { error: 'Amount must be greater than 0. Use cancel instead.' },
        }));
        return;
      }
      // Return the difference to player's resources
      const difference = order.amount - newAmount;
      player.resources[order.resourceType] = (player.resources[order.resourceType] || 0) + difference;
    } else if (order.orderType === 'buy') {
      // Buy orders: can only INCREASE quantity
      if (newAmount < order.amount) {
        player.ws.send(JSON.stringify({
          type: 'MARKET_MODIFY_RESULT',
          payload: { error: 'Buy orders can only increase quantity, not decrease.' },
        }));
        return;
      }
      // Need to lock additional credits
      const additionalQty = newAmount - order.amount;
      const additionalCost = additionalQty * order.pricePerUnit;
      if (player.credits < additionalCost + MARKET_CONFIG.listingFee) {
        player.ws.send(JSON.stringify({
          type: 'MARKET_MODIFY_RESULT',
          payload: { error: `Insufficient credits. Need ${additionalCost + MARKET_CONFIG.listingFee} CR.` },
        }));
        return;
      }
      player.credits -= additionalCost;
    }
    order.amount = newAmount;
    order.totalPrice = newAmount * order.pricePerUnit;
  }

  // Validate and apply new price
  if (newPrice !== undefined && newPrice !== order.pricePerUnit) {
    if (newPrice < MARKET_CONFIG.minPrice || newPrice > MARKET_CONFIG.maxPrice) {
      player.ws.send(JSON.stringify({
        type: 'MARKET_MODIFY_RESULT',
        payload: { error: `Price must be between ${MARKET_CONFIG.minPrice} and ${MARKET_CONFIG.maxPrice} CR.` },
      }));
      return;
    }
    order.pricePerUnit = newPrice;
    order.totalPrice = order.amount * newPrice;
  }

  // Charge listing fee (like new order)
  if (player.credits < MARKET_CONFIG.listingFee) {
    player.ws.send(JSON.stringify({
      type: 'MARKET_MODIFY_RESULT',
      payload: { error: `Insufficient credits for modification fee (${MARKET_CONFIG.listingFee} CR).` },
    }));
    return;
  }
  player.credits -= MARKET_CONFIG.listingFee;

  // Update modification timestamp
  order.lastModified = now;

  player.ws.send(JSON.stringify({
    type: 'MARKET_MODIFY_RESULT',
    payload: {
      success: true,
      orderId: order.id,
      newAmount: order.amount,
      newPrice: order.pricePerUnit,
      fee: MARKET_CONFIG.listingFee,
      credits: player.credits,
    },
  }));
}

function startMarketCleanupLoop() {
  // Every 5 minutes, clean expired orders
  setInterval(() => {
    const now = Date.now();
    for (const [id, order] of gameState.marketOrders) {
      if (order.expiresAt <= now) {
        // Return resources to seller
        const seller = gameState.players.get(order.sellerId);
        if (seller) {
          seller.resources[order.resourceType] = (seller.resources[order.resourceType] || 0) + order.amount;

          if (seller.online) {
            seller.ws.send(JSON.stringify({
              type: 'MARKET_ORDER_EXPIRED',
              payload: {
                resource: order.resourceType,
                amount: order.amount,
                returned: true,
              },
            }));
          }
        }
        gameState.marketOrders.delete(id);
        console.log(`[MARKET] Order ${id} expired`);
      }
    }
  }, 300000); // 5 minutes
}
function handleDefendView(player) {
  // Get all intrusions on networks owned by this player
  const ownedIntrusions = [];

  for (const [networkId, intrusions] of gameState.intrusions) {
    const network = gameState.universe.networks[networkId];
    // Check if player owns this network (for now, using player's own server)
    if (network && network.ownerId === player.id) {
      for (const intrusion of intrusions) {
        if (intrusion.status === 'active') {
          ownedIntrusions.push(getIntrusionInfo(intrusion));
        }
      }
    }
  }

  player.ws.send(JSON.stringify({
    type: 'DEFEND_VIEW_RESULT',
    payload: {
      success: true,
      intrusions: ownedIntrusions,
      counterPrograms: Object.values(COUNTER_PROGRAMS).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        cost: p.cost,
      })),
    },
  }));
}

function handleDefendBacktrace(player, { intrusionId }) {
  const result = applyDefenderAction(player, intrusionId, 'BACKTRACE');

  player.ws.send(JSON.stringify({
    type: 'DEFEND_BACKTRACE_RESULT',
    payload: result,
  }));
}

function handleDefendCounterIce(player, { intrusionId }) {
  const result = applyDefenderAction(player, intrusionId, 'COUNTER_ICE');

  player.ws.send(JSON.stringify({
    type: 'DEFEND_COUNTERICE_RESULT',
    payload: result,
  }));
}

function handleDefendLockdown(player, { networkId }) {
  // Find all active intrusions on this network
  const intrusions = gameState.intrusions.get(networkId) || [];
  const activeIntrusions = intrusions.filter(i => i.status === 'active');

  if (activeIntrusions.length === 0) {
    player.ws.send(JSON.stringify({
      type: 'DEFEND_LOCKDOWN_RESULT',
      payload: { error: 'No active intrusions on this network.' },
    }));
    return;
  }

  // Check cost
  const cost = COUNTER_PROGRAMS.LOCKDOWN.cost;
  if (player.credits < cost) {
    player.ws.send(JSON.stringify({
      type: 'DEFEND_LOCKDOWN_RESULT',
      payload: { error: `Insufficient credits. Lockdown costs ${cost} CR.` },
    }));
    return;
  }

  // Deduct cost
  player.credits -= cost;

  // Lock the network
  const lockDuration = COUNTER_PROGRAMS.LOCKDOWN.lockDuration;
  gameState.lockedNetworks.set(networkId, Date.now() + lockDuration);

  // Disconnect all intruders
  for (const intrusion of activeIntrusions) {
    intrusion.status = 'lockdown';

    // Notify the attacker
    const attacker = gameState.players.get(intrusion.attackerId);
    if (attacker && attacker.online) {
      attacker.ws.send(JSON.stringify({
        type: 'DEFENDER_ACTION',
        payload: {
          action: 'lockdown',
          message: 'EMERGENCY LOCKDOWN! You have been forcibly disconnected.',
          networkId,
        },
      }));
    }
  }

  player.ws.send(JSON.stringify({
    type: 'DEFEND_LOCKDOWN_RESULT',
    payload: {
      success: true,
      disconnected: activeIntrusions.length,
      lockDuration: lockDuration / 1000,
      credits: player.credits,
    },
  }));

  console.log(`[DEFEND] ${player.id} locked down network ${networkId}`);
}

function applyDefenderAction(player, intrusionId, programType) {
  // Find the intrusion
  let targetIntrusion = null;
  let targetNetworkId = null;

  for (const [networkId, intrusions] of gameState.intrusions) {
    const found = intrusions.find(i => i.id === intrusionId);
    if (found) {
      targetIntrusion = found;
      targetNetworkId = networkId;
      break;
    }
  }

  if (!targetIntrusion) {
    return { error: 'Intrusion not found.' };
  }

  // Verify ownership
  const network = gameState.universe.networks[targetNetworkId];
  if (!network || network.ownerId !== player.id) {
    return { error: 'You do not own this network.' };
  }

  // Check cost
  const program = COUNTER_PROGRAMS[programType];
  if (player.credits < program.cost) {
    return { error: `Insufficient credits. ${program.name} costs ${program.cost} CR.` };
  }

  // Deduct cost and apply
  player.credits -= program.cost;
  const result = applyCounterProgram(targetIntrusion, programType, player.id);

  if (result.error) {
    player.credits += program.cost; // Refund
    return result;
  }

  // Notify attacker that counter-measure is active
  const attacker = gameState.players.get(targetIntrusion.attackerId);
  if (attacker && attacker.online) {
    attacker.ws.send(JSON.stringify({
      type: 'DEFENDER_ACTION',
      payload: {
        action: programType.toLowerCase(),
        message: `WARNING: ${program.name} detected!`,
        duration: program.duration,
      },
    }));
  }

  return {
    success: true,
    program: program.name,
    duration: program.duration / 1000,
    credits: player.credits,
  };
}

// Track intrusion when player connects to a network
function trackIntrusion(attackerId, attackerIp, networkId) {
  const network = gameState.universe.networks[networkId];
  if (!network || !network.ownerId) return null;

  // Don't track intrusions on NPC networks for now
  if (network.ownerId === 'npc') return null;

  const intrusion = createIntrusion(networkId, attackerId, attackerIp);

  if (!gameState.intrusions.has(networkId)) {
    gameState.intrusions.set(networkId, []);
  }
  gameState.intrusions.get(networkId).push(intrusion);

  console.log(`[INTRUSION] ${attackerIp} -> ${networkId}`);
  return intrusion;
}

// Remove intrusion when player disconnects
function removeIntrusion(attackerId, networkId) {
  const intrusions = gameState.intrusions.get(networkId);
  if (!intrusions) return;

  const index = intrusions.findIndex(i => i.attackerId === attackerId && i.status === 'active');
  if (index !== -1) {
    intrusions[index].status = 'escaped';
  }
}

// Process intrusions and counter-measures
function startIntrusionProcessingLoop() {
  setInterval(() => {
    for (const [networkId, intrusions] of gameState.intrusions) {
      const network = gameState.universe.networks[networkId];

      for (const intrusion of intrusions) {
        if (intrusion.status !== 'active') continue;

        // Check if owner should be alerted
        if (!intrusion.detected && shouldAlertOwner(intrusion)) {
          markDetected(intrusion);

          // Send alert to owner
          const owner = gameState.players.get(network?.ownerId);
          if (owner && owner.online) {
            owner.ws.send(JSON.stringify({
              type: 'INTRUSION_ALERT',
              payload: {
                networkId,
                networkName: network.owner,
                attackerNode: intrusion.attackerNode,
                message: 'INTRUSION DETECTED! Someone is hacking your network.',
              },
            }));
          }
        }

        // Process completed counter-measures
        const effects = processCounterMeasures(intrusion);

        for (const effect of effects) {
          switch (effect.type) {
            case 'backtrace_complete': {
              // Notify defender
              const owner = gameState.players.get(network?.ownerId);
              if (owner && owner.online) {
                owner.ws.send(JSON.stringify({
                  type: 'BACKTRACE_COMPLETE',
                  payload: {
                    attackerIp: effect.attackerIp,
                    message: `Backtrace complete! Attacker IP: ${effect.attackerIp}`,
                  },
                }));
              }
              break;
            }

            case 'counter_ice_hit': {
              // Damage attacker's hardware
              const attacker = gameState.players.get(effect.attackerId);
              if (attacker && attacker.online) {
                // Apply damage (would need to track hardware on server)
                attacker.ws.send(JSON.stringify({
                  type: 'DEFENDER_ACTION',
                  payload: {
                    action: 'counter_ice_hit',
                    damage: effect.damage,
                    message: `COUNTER-ICE HIT! Hardware integrity -${effect.damage}%`,
                  },
                }));
              }
              break;
            }
          }
        }
      }
    }

    // Clean up expired lockdowns
    const now = Date.now();
    for (const [networkId, unlockTime] of gameState.lockedNetworks) {
      if (now >= unlockTime) {
        gameState.lockedNetworks.delete(networkId);
        console.log(`[DEFEND] Network ${networkId} lockdown expired`);
      }
    }

  }, INTRUSION_CONFIG.traceUpdateInterval);
}

// Safe House spawning
function spawnNPCSafeHouses() {
  const zones = ['clearnet', 'greynet', 'darknet'];
  const safeHousesPerZone = { clearnet: 5, greynet: 4, darknet: 6 };

  for (const zone of zones) {
    const networks = getNetworksByZone(gameState.universe, zone);
    const count = Math.min(safeHousesPerZone[zone], networks.length);

    // Pick random networks for Safe Houses
    const shuffled = networks.sort(() => Math.random() - 0.5);
    for (let i = 0; i < count; i++) {
      const network = shuffled[i];
      const safeHouse = generateNPCSafeHouse(network.id, network.ip, zone);
      gameState.safeHouses.set(safeHouse.id, safeHouse);

      // Mark network as having a Safe House
      network.hasSafeHouse = true;
      network.safeHouseId = safeHouse.id;
    }
  }

  console.log(`  Safe Houses: ${gameState.safeHouses.size} spawned`);
}

// Safe House Handlers
function handleDock(player) {
  const network = gameState.universe.networks[player.location?.networkId];

  if (!network || !network.hasSafeHouse) {
    player.ws.send(JSON.stringify({
      type: 'DOCK_RESULT',
      payload: { error: 'No Safe House at this location.' },
    }));
    return;
  }

  const safeHouse = gameState.safeHouses.get(network.safeHouseId);
  if (!safeHouse) {
    player.ws.send(JSON.stringify({
      type: 'DOCK_RESULT',
      payload: { error: 'Safe House not found.' },
    }));
    return;
  }

  // Check access
  const access = canDock(safeHouse, player);
  if (!access.allowed) {
    player.ws.send(JSON.stringify({
      type: 'DOCK_RESULT',
      payload: { error: access.reason },
    }));
    return;
  }

  // Charge docking fee
  if (safeHouse.dockingFee > 0) {
    player.credits -= safeHouse.dockingFee;
  }

  // Initialize player storage at this Safe House if needed
  if (!safeHouse.storedAssets[player.id]) {
    safeHouse.storedAssets[player.id] = getEmptyAssetStorage();
  }

  // Dock the player
  player.docked = true;
  player.dockedAt = safeHouse.id;
  safeHouse.dockedPlayers.push(player.id);

  player.ws.send(JSON.stringify({
    type: 'DOCK_RESULT',
    payload: {
      success: true,
      safeHouse: {
        id: safeHouse.id,
        name: safeHouse.name,
        type: safeHouse.type,
        hasRepair: safeHouse.hasRepair,
        hasMarket: safeHouse.hasMarket,
        hasCloning: safeHouse.hasCloning,
      },
      fee: safeHouse.dockingFee,
      credits: player.credits,
    },
  }));
}

function handleUndock(player) {
  if (!player.docked) {
    player.ws.send(JSON.stringify({
      type: 'UNDOCK_RESULT',
      payload: { error: 'You are not docked.' },
    }));
    return;
  }

  const safeHouse = gameState.safeHouses.get(player.dockedAt);
  if (safeHouse) {
    safeHouse.dockedPlayers = safeHouse.dockedPlayers.filter(id => id !== player.id);
  }

  player.docked = false;
  player.dockedAt = null;

  player.ws.send(JSON.stringify({
    type: 'UNDOCK_RESULT',
    payload: { success: true },
  }));
}

function handleHangar(player) {
  if (!player.docked) {
    player.ws.send(JSON.stringify({
      type: 'HANGAR_RESULT',
      payload: { error: 'You must be docked to access the hangar.' },
    }));
    return;
  }

  const safeHouse = gameState.safeHouses.get(player.dockedAt);
  const assets = safeHouse?.storedAssets[player.id] || getEmptyAssetStorage();

  player.ws.send(JSON.stringify({
    type: 'HANGAR_RESULT',
    payload: {
      success: true,
      safeHouse: safeHouse.name,
      rigs: assets.rigs,
      software: assets.software,
      files: assets.files,
      resources: assets.resources,
    },
  }));
}

function handleStoreItem(player, { itemType, itemId, amount }) {
  if (!player.docked) {
    player.ws.send(JSON.stringify({
      type: 'STORE_RESULT',
      payload: { error: 'You must be docked to store items.' },
    }));
    return;
  }

  const safeHouse = gameState.safeHouses.get(player.dockedAt);
  const assets = safeHouse?.storedAssets[player.id];

  if (!assets) {
    player.ws.send(JSON.stringify({
      type: 'STORE_RESULT',
      payload: { error: 'Storage not initialized.' },
    }));
    return;
  }

  // Store resources
  if (itemType === 'resources' && player.resources[itemId] !== undefined) {
    const storeAmount = Math.min(amount || player.resources[itemId], player.resources[itemId]);
    assets.resources[itemId] = (assets.resources[itemId] || 0) + storeAmount;
    player.resources[itemId] -= storeAmount;

    player.ws.send(JSON.stringify({
      type: 'STORE_RESULT',
      payload: {
        success: true,
        stored: { type: itemId, amount: storeAmount },
        remaining: player.resources[itemId],
      },
    }));
    return;
  }

  player.ws.send(JSON.stringify({
    type: 'STORE_RESULT',
    payload: { error: 'Invalid item or item type.' },
  }));
}

function handleRetrieveItem(player, { itemType, itemId, amount }) {
  if (!player.docked) {
    player.ws.send(JSON.stringify({
      type: 'RETRIEVE_RESULT',
      payload: { error: 'You must be docked to retrieve items.' },
    }));
    return;
  }

  const safeHouse = gameState.safeHouses.get(player.dockedAt);
  const assets = safeHouse?.storedAssets[player.id];

  if (!assets) {
    player.ws.send(JSON.stringify({
      type: 'RETRIEVE_RESULT',
      payload: { error: 'No items stored here.' },
    }));
    return;
  }

  // Retrieve resources
  if (itemType === 'resources' && assets.resources[itemId] !== undefined) {
    const retrieveAmount = Math.min(amount || assets.resources[itemId], assets.resources[itemId]);
    player.resources[itemId] = (player.resources[itemId] || 0) + retrieveAmount;
    assets.resources[itemId] -= retrieveAmount;

    player.ws.send(JSON.stringify({
      type: 'RETRIEVE_RESULT',
      payload: {
        success: true,
        retrieved: { type: itemId, amount: retrieveAmount },
        remaining: assets.resources[itemId],
      },
    }));
    return;
  }

  player.ws.send(JSON.stringify({
    type: 'RETRIEVE_RESULT',
    payload: { error: 'Invalid item or item type.' },
  }));
}

function handleSwapRig(player, { rigId }) {
  if (!player.docked) {
    player.ws.send(JSON.stringify({
      type: 'SWAP_RIG_RESULT',
      payload: { error: 'You must be docked to swap rigs.' },
    }));
    return;
  }

  const safeHouse = gameState.safeHouses.get(player.dockedAt);
  const assets = safeHouse?.storedAssets[player.id];

  if (!assets || assets.rigs.length === 0) {
    player.ws.send(JSON.stringify({
      type: 'SWAP_RIG_RESULT',
      payload: { error: 'No rigs stored at this Safe House.' },
    }));
    return;
  }

  const rigIndex = assets.rigs.findIndex(r => r.id === rigId);
  if (rigIndex === -1) {
    player.ws.send(JSON.stringify({
      type: 'SWAP_RIG_RESULT',
      payload: { error: 'Rig not found.' },
    }));
    return;
  }

  // Swap rigs
  const newRig = assets.rigs[rigIndex];
  const currentRig = createRig(
    player.activeRig?.name || 'Previous Rig',
    player.hardware || {},
    player.software || []
  );

  // Store current rig
  assets.rigs[rigIndex] = currentRig;

  // Apply new rig
  player.hardware = newRig.hardware;
  player.software = newRig.software;

  player.ws.send(JSON.stringify({
    type: 'SWAP_RIG_RESULT',
    payload: {
      success: true,
      newRig: newRig.name,
      storedRig: currentRig.name,
    },
  }));
}

function handleSetHome(player) {
  if (!player.docked) {
    player.ws.send(JSON.stringify({
      type: 'SET_HOME_RESULT',
      payload: { error: 'You must be docked to set home.' },
    }));
    return;
  }

  const safeHouse = gameState.safeHouses.get(player.dockedAt);
  if (!safeHouse.hasCloning) {
    player.ws.send(JSON.stringify({
      type: 'SET_HOME_RESULT',
      payload: { error: 'This Safe House does not have cloning services.' },
    }));
    return;
  }

  player.homeSafeHouse = safeHouse.id;

  player.ws.send(JSON.stringify({
    type: 'SET_HOME_RESULT',
    payload: {
      success: true,
      home: safeHouse.name,
    },
  }));
}
function handleGhostScan(player) {
  // Scan for active ghost networks from DarkNet locations
  const playerLocation = player.location;
  const playerNetwork = gameState.universe.networks[playerLocation?.networkId];

  // Must be in DarkNet to scan for ghosts
  if (!playerNetwork || playerNetwork.zone !== 'darknet') {
    player.ws.send(JSON.stringify({
      type: 'GHOST_SCAN_RESULT',
      payload: { error: 'Ghost networks can only be detected from DarkNet zones.' },
    }));
    return;
  }

  // Check for active ghost networks and discovery chance
  const activeGhosts = Array.from(gameState.ghostNetworks.values());
  const discoveredGhosts = [];

  for (const ghost of activeGhosts) {
    // Discovery chance based on ghost age (older = more detectable)
    const age = Date.now() - ghost.spawnedAt;
    const baseChance = 0.3;
    const ageBonus = Math.min(0.4, age / (ghost.lifetime * 1000) * 0.4);

    if (Math.random() < baseChance + ageBonus) {
      discoveredGhosts.push({
        id: ghost.id,
        ip: ghost.ip,
        name: ghost.owner,
        timeRemaining: getGhostTimeRemaining(ghost),
        security: 'EXTREME',
        zone: 'GHOST',
      });
    }
  }

  player.ws.send(JSON.stringify({
    type: 'GHOST_SCAN_RESULT',
    payload: {
      success: true,
      discovered: discoveredGhosts.length,
      ghosts: discoveredGhosts,
      totalActive: activeGhosts.length,
    },
  }));
}

function handleGhostEnter(player, { ghostId }) {
  const ghost = gameState.ghostNetworks.get(ghostId);

  if (!ghost) {
    player.ws.send(JSON.stringify({
      type: 'GHOST_ENTER_RESULT',
      payload: { error: 'Ghost network not found or has collapsed.' },
    }));
    return;
  }

  if (isGhostExpired(ghost)) {
    gameState.ghostNetworks.delete(ghostId);
    player.ws.send(JSON.stringify({
      type: 'GHOST_ENTER_RESULT',
      payload: { error: 'Ghost network has collapsed!' },
    }));
    return;
  }

  // Add player to ghost network
  ghost.playersInside.push(player.id);

  player.ws.send(JSON.stringify({
    type: 'GHOST_ENTER_RESULT',
    payload: {
      success: true,
      network: ghost,
      timeRemaining: getGhostTimeRemaining(ghost),
      warning: 'WARNING: You cannot see other players in Ghost Networks. Proceed with caution.',
    },
  }));
}

// Ghost Network Spawning
function spawnInitialGhostNetworks() {
  // Spawn 1-2 ghost networks on server start
  const count = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    spawnGhostNetwork();
  }
  console.log(`  Ghost Networks: ${gameState.ghostNetworks.size} active`);
}

function spawnGhostNetwork() {
  if (gameState.ghostNetworks.size >= GHOST_NETWORK_CONFIG.maxActive) {
    return null;
  }

  const ghost = generateGhostNetwork();
  gameState.ghostNetworks.set(ghost.id, ghost);

  console.log(`[GHOST] Spawned: ${ghost.owner} (${ghost.ip}) - ${Math.floor(ghost.lifetime / 60)}min lifetime`);

  // Broadcast to all online players
  for (const [, p] of gameState.players) {
    if (p.online && p.ws) {
      p.ws.send(JSON.stringify({
        type: 'GHOST_SPAWN_ALERT',
        payload: {
          message: 'A Ghost Network has been detected in the system...',
          // Don't reveal location - players must scan
        },
      }));
    }
  }

  return ghost;
}

function cleanupExpiredGhosts() {
  for (const [id, ghost] of gameState.ghostNetworks) {
    if (isGhostExpired(ghost)) {
      console.log(`[GHOST] Collapsed: ${ghost.owner} (${ghost.ip})`);

      // Notify players inside
      for (const playerId of ghost.playersInside) {
        const player = gameState.players.get(playerId);
        if (player && player.online) {
          player.ws.send(JSON.stringify({
            type: 'GHOST_COLLAPSE',
            payload: {
              message: 'The Ghost Network is collapsing! Emergency disconnect initiated.',
            },
          }));
        }
      }

      gameState.ghostNetworks.delete(id);
    }
  }
}

function startGhostSpawnLoop() {
  // Every 5 minutes, check for spawn and cleanup
  setInterval(() => {
    cleanupExpiredGhosts();

    // Spawn chance
    if (Math.random() < GHOST_NETWORK_CONFIG.spawnChance) {
      spawnGhostNetwork();
    }
  }, GHOST_NETWORK_CONFIG.spawnInterval * 1000);
}

// --- Auth Handlers ---

async function handleRegister(player, { username, password }) {
  console.log(`Registering user: ${username}`);
  const result = await registerUser(username, password);

  if (result.error) {
    player.ws.send(JSON.stringify({ type: 'REGISTER_RESULT', payload: { error: result.error } }));
    return;
  }

  const oldId = player.id;
  const newId = result.user.id;

  // Check if this user is already logged in elsewhere (should be rare for new registration)
  if (gameState.authenticatedSessions.has(newId)) {
    const existingPlayerId = gameState.authenticatedSessions.get(newId);
    const existingPlayer = gameState.players.get(existingPlayerId);
    if (existingPlayer && existingPlayer.ws !== player.ws) {
      // Notify old session before kicking
      existingPlayer.ws.send(JSON.stringify({
        type: 'SESSION_KICKED',
        payload: { reason: 'You have been logged in from another location.' }
      }));
      existingPlayer.ws.close();
      gameState.players.delete(existingPlayerId);
    }
  }

  gameState.players.delete(oldId);
  player.id = newId;
  player.authenticatedUserId = newId; // Mark this player as authenticated
  gameState.players.set(newId, player);
  gameState.authenticatedSessions.set(newId, newId); // Track session

  // Persist the current "starter" state to the fresh account
  await savePlayerState(newId, player);

  player.ws.send(JSON.stringify({ type: 'REGISTER_RESULT', payload: { success: true, username } }));
}

async function handleLogin(player, { username, password }) {
  console.log(`Logging in user: ${username}`);
  const result = await loginUser(username, password);

  if (result.error) {
    player.ws.send(JSON.stringify({ type: 'LOGIN_RESULT', payload: { error: result.error } }));
    return;
  }

  const userId = result.user.id;

  // Load state
  const savedState = await loadPlayerState(userId);
  if (!savedState || !savedState.stats) {
    player.ws.send(JSON.stringify({ type: 'LOGIN_RESULT', payload: { error: 'Save data not found or corruption' } }));
    return;
  }

  // Handle session cleanup if already online (single session enforcement)
  if (gameState.authenticatedSessions.has(userId)) {
    const existingPlayerId = gameState.authenticatedSessions.get(userId);
    const existingPlayer = gameState.players.get(existingPlayerId);
    if (existingPlayer && existingPlayer.ws !== player.ws) {
      // Notify old session before kicking
      existingPlayer.ws.send(JSON.stringify({
        type: 'SESSION_KICKED',
        payload: { reason: 'You have been logged in from another location.' }
      }));
      existingPlayer.ws.close();
      gameState.players.delete(existingPlayerId);
    }
  }

  const oldId = player.id;
  gameState.players.delete(oldId);

  // Apply saved state to current player object
  player.id = userId;
  player.authenticatedUserId = userId; // Mark as authenticated
  gameState.players.set(userId, player);
  gameState.authenticatedSessions.set(userId, userId); // Track session

  player.credits = savedState.stats.credits;
  player.reputation = savedState.stats.reputation;
  player.heat = savedState.stats.heat;
  player.homeSafeHouse = savedState.stats.home_safehouse_id;
  player.rigIntegrity = savedState.stats.rig_integrity;

  // Restore Rig
  const rigClassId = savedState.stats.current_rig_class;
  const rigClass = getRigById(rigClassId);

  // Re-calculate hardware
  // We need a helper for this ideally, but let's inline for MVP
  // Assume basic logic from game.js constructor but hydrated
  player.hardware = {
    tier: rigClass.tier,
    name: rigClass.name,
    cpu: rigClass.baseCpu,
    ram: rigClass.baseRam,
    bandwidth: rigClass.baseBandwidth,
    traceResist: (rigClass.bonuses.traceResist - 1) * 100,
    cpuUsed: 0,
    ramUsed: 0,
    integrity: player.rigIntegrity,
  };

  // Restore modules
  player.rig = {
    class: rigClass,
    equippedModules: { core: [], memory: [], expansion: [] }
  };

  // Hydrate modules from IDs
  // savedState.equippedModules is { core: ['id', ...], ... }
  // We need to fetch module objects
  Object.keys(savedState.equippedModules).forEach(slot => {
    savedState.equippedModules[slot].forEach(modId => {
      const mod = getModuleById(slot, modId);
      if (mod) player.rig.equippedModules[slot].push(mod);
    });
  });

  // Restore resources
  player.resources = savedState.resources;

  // Restore local storage
  // Can't easily restore file content without sending it all to client?
  // Client expects `player.files` on `server` object? No, `localStorage` is implemented on CLIENT side mostly?
  // Wait, `game.js` on client has `player.localStorage`.
  // Server `player` object currently doesn't track `localStorage` files structure in `server/index.js` player object?
  // Let's check `server/index.js` `player` object definition (lines 114-146).
  // It has `files: []` (legacy?) but `localStorage` logic was client-side?
  // If `localStorage` is client-side, server doesn't know about it unless we send it.
  // BUT the persistence requirement means server MUST store it.
  // So server needs to send `localStorage` data in `INIT` or separate message.
  // Currently `handleLogin` doesn't re-send `INIT`. It should.

  gameState.players.set(userId, player);

  const startingNetwork = gameState.universe.networks[player.location.networkId];

  // Re-send INIT with full hydrated state
  // We need to modify the INIT payload to include localStorage files if we want them persisted.
  // For now, let's just get stats working. Files are secondary (but planned).

  player.ws.send(JSON.stringify({
    type: 'LOGIN_RESULT',
    payload: { success: true, username }
  }));

  // Re-send INIT
  player.ws.send(JSON.stringify({
    type: 'INIT',
    payload: {
      playerId: player.id,
      ip: player.ip,
      credits: player.credits,
      server: player.server,
      location: player.location,
      resources: player.resources,
      // We need to send Rig/Modules too? Client usually tracks its own hardware if server confirms it.
      // But `INIT` in client `game.js` overwrites `this.state.player`...
      // We need to verify what `INIT` handles.
      currentNetwork: {
        id: startingNetwork.id,
        // ... (simplified re-send)
        ip: startingNetwork.ip,
        owner: startingNetwork.owner,
        security: startingNetwork.security,
        zone: startingNetwork.zone,
        zoneName: startingNetwork.zoneName,
        zoneColor: startingNetwork.zoneColor,
      },
      universe: {
        sectors: Object.keys(gameState.universe.sectors),
        totalNetworks: gameState.universe.totalNetworks,
      },
      // Extra data for hydration
      persistedState: {
        reputation: player.reputation,
        heat: player.heat,
        rig: player.rig, // Client needs to handle this
        localStorage: savedState.localFiles // Client needs to handle this
      }
    },
  }));
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║           0xUPLINK // Netrunner Server v0.4              ║
║                                                          ║
║     Running on port ${PORT}                                  ║
║     http://localhost:${PORT}                                 ║
║                                                          ║
║     Universe: ${gameState.universe.totalNetworks} networks across ${Object.keys(gameState.universe.sectors).length} sectors       ║
║     Safe Houses: ${gameState.safeHouses.size} | Ghosts: ${gameState.ghostNetworks.size}                  ║
╚══════════════════════════════════════════════════════════╝
  `);
});
