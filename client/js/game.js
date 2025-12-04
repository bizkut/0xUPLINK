import { HARDWARE_TIERS, ICE_TYPES, SOFTWARE_TYPES, NODE_TYPES, GAME_CONFIG, COMMANDS } from '../../shared/constants.js';

export class Game {
  constructor() {
    this.state = {
      player: {
        id: null,
        ip: this.generateIP(),
        credits: GAME_CONFIG.STARTING_CREDITS,
        reputation: GAME_CONFIG.STARTING_REPUTATION,
        heat: 0,
        faction: null,
        hardware: {
          tier: 0,
          ...HARDWARE_TIERS[0],
          cpuUsed: 0,
          ramUsed: 0,
          integrity: 100,
        },
        software: [],
        files: [],
      },
      connection: {
        active: false,
        targetIp: null,
        targetOwner: null,
        network: null,
        currentNode: null,
        trace: 0,
        traceRate: GAME_CONFIG.BASE_TRACE_RATE,
        cloaked: false,
      },
      contracts: [],
      scannedServers: {},
    };

    this.ws = null;
    this.lastUpdate = Date.now();

    // Give starter software
    this.addSoftware('icebreaker', 1);
    this.addSoftware('password_cracker', 1);
  }

  async connect() {
    // For now, run in offline/single-player mode
    // WebSocket connection will be added for multiplayer
    this.state.player.id = 'local_' + Math.random().toString(36).substr(2, 9);
    this.generateContracts();
    return true;
  }

  generateIP() {
    const octets = [
      Math.floor(Math.random() * 223) + 1,
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
      Math.floor(Math.random() * 256),
    ];
    return octets.join('.');
  }

  update() {
    const now = Date.now();
    const delta = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;

    // Update trace if connected
    if (this.state.connection.active) {
      let traceRate = this.state.connection.traceRate;
      
      // Apply hardware trace resistance
      traceRate *= (1 - this.state.player.hardware.traceResist / 100);
      
      // Apply cloak if active
      if (this.state.connection.cloaked) {
        const proxyChain = this.state.player.software.find(s => s.id === 'proxy_chain');
        if (proxyChain) {
          traceRate *= (1 - proxyChain.traceReduction / 100);
        }
      }

      this.state.connection.trace += traceRate * delta;
      this.state.connection.trace = Math.min(100, this.state.connection.trace);
    }

    // Decay heat when not connected
    if (!this.state.connection.active && this.state.player.heat > 0) {
      this.state.player.heat -= GAME_CONFIG.HEAT_DECAY_RATE * delta / 60;
      this.state.player.heat = Math.max(0, this.state.player.heat);
    }
  }

  // === Scanning & Connecting ===

  async scanTarget(ip) {
    // Check if already scanned
    if (this.scannedServers[ip]) {
      return this.scannedServers[ip];
    }

    // Generate or fetch server data
    const server = this.generateServer(ip);
    this.state.scannedServers[ip] = server;

    return {
      owner: server.owner,
      securityRating: server.securityRating,
      nodeCount: server.nodes.length,
      iceCount: server.nodes.filter(n => n.ice).length,
    };
  }

  async connectToTarget(ip) {
    // Must scan first
    if (!this.state.scannedServers[ip]) {
      return { error: 'Target not scanned. Use "scan" first.' };
    }

    if (this.state.connection.active) {
      return { error: 'Already connected. Disconnect first.' };
    }

    const server = this.state.scannedServers[ip];
    const entryNode = server.nodes.find(n => n.type === 'gateway');

    this.state.connection = {
      active: true,
      targetIp: ip,
      targetOwner: server.owner,
      network: server,
      currentNode: entryNode.id,
      trace: 0,
      traceRate: server.traceRate || GAME_CONFIG.BASE_TRACE_RATE,
      cloaked: false,
    };

    return {
      entryNode: entryNode.id,
      network: server,
    };
  }

