import { HARDWARE_TIERS, ICE_TYPES, SOFTWARE_TYPES, NODE_TYPES, GAME_CONFIG, COMMANDS, RESOURCES, SOVEREIGNTY_STRUCTURES, ORGANIZATION_TYPES, HEAT_THRESHOLDS } from '../../shared/constants.js';
import { COMPUTER_CLASSES, RIG_MODULES, getRigById, getModuleById, calculateEffectiveStats, canEquipModule } from '../../shared/computerModels.js';

export class Game {
  constructor() {
    // Default to Burner rig
    const starterRig = COMPUTER_CLASSES.BURNER;

    this.state = {
      player: {
        id: null,
        ip: this.generateIP(),
        credits: GAME_CONFIG.STARTING_CREDITS,
        reputation: GAME_CONFIG.STARTING_REPUTATION,
        heat: 0,
        faction: null,
        organization: null, // { id, name, role }
        // Computer rig system
        rig: {
          class: starterRig,
          equippedModules: {
            core: [],
            memory: [],
            expansion: [],
          },
        },
        hardware: {
          tier: starterRig.tier,
          name: starterRig.name,
          cpu: starterRig.baseCpu,
          ram: starterRig.baseRam,
          bandwidth: starterRig.baseBandwidth,
          traceResist: (starterRig.bonuses.traceResist - 1) * 100, // Convert to percentage
          cpuUsed: 0,
          ramUsed: 0,
          integrity: 100,
        },
        software: [],
        files: [],
        resources: {
          data_packets: 0,
          bandwidth_tokens: 0,
          encryption_keys: 0,
          access_tokens: 0,
          zero_days: 0,
          quantum_cores: 0,
        },
        // Local storage on player's computer
        localStorage: {
          capacity: 100, // Base capacity in MB, modified by rig class
          used: 0,
          files: [
            { name: 'readme.txt', size: 1, type: 'text', content: 'Welcome to UPLINK. Type "help" for commands.' },
            { name: 'config.sys', size: 2, type: 'system', content: 'SYSTEM_CONFIG=default' },
          ],
          installedSoftware: [], // Software installed on local machine
        },
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
    this.addSoftware('log_cleaner', 1);

    // Pending message callbacks for request/response pattern
    this.pendingCallbacks = new Map();
    this.messageId = 0;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[Game] WebSocket connected');
        this.isOnline = true;
        this.generateContracts();
        resolve(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleServerMessage(message);
        } catch (e) {
          console.error('[Game] Failed to parse message:', e);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[Game] WebSocket error - server connection required');
        this.isOnline = false;
        reject(new Error('Server connection required. Cannot play offline.'));
      };

      this.ws.onclose = () => {
        console.log('[Game] WebSocket disconnected');
        this.isOnline = false;
        window.dispatchEvent(new CustomEvent('connection-lost'));
      };
    });
  }

