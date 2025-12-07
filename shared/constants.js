// Hardware Tiers
export const HARDWARE_TIERS = {
  0: { name: 'Burner Laptop', cpu: 2, ram: 64, traceResist: 0, bandwidth: 50, price: 0 },
  1: { name: 'Custom Rig', cpu: 4, ram: 256, traceResist: 10, bandwidth: 100, price: 5000 },
  2: { name: 'Workstation', cpu: 6, ram: 1024, traceResist: 20, bandwidth: 250, price: 25000 },
  3: { name: 'Mainframe', cpu: 8, ram: 4096, traceResist: 35, bandwidth: 500, price: 100000 },
  4: { name: 'Quantum Node', cpu: 12, ram: 16384, traceResist: 50, bandwidth: 1000, price: 500000 },
};

// ICE Types (Defense)
export const ICE_TYPES = {
  FIREWALL: {
    id: 'firewall',
    name: 'Firewall',
    description: 'Blocks unauthorized access. Must be breached to proceed.',
    baseStrength: 100,
    cpuCost: 1,
    price: 500,
  },
  TRACKER: {
    id: 'tracker',
    name: 'Tracker ICE',
    description: 'Accelerates trace speed by 25%.',
    traceMultiplier: 1.25,
    cpuCost: 1,
    price: 750,
  },
  BLACK_ICE: {
    id: 'black_ice',
    name: 'Black ICE',
    description: 'Deals damage to attacker hardware on contact.',
    damage: 50,
    cpuCost: 2,
    price: 2000,
  },
  TAR_PIT: {
    id: 'tar_pit',
    name: 'Tar Pit',
    description: 'Slows all attacker operations by 50%.',
    slowMultiplier: 0.5,
    cpuCost: 1,
    price: 1000,
  },
  HONEYPOT: {
    id: 'honeypot',
    name: 'Honeypot',
    description: 'Fake data node. Wastes attacker time and triggers alert.',
    cpuCost: 1,
    price: 600,
  },
  SCRAMBLER: {
    id: 'scrambler',
    name: 'Scrambler',
    description: 'Corrupts stolen data unless attacker has decryptor.',
    cpuCost: 1,
    price: 1200,
  },
  FAILSAFE: {
    id: 'failsafe',
    name: 'Failsafe',
    description: 'Auto-wipes data if breach detected on this node.',
    cpuCost: 2,
    price: 3000,
  },
};

// Software Types (Offense)
export const SOFTWARE_TYPES = {
  ICEBREAKER: {
    id: 'icebreaker',
    name: 'Icebreaker',
    description: 'Bypasses firewall ICE.',
    versions: [
      { level: 1, power: 100, cpuCost: 1, ramCost: 32, price: 500 },
      { level: 2, power: 200, cpuCost: 1, ramCost: 64, price: 1500 },
      { level: 3, power: 350, cpuCost: 2, ramCost: 128, price: 5000 },
      { level: 4, power: 500, cpuCost: 2, ramCost: 256, price: 15000 },
      { level: 5, power: 750, cpuCost: 3, ramCost: 512, price: 50000 },
    ],
  },
  PASSWORD_CRACKER: {
    id: 'password_cracker',
    name: 'Password Cracker',
    description: 'Cracks password-protected nodes.',
    versions: [
      { level: 1, speed: 1, cpuCost: 1, ramCost: 32, price: 400 },
      { level: 2, speed: 2, cpuCost: 1, ramCost: 64, price: 1200 },
      { level: 3, speed: 4, cpuCost: 2, ramCost: 128, price: 4000 },
      { level: 4, speed: 8, cpuCost: 2, ramCost: 256, price: 12000 },
      { level: 5, speed: 16, cpuCost: 3, ramCost: 512, price: 40000 },
    ],
  },
  PROXY_CHAIN: {
    id: 'proxy_chain',
    name: 'Proxy Chain',
    description: 'Bounces connection through proxies to slow trace.',
    versions: [
      { level: 1, proxies: 1, traceReduction: 10, cpuCost: 1, ramCost: 16, price: 300 },
      { level: 2, proxies: 2, traceReduction: 20, cpuCost: 1, ramCost: 32, price: 900 },
      { level: 3, proxies: 3, traceReduction: 30, cpuCost: 1, ramCost: 64, price: 3000 },
      { level: 4, proxies: 4, traceReduction: 40, cpuCost: 2, ramCost: 128, price: 10000 },
      { level: 5, proxies: 5, traceReduction: 50, cpuCost: 2, ramCost: 256, price: 35000 },
    ],
  },
  LOG_CLEANER: {
    id: 'log_cleaner',
    name: 'Log Cleaner',
    description: 'Erases your trace after disconnecting.',
    versions: [
      { level: 1, effectiveness: 50, cpuCost: 1, ramCost: 16, price: 200 },
      { level: 2, effectiveness: 70, cpuCost: 1, ramCost: 32, price: 600 },
      { level: 3, effectiveness: 85, cpuCost: 1, ramCost: 64, price: 2000 },
      { level: 4, effectiveness: 95, cpuCost: 1, ramCost: 128, price: 8000 },
      { level: 5, effectiveness: 100, cpuCost: 2, ramCost: 256, price: 25000 },
    ],
  },
  DECRYPTOR: {
    id: 'decryptor',
    name: 'Decryptor',
    description: 'Decrypts scrambled data.',
    versions: [
      { level: 1, power: 100, cpuCost: 1, ramCost: 64, price: 800 },
      { level: 2, power: 200, cpuCost: 2, ramCost: 128, price: 2500 },
      { level: 3, power: 400, cpuCost: 2, ramCost: 256, price: 8000 },
    ],
  },
  SIPHON: {
    id: 'siphon',
    name: 'Credit Siphon',
    description: 'Drains credits directly during hack.',
    versions: [
      { level: 1, rate: 10, cpuCost: 1, ramCost: 32, price: 1000 },
      { level: 2, rate: 25, cpuCost: 2, ramCost: 64, price: 5000 },
      { level: 3, rate: 50, cpuCost: 3, ramCost: 128, price: 20000 },
    ],
  },
};