  disconnect(emergency = false) {
    let heatGained = 0;
    let logsCleaned = false;

    if (emergency) {
      heatGained = GAME_CONFIG.BASE_HACK_HEAT * 2;
    } else {
      // Check if logs were cleaned
      const logCleaner = this.state.player.software.find(s => s.id === 'log_cleaner');
      if (logCleaner && logCleaner.used) {
        logsCleaned = true;
        heatGained = Math.floor(GAME_CONFIG.BASE_HACK_HEAT * (1 - logCleaner.effectiveness / 100));
      } else {
        heatGained = GAME_CONFIG.BASE_HACK_HEAT;
      }
    }

    this.state.player.heat = Math.min(GAME_CONFIG.MAX_HEAT, this.state.player.heat + heatGained);

    this.state.connection = {
      active: false,
      targetIp: null,
      targetOwner: null,
      network: null,
      currentNode: null,
      trace: 0,
      traceRate: GAME_CONFIG.BASE_TRACE_RATE,
      cloaked: false,
    };

    // Reset software usage
    this.state.player.software.forEach(s => s.used = false);

    return { heatGained, logsCleaned };
  }

  onTraced() {
    const heatGained = GAME_CONFIG.BASE_HACK_HEAT * 3;
    this.state.player.heat = Math.min(GAME_CONFIG.MAX_HEAT, this.state.player.heat + heatGained);

    this.state.connection = {
      active: false,
      targetIp: null,
      targetOwner: null,
      network: null,
      currentNode: null,
      trace: 0,
      traceRate: GAME_CONFIG.BASE_TRACE_RATE,
      cloaked: false,
    };

    return { heatGained };
  }

  // === Node Navigation ===

  getCurrentNode() {
    if (!this.state.connection.active) return null;
    return this.state.connection.network.nodes.find(n => n.id === this.state.connection.currentNode);
  }

  getAdjacentNodes() {
    const current = this.getCurrentNode();
    if (!current) return [];

    return this.state.connection.network.nodes.filter(n => 
      current.connections.includes(n.id)
    );
  }

  moveToNode(nodeId) {
    const current = this.getCurrentNode();
    if (!current) return { error: 'Not connected.' };

    if (!current.connections.includes(nodeId)) {
      return { error: 'Cannot reach that node from here.' };
    }

    const targetNode = this.state.connection.network.nodes.find(n => n.id === nodeId);
    if (!targetNode) {
      return { error: 'Node not found.' };
    }

    // Check if we need to breach first
    if (targetNode.ice && !targetNode.breached) {
      return { error: `Node protected by ${targetNode.ice.name}. Breach first.` };
    }

    this.state.connection.currentNode = nodeId;
    return { node: targetNode };
  }

  // === Hacking Actions ===

  async breachNode() {
    const current = this.getCurrentNode();
    if (!current || !current.ice) {
      return { error: 'No ICE to breach.' };
    }

    const icebreaker = this.state.player.software.find(s => s.id === 'icebreaker');
    if (!icebreaker) {
      return { error: 'No icebreaker software installed.' };
    }

    // Check CPU availability
    if (this.state.player.hardware.cpuUsed + icebreaker.cpuCost > this.state.player.hardware.cpu) {
      return { error: 'Insufficient CPU cores available.' };
    }

    // Temporarily use CPU
    this.state.player.hardware.cpuUsed += icebreaker.cpuCost;

    // Simulate breach time
    await this.delay(1000 + Math.random() * 1000);

    // Release CPU
    this.state.player.hardware.cpuUsed -= icebreaker.cpuCost;

    // Check success
    const success = icebreaker.power >= current.ice.strength;

    if (success) {
      current.breached = true;
      
      // Handle Black ICE damage
      if (current.ice.id === 'black_ice') {
        const damage = current.ice.damage || 10;
        this.state.player.hardware.integrity -= damage;
        return { success: true, damage };
      }
      
      return { success: true };
    }

    // Failed - take damage from Black ICE
    if (current.ice.id === 'black_ice') {
      const damage = current.ice.damage || 20;
      this.state.player.hardware.integrity -= damage;
      return { success: false, damage };
    }

    return { success: false };
  }

