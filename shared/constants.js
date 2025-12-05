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