// Node Types
export const NODE_TYPES = {
  GATEWAY: { id: 'gateway', name: 'Gateway', icon: '◉', shape: 'circle' },
  FIREWALL: { id: 'firewall', name: 'Firewall', icon: '▣', shape: 'square' },
  DATABASE: { id: 'database', name: 'Database', icon: '◈', shape: 'diamond' },
  VAULT: { id: 'vault', name: 'Vault', icon: '⬡', shape: 'hexagon' },
  PROXY: { id: 'proxy', name: 'Proxy', icon: '△', shape: 'triangle' },
  LOG_SERVER: { id: 'log_server', name: 'Log Server', icon: '▤', shape: 'square' },
  TRAP: { id: 'trap', name: 'Trap Node', icon: '⚠', shape: 'circle' },
  RESEARCH_LAB: { id: 'research_lab', name: 'Research Lab', icon: '⚗', shape: 'hexagon' },
  QUANTUM_NODE: { id: 'quantum_node', name: 'Quantum Node', icon: '⚛', shape: 'star' },
};

// Factions
export const FACTIONS = {
  SYNDICATE: {
    id: 'syndicate',
    name: 'The Syndicate',
    description: 'Mercenary hackers for hire.',
    bonus: { creditTheft: 0.2 },
    color: '#ffb000',
  },
  GHOST: {
    id: 'ghost',
    name: 'Ghost Protocol',
    description: 'Masters of stealth and evasion.',
    bonus: { traceResist: 0.3 },
    color: '#aa55ff',
  },
  IRONWALL: {
    id: 'ironwall',
    name: 'Iron Wall',
    description: 'Defensive fortress builders.',
    bonus: { iceStrength: 0.25 },
    color: '#00aaff',
  },
  CHAOS: {
    id: 'chaos',
    name: 'Chaos Engine',
    description: 'Aggressive raiders who strike fast.',
    bonus: { softwarePower: 0.15 },
    color: '#ff3333',
  },
};

// Game Constants
export const GAME_CONFIG = {
  BASE_TRACE_RATE: 2, // % per second
  BASE_HACK_HEAT: 5, // heat per successful hack
  HEAT_DECAY_RATE: 0.5, // heat decay per minute when offline
  MAX_HEAT: 100,
  FEDERAL_INVESTIGATION_THRESHOLD: 80,
  RAID_TIME: 300, // seconds after reaching threshold
  STARTING_CREDITS: 1000,
  STARTING_REPUTATION: 0,
};

// Graded Heat System - Effects escalate as heat increases
export const HEAT_THRESHOLDS = {
  CLEAN: {
    level: 0,
    name: 'Clean',
    color: '#00ff00',
    effects: {},
    description: 'No criminal activity detected.',
  },
  SUSPICIOUS: {
    level: 30,
    name: 'Suspicious',
    color: '#ffff00',
    effects: {
      scanSpeedMultiplier: 1.5, // Scans take 50% longer
      clearnetAlertChance: 0.1, // 10% chance NPCs alert authorities
    },
    description: 'Authorities are starting to notice you.',
  },
  WANTED: {
    level: 50,
    name: 'Wanted',
    color: '#ff8800',
    effects: {
      scanSpeedMultiplier: 2.0, // Scans take twice as long
      clearnetAlertChance: 0.3, // 30% chance NPCs alert
      autoBounty: true, // Auto-generate bounty contract
      bountyAmount: 500, // Base bounty value
    },
    description: 'A bounty has been placed on your identity.',
  },
  HUNTED: {
    level: 70,
    name: 'Hunted',
    color: '#ff4400',
    effects: {
      scanSpeedMultiplier: 3.0,
      clearnetAlertChance: 0.5,
      autoBounty: true,
      bountyAmount: 2000,
      hunterIceEnabled: true, // Hunter ICE can spawn when hacking
      traceRateMultiplier: 1.25, // 25% faster trace
    },
    description: 'Elite hunter programs are tracking you.',
  },
  FEDERAL: {
    level: 80,
    name: 'Federal Investigation',
    color: '#ff0000',
    effects: {
      scanSpeedMultiplier: 4.0,
      clearnetAlertChance: 0.8,
      autoBounty: true,
      bountyAmount: 5000,
      hunterIceEnabled: true,
      traceRateMultiplier: 1.5,
      raidTimer: 300, // 5 minute countdown to raid
      clearnetBanned: true, // Cannot enter ClearNet
    },
    description: 'Federal agents are closing in. DANGER!',
  },
};