  async crackPassword() {
    const current = this.getCurrentNode();
    if (!current || !current.password) {
      return { error: 'No password to crack.' };
    }

    const cracker = this.state.player.software.find(s => s.id === 'password_cracker');
    if (!cracker) {
      return { error: 'No password cracker installed.' };
    }

    // Simulate cracking time
    const baseTime = 3000;
    const crackTime = baseTime / cracker.speed;
    await this.delay(crackTime);

    current.cracked = true;
    return { success: true };
  }

  async downloadFile(filename) {
    const current = this.getCurrentNode();
    if (!current) return { error: 'Not connected.' };

    const file = (current.files || []).find(f => f.name === filename);
    if (!file) return { error: 'File not found.' };

    if (file.encrypted && !this.hasDecryptor()) {
      return { error: 'File encrypted. Decryptor required.' };
    }

    // Simulate download time based on file size and bandwidth
    const downloadTime = (file.size / 1024) / (this.state.player.hardware.bandwidth / 8) * 1000;
    await this.delay(Math.min(downloadTime, 3000));

    // Add to player files
    this.state.player.files.push({ ...file, stolen: true });

    // Award credits if valuable
    let credits = 0;
    if (file.value) {
      credits = file.value;
      this.state.player.credits += credits;
    }

    return { success: true, credits };
  }

  async cleanLogs() {
    const logCleaner = this.state.player.software.find(s => s.id === 'log_cleaner');
    if (!logCleaner) {
      return { success: false };
    }

    await this.delay(500);
    logCleaner.used = true;

    return { success: true, effectiveness: logCleaner.effectiveness };
  }

  activateCloak() {
    const proxyChain = this.state.player.software.find(s => s.id === 'proxy_chain');
    if (!proxyChain) {
      return { error: 'Proxy chain not installed.' };
    }

    if (this.state.connection.cloaked) {
      return { active: true, proxies: proxyChain.proxies, traceReduction: proxyChain.traceReduction };
    }

    this.state.connection.cloaked = true;
    return { active: true, proxies: proxyChain.proxies, traceReduction: proxyChain.traceReduction };
  }

  // === Software Management ===

  addSoftware(id, level) {
    const softwareType = SOFTWARE_TYPES[id.toUpperCase()];
    if (!softwareType) return false;

    const version = softwareType.versions.find(v => v.level === level);
    if (!version) return false;

    // Remove old version if exists
    this.state.player.software = this.state.player.software.filter(s => s.id !== id);

    this.state.player.software.push({
      id,
      name: softwareType.name,
      ...version,
      used: false,
    });

    return true;
  }

  hasDecryptor() {
    return this.state.player.software.some(s => s.id === 'decryptor');
  }

  getAvailableSoftware() {
    const available = [];
    
    Object.entries(SOFTWARE_TYPES).forEach(([key, soft]) => {
      const owned = this.state.player.software.find(s => s.id === soft.id);
      const ownedLevel = owned ? owned.level : 0;
      
      soft.versions.forEach(v => {
        if (v.level > ownedLevel) {
          available.push({
            id: `${soft.id}_v${v.level}`,
            name: soft.name,
            level: v.level,
            price: v.price,
            cpuCost: v.cpuCost,
            ramCost: v.ramCost,
          });
        }
      });
    });

    return available;
  }

  // === Server Generation ===