  handleServerMessage(message) {
    const { type, payload, messageId } = message;

    // Handle response to a pending request
    if (messageId && this.pendingCallbacks.has(messageId)) {
      const callback = this.pendingCallbacks.get(messageId);
      this.pendingCallbacks.delete(messageId);
      callback(payload);
      return;
    }

    // Handle server-pushed events
    switch (type) {
      case 'INIT':
        this.state.player.id = payload.playerId;
        this.state.player.ip = payload.ip;
        this.state.player.credits = payload.credits;
        if (payload.resources) {
          this.state.player.resources = payload.resources;
        }

        // Handle persisted state
        if (payload.persistedState) {
          this.state.player.reputation = payload.persistedState.reputation || 0;
          this.state.player.heat = payload.persistedState.heat || 0;

          if (payload.persistedState.rig) {
            this.state.player.rig = payload.persistedState.rig;
            this.recalculateHardware();
          }

          if (payload.persistedState.localStorage) {
            this.state.player.localStorage.files = payload.persistedState.localStorage;
            this.updateStorageCapacity();
          }
        }
        console.log('[Game] Initialized with ID:', payload.playerId);
        break;
      case 'REGISTER_RESULT':
        window.dispatchEvent(new CustomEvent('register-result', { detail: payload }));
        break;
      case 'LOGIN_RESULT':
        window.dispatchEvent(new CustomEvent('login-result', { detail: payload }));
        break;
      case 'SESSION_KICKED':
        // Another login detected - show alert and reload
        alert(payload.reason || 'Your session was ended by another login.');
        window.location.reload();
        break;
      case 'INTRUSION_ALERT':
        console.log('[Game] Intrusion from:', payload.attackerIp);
        window.dispatchEvent(new CustomEvent('intrusion-alert', { detail: payload }));
        break;
      case 'HACK_ACTIVITY':
        console.log('[Game] Hack activity:', payload);
        break;
      case 'CHAT_MESSAGE':
        window.dispatchEvent(new CustomEvent('chat-message', { detail: payload }));
        break;
      case 'MARKET_LIST_RESULT':
        window.dispatchEvent(new CustomEvent('market-list-result', { detail: payload }));
        break;
      case 'MARKET_BUY_RESULT':
        window.dispatchEvent(new CustomEvent('market-buy-result', { detail: payload }));
        break;
      case 'MARKET_SELL_RESULT':
        window.dispatchEvent(new CustomEvent('market-sell-result', { detail: payload }));
        break;
      case 'MARKET_CANCEL_RESULT':
        window.dispatchEvent(new CustomEvent('market-cancel-result', { detail: payload }));
        break;
      case 'MARKET_MODIFY_RESULT':
        window.dispatchEvent(new CustomEvent('market-modify-result', { detail: payload }));
        break;
      case 'CONTRACT_LIST_RESULT':
        window.dispatchEvent(new CustomEvent('contract-list-result', { detail: payload }));
        break;
      case 'CONTRACT_CREATE_RESULT':
        window.dispatchEvent(new CustomEvent('contract-create-result', { detail: payload }));
        break;
      case 'CONTRACT_ACCEPT_RESULT':
        window.dispatchEvent(new CustomEvent('contract-accept-result', { detail: payload }));
        break;
      case 'CONTRACT_CANCEL_RESULT':
        window.dispatchEvent(new CustomEvent('contract-cancel-result', { detail: payload }));
        break;
      case 'BLACKMARKET_LIST_RESULT':
        window.dispatchEvent(new CustomEvent('blackmarket-list-result', { detail: payload }));
        break;
      case 'BLACKMARKET_BUY_RESULT':
        window.dispatchEvent(new CustomEvent('blackmarket-buy-result', { detail: payload }));
        break;
      case 'BLACKMARKET_SELL_RESULT':
        window.dispatchEvent(new CustomEvent('blackmarket-sell-result', { detail: payload }));
        break;
      case 'PLAYER_COUNT':
        window.dispatchEvent(new CustomEvent('player-count', { detail: payload }));
        break;
      default:
        // Most messages are responses, handled by pendingCallbacks
        console.log('[Game] Unhandled message:', type);
    }
  }

  /**
   * Send a message to the server and wait for response
   * Server connection is REQUIRED - no offline mode
   */
  async register(username, password) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return { error: 'Not connected' };