// Security Zones (EVE-style Highsec/Lowsec/Nullsec)
export const SECURITY_ZONES = {
  CLEARNET: {
    id: 'clearnet',
    name: 'ClearNet',
    description: 'Corporate internet. Heavy AI Sentinel protection.',
    securityRange: [0.5, 1.0],
    color: '#00ff00',
    rules: {
      canAttackPlayers: false,
      sentinelResponse: true,
      sentinelDelay: 5, // seconds
      traceRateMultiplier: 1.5,
      rewardMultiplier: 0.5,
      heatGainMultiplier: 2.0,
      canClaimSovereignty: false,
    },
  },
  GREYNET: {
    id: 'greynet',
    name: 'GreyNet',
    description: 'Underground networks. Weak protection, faction warfare.',
    securityRange: [0.1, 0.4],
    color: '#ffaa00',
    rules: {
      canAttackPlayers: true,
      sentinelResponse: true,
      sentinelDelay: 30, // seconds - much slower
      traceRateMultiplier: 1.0,
      rewardMultiplier: 1.0,
      heatGainMultiplier: 1.0,
      canClaimSovereignty: false, // Limited structures only
    },
  },
  DARKNET: {
    id: 'darknet',
    name: 'DarkNet',
    description: 'Lawless networks. No protection, full sovereignty.',
    securityRange: [-1.0, 0.0],
    color: '#ff0000',
    rules: {
      canAttackPlayers: true,
      sentinelResponse: false,
      sentinelDelay: null,
      traceRateMultiplier: 0.75,
      rewardMultiplier: 2.0,
      heatGainMultiplier: 0.5,
      canClaimSovereignty: true,
    },
  },
};

// Ghost Networks (Wormhole-like temporary zones)
export const GHOST_NETWORK_CONFIG = {
  id: 'ghost',
  name: 'Ghost Network',
  description: 'Unstable hidden network. Extremely valuable but temporary.',
  color: '#aa00ff',
  lifetimeRange: [1800, 7200], // 30 min to 2 hours in seconds
  spawnChance: 0.1, // 10% chance per spawn cycle
  spawnInterval: 300, // Check every 5 minutes
  maxActive: 5, // Maximum active ghost networks at once
  rules: {
    canAttackPlayers: true,
    sentinelResponse: false,
    noLocal: true, // Cannot see other players in network
    traceRateMultiplier: 0.5, // Slower traces
    rewardMultiplier: 5.0, // 5x rewards!
    heatGainMultiplier: 0.25, // Very low heat gain
    canClaimSovereignty: false,
    hidePlayerCount: true, // Don't show how many players inside
  },
  themes: ['ghost', 'void', 'experimental'],
  // Resource bonuses
  resourceMultiplier: 3,
  guaranteedRareResources: true, // Always has zero-days or quantum cores
};

// Ghost Network themed names
export const GHOST_NETWORK_NAMES = [
  'Phantom Signal', 'Echo Chamber', 'Spectral Gateway', 'Void Whisper',
  'Shadow Frequency', 'Dark Reflection', 'Null Instance', 'Ghost Protocol',
  'Fading Node', 'Transient Link', 'Unstable Connection', 'Flickering Grid',
  'Temporal Breach', 'Dimensional Rift', 'Quantum Shadow', 'Phase Shift',
];

// Safe House Configuration (EVE Station equivalent)
export const SAFE_HOUSE_TYPES = {
  NPC_PUBLIC: {
    id: 'npc_public',
    name: 'Public Data Haven',
    description: 'NPC-operated safe house. Open to all, charges fees.',
    rigSlots: 10,
    vaultCapacity: 1000,
    dockingFee: 0,
    storageFeePerDay: 10,
    hasRepair: true,
    hasMarket: true,
    hasCloning: true,
  },
  PLAYER_PRIVATE: {
    id: 'player_private',
    name: 'Private Safe House',
    description: 'Player-deployed personal storage. No fees, limited access.',
    rigSlots: 5,
    vaultCapacity: 500,
    dockingFee: 0,
    storageFeePerDay: 0,
    hasRepair: false,
    hasMarket: false,
    hasCloning: true,
    deploymentCost: 50000,
    requiredResources: { encryption_keys: 50, access_tokens: 20 },
  },
  CREW_SHARED: {
    id: 'crew_shared',
    name: 'Crew Hideout',
    description: 'Organization-owned safe house with shared storage.',
    rigSlots: 20,
    vaultCapacity: 2000,
    dockingFee: 0,
    storageFeePerDay: 0,
    hasRepair: true,
    hasMarket: false,
    hasCloning: true,
    deploymentCost: 200000,
    requiredResources: { encryption_keys: 200, access_tokens: 100, zero_days: 5 },
  },
};