  generateServer(ip) {
    const difficulty = Math.random();
    const nodeCount = 4 + Math.floor(difficulty * 6);
    
    const nodes = [];
    
    // Always have a gateway
    nodes.push({
      id: 'gateway',
      type: 'gateway',
      ...NODE_TYPES.GATEWAY,
      connections: ['firewall_1'],
      ice: null,
      breached: true,
      files: [],
    });

    // Add firewall
    nodes.push({
      id: 'firewall_1',
      type: 'firewall',
      ...NODE_TYPES.FIREWALL,
      connections: ['gateway', 'database_1'],
      ice: { ...ICE_TYPES.FIREWALL, strength: 100 + Math.floor(difficulty * 200) },
      breached: false,
      files: [],
    });

    // Add database with files
    nodes.push({
      id: 'database_1',
      type: 'database',
      ...NODE_TYPES.DATABASE,
      connections: ['firewall_1', 'vault_1'],
      ice: difficulty > 0.5 ? { ...ICE_TYPES.TRACKER } : null,
      breached: false,
      password: difficulty > 0.3,
      cracked: false,
      files: [
        { name: 'user_data.db', size: 1024 * 512, value: 200, encrypted: false },
        { name: 'logs.txt', size: 1024 * 10, value: 0, encrypted: false },
      ],
    });

    // Add vault (high value target)
    nodes.push({
      id: 'vault_1',
      type: 'vault',
      ...NODE_TYPES.VAULT,
      connections: ['database_1'],
      ice: { ...ICE_TYPES.BLACK_ICE, strength: 150 + Math.floor(difficulty * 250), damage: 20 + Math.floor(difficulty * 30) },
      breached: false,
      password: true,
      cracked: false,
      files: [
        { name: 'financial_records.enc', size: 1024 * 1024, value: 1000 + Math.floor(difficulty * 2000), encrypted: true },
        { name: 'credentials.txt', size: 1024, value: 500, encrypted: false },
      ],
    });

    const owners = ['CyberCorp', 'DataVault Inc', 'NeoTech', 'Axiom Systems', 'Player_' + Math.random().toString(36).substr(2, 6)];

    return {
      ip,
      owner: owners[Math.floor(Math.random() * owners.length)],
      securityRating: difficulty > 0.7 ? 'HIGH' : difficulty > 0.4 ? 'MEDIUM' : 'LOW',
      traceRate: GAME_CONFIG.BASE_TRACE_RATE * (1 + difficulty),
      nodes,
    };
  }

  generateTutorialServer() {
    const tutorialServer = {
      ip: '10.0.0.1',
      owner: 'TUTORIAL_SYS',
      securityRating: 'LOW',
      traceRate: 0.5,
      nodes: [
        {
          id: 'gateway',
          type: 'gateway',
          ...NODE_TYPES.GATEWAY,
          connections: ['firewall_1'],
          ice: null,
          breached: true,
          files: [],
        },
        {
          id: 'firewall_1',
          type: 'firewall',
          ...NODE_TYPES.FIREWALL,
          connections: ['gateway', 'database_1'],
          ice: { ...ICE_TYPES.FIREWALL, strength: 50 },
          breached: false,
          files: [],
        },
        {
          id: 'database_1',
          type: 'database',
          ...NODE_TYPES.DATABASE,
          connections: ['firewall_1'],
          ice: null,
          breached: false,
          files: [
            { name: 'welcome.txt', size: 256, value: 100, encrypted: false },
          ],
        },
      ],
    };

    this.state.scannedServers['10.0.0.1'] = tutorialServer;
  }

  // === Contracts ===

  generateContracts() {
    this.state.contracts = [
      {
        id: 'contract_1',
        title: 'Data Retrieval - CyberCorp',
        type: 'DATA_HEIST',
        targetIp: this.generateIP(),
        objective: 'Download financial_records.enc',
        reward: 2000,
        difficulty: 'EASY',
        deadline: null,
      },
      {
        id: 'contract_2', 
        title: 'Corporate Espionage',
        type: 'DATA_HEIST',
        targetIp: this.generateIP(),
        objective: 'Download all files from vault',
        reward: 5000,
        difficulty: 'MEDIUM',
        deadline: null,
      },
      {
        id: 'contract_3',
        title: 'System Sabotage',
        type: 'SABOTAGE',
        targetIp: this.generateIP(),
        objective: 'Delete all database files',
        reward: 3500,
        difficulty: 'MEDIUM',
        deadline: null,
      },
    ];
  }

  getAvailableContracts() {
    return this.state.contracts;
  }

  // === Helpers ===

  getCommandHelp(cmd) {
    return COMMANDS.find(c => c.cmd === cmd.toLowerCase());
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
