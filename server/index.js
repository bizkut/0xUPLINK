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
import { SECURITY_ZONES, SECTORS, FACTIONS, GHOST_NETWORK_CONFIG, SAFE_HOUSE_TYPES } from '../shared/constants.js';
import {
  generateNPCSafeHouse,
  findSafeHouseAtNetwork,
  canDock,
  getEmptyAssetStorage,
  createRig,
} from '../shared/safehouses.js';

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
  contracts: [],
  factions: {
    syndicate: { members: [], treasury: 0 },
    ghost: { members: [], treasury: 0 },
    ironwall: { members: [], treasury: 0 },
    chaos: { members: [], treasury: 0 },
  },
  organizations: new Map(), // Player-created orgs
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
startGhostSpawnLoop(); // Start periodic ghost spawning

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