export const SAFE_HOUSE_NAMES = {
  clearnet: [
    'CyberCafe Alpha', 'NetZone Hub', 'DataLink Station', 'CloudNine Lounge',
    'ByteStop Inn', 'Terminal Junction', 'AccessPoint Central', 'GridLock Haven',
  ],
  greynet: [
    'Shadow Terminal', 'Gray Market Hub', 'Twilight Station', 'Borderline Cache',
    'Midway Haven', 'Neutral Ground', 'Crossroads Node', 'Buffer Zone',
  ],
  darknet: [
    'Black Site Alpha', 'Dead Drop', 'Smuggler\'s Cache', 'Underground Vault',
    'Ghost Station', 'Phantom Point', 'Abyss Terminal', 'Void Haven',
    'Shadow Broker', 'Dark Nexus', 'Hidden Fortress', 'Stealth Node',
  ],
};

// Active Defender Counter-Play Programs
export const COUNTER_PROGRAMS = {
  BACKTRACE: {
    id: 'backtrace',
    name: 'Backtrace',
    description: 'Trace the attacker\'s real IP address.',
    cost: 500,
    duration: 30000, // 30 seconds to complete
    cooldown: 60000, // 1 minute cooldown
    effect: 'reveal_attacker',
  },
  COUNTER_ICE: {
    id: 'counter_ice',
    name: 'Counter-ICE',
    description: 'Deploy offensive ICE to damage attacker\'s hardware.',
    cost: 1000,
    duration: 5000, // 5 seconds to deploy
    cooldown: 120000, // 2 minute cooldown
    effect: 'damage_hardware',
    damage: 25, // % integrity damage
  },
  LOCKDOWN: {
    id: 'lockdown',
    name: 'Emergency Lockdown',
    description: 'Force-disconnect all intruders and lock network.',
    cost: 2000,
    duration: 2000, // 2 seconds
    cooldown: 300000, // 5 minute cooldown
    effect: 'disconnect_all',
    lockDuration: 300000, // Network locked for 5 minutes
  },
  DATA_WIPE: {
    id: 'data_wipe',
    name: 'Emergency Data Wipe',
    description: 'Destroy sensitive files before theft.',
    cost: 1500,
    duration: 3000, // 3 seconds
    cooldown: 600000, // 10 minute cooldown
    effect: 'destroy_files',
  },
};

// Intrusion alert configuration
export const INTRUSION_CONFIG = {
  alertDelay: 5000, // 5 seconds before owner is alerted
  traceUpdateInterval: 1000, // How often to broadcast trace progress
  maxActiveIntrusions: 10, // Max intrusions to track per network
};

// Player Market Economy
export const MARKET_CONFIG = {
  listingFee: 10,           // CR to post a sell order
  transactionFee: 0.05,     // 5% fee on sales
  maxActiveOrders: 20,      // Max orders per player
  orderExpiry: 86400000,    // 24 hours in ms
  minPrice: 1,              // Minimum price per unit
  maxPrice: 1000000,        // Maximum price per unit
  modifyCooldown: 120000,   // 2 minutes cooldown between order modifications
};

// Tradeable resource types
export const TRADEABLE_RESOURCES = [
  'data_packets',
  'bandwidth_tokens',
  'encryption_keys',
  'access_tokens',
  'zero_days',
  'quantum_cores',
];

// Contract Types (Player-created job board)
export const CONTRACT_TYPES = {
  BOUNTY: {
    id: 'bounty',
    name: 'Bounty',
    description: 'Trace target player. Reward on successful trace.',
    minReward: 100,
    maxReward: 50000,
    duration: 86400000, // 24hrs
    completionCheck: 'trace_player',
    icon: '🎯',
  },
  DATA_THEFT: {
    id: 'data_theft',
    name: 'Data Theft',
    description: 'Steal specific file from target network.',
    minReward: 200,
    maxReward: 10000,
    duration: 172800000, // 48hrs
    completionCheck: 'steal_file',
    icon: '📁',
  },
  DEFENSE: {
    id: 'defense',
    name: 'Network Defense',
    description: 'Protect issuer network from breach.',
    minReward: 500,
    maxReward: 5000,
    duration: 3600000, // 1hr active defense
    completionCheck: 'defense_success',
    icon: '🛡️',
  },
  DELIVERY: {
    id: 'delivery',
    name: 'Courier',
    description: 'Transport item between safe houses.',
    minReward: 50,
    maxReward: 2000,
    duration: 86400000, // 24hrs
    completionCheck: 'delivery_complete',
    icon: '📦',
  },
};

export const CONTRACT_CONFIG = {
  creationFee: 50,            // CR to post contract
  maxActiveContracts: 5,      // Max contracts per player
  collateralMultiplier: 1.2,  // Issuer escrows 120% of reward
  minDuration: 3600000,       // 1hr minimum
  maxDuration: 604800000,     // 7 days maximum
};

// Black Market (DarkNet-only, dynamic pricing)
export const BLACK_MARKET_CONFIG = {
  priceUpdateInterval: 3600000,  // 1hr price fluctuation
  volatility: 0.15,              // 15% max price swing per cycle
  demandDecay: 0.05,             // 5% demand decrease per cycle
  heatPenalty: 5,                // Heat gain per contraband transaction
  darknetOnly: true,             // Requires DarkNet zone access
  supplyLevels: {
    abundant: { threshold: 20, multiplier: 0.8 },  // 80% of base price
    normal: { threshold: 10, multiplier: 1.0 },    // Base price
    scarce: { threshold: 5, multiplier: 1.25 },    // 125% of base price
    rare: { threshold: 0, multiplier: 1.5 },       // 150% of base price
  },
};