    return new Promise((resolve) => {
      const handler = (e) => {
        window.removeEventListener('register-result', handler);
        resolve(e.detail);
      };
      setTimeout(() => {
        window.removeEventListener('register-result', handler);
        resolve({ error: 'Timeout' });
      }, 5000);

      window.addEventListener('register-result', handler);
      this.ws.send(JSON.stringify({ type: 'REGISTER', payload: { username, password } }));
    });
  }

  async login(username, password) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return { error: 'Not connected' };

    return new Promise((resolve) => {
      const handler = (e) => {
        window.removeEventListener('login-result', handler);
        resolve(e.detail);
      };
      setTimeout(() => {
        window.removeEventListener('login-result', handler);
        resolve({ error: 'Timeout. Server might be offline.' });
      }, 5000);

      window.addEventListener('login-result', handler);
      this.ws.send(JSON.stringify({ type: 'LOGIN', payload: { username, password } }));
    });
  }

  async sendMessage(type, payload = {}) {
    // Server connection is required
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return { error: 'Not connected to server. Please refresh the page.' };
    }

    return this.sendWebSocketMessage(type, payload);
  }

  sendWebSocketMessage(type, payload) {
    return new Promise((resolve, reject) => {
      const messageId = ++this.messageId;
      const timeout = setTimeout(() => {
        this.pendingCallbacks.delete(messageId);
        console.error(`[Game] Request ${type} timed out`);
        resolve({ error: 'Server request timed out. Please try again.' });
      }, 10000);

      this.pendingCallbacks.set(messageId, (response) => {
        clearTimeout(timeout);
        resolve(response);
      });

      this.ws.send(JSON.stringify({ type, payload, messageId }));
    });
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

  // === Heat System ===

  getHeatTier() {
    const heat = this.state.player.heat;
    // Find the highest tier the player qualifies for
    let currentTier = HEAT_THRESHOLDS.CLEAN;
    for (const tier of Object.values(HEAT_THRESHOLDS)) {
      if (heat >= tier.level && tier.level >= currentTier.level) {
        currentTier = tier;
      }
    }
    return currentTier;
  }

  getHeatEffects() {
    return this.getHeatTier().effects || {};
  }

  getHeatInfo() {
    const tier = this.getHeatTier();
    return {
      heat: this.state.player.heat,
      tier: tier.name,
      color: tier.color,
      description: tier.description,
      effects: tier.effects,
      nextTierAt: this.getNextHeatThreshold(),
    };
  }

  getNextHeatThreshold() {
    const heat = this.state.player.heat;
    const thresholds = Object.values(HEAT_THRESHOLDS)
      .map(t => t.level)
      .sort((a, b) => a - b);

    for (const threshold of thresholds) {
      if (threshold > heat) return threshold;
    }
    return null; // At max tier
  }

  // === Scanning & Connecting ===

  async scanTarget(ip) {
    // Check if already scanned
    if (this.state.scannedServers[ip]) {
      return this.state.scannedServers[ip];
    }

    // Apply heat-based scan delay
    const effects = this.getHeatEffects();
    const scanMultiplier = effects.scanSpeedMultiplier || 1;
    const baseScanTime = 500; // Base scan time in ms

    if (scanMultiplier > 1) {
      await this.delay(baseScanTime * (scanMultiplier - 1));
    }

    // Generate or fetch server data
    const server = this.generateServer(ip);
    this.state.scannedServers[ip] = server;

    return {
      owner: server.owner,
      securityRating: server.securityRating,
      nodeCount: server.nodes.length,
      iceCount: server.nodes.filter(n => n.ice).length,
      scanDelayed: scanMultiplier > 1,
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
    const effects = this.getHeatEffects();

    // Check if player is banned from ClearNet (Federal heat level)
    if (effects.clearnetBanned && server.zone === 'clearnet') {
      return {
        error: 'FEDERAL LOCKOUT: You cannot enter ClearNet while under federal investigation. Lay low in GreyNet or DarkNet.',
        heatBlocked: true,
      };
    }

    const entryNode = server.nodes.find(n => n.type === 'gateway');

    // Calculate trace rate with heat modifier
    let traceRate = server.traceRate || GAME_CONFIG.BASE_TRACE_RATE;
    if (effects.traceRateMultiplier) {
      traceRate *= effects.traceRateMultiplier;
    }

    this.state.connection = {
      active: true,
      targetIp: ip,
      targetOwner: server.owner,
      network: server,
      currentNode: entryNode.id,
      trace: 0,
      traceRate: traceRate,
      cloaked: false,
      heatModified: !!effects.traceRateModifier,
    };

    return {
      entryNode: entryNode.id,
      network: server,
      traceRateModified: !!effects.traceRateMultiplier,
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

  async harvestResources() {
    const current = this.getCurrentNode();
    if (!current) return { error: 'Not connected.' };

    if (!current.resources || current.resources.length === 0) {
      return { error: 'No resources to harvest.' };
    }

    // Simulate harvest time
    await this.delay(1000);

    // Harvest all resources
    const harvested = [];
    current.resources.forEach(res => {
      if (this.state.player.resources[res.type] !== undefined) {
        this.state.player.resources[res.type] += res.amount;
        harvested.push(res);
      }
    });

    // Clear resources
    current.resources = [];

    // Increase trace slightly
    this.state.connection.trace += 5;

    return { success: true, harvested };
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

  // === Organization Management (Mock/Client-Side) ===

  async createCrew(name) {
    if (this.state.player.organization) {
      return { error: 'You are already in an organization.' };
    }

    // Mock cost check
    const cost = 1000; // Crew creation cost
    if (this.state.player.credits < cost) {
      return { error: `Insufficient credits. Cost: ${cost} CR` };
    }

    this.state.player.credits -= cost;

    // Create mock crew
    const crewId = 'crew_' + Math.random().toString(36).substr(2, 6);
    const crew = {
      id: crewId,
      name: name,
      type: 'CREW',
      leader: this.state.player.id,
      members: [
        { id: this.state.player.id, name: 'You', role: 'LEADER' }
      ],
      treasury: 0,
    };

    // Assign to player
    this.state.player.organization = {
      id: crew.id,
      name: crew.name,
      role: 'LEADER',
      data: crew // store full data for mock mode
    };

    return { success: true, crew };
  }

  async leaveCrew() {
    if (!this.state.player.organization) {
      return { error: 'You are not in an organization.' };
    }

    const org = this.state.player.organization;

    // Mock leave logic
    if (org.role === 'LEADER' && org.data.members.length > 1) {
      return { error: 'Leader cannot leave while there are other members. Disband or transfer leadership.' };
    }

    this.state.player.organization = null;
    return { success: true };
  }

  async getCrewInfo() {
    if (!this.state.player.organization) {
      return { error: 'You are not in an organization.' };
    }
    return { success: true, info: this.state.player.organization.data };
  }

  // === Sovereignty System ===

  async deployStructure(typeId) {
    const structureDef = SOVEREIGNTY_STRUCTURES[typeId.toUpperCase()];
    if (!structureDef) {
      return { error: 'Invalid structure type.' };
    }

    // Check organization requirement
    if (!this.state.player.organization) {
      return { error: 'You must be in an organization to deploy structures.' };
    }

    const orgType = this.state.player.organization.data.type;
    const allowed = ORGANIZATION_TYPES[orgType]?.allowedStructures;

    if (allowed !== 'all' && !allowed.includes(structureDef.id)) {
      return { error: `${structureDef.name} requires a ${structureDef.requiresOrg.toUpperCase()} organization.` };
    }

    // Check zone requirement
    if (structureDef.requiresZone && this.state.connection.network.zone !== structureDef.requiresZone.toLowerCase()) {
      return { error: `${structureDef.name} can only be deployed in ${structureDef.requiresZone}.` };
    }

    // Check credits
    if (this.state.player.credits < structureDef.deployCost) {
      return { error: `Insufficient credits. Cost: ${structureDef.deployCost} CR` };
    }

    // Deploy logic (Mock)
    this.state.player.credits -= structureDef.deployCost;

    const structure = {
      id: `${typeId}_${Date.now()}`,
      type: typeId,
      name: structureDef.name,
      location: this.state.connection.network.ip,
      ownerOrg: this.state.player.organization.id,
      status: 'ONLINE', // In real game, would be 'DEPLOYING'
      health: structureDef.health,
    };

    // Add to network (mock)
    if (!this.state.connection.network.structures) {
      this.state.connection.network.structures = [];
    }
    this.state.connection.network.structures.push(structure);

    return { success: true, structure };
  }

  async getSovereigntyStatus() {
    // Mock status - would usually fetch from server
    const network = this.state.connection.network;
    if (!network) return { error: 'Not connected.' };

    return {
      network: network.ip,
      zone: network.zone,
      structures: network.structures || [],
      sovereignty: network.sovereignty || 'UNCLAIMED'
    };
  }

  async siegeStructure(structureId) {
    const network = this.state.connection.network;
    if (!network) return { error: 'Not connected.' };

    if (!network.structures) return { error: 'No structures found.' };

    const structure = network.structures.find(s => s.id === structureId);
    if (!structure) return { error: 'Structure not found.' };

    if (structure.ownerOrg === this.state.player.organization?.id) {
      return { error: 'Cannot siege your own structure.' };
    }

    // Check if already sieging
    if (structure.status === 'UNDER_SIEGE') {
      return { error: 'Structure already under siege.' };
    }

    // Start siege (Mock)
    structure.status = 'UNDER_SIEGE';

    // Calculate siege time (mock ADM)
    // Base 5 minutes + 1 min per ADM level (mock ADM=1)
    const siegeDuration = 300 + 60;

    return { success: true, structure, duration: siegeDuration };
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
      resources: Math.random() > 0.5 ? [{ type: 'bandwidth_tokens', amount: Math.floor(5 + Math.random() * 10) }] : [],
    });

    // Add firewall
    nodes.push({
      id: 'firewall_1',
      type: 'firewall',
      ...NODE_TYPES.FIREWALL,
      connections: ['gateway', 'database_1', 'log_server'],
      ice: { ...ICE_TYPES.FIREWALL, strength: 100 + Math.floor(difficulty * 200) },
      breached: false,
      files: [],
      resources: [],
    });

    // Add log server - where players clean logs
    nodes.push({
      id: 'log_server',
      type: 'log_server',
      ...NODE_TYPES.LOG_SERVER,
      connections: ['firewall_1'],
      ice: difficulty > 0.6 ? { ...ICE_TYPES.TRACKER } : null,
      breached: false,
      files: [
        { name: 'access.log', size: 1024 * 50, value: 0, encrypted: false, isLog: true },
        { name: 'auth.log', size: 1024 * 20, value: 0, encrypted: false, isLog: true },
        { name: 'system.log', size: 1024 * 100, value: 0, encrypted: false, isLog: true },
      ],
      resources: [],
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
      resources: Math.random() > 0.3 ? [{ type: 'data_packets', amount: Math.floor(10 + Math.random() * 20) }] : [],
    });

    // Add vault (high value target)
    const vaultResources = [];
    if (difficulty > 0.4) vaultResources.push({ type: 'encryption_keys', amount: Math.floor(1 + Math.random() * 5) });
    if (difficulty > 0.8) vaultResources.push({ type: 'zero_days', amount: 1 });

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
      resources: vaultResources,
    });

    // Add Research Lab (Very High Difficulty)
    if (difficulty > 0.8) {
      nodes[nodes.length - 1].connections.push('research_lab_1');
      nodes.push({
        id: 'research_lab_1',
        type: 'research_lab',
        ...NODE_TYPES.RESEARCH_LAB,
        connections: ['vault_1'],
        ice: { ...ICE_TYPES.SCRAMBLER },
        breached: false,
        files: [
          { name: 'experiment_data.enc', size: 1024 * 512, value: 1500, encrypted: true },
        ],
        resources: [{ type: 'zero_days', amount: 1 }],
      });
    }

    // Add Quantum Node (Extreme Difficulty)
    if (difficulty > 0.95) {
      // Connect to research lab or vault
      const parentId = difficulty > 0.8 ? 'research_lab_1' : 'vault_1';
      nodes[nodes.length - 1].connections.push('quantum_node_1'); // Connect to last node

      nodes.push({
        id: 'quantum_node_1',
        type: 'quantum_node',
        ...NODE_TYPES.QUANTUM_NODE,
        connections: [parentId],
        ice: { ...ICE_TYPES.BLACK_ICE, strength: 500, damage: 50 },
        breached: false,
        files: [],
        resources: [{ type: 'quantum_cores', amount: Math.floor(1 + Math.random() * 2) }],
      });
    }

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

  // === Rig Management ===

  // Get available rig classes for purchase/selection
  getAvailableRigs() {
    return Object.values(COMPUTER_CLASSES);
  }

  // Get available modules for purchase
  getAvailableModules() {
    return Object.values(RIG_MODULES);
  }

  // Get current rig info with effective stats
  getRigInfo() {
    const rig = this.state.player.rig;
    const allModules = [
      ...rig.equippedModules.core,
      ...rig.equippedModules.memory,
      ...rig.equippedModules.expansion,
    ];
    const effectiveStats = calculateEffectiveStats(rig.class, allModules);

    return {
      class: rig.class,
      slots: {
        core: { used: rig.equippedModules.core.length, max: rig.class.slots.core },
        memory: { used: rig.equippedModules.memory.length, max: rig.class.slots.memory },
        expansion: { used: rig.equippedModules.expansion.length, max: rig.class.slots.expansion },
      },
      equippedModules: rig.equippedModules,
      effectiveStats,
    };
  }

  // Switch to a different rig class
  async selectRig(rigId) {
    const newRig = getRigById(rigId);
    if (!newRig) {
      return { success: false, error: `Unknown rig class: ${rigId}` };
    }

    // Check if player can afford it
    if (this.state.player.credits < newRig.price) {
      return { success: false, error: `Insufficient credits. Need ${newRig.price} CR.` };
    }

    // Cannot switch while connected
    if (this.state.connection.active) {
      return { success: false, error: 'Cannot switch rig while connected to a target.' };
    }

    // Deduct credits
    this.state.player.credits -= newRig.price;

    // Unequip all modules (they go back to inventory)
    const oldModules = [
      ...this.state.player.rig.equippedModules.core,
      ...this.state.player.rig.equippedModules.memory,
      ...this.state.player.rig.equippedModules.expansion,
    ];

    // Set new rig
    this.state.player.rig = {
      class: newRig,
      equippedModules: {
        core: [],
        memory: [],
        expansion: [],
      },
    };

    // Recalculate hardware stats
    this.recalculateHardware();

    return {
      success: true,
      rig: newRig,
      unequippedModules: oldModules,
      message: `Switched to ${newRig.name}. Previous modules unequipped.`,
    };
  }

  // Equip a module to the rig
  equipModule(moduleId) {
    const module = getModuleById(moduleId);
    if (!module) {
      return { success: false, error: `Unknown module: ${moduleId}` };
    }

    const rig = this.state.player.rig;
    const slotType = module.slotType;
    const slots = rig.equippedModules[slotType];
    const maxSlots = rig.class.slots[slotType];

    if (slots.length >= maxSlots) {
      return { success: false, error: `No ${slotType} slots available (${slots.length}/${maxSlots}).` };
    }

    // Check CPU cost
    const currentCpuUsed = this.getTotalModuleCpuCost();
    if (currentCpuUsed + module.cpuCost > this.state.player.hardware.cpu) {
      return { success: false, error: `Insufficient CPU. Need ${module.cpuCost}, have ${this.state.player.hardware.cpu - currentCpuUsed} free.` };
    }

    // Check RAM cost
    const currentRamUsed = this.getTotalModuleRamCost();
    if (currentRamUsed + module.ramCost > this.state.player.hardware.ram) {
      return { success: false, error: `Insufficient RAM. Need ${module.ramCost}, have ${this.state.player.hardware.ram - currentRamUsed} free.` };
    }

    // Equip the module
    slots.push(module);
    this.recalculateHardware();

    return {
      success: true,
      module,
      message: `Equipped ${module.name} to ${slotType} slot.`,
    };
  }

  // Unequip a module from the rig
  unequipModule(moduleId) {
    const rig = this.state.player.rig;

    for (const slotType of ['core', 'memory', 'expansion']) {
      const slots = rig.equippedModules[slotType];
      const index = slots.findIndex(m => m.id === moduleId);

      if (index !== -1) {
        const module = slots.splice(index, 1)[0];
        this.recalculateHardware();
        return {
          success: true,
          module,
          message: `Unequipped ${module.name}.`,
        };
      }
    }

    return { success: false, error: `Module not equipped: ${moduleId}` };
  }

  // Get total CPU cost of all equipped modules
  getTotalModuleCpuCost() {
    const rig = this.state.player.rig;
    let total = 0;
    for (const slotType of ['core', 'memory', 'expansion']) {
      for (const mod of rig.equippedModules[slotType]) {
        total += mod.cpuCost || 0;
      }
    }
    return total;
  }

  // Get total RAM cost of all equipped modules
  getTotalModuleRamCost() {
    const rig = this.state.player.rig;
    let total = 0;
    for (const slotType of ['core', 'memory', 'expansion']) {
      for (const mod of rig.equippedModules[slotType]) {
        total += mod.ramCost || 0;
      }
    }
    return total;
  }

  // Recalculate hardware stats based on rig and modules
  recalculateHardware() {
    const rig = this.state.player.rig;
    const allModules = [
      ...rig.equippedModules.core,
      ...rig.equippedModules.memory,
      ...rig.equippedModules.expansion,
    ];
    const stats = calculateEffectiveStats(rig.class, allModules);

    this.state.player.hardware = {
      tier: rig.class.tier,
      name: rig.class.name,
      cpu: stats.cpu,
      ram: stats.ram,
      bandwidth: stats.bandwidth,
      traceResist: Math.round((stats.traceResist - 1) * 100),
      cpuUsed: this.getTotalModuleCpuCost(),
      ramUsed: this.getTotalModuleRamCost(),
      integrity: this.state.player.hardware?.integrity || 100,
    };

    // Update storage capacity based on rig
    this.updateStorageCapacity();
  }

  // === Local Storage Management ===

  updateStorageCapacity() {
    const rig = this.state.player.rig.class;
    let baseCapacity = 100; // Base 100 MB

    // Apply rig bonus (Mule has +100% inventory = +100% storage)
    const inventoryMultiplier = rig.bonuses.inventorySlots || 1.0;
    this.state.player.localStorage.capacity = Math.floor(baseCapacity * inventoryMultiplier);

    // Recalculate used space
    this.recalculateStorageUsed();
  }

  recalculateStorageUsed() {
    let used = 0;
    for (const file of this.state.player.localStorage.files) {
      used += file.size || 1;
    }
    for (const sw of this.state.player.localStorage.installedSoftware) {
      used += sw.size || 5;
    }
    this.state.player.localStorage.used = used;
  }

  getLocalFiles() {
    return this.state.player.localStorage.files;
  }

  getStorageInfo() {
    const storage = this.state.player.localStorage;
    return {
      capacity: storage.capacity,
      used: storage.used,
      free: storage.capacity - storage.used,
      files: storage.files,
      installedSoftware: storage.installedSoftware,
    };
  }

  addLocalFile(file) {
    const storage = this.state.player.localStorage;
    const fileSize = file.size || 1;

    if (storage.used + fileSize > storage.capacity) {
      return { success: false, error: 'Insufficient storage space.' };
    }

    // Check for duplicate filename
    const existing = storage.files.find(f => f.name === file.name);
    if (existing) {
      return { success: false, error: `File "${file.name}" already exists.` };
    }

    storage.files.push(file);
    storage.used += fileSize;

    return { success: true, message: `Saved ${file.name} (${fileSize} MB)` };
  }

  deleteLocalFile(filename) {
    const storage = this.state.player.localStorage;
    const index = storage.files.findIndex(f => f.name === filename);

    if (index === -1) {
      return { success: false, error: `File not found: ${filename}` };
    }

    const file = storage.files[index];
    storage.files.splice(index, 1);
    storage.used -= file.size || 1;

    return { success: true, message: `Deleted ${filename}` };
  }

  readLocalFile(filename) {
    const file = this.state.player.localStorage.files.find(f => f.name === filename);
    if (!file) {
      return { success: false, error: `File not found: ${filename}` };
    }
    return { success: true, file };
  }
}
