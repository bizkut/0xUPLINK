import {
  SECTORS,
  SECURITY_ZONES,
  NPC_FACTIONS,
  ICE_TYPES,
  NODE_TYPES,
  RESOURCES,
  GAME_CONFIG,
  GHOST_NETWORK_CONFIG,
  GHOST_NETWORK_NAMES,
} from './constants.js';

// Server name generators by theme
const SERVER_NAMES = {
  corporate: [
    'Axiom Industries', 'NeoTech Solutions', 'Quantum Dynamics', 'Apex Corporation',
    'Helix Systems', 'Vanguard Holdings', 'Cipher Group', 'Nexus Financial',
    'Prometheus Labs', 'Titan Aerospace', 'Meridian Bank', 'Obsidian Securities',
    'Sterling Industries', 'Zenith Corp', 'Paragon Systems', 'Vector Technologies',
  ],
  commercial: [
    'DataVault ISP', 'NetStream Services', 'CloudNine Hosting', 'ByteWave Solutions',
    'InfoTech Partners', 'Digital Frontier', 'CyberLink Networks', 'TechHub Inc',
    'WebForge Systems', 'DataStream Corp', 'NetPulse Services', 'BitCloud Hosting',
  ],
  frontier: [
    'Shadow Market', 'Gray Zone Trading', 'Neutral Ground', 'Crossroads Hub',
    'Borderline Systems', 'Twilight Exchange', 'Liminal Networks', 'Edge Systems',
    'Threshold Trading', 'Midway Station', 'Buffer Zone', 'Transit Hub',
  ],
  underground: [
    'Black Market Node', 'Hidden Cache', 'Dark Exchange', 'Smuggler\'s Den',
    'Underground Vault', 'Shadow Broker', 'Covert Operations', 'Silent Running',
    'Ghost Server', 'Phantom Network', 'Whisper Node', 'Stealth Systems',
  ],
  abandoned: [
    'Derelict Server', 'Abandoned Hub', 'Dead Drop', 'Forgotten Node',
    'Rusted Gateway', 'Decayed Network', 'Broken Link', 'Lost Connection',
    'Orphaned System', 'Defunct Corp', 'Bankrupt Holdings', 'Collapsed Infrastructure',
  ],
  void: [
    'Void Walker', 'Abyss Node', 'Deep Dark', 'Null Space',
    'Event Horizon', 'Singularity', 'Black Hole', 'Dark Matter',
    'Entropy', 'Oblivion', 'Terminus', 'End Point',
  ],
};

/**
 * Determines security zone from security level
 */
export function getSecurityZone(securityLevel) {
  for (const [key, zone] of Object.entries(SECURITY_ZONES)) {
    if (securityLevel >= zone.securityRange[0] && securityLevel <= zone.securityRange[1]) {
      return zone;
    }
  }
  return SECURITY_ZONES.DARKNET;
}

/**
 * Generates a random security level within a range
 */