export const CONTRABAND_ITEMS = [
  { id: 'stolen_creds', name: 'Stolen Credentials', basePrice: 500, rarity: 'normal', desc: 'Bank login data' },
  { id: 'hot_data', name: 'Hot Data', basePrice: 200, rarity: 'abundant', desc: 'Recently stolen files' },
  { id: 'exploit_kit', name: 'Exploit Kit', basePrice: 2000, rarity: 'scarce', desc: 'Zero-day package' },
  { id: 'corp_secrets', name: 'Corporate Secrets', basePrice: 5000, rarity: 'scarce', desc: 'Insider trading intel' },
  { id: 'backdoor_access', name: 'Backdoor Access', basePrice: 10000, rarity: 'rare', desc: 'Pre-installed network access' },
  { id: 'identity_packet', name: 'Identity Packet', basePrice: 3000, rarity: 'scarce', desc: 'Clean ID for heat wipe' },
  { id: 'blackmail_data', name: 'Blackmail Data', basePrice: 8000, rarity: 'rare', desc: 'Leverage on targets' },
];

// Territory Control (GreyNet Faction Warfare)
export const TERRITORY_CONFIG = {
  zone: 'greynet',              // Only GreyNet networks are capturable
  captureTime: 300000,          // 5 min to capture uncontested
  captureTickInterval: 30000,   // Progress tick every 30 seconds
  influencePerTick: 10,         // Influence gained per tick while capturing
  maxInfluence: 100,            // Full control at 100 influence
  contestDecay: 5,              // Influence lost per tick when contested
  abandonDecay: 2,              // Influence lost per tick when no one present
  passiveIncome: 10,            // Credits per hour per territory
  bonusMultiplier: 1.25,        // 25% bonus resources on owned networks
  maxTerritories: 10,           // Max territories per player
};

export const DEATH_CONFIG = {
  // When traced (caught)
  traceConsequences: {
    creditLoss: 0.10,       // Lose 10% of credits
    heatGain: 20,           // +20 heat
    rigDamage: 25,          // 25% integrity damage to active rig
    cargoLoss: 0.50,        // Lose 50% of carried resources
    bountyReward: 0.25,     // 25% of lost credits go to hunter
  },

  // When killed by Counter-ICE
  killConsequences: {
    creditLoss: 0.25,       // Lose 25% of credits
    rigDamage: 50,          // 50% integrity damage
    cargoLoss: 1.0,         // Lose ALL carried resources
    respawnDelay: 30000,    // 30 second respawn delay
  },

  // Rig integrity
  rigIntegrity: {
    max: 100,
    repairCostPerPoint: 10, // 10 CR per integrity point
    destroyedThreshold: 0,  // At 0, rig is destroyed
    degradedThreshold: 25,  // Below 25%, performance degraded
    degradedPenalty: 0.5,   // 50% slower when degraded
  },

  // Respawn behavior
  respawn: {
    defaultLocation: 'clearnet', // If no home set
    protectionTime: 60000,       // 60s immunity after respawn
  },
};

// Chat & Communications
export const CHAT_CONFIG = {
  channels: {
    LOCAL: { id: 'local', name: 'Local', range: 'cluster' },      // Same cluster
    GLOBAL: { id: 'global', name: 'Global', range: 'all' },       // All players
    CREW: { id: 'crew', name: 'Crew', range: 'organization' },    // Org members only
    DARKNET: { id: 'darknet', name: 'DarkNet', range: 'zone' },   // DarkNet only
  },
  messageRateLimit: 1000,    // 1 message per second
  maxMessageLength: 500,
  historyLength: 100,        // Messages to keep per channel
};

// Reputation System
export const REPUTATION_CONFIG = {
  actions: {
    SUCCESSFUL_HACK: 5,        // +5 rep for successful hack
    CLEAN_GETAWAY: 10,         // +10 for escaping without trace
    TRACED: -15,               // -15 for getting caught
    DEFEND_SUCCESS: 8,         // +8 for catching an intruder
    TRADE_COMPLETE: 2,         // +2 per successful trade
    CONTRACT_COMPLETE: 20,     // +20 per contract completed
    CONTRACT_FAIL: -25,        // -25 for failing contract
  },
  titles: [
    { minRep: -100, title: 'Blacklisted', color: '#ff0000' },
    { minRep: 0, title: 'Unknown', color: '#888888' },
    { minRep: 50, title: 'Script Kiddie', color: '#00ff00' },
    { minRep: 150, title: 'Hacker', color: '#00ffff' },
    { minRep: 300, title: 'Elite Hacker', color: '#ffff00' },
    { minRep: 500, title: 'Netrunner', color: '#ff00ff' },
    { minRep: 1000, title: 'Ghost', color: '#ffffff' },
    { minRep: 2500, title: 'Legend', color: '#ffd700' },
  ],
};

