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

// Commands
export const COMMANDS = [
  { cmd: 'help', desc: 'Show available commands', usage: 'help [command]' },
  { cmd: 'scan', desc: 'Scan target for nodes and ICE', usage: 'scan <ip>' },
  { cmd: 'connect', desc: 'Connect to target server', usage: 'connect <ip>' },
  { cmd: 'disconnect', desc: 'Disconnect from current server', usage: 'disconnect' },
  { cmd: 'breach', desc: 'Breach current node', usage: 'breach' },
  { cmd: 'crack', desc: 'Crack password on current node', usage: 'crack' },
  { cmd: 'download', desc: 'Download file from current node', usage: 'download <filename>' },
  { cmd: 'upload', desc: 'Upload file to current node', usage: 'upload <filename>' },
  { cmd: 'move', desc: 'Move to connected node', usage: 'move <node_id>' },
  { cmd: 'ls', desc: 'List files in current node', usage: 'ls' },
  { cmd: 'cat', desc: 'View file contents', usage: 'cat <filename>' },
  { cmd: 'rm', desc: 'Delete file', usage: 'rm <filename>' },
  { cmd: 'run', desc: 'Run a program', usage: 'run <program>' },
  { cmd: 'abort', desc: 'Emergency disconnect (leaves trace)', usage: 'abort' },
  { cmd: 'clean', desc: 'Clean logs before disconnecting', usage: 'clean' },
  { cmd: 'cloak', desc: 'Activate proxy chain', usage: 'cloak' },
  { cmd: 'status', desc: 'Show current status', usage: 'status' },
  { cmd: 'hardware', desc: 'View hardware specs', usage: 'hardware' },
  { cmd: 'software', desc: 'View installed software', usage: 'software' },
  { cmd: 'contracts', desc: 'View available contracts', usage: 'contracts' },
  { cmd: 'accept', desc: 'Accept a contract', usage: 'accept <contract_id>' },
  { cmd: 'shop', desc: 'Open the black market', usage: 'shop' },
  { cmd: 'buy', desc: 'Purchase item', usage: 'buy <item_id>' },
  { cmd: 'upgrade', desc: 'Upgrade hardware', usage: 'upgrade <component>' },
  { cmd: 'faction', desc: 'View faction info', usage: 'faction' },
  { cmd: 'join', desc: 'Join a faction', usage: 'join <faction_name>' },
  { cmd: 'clear', desc: 'Clear terminal', usage: 'clear' },
];