export function randomSecurity(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

/**
 * Generates a unique network IP based on sector and cluster
 */
export function generateNetworkIP(sectorIndex, clusterIndex, networkIndex) {
  const firstOctet = 10 + sectorIndex;
  const secondOctet = clusterIndex;
  const thirdOctet = networkIndex;
  return `${firstOctet}.${secondOctet}.${thirdOctet}.0/24`;
}

/**
 * Generates the entire universe structure
 */
export function generateUniverse() {
  const universe = {
    sectors: {},
    clusters: {},
    networks: {},
    totalNetworks: 0,
  };

  let sectorIndex = 0;

  for (const [sectorKey, sectorDef] of Object.entries(SECTORS)) {
    const sector = {
      id: sectorDef.id,
      name: sectorDef.name,
      description: sectorDef.description,
      zone: sectorDef.zone,
      securityRange: sectorDef.securityRange,
      theme: sectorDef.theme,
      npcFactions: sectorDef.npcFactions,
      clusters: [],
    };

    // Generate clusters for this sector
    for (let c = 0; c < sectorDef.clusterCount; c++) {
      const clusterId = `${sectorDef.id}_cluster_${c}`;
      const cluster = generateCluster(
        clusterId,
        sectorDef,
        sectorIndex,
        c
      );

      sector.clusters.push(clusterId);
      universe.clusters[clusterId] = cluster;

      // Add networks to universe
      for (const networkId of cluster.networks) {
        universe.networks[networkId] = cluster.networkData[networkId];
        universe.totalNetworks++;
      }
    }

    universe.sectors[sectorKey] = sector;
    sectorIndex++;
  }

  return universe;
}

/**
 * Generates a cluster with networks
 */
function generateCluster(clusterId, sectorDef, sectorIndex, clusterIndex) {
  const networkCount = 5 + Math.floor(Math.random() * 10); // 5-14 networks

  const cluster = {
    id: clusterId,
    sectorId: sectorDef.id,
    name: `${sectorDef.name} Cluster ${clusterIndex + 1}`,
    networks: [],
    networkData: {},
    sovereignty: null, // Player/org that controls this cluster
    structures: [],
  };

  for (let n = 0; n < networkCount; n++) {
    const networkId = `${clusterId}_net_${n}`;
    const networkIP = generateNetworkIP(sectorIndex, clusterIndex, n);

    const security = randomSecurity(
      sectorDef.securityRange[0],
      sectorDef.securityRange[1]
    );

    const network = generateNetwork(
      networkId,
      networkIP,
      security,
      sectorDef.theme,
      clusterId
    );

    cluster.networks.push(networkId);
    cluster.networkData[networkId] = network;
  }

  // Create backbone connections between networks
  connectNetworks(cluster);

  return cluster;
}

/**
 * Generates a single network with nodes
 */
function generateNetwork(networkId, ip, security, theme, clusterId) {
  const zone = getSecurityZone(security);
  const difficulty = (1 - security) / 2 + 0.5; // 0.5-1.0 based on security

  const serverNames = SERVER_NAMES[theme] || SERVER_NAMES.corporate;
  const ownerName = serverNames[Math.floor(Math.random() * serverNames.length)];

  const network = {
    id: networkId,
    ip: ip,
    clusterId: clusterId,
    owner: ownerName,
    ownerId: 'npc', // NPC owned by default
    security: security,
    zone: zone.id,
    zoneName: zone.name,
    zoneColor: zone.color,
    traceRate: GAME_CONFIG.BASE_TRACE_RATE * zone.rules.traceRateMultiplier * (1 + difficulty * 0.5),
    rewardMultiplier: zone.rules.rewardMultiplier,
    nodes: [],
    connections: [], // Backbone connections to other networks
    sovereignty: null,
    structures: [],
  };

  // Generate nodes based on difficulty
  network.nodes = generateNodes(difficulty, security, theme);

  return network;
}

/**
 * Generates nodes for a network
 */
function generateNodes(difficulty, security, theme) {
  const nodes = [];
  const zone = getSecurityZone(security);

  // Base node count scales with difficulty
  const baseNodeCount = 4 + Math.floor(difficulty * 6);

  // Always have a gateway
  nodes.push({
    id: 'gateway',
    type: 'gateway',
    ...NODE_TYPES.GATEWAY,
    connections: ['firewall_1'],
    ice: null,
    breached: true, // Entry point is always accessible
    files: [],
    resources: generateNodeResources('gateway', security),
  });

  // Firewall layer
  const firewallStrength = 100 + Math.floor(difficulty * 300);
  nodes.push({
    id: 'firewall_1',
    type: 'firewall',
    ...NODE_TYPES.FIREWALL,
    connections: ['gateway', 'database_1'],
    ice: {
      ...ICE_TYPES.FIREWALL,
      strength: firewallStrength,
    },
    breached: false,
    files: [],
    resources: generateNodeResources('firewall', security),
  });

  // Database layer
  const hasTracker = difficulty > 0.4;
  nodes.push({
    id: 'database_1',
    type: 'database',
    ...NODE_TYPES.DATABASE,
    connections: ['firewall_1', 'vault_1'],
    ice: hasTracker ? { ...ICE_TYPES.TRACKER } : null,
    breached: false,
    password: difficulty > 0.3,
    cracked: false,
    files: generateFiles(difficulty, 'database', zone),
    resources: generateNodeResources('database', security),
  });

  // Vault (high value target)
  const vaultIceStrength = 150 + Math.floor(difficulty * 350);
  const vaultDamage = 20 + Math.floor(difficulty * 40);
  nodes.push({
    id: 'vault_1',
    type: 'vault',
    ...NODE_TYPES.VAULT,
    connections: ['database_1'],
    ice: {
      ...ICE_TYPES.BLACK_ICE,
      strength: vaultIceStrength,
      damage: vaultDamage,
    },
    breached: false,
    password: true,
    cracked: false,
    files: generateFiles(difficulty, 'vault', zone),
    resources: generateNodeResources('vault', security),
  });

  // Add extra nodes for higher difficulty
  if (difficulty > 0.6) {
    // Add proxy node
    nodes[1].connections.push('proxy_1');
    nodes.push({
      id: 'proxy_1',
      type: 'proxy',
      ...NODE_TYPES.PROXY,
      connections: ['firewall_1', 'log_server_1'],
      ice: { ...ICE_TYPES.TAR_PIT },
      breached: false,
      files: [],
      resources: generateNodeResources('proxy', security),
    });

    // Add log server
    nodes.push({
      id: 'log_server_1',
      type: 'log_server',
      ...NODE_TYPES.LOG_SERVER,
      connections: ['proxy_1'],
      ice: difficulty > 0.8 ? { ...ICE_TYPES.HONEYPOT } : null,
      breached: false,
      files: generateFiles(difficulty, 'logs', zone),
      resources: generateNodeResources('log_server', security),
    });
  }

  // Add trap node for very high difficulty
  if (difficulty > 0.85) {
    nodes[2].connections.push('trap_1');
    nodes.push({
      id: 'trap_1',
      type: 'trap',
      ...NODE_TYPES.TRAP,
      connections: ['database_1'],
      ice: { ...ICE_TYPES.FAILSAFE },
      breached: false,
      files: [{ name: 'secret_data.enc', size: 1024 * 1024, value: 0, trap: true }],
      resources: [],
    });
  }

  // Add research lab for high difficulty
  if (difficulty > 0.7) {
    // Connect to database
    nodes[2].connections.push('research_lab_1');
    nodes.push({
      id: 'research_lab_1',
      type: 'research_lab',
      ...NODE_TYPES.RESEARCH_LAB,
      connections: ['database_1'],
      ice: { ...ICE_TYPES.SCRAMBLER },
      breached: false,
      files: generateFiles(difficulty, 'research_lab', zone),
      resources: generateNodeResources('research_lab', security),
    });
  }

  // Add quantum node for extreme difficulty (The Void)
  if (difficulty > 0.9) {
    // Connect to vault
    nodes[3].connections.push('quantum_node_1');
    nodes.push({
      id: 'quantum_node_1',
      type: 'quantum_node',
      ...NODE_TYPES.QUANTUM_NODE,
      connections: ['vault_1'],
      ice: { ...ICE_TYPES.BLACK_ICE, strength: 500, damage: 100 },
      breached: false,
      files: [],
      resources: generateNodeResources('quantum_node', security),
    });
  }


  return nodes;
}

/**
 * Generates files for a node
 */
function generateFiles(difficulty, nodeType, zone) {
  const files = [];
  const rewardMult = zone.rules.rewardMultiplier;

  switch (nodeType) {
    case 'database':
      files.push({
        name: 'user_data.db',
        size: 1024 * 512,
        value: Math.floor(200 * rewardMult * (1 + difficulty)),
        encrypted: false,
      });
      files.push({
        name: 'system_logs.txt',
        size: 1024 * 10,
        value: Math.floor(50 * rewardMult),
        encrypted: false,
      });
      break;

    case 'vault':
      files.push({
        name: 'financial_records.enc',
        size: 1024 * 1024,
        value: Math.floor(1000 * rewardMult * (1 + difficulty * 2)),
        encrypted: true,
      });
      files.push({
        name: 'credentials.txt',
        size: 1024,
        value: Math.floor(500 * rewardMult * (1 + difficulty)),
        encrypted: false,
      });
      if (difficulty > 0.7) {
        files.push({
          name: 'classified_intel.enc',
          size: 1024 * 2048,
          value: Math.floor(3000 * rewardMult * (1 + difficulty)),
          encrypted: true,
        });
      }
      break;

    case 'logs':
      files.push({
        name: 'access_logs.txt',
        size: 1024 * 50,
        value: Math.floor(100 * rewardMult),
        encrypted: false,
      });
      break;

    case 'research_lab':
      files.push({
        name: 'experiment_data.enc',
        size: 1024 * 512,
        value: Math.floor(800 * rewardMult * (1 + difficulty)),
        encrypted: true,
      });
      files.push({
        name: 'prototype_specs.txt',
        size: 1024 * 64,
        value: Math.floor(300 * rewardMult),
        encrypted: false,
      });
      break;
  }

  return files;
}

/**
 * Generates resource drops for a node based on type and security
 */
function generateNodeResources(nodeType, security) {
  const resources = [];
  const zone = getSecurityZone(security);

  // Higher security = fewer/no resources (safe but low reward)
  // Lower security = more/better resources
  const resourceChance = security < 0 ? 0.8 : security < 0.5 ? 0.5 : 0.2;

  if (Math.random() > resourceChance) return resources;

  switch (nodeType) {
    case 'database':
    case 'log_server':
      resources.push({
        type: 'data_packets',
        amount: Math.floor(10 + Math.random() * 40 * (1 - security)),
      });
      break;

    case 'gateway':
    case 'proxy':
      resources.push({
        type: 'bandwidth_tokens',
        amount: Math.floor(5 + Math.random() * 20 * (1 - security)),
      });
      break;

    case 'firewall':
    case 'vault':
      if (security < 0.5) {
        resources.push({
          type: 'encryption_keys',
          amount: Math.floor(2 + Math.random() * 10 * (0.5 - security)),
        });
      }
      if (security < -0.5) {
        resources.push({
          type: 'access_tokens',
          amount: Math.floor(1 + Math.random() * 5),
        });
      }
      if (security < -0.7 && Math.random() < 0.1) {
        resources.push({
          type: 'zero_days',
          amount: 1,
        });
      }
      break;

    case 'research_lab':
      resources.push({
        type: 'data_packets',
        amount: Math.floor(50 + Math.random() * 50),
      });
      if (Math.random() < 0.3) {
        resources.push({
          type: 'zero_days',
          amount: 1,
        });
      }
      break;

    case 'quantum_node':
      resources.push({
        type: 'quantum_cores',
        amount: Math.floor(1 + Math.random() * 3),
      });
      break;
  }

  return resources;
}

/**
 * Creates backbone connections between networks in a cluster
 */
function connectNetworks(cluster) {
  const networks = cluster.networks;

  // Create a connected graph (minimum spanning tree + some extras)
  for (let i = 1; i < networks.length; i++) {
    // Connect to at least one previous network
    const targetIndex = Math.floor(Math.random() * i);
    const sourceNet = cluster.networkData[networks[i]];
    const targetNet = cluster.networkData[networks[targetIndex]];

    sourceNet.connections.push(networks[targetIndex]);
    targetNet.connections.push(networks[i]);
  }

  // Add some extra connections for redundancy (not a strict tree)
  const extraConnections = Math.floor(networks.length * 0.3);
  for (let i = 0; i < extraConnections; i++) {
    const a = Math.floor(Math.random() * networks.length);
    const b = Math.floor(Math.random() * networks.length);

    if (a !== b) {
      const netA = cluster.networkData[networks[a]];
      const netB = cluster.networkData[networks[b]];

      if (!netA.connections.includes(networks[b])) {
        netA.connections.push(networks[b]);
        netB.connections.push(networks[a]);
      }
    }
  }
}

/**
 * Finds a network by IP address
 */
export function findNetworkByIP(universe, ip) {
  for (const network of Object.values(universe.networks)) {
    if (network.ip === ip || network.ip.startsWith(ip.split('/')[0])) {
      return network;
    }
  }
  return null;
}

/**
 * Gets all networks in a security zone
 */
export function getNetworksByZone(universe, zoneId) {
  return Object.values(universe.networks).filter(n => n.zone === zoneId);
}

/**
 * Gets adjacent networks (connected via backbone)
 */
export function getAdjacentNetworks(universe, networkId) {
  const network = universe.networks[networkId];
  if (!network) return [];

  return network.connections.map(id => universe.networks[id]).filter(Boolean);
}

/**
 * Calculates route between two networks
 */
export function findRoute(universe, fromNetworkId, toNetworkId) {
  if (fromNetworkId === toNetworkId) return [fromNetworkId];

  // BFS to find shortest path
  const visited = new Set();
  const queue = [[fromNetworkId]];

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];

    if (current === toNetworkId) return path;

    if (visited.has(current)) continue;
    visited.add(current);

    const network = universe.networks[current];
    if (!network) continue;

    for (const neighbor of network.connections) {
      if (!visited.has(neighbor)) {
        queue.push([...path, neighbor]);
      }
    }
  }

  return null; // No route found
}