// Specialization Paths
export const SPECIALIZATION_CONFIG = {
  paths: {
    INFILTRATOR: {
      id: 'infiltrator',
      name: 'Infiltrator',
      description: 'Master of stealth and intrusion. Faster hacks, harder to trace.',
      icon: '🔓',
      skills: [
        { id: 'silent_breach', name: 'Silent Breach', level: 1, cost: 100, effect: 'ICE breach 15% faster' },
        { id: 'ghost_protocol', name: 'Ghost Protocol', level: 2, cost: 250, effect: 'Trace rate -20%' },
        { id: 'shadow_step', name: 'Shadow Step', level: 3, cost: 500, effect: 'Move between nodes undetected' },
        { id: 'zero_footprint', name: 'Zero Footprint', level: 4, cost: 1000, effect: 'Log cleaning instant' },
        { id: 'phantom', name: 'Phantom', level: 5, cost: 2500, effect: 'Appear offline to defenders' },
      ],
    },
    SENTINEL: {
      id: 'sentinel',
      name: 'Sentinel',
      description: 'Network defender. Stronger ICE, faster traces.',
      icon: '🛡️',
      skills: [
        { id: 'fortify', name: 'Fortify', level: 1, cost: 100, effect: 'ICE strength +15%' },
        { id: 'rapid_trace', name: 'Rapid Trace', level: 2, cost: 250, effect: 'Backtrace 25% faster' },
        { id: 'counter_surge', name: 'Counter Surge', level: 3, cost: 500, effect: 'Counter-ICE damage +20%' },
        { id: 'iron_wall', name: 'Iron Wall', level: 4, cost: 1000, effect: 'Lockdown duration +50%' },
        { id: 'omniscient', name: 'Omniscient', level: 5, cost: 2500, effect: 'Instant intrusion alerts' },
      ],
    },
    BROKER: {
      id: 'broker',
      name: 'Broker',
      description: 'Information trader. Better deals, larger inventory.',
      icon: '💰',
      skills: [
        { id: 'haggle', name: 'Haggle', level: 1, cost: 100, effect: 'Market fees -25%' },
        { id: 'deep_pockets', name: 'Deep Pockets', level: 2, cost: 250, effect: 'Max orders +10' },
        { id: 'black_market', name: 'Black Market Access', level: 3, cost: 500, effect: 'Access rare resources' },
        { id: 'information_broker', name: 'Information Broker', level: 4, cost: 1000, effect: 'Trade rep +50%' },
        { id: 'kingpin', name: 'Kingpin', level: 5, cost: 2500, effect: 'Create exclusive contracts' },
      ],
    },
  },
  maxSkillLevel: 5,
  respecCost: 5000,  // CR to reset skills
};

// Sectors (Regions of the Grid)
export const SECTORS = {
  CORPORATE_CORE: {
    id: 'corporate_core',
    name: 'Corporate Core',
    description: 'Heart of the megacorporations. Banking, trading, corporate espionage.',
    securityRange: [0.7, 1.0],
    zone: 'CLEARNET',
    clusterCount: 8,
    theme: 'corporate',
    npcFactions: ['MEGACORP_CONSORTIUM', 'FEDERAL_CYBER_DIVISION'],
  },
  COMMERCIAL_RING: {
    id: 'commercial_ring',
    name: 'Commercial Ring',
    description: 'Business networks and ISPs. Entry-level targets.',
    securityRange: [0.5, 0.7],
    zone: 'CLEARNET',
    clusterCount: 12,
    theme: 'commercial',
    npcFactions: ['MEGACORP_CONSORTIUM'],
  },
  FRONTIER: {
    id: 'frontier',
    name: 'The Frontier',
    description: 'Transition zone. Faction warfare, smuggling routes.',
    securityRange: [0.2, 0.5],
    zone: 'GREYNET',
    clusterCount: 15,
    theme: 'frontier',
    npcFactions: ['SHADOWBROKERS'],
  },
  UNDERGROUND: {
    id: 'underground',
    name: 'The Underground',
    description: 'Black markets and hidden networks. High risk, high reward.',
    securityRange: [0.1, 0.3],
    zone: 'GREYNET',
    clusterCount: 10,
    theme: 'underground',
    npcFactions: ['SHADOWBROKERS', 'GHOST_COLLECTIVE'],
  },
  DEAD_ZONES: {
    id: 'dead_zones',
    name: 'Dead Zones',
    description: 'Abandoned corporate infrastructure. Entry to DarkNet.',
    securityRange: [-0.3, 0.1],
    zone: 'DARKNET',
    clusterCount: 20,
    theme: 'abandoned',
    npcFactions: ['GHOST_COLLECTIVE'],
  },
  THE_VOID: {
    id: 'the_void',
    name: 'The Void',
    description: 'Deep DarkNet. Richest rewards, most dangerous. Full sovereignty.',
    securityRange: [-1.0, -0.3],
    zone: 'DARKNET',
    clusterCount: 30,
    theme: 'void',
    npcFactions: [],
  },
};

// NPC Factions (Empire equivalents)
export const NPC_FACTIONS = {
  FEDERAL_CYBER_DIVISION: {
    id: 'federal_cyber_division',
    name: 'Federal Cyber Division',
    description: 'Government law enforcement. Hunts criminals in ClearNet.',
    stance: 'hostile_to_criminals',
    territory: ['CORPORATE_CORE'],
    services: ['bounty_clearing', 'legal_contracts'],
    color: '#0066ff',
  },
  MEGACORP_CONSORTIUM: {
    id: 'megacorp_consortium',
    name: 'Megacorp Consortium',
    description: 'Coalition of megacorporations. Controls ClearNet infrastructure.',
    stance: 'neutral',
    territory: ['CORPORATE_CORE', 'COMMERCIAL_RING'],
    services: ['banking', 'insurance', 'contracts', 'market'],
    color: '#00cccc',
  },
  SHADOWBROKERS: {
    id: 'shadowbrokers',
    name: 'Shadowbrokers',
    description: 'Information dealers and black market operators.',
    stance: 'neutral',
    territory: ['FRONTIER', 'UNDERGROUND'],
    services: ['black_market', 'intelligence', 'contracts'],
    color: '#aa00aa',
  },
  GHOST_COLLECTIVE: {
    id: 'ghost_collective',
    name: 'Ghost Collective',
    description: 'Anarchist hackers. Operate safe houses in DarkNet.',
    stance: 'friendly_to_outlaws',
    territory: ['UNDERGROUND', 'DEAD_ZONES'],
    services: ['safe_houses', 'identity_wipes', 'hiding'],
    color: '#666666',
  },
};

// Resources (Mining equivalents)
export const RESOURCES = {
  DATA_PACKETS: {
    id: 'data_packets',
    name: 'Data Packets',
    description: 'Raw data fragments. Basic crafting material.',
    tier: 1,
    baseValue: 1,
    sources: ['database', 'log_server'],
    minSecurity: -1.0,
  },
  BANDWIDTH_TOKENS: {
    id: 'bandwidth_tokens',
    name: 'Bandwidth Tokens',
    description: 'Network capacity units. Required for large operations.',
    tier: 1,
    baseValue: 5,
    sources: ['gateway', 'proxy'],
    minSecurity: -1.0,
  },
  ENCRYPTION_KEYS: {
    id: 'encryption_keys',
    name: 'Encryption Keys',
    description: 'Cryptographic keys. Required for advanced software.',
    tier: 2,
    baseValue: 25,
    sources: ['vault', 'firewall'],
    minSecurity: -0.5,
  },
  ACCESS_TOKENS: {
    id: 'access_tokens',
    name: 'Access Tokens',
    description: 'Authentication credentials. Used for privileged access.',
    tier: 2,
    baseValue: 50,
    sources: ['vault'],
    minSecurity: -0.5,
  },
  ZERO_DAYS: {
    id: 'zero_days',
    name: 'Zero-Day Exploits',
    description: 'Rare vulnerabilities. Essential for elite software.',
    tier: 3,
    baseValue: 500,
    sources: ['research_lab', 'vault'],
    minSecurity: -0.7,
  },
  QUANTUM_CORES: {
    id: 'quantum_cores',
    name: 'Quantum Cores',
    description: 'Experimental quantum fragments. Endgame materials.',
    tier: 4,
    baseValue: 5000,
    sources: ['quantum_node'],
    minSecurity: -1.0, // Deep Void only
  },
};

// Sovereignty Structures
export const SOVEREIGNTY_STRUCTURES = {
  CONTROL_NODE: {
    id: 'control_node',
    name: 'Control Node',
    description: 'Establishes root access over a network. Required to claim sovereignty.',
    deployCost: 50000,
    maintenanceCost: 500, // per hour
    deployTime: 3600, // 1 hour vulnerability
    health: 1000,
    defenses: ['firewall'],
    requiresZone: 'DARKNET',
    requiresOrg: 'syndicate',
  },
  SOVEREIGNTY_HUB: {
    id: 'sov_hub',
    name: 'Sovereignty Hub',
    description: 'Central management for cluster upgrades. Replaces Control Node.',
    deployCost: 250000,
    maintenanceCost: 2000,
    deployTime: 7200, // 2 hour vulnerability
    health: 5000,
    upgrades: ['military', 'industrial', 'logistics'],
    requiresZone: 'DARKNET',
    requiresOrg: 'syndicate',
  },
  DATA_SKYHOOK: {
    id: 'data_skyhook',
    name: 'Data Skyhook',
    description: 'Passively harvests data packets from network. Can be raided.',
    deployCost: 100000,
    maintenanceCost: 1000,
    deployTime: 1800,
    health: 2000,
    harvestRate: { data_packets: 100, encryption_keys: 10 }, // per hour
    raidable: true,
    requiresZone: 'DARKNET',
    requiresOrg: 'syndicate',
  },
  CRYPTO_MINING_RIG: {
    id: 'mining_rig',
    name: 'Crypto Mining Rig',
    description: 'Generates passive credits through computational mining.',
    deployCost: 150000,
    maintenanceCost: 1500,
    deployTime: 1800,
    health: 1500,
    creditRate: 50, // per hour
    requiresZone: 'DARKNET',
    requiresOrg: 'syndicate',
  },
  SAFE_HOUSE: {
    id: 'safe_house',
    name: 'Safe House',
    description: 'Spawn point and storage. Protects assets on death.',
    deployCost: 25000,
    maintenanceCost: 250,
    deployTime: 900,
    health: 3000,
    storage: 100, // file slots
    requiresZone: null, // Can deploy anywhere except high ClearNet
    requiresOrg: 'crew',
  },
};