/**
 * Gets starting location for new player (safe ClearNet network)
 */
export function getStartingLocation(universe) {
  const clearnetNetworks = getNetworksByZone(universe, 'clearnet');
  if (clearnetNetworks.length === 0) {
    // Fallback to any network
    const allNetworks = Object.values(universe.networks);
    return allNetworks[Math.floor(Math.random() * allNetworks.length)];
  }

  // Pick a random ClearNet network with high security
  const safeNetworks = clearnetNetworks.filter(n => n.security >= 0.7);
  return safeNetworks[Math.floor(Math.random() * safeNetworks.length)] || clearnetNetworks[0];
}

/**
 * Generates a temporary Ghost Network (wormhole-like zone)
 * Ghost Networks are high-value, temporary instances with special rules
 */
export function generateGhostNetwork() {
  const config = GHOST_NETWORK_CONFIG;
  const ghostId = `ghost_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  // Random lifetime between 30 min and 2 hours
  const lifetime = config.lifetimeRange[0] +
    Math.floor(Math.random() * (config.lifetimeRange[1] - config.lifetimeRange[0]));

  // Pick a random themed name
  const ghostName = GHOST_NETWORK_NAMES[Math.floor(Math.random() * GHOST_NETWORK_NAMES.length)];

  // Ghost networks have extreme security (very negative = very high rewards)
  const security = -0.8 - Math.random() * 0.2; // -0.8 to -1.0
  const difficulty = 0.85 + Math.random() * 0.15; // 0.85 to 1.0 (very hard)

  // Generate unique IP in special range
  const ip = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

  const ghostNetwork = {
    id: ghostId,
    ip: ip,
    clusterId: 'ghost_cluster', // Virtual cluster
    owner: ghostName,
    ownerId: 'ghost', // Special ghost owner
    security: security,
    zone: 'ghost',
    zoneName: 'Ghost Network',
    zoneColor: config.color,
    isGhost: true, // Flag for special handling

    // Timing
    spawnedAt: Date.now(),
    expiresAt: Date.now() + (lifetime * 1000),
    lifetime: lifetime,
    timeRemaining: lifetime,

    // Special ghost rules
    traceRate: GAME_CONFIG.BASE_TRACE_RATE * config.rules.traceRateMultiplier,
    rewardMultiplier: config.rules.rewardMultiplier,
    noLocal: config.rules.noLocal,
    hidePlayerCount: config.rules.hidePlayerCount,

    // Network data
    nodes: generateGhostNodes(difficulty),
    connections: [], // Ghost networks are isolated
    playersInside: [], // Track who's in (hidden from others)
    sovereignty: null,
    structures: [],
  };

  return ghostNetwork;
}

/**
 * Generates nodes for a Ghost Network with guaranteed rare resources
 */
function generateGhostNodes(difficulty) {
  const config = GHOST_NETWORK_CONFIG;
  const nodes = [];

  // Ghost gateway with eerie theme
  nodes.push({
    id: 'gateway',
    type: 'gateway',
    ...NODE_TYPES.GATEWAY,
    name: 'Spectral Gateway',
    connections: ['void_firewall'],
    ice: null,
    breached: true,
    files: [],
    resources: [{ type: 'bandwidth_tokens', amount: 50 }],
  });

  // Strong void firewall
  nodes.push({
    id: 'void_firewall',
    type: 'firewall',
    ...NODE_TYPES.FIREWALL,
    name: 'Void Barrier',
    connections: ['gateway', 'data_cache', 'anomaly_node'],
    ice: { ...ICE_TYPES.FIREWALL, strength: 400 + Math.floor(Math.random() * 100) },
    breached: false,
    files: [],
    resources: [{ type: 'encryption_keys', amount: 10 + Math.floor(Math.random() * 10) }],
  });

  // Data cache with high-value data
  nodes.push({
    id: 'data_cache',
    type: 'database',
    ...NODE_TYPES.DATABASE,
    name: 'Lost Data Cache',
    connections: ['void_firewall', 'core_vault'],
    ice: { ...ICE_TYPES.TRACKER },
    breached: false,
    password: true,
    cracked: false,
    files: [
      { name: 'recovered_intel.enc', size: 1024 * 2048, value: 5000, encrypted: true },
      { name: 'ghost_data.db', size: 1024 * 1024, value: 3000, encrypted: false },
    ],
    resources: [
      { type: 'data_packets', amount: 100 + Math.floor(Math.random() * 100) },
      { type: 'zero_days', amount: 1 }, // Guaranteed zero-day
    ],
  });

  // Core vault with extreme rewards
  nodes.push({
    id: 'core_vault',
    type: 'vault',
    ...NODE_TYPES.VAULT,
    name: 'Phantom Vault',
    connections: ['data_cache', 'quantum_core'],
    ice: { ...ICE_TYPES.BLACK_ICE, strength: 450, damage: 60 },
    breached: false,
    password: true,
    cracked: false,
    files: [
      { name: 'classified_archive.enc', size: 1024 * 4096, value: 10000, encrypted: true },
      { name: 'master_keys.txt', size: 512, value: 2500, encrypted: false },
    ],
    resources: [
      { type: 'encryption_keys', amount: 20 },
      { type: 'access_tokens', amount: 10 },
      { type: 'zero_days', amount: Math.floor(1 + Math.random() * 2) },
    ],
  });

  // Anomaly node (optional path with danger)
  nodes.push({
    id: 'anomaly_node',
    type: 'research_lab',
    ...NODE_TYPES.RESEARCH_LAB,
    name: 'Anomaly Nexus',
    connections: ['void_firewall'],
    ice: { ...ICE_TYPES.SCRAMBLER },
    breached: false,
    files: [
      { name: 'anomaly_research.enc', size: 1024 * 512, value: 4000, encrypted: true },
    ],
    resources: [
      { type: 'data_packets', amount: 200 },
    ],
  });

  // Quantum core - ultimate prize
  nodes.push({
    id: 'quantum_core',
    type: 'quantum_node',
    ...NODE_TYPES.QUANTUM_NODE,
    name: 'Unstable Core',
    connections: ['core_vault'],
    ice: { ...ICE_TYPES.BLACK_ICE, strength: 600, damage: 80 },
    breached: false,
    files: [],
    resources: [
      { type: 'quantum_cores', amount: 2 + Math.floor(Math.random() * 3) }, // 2-4 quantum cores!
    ],
  });

  return nodes;
}

/**
 * Checks if a ghost network has expired
 */
export function isGhostExpired(ghostNetwork) {
  return Date.now() > ghostNetwork.expiresAt;
}

/**
 * Gets remaining time for a ghost network in seconds
 */
export function getGhostTimeRemaining(ghostNetwork) {
  const remaining = Math.max(0, ghostNetwork.expiresAt - Date.now());
  return Math.floor(remaining / 1000);
}