// Organization Types
export const ORGANIZATION_TYPES = {
  CREW: {
    id: 'crew',
    name: 'Crew',
    description: 'Small group of hackers. Basic cooperation.',
    maxMembers: 10,
    canClaimSov: false,
    allowedStructures: ['safe_house'],
    taxRateRange: [0, 0.2],
    createCost: 1000,
  },
  SYNDICATE: {
    id: 'syndicate',
    name: 'Syndicate',
    description: 'Organized hacking group. Can claim sovereignty.',
    maxMembers: 100,
    canClaimSov: true,
    allowedStructures: ['safe_house', 'control_node', 'data_skyhook', 'mining_rig'],
    taxRateRange: [0, 0.5],
    createCost: 50000,
    requires: { crews: 3 }, // Need 3 crews to form
  },
  CARTEL: {
    id: 'cartel',
    name: 'Cartel',
    description: 'Alliance of syndicates. Controls sectors.',
    maxMembers: 1000,
    canClaimSov: true,
    allowedStructures: 'all',
    taxRateRange: [0, 1.0],
    createCost: 500000,
    requires: { syndicates: 3 },
  },
};

// Commands
export const COMMANDS = [
  // Basic
  { cmd: 'help', desc: 'Show available commands', usage: 'help [command]' },
  { cmd: 'status', desc: 'Show current status and location', usage: 'status' },
  { cmd: 'clear', desc: 'Clear terminal', usage: 'clear' },

  // Navigation (Universe)
  { cmd: 'location', desc: 'Show current location in the Grid', usage: 'location' },
  { cmd: 'explore', desc: 'Explore current cluster or sector', usage: 'explore [sector_name]' },
  { cmd: 'navigate', desc: 'Navigate to a network', usage: 'navigate <network_id>' },
  { cmd: 'jump', desc: 'Jump to connected network', usage: 'jump <network_id>' },
  { cmd: 'map', desc: 'Show cluster network map', usage: 'map' },
  { cmd: 'sectors', desc: 'List all sectors', usage: 'sectors' },

  // Hacking
  { cmd: 'scan', desc: 'Scan target for nodes and ICE', usage: 'scan <ip>' },
  { cmd: 'connect', desc: 'Connect to target server', usage: 'connect <ip>' },
  { cmd: 'disconnect', desc: 'Disconnect from current server', usage: 'disconnect' },
  { cmd: 'breach', desc: 'Breach current node', usage: 'breach' },
  { cmd: 'crack', desc: 'Crack password on current node', usage: 'crack' },
  { cmd: 'download', desc: 'Download file from current node', usage: 'download <filename>' },
  { cmd: 'upload', desc: 'Upload file to current node', usage: 'upload <filename>' },
  { cmd: 'move', desc: 'Move to connected node', usage: 'move <node_id>' },
  { cmd: 'abort', desc: 'Emergency disconnect (leaves trace)', usage: 'abort' },
  { cmd: 'clean', desc: 'Clean logs before disconnecting', usage: 'clean' },
  { cmd: 'cloak', desc: 'Activate proxy chain', usage: 'cloak' },

  // Files
  { cmd: 'ls', desc: 'List files in current node', usage: 'ls' },
  { cmd: 'cat', desc: 'View file contents', usage: 'cat <filename>' },
  { cmd: 'rm', desc: 'Delete file', usage: 'rm <filename>' },
  { cmd: 'run', desc: 'Run a program', usage: 'run <program>' },

  // Resources
  { cmd: 'resources', desc: 'View harvested resources', usage: 'resources' },
  { cmd: 'harvest', desc: 'Harvest resources from current node', usage: 'harvest' },

  // Equipment
  { cmd: 'hardware', desc: 'View hardware specs', usage: 'hardware' },
  { cmd: 'software', desc: 'View installed software', usage: 'software' },
  { cmd: 'shop', desc: 'Open the black market', usage: 'shop' },
  { cmd: 'buy', desc: 'Purchase item', usage: 'buy <item_id>' },
  { cmd: 'upgrade', desc: 'Upgrade hardware', usage: 'upgrade <component>' },

  // Contracts & Economy
  { cmd: 'contracts', desc: 'View available contracts', usage: 'contracts' },
  { cmd: 'accept', desc: 'Accept a contract', usage: 'accept <contract_id>' },

  // Factions & Organizations
  { cmd: 'faction', desc: 'View faction info', usage: 'faction' },
  { cmd: 'join', desc: 'Join a faction', usage: 'join <faction_name>' },
  { cmd: 'crew', desc: 'Manage your crew', usage: 'crew [create|invite|leave|info]' },

  // Sovereignty & Warfare
  { cmd: 'sov', desc: 'Sovereignty management', usage: 'sov [status|list|deploy]' },
  { cmd: 'siege', desc: 'Attack territory structure', usage: 'siege <structure_id>' },
];
