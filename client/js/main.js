import { Terminal } from './terminal.js';
import { Game } from './game.js';
import { NodeMap } from './nodeMap.js';
import { UI } from './ui.js';
import { MarketUI } from './market.js';
import { ContractUI } from './contracts.js';
import { SECTORS, SECURITY_ZONES, SOVEREIGNTY_STRUCTURES, HEAT_THRESHOLDS } from '../../shared/constants.js';

class App {
  constructor() {
    this.terminal = new Terminal();
    this.game = new Game();
    this.nodeMap = new NodeMap();
    this.ui = new UI();

    // Universe state (received from server)
    this.location = null;
    this.currentNetwork = null;
    this.resources = {};

    // DOM element cache for performance
    this.domCache = {};
    // Last known values to prevent redundant updates
    this.lastUI = {};

    this.init();
  }

  async init() {
    // Initialize components
    this.ui.init();
    this.terminal.init(this.handleCommand.bind(this), this.getFilesSuggestions.bind(this));
    this.nodeMap.init();

    // Connect to server
    await this.game.connect();

    // Show login screen (game starts hidden until authenticated)
    this.loginScreen = new window.LoginScreen(this.game);

    // Initialize Market UI
    this.marketUI = new MarketUI(this.game);

    // Initialize Contract UI
    this.contractUI = new ContractUI(this.game);

    // Display welcome message (will be shown after login)

    // Start game loop
    this.startGameLoop();

    // Setup action buttons
    this.setupActionButtons();

    // Setup hotkeys
    this.setupHotkeys();

    // Initialize sidebar with command handler
    this.ui.initSidebar((cmd) => this.handleCommand(cmd));

    // Initialize chat system
    this.initChat();
    // Initial sidebar status update
    this.updateSidebarStatus();
  }

  updateSidebarStatus() {
    // Update rig display
    const rigInfo = this.game.getRigInfo();
    const rig = rigInfo.class;
    const hw = this.game.state.player.hardware;

    // Rig name and specialty
    const rigNameEl = document.getElementById('rig-name');
    const rigSpecialtyEl = document.getElementById('rig-specialty');
    if (rigNameEl) rigNameEl.textContent = rig.name;
    if (rigSpecialtyEl) rigSpecialtyEl.textContent = rig.specialty;

    // Stats
    const rigCpuEl = document.getElementById('rig-cpu');
    const rigRamEl = document.getElementById('rig-ram');
    const rigBwEl = document.getElementById('rig-bw');
    const rigTraceEl = document.getElementById('rig-trace');
    if (rigCpuEl) rigCpuEl.textContent = `${hw.cpuUsed}/${hw.cpu}`;
    if (rigRamEl) rigRamEl.textContent = `${hw.ramUsed}/${hw.ram}`;
    if (rigBwEl) rigBwEl.textContent = hw.bandwidth;
    if (rigTraceEl) rigTraceEl.textContent = `${hw.traceResist}%`;

    // Slots
    const slotCoreEl = document.getElementById('slot-core');
    const slotMemEl = document.getElementById('slot-memory');
    const slotExpEl = document.getElementById('slot-expansion');
    if (slotCoreEl) slotCoreEl.textContent = `${rigInfo.slots.core.used}/${rigInfo.slots.core.max}`;
    if (slotMemEl) slotMemEl.textContent = `${rigInfo.slots.memory.used}/${rigInfo.slots.memory.max}`;
    if (slotExpEl) slotExpEl.textContent = `${rigInfo.slots.expansion.used}/${rigInfo.slots.expansion.max}`;

    // Equipped modules
    const modulesEl = document.getElementById('rig-modules');
    if (modulesEl) {
      modulesEl.innerHTML = '';
      const allMods = [
        ...rigInfo.equippedModules.core,
        ...rigInfo.equippedModules.memory,
        ...rigInfo.equippedModules.expansion,
      ];
      if (allMods.length === 0) {
        modulesEl.innerHTML = '<div class="rig-module-item" style="color:var(--text-dim)">No modules fitted</div>';
      } else {
        for (const mod of allMods) {
          const modEl = document.createElement('div');
          modEl.className = 'rig-module-item';
          modEl.textContent = mod.name;
          modulesEl.appendChild(modEl);
        }
      }
    }

    // Update integrity
    this.ui.updateRigStatus(this.game.state.player?.hardware?.integrity || 100);

    // Update resources
    this.ui.updateResources(this.game.state.player?.resources || {});

    // Update reputation
    const rep = this.game.state.player?.reputation || 0;
    const title = this.getRepTitle(rep);
    this.ui.updateReputation(rep, title);

    // Update heat
    const heat = this.game.state.player?.heat || 0;
    const tier = this.getHeatTier(heat);
    this.ui.updateHeatDisplay(heat, tier);

    // Update credits
    this.ui.updateCredits(this.game.state.player?.credits || 1000);

    // Update context actions based on game state
    if (this.game.state.connected) {
      this.ui.showContextActions('connected');
    } else if (this.game.state.atSafeHouse) {
      this.ui.showContextActions('safehouse');
    } else {
      this.ui.showContextActions(null);
    }
  }

  getRepTitle(rep) {
    if (rep >= 2500) return 'Legend';
    if (rep >= 1000) return 'Ghost';
    if (rep >= 500) return 'Netrunner';
    if (rep >= 300) return 'Elite Hacker';
    if (rep >= 150) return 'Hacker';
    if (rep >= 50) return 'Script Kiddie';
    if (rep >= 0) return 'Unknown';
    return 'Blacklisted';
  }

  getHeatTier(heat) {
    if (heat >= 80) return 'federal';
    if (heat >= 60) return 'hunted';
    if (heat >= 40) return 'hot';
    if (heat >= 20) return 'warm';
    return 'clean';
  }

  // Get files for autocomplete based on current context
  getFilesSuggestions(cmd) {
    // If connected, return remote files (for download command)
    if (this.game.state.connection.active) {
      const currentNode = this.game.getCurrentNode();
      if (currentNode && currentNode.files) {
        return currentNode.files;
      }
      return [];
    }

    // If not connected, return local files (for cat, rm)
    return this.game.getLocalFiles();
  }

  showWelcome() {
    const banner = `
 ██╗   ██╗██████╗ ██╗     ██╗███╗   ██╗██╗  ██╗
 ██║   ██║██╔══██╗██║     ██║████╗  ██║██║ ██╔╝
 ██║   ██║██████╔╝██║     ██║██╔██╗ ██║█████╔╝ 
 ██║   ██║██╔═══╝ ██║     ██║██║╚██╗██║██╔═██╗ 
 ╚██████╔╝██║     ███████╗██║██║ ╚████║██║  ██╗
  ╚═════╝ ╚═╝     ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
                                    v0.1.0`;

    this.terminal.printRaw(banner, 'success');
    this.terminal.print('');
    this.terminal.print('Welcome to UPLINK // Netrunner', 'info');
    this.terminal.print('Type "help" for available commands.', 'system');
    this.terminal.print('Type "location" to see where you are in the Grid.', 'system');
    this.terminal.print('');

    // Show initial location if available
    if (this.currentNetwork) {
      this.terminal.print(`Current Location: ${this.currentNetwork.zoneName} - ${this.currentNetwork.ip}`, 'system');
    }
  }

  // Called when we receive initial state from server
  onInitialState(data) {
    this.location = data.location;
    this.currentNetwork = data.currentNetwork;
    this.resources = data.resources || {};

    // Update UI
    this.updateLocationDisplay();
  }

  updateLocationDisplay() {
    if (!this.currentNetwork) return;

    const zoneIndicator = document.getElementById('zone-indicator');
    const sectorName = document.getElementById('sector-name');
    const networkIp = document.getElementById('network-ip');
    const securityLevel = document.getElementById('security-level');

    // Update zone indicator
    const zone = this.currentNetwork.zone;
    zoneIndicator.textContent = zone.toUpperCase();
    zoneIndicator.className = `zone-${zone}`;

    // Update sector name
    const sector = SECTORS[this.location?.sectorId?.toUpperCase()] || { name: 'Unknown Sector' };
    sectorName.textContent = sector.name || this.location?.sectorId || 'Unknown';

    // Update network IP
    networkIp.textContent = this.currentNetwork.ip;

    // Update security level with color
    const sec = this.currentNetwork.security;
    securityLevel.textContent = sec.toFixed(1);
    securityLevel.className = 'security-badge ' + (
      sec >= 0.5 ? 'sec-high' : sec >= 0.1 ? 'sec-med' : 'sec-low'
    );
  }

  async handleCommand(input) {
    const parts = input.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        this.cmdHelp(args);
        break;
      case 'register':
        await this.cmdRegister(args);
        break;
      case 'login':
        await this.cmdLogin(args);
        break;
      case 'clear':
        this.terminal.clear();
        break;
      case 'status':
        this.cmdStatus();
        break;
      case 'heat':
        this.cmdHeat();
        break;
      case 'scan':
        await this.cmdScan(args);
        break;
      case 'connect':
        await this.cmdConnect(args);
        break;
      case 'disconnect':
        this.cmdDisconnect();
        break;
      case 'move':
        this.cmdMove(args);
        break;
      case 'breach':
        await this.cmdBreach();
        break;
      case 'crack':
        await this.cmdCrack();
        break;
      case 'ls':
        this.cmdLs();
        break;
      case 'download':
        await this.cmdDownload(args);
        break;
      case 'storage':
        this.cmdStorage();
        break;
      case 'cat':
        this.cmdCat(args);
        break;
      case 'rm':
        this.cmdRm(args);
        break;
      case 'harvest':
        await this.cmdHarvest();
        break;
      case 'abort':
        this.cmdAbort();
        break;
      case 'clean':
        await this.cmdClean();
        break;
      case 'cloak':
        this.cmdCloak();
        break;
      case 'hardware':
        this.cmdHardware();
        break;
      case 'software':
        this.cmdSoftware();
        break;
      case 'contracts':
        this.cmdContracts();
        break;
      case 'shop':
        this.cmdShop();
        break;
      case 'tutorial':
        await this.cmdTutorial();
        break;
      case 'location':
        this.cmdLocation();
        break;
      case 'explore':
        await this.cmdExplore(args);
        break;
      case 'sectors':
        this.cmdSectors();
        break;
      case 'navigate':
      case 'jump':
        await this.cmdNavigate(args);
        break;
      case 'resources':
        this.cmdResources();
        break;
      case 'crew':
        await this.cmdCrew(args);
        break;
      case 'sov':
        await this.cmdSov(args);
        break;
      case 'siege':
        await this.cmdSiege(args);
        break;
      case 'map':
        this.cmdMap();
        break;
      case 'dock':
        await this.cmdDock();
        break;
      case 'undock':
        await this.cmdUndock();
        break;
      case 'hangar':
        await this.cmdHangar();
        break;
      case 'store':
        await this.cmdStore(args);
        break;
      case 'retrieve':
        await this.cmdRetrieve(args);
        break;
      case 'sethome':
        await this.cmdSetHome();
        break;
      case 'defend':
        await this.cmdDefend();
        break;
      case 'backtrace':
        await this.cmdBacktrace(args);
        break;
      case 'counterice':
        await this.cmdCounterIce(args);
        break;
      case 'lockdown':
        await this.cmdLockdown(args);
        break;
      case 'market':
        await this.cmdMarket(args);
        break;
      case 'sell':
        await this.cmdSell(args);
        break;
      case 'buy':
        await this.cmdBuy(args);
        break;
      case 'repair':
        await this.cmdRepair();
        break;
      case 'rig':
        await this.cmdRig(args);
        break;
      case 'rigs':
        this.cmdRigs();
        break;
      case 'fit':
        this.cmdFit(args);
        break;
      case 'unfit':
        this.cmdUnfit(args);
        break;
      case 'modules':
        this.cmdModules();
        break;
      case 'say':
        await this.cmdSay(args);
        break;
      case 'shout':
        await this.cmdShout(args);
        break;
      case 'rep':
        await this.cmdRep(args);
        break;
      case 'skills':
        await this.cmdSkills();
        break;
      case 'spec':
        await this.cmdSpec(args);
        break;
      default:
        this.terminal.print(`Unknown command: ${cmd}`, 'error');
        this.terminal.print('Type "help" for available commands.', 'system');
    }
  }

  cmdHelp(args) {
    if (args.length > 0) {
      const cmd = this.game.getCommandHelp(args[0]);
      if (cmd) {
        this.terminal.print(`${cmd.cmd} - ${cmd.desc}`, 'info');
        this.terminal.print(`Usage: ${cmd.usage}`, 'system');
      } else {
        this.terminal.print(`Unknown command: ${args[0]}`, 'error');
      }
      return;
    }

    this.terminal.print('=== AVAILABLE COMMANDS ===', 'info');
    this.terminal.print('');
    this.terminal.print('UNIVERSE:', 'warning');
    this.terminal.print('  location       - Show current location in Grid', 'system');
    this.terminal.print('  sectors        - List all sectors', 'system');
    this.terminal.print('  explore [sec]  - Explore cluster or sector', 'system');
    this.terminal.print('  navigate <id>  - Navigate to network', 'system');
    this.terminal.print('  map            - Show cluster network map', 'system');
    this.terminal.print('');
    this.terminal.print('HACKING:', 'warning');
    this.terminal.print('  scan <ip>      - Scan target server', 'system');
    this.terminal.print('  connect <ip>   - Connect to server', 'system');
    this.terminal.print('  disconnect     - Clean disconnect', 'system');
    this.terminal.print('  move <node>    - Move to node', 'system');
    this.terminal.print('  breach         - Breach current node ICE', 'system');
    this.terminal.print('  crack          - Crack password', 'system');
    this.terminal.print('  download <f>   - Download file', 'system');
    this.terminal.print('  harvest        - Harvest resources', 'system');
    this.terminal.print('  clean          - Clean logs', 'system');
    this.terminal.print('');
    this.terminal.print('DEFENSE:', 'warning');
    this.terminal.print('  cloak          - Activate proxy chain', 'system');
    this.terminal.print('  abort          - Emergency disconnect', 'system');
    this.terminal.print('');
    this.terminal.print('INFO:', 'warning');
    this.terminal.print('  status         - Current status', 'system');
    this.terminal.print('  resources      - View harvested resources', 'system');
    this.terminal.print('  crew           - Manage your organization', 'system');
    this.terminal.print('  sov            - Sovereignty management', 'system');
    this.terminal.print('  siege          - Attack structures', 'system');
    this.terminal.print('  hardware       - View hardware', 'system');
    this.terminal.print('  software       - View programs', 'system');
    this.terminal.print('  contracts      - View jobs', 'system');
    this.terminal.print('  shop           - Black market', 'system');
  }

  cmdRegister(args) {
    if (args.length < 2) {
      this.terminal.print('Usage: register <username> <password>', 'error');
      return;
    }
    const [username, password] = args;
    this.terminal.print('Registering user...', 'system');

    this.game.register(username, password).then(result => {
      if (result.error) {
        this.terminal.print(`Registration failed: ${result.error}`, 'error');
      } else {
        this.terminal.print(`Successfully registered as ${username}.`, 'success');
        this.terminal.print('Initial save state created.', 'info');
      }
    });
  }

  cmdLogin(args) {
    if (args.length < 2) {
      this.terminal.print('Usage: login <username> <password>', 'error');
      return;
    }
    const [username, password] = args;
    this.terminal.print('Logging in...', 'system');

    this.game.login(username, password).then(result => {
      if (result.error) {
        this.terminal.print(`Login failed: ${result.error}`, 'error');
      } else {
        this.terminal.print(`Welcome back, ${username}.`, 'success');
        this.terminal.print('System state restored.', 'info');
      }
    });
  }

  cmdStatus() {
    const state = this.game.state;
    this.terminal.print('=== STATUS ===', 'info');
    this.terminal.print(`Credits: ${state.player.credits} CR`, 'system');
    this.terminal.print(`Reputation: ${state.player.reputation}`, 'system');
    this.terminal.print(`Heat: ${state.player.heat}%`, state.player.heat > 50 ? 'warning' : 'system');
    this.terminal.print(`Faction: ${state.player.faction || 'None'}`, 'system');

    if (state.connection.active) {
      this.terminal.print('', '');
      this.terminal.print('=== CONNECTION ===', 'warning');
      this.terminal.print(`Target: ${state.connection.targetIp}`, 'system');
      this.terminal.print(`Current Node: ${state.connection.currentNode}`, 'system');
      this.terminal.print(`Trace: ${state.connection.trace.toFixed(1)}%`,
        state.connection.trace > 70 ? 'error' : state.connection.trace > 40 ? 'warning' : 'system');
    }
  }

  cmdHeat() {
    const heatInfo = this.game.getHeatInfo();
    const heatClass = heatInfo.heat >= 80 ? 'error' : heatInfo.heat >= 50 ? 'warning' : heatInfo.heat >= 30 ? 'warning' : 'success';

    this.terminal.print('=== HEAT STATUS ===', 'info');
    this.terminal.print('');
    this.terminal.print(`Current Heat: ${heatInfo.heat.toFixed(1)}%`, heatClass);
    this.terminal.print(`Threat Level: ${heatInfo.tier}`, heatClass);
    this.terminal.print(`${heatInfo.description}`, 'system');

    if (heatInfo.nextTierAt) {
      this.terminal.print(`Next threshold at: ${heatInfo.nextTierAt}%`, 'system');
    }

    this.terminal.print('');

    // Show active effects
    const effects = heatInfo.effects || {};
    const effectsList = Object.keys(effects);

    if (effectsList.length > 0) {
      this.terminal.print('Active Penalties:', 'warning');
      if (effects.scanSpeedMultiplier) {
        this.terminal.print(`  • Scan Speed: ${effects.scanSpeedMultiplier}x slower`, 'system');
      }
      if (effects.traceRateMultiplier) {
        this.terminal.print(`  • Trace Rate: ${effects.traceRateMultiplier}x faster`, 'system');
      }
      if (effects.autoBounty) {
        this.terminal.print(`  • Active Bounty: ${effects.bountyAmount} CR`, 'warning');
      }
      if (effects.hunterIceEnabled) {
        this.terminal.print(`  • Hunter ICE may spawn during hacks`, 'error');
      }
      if (effects.clearnetBanned) {
        this.terminal.print(`  • BANNED from ClearNet zones`, 'error');
      }
      if (effects.raidTimer) {
        this.terminal.print(`  • Federal raid in ${effects.raidTimer}s if heat maintained`, 'error');
      }
    } else {
      this.terminal.print('No active penalties. You are operating clean.', 'success');
    }

    this.terminal.print('');
    this.terminal.print('Heat decays slowly when not connected.', 'system');
    this.terminal.print('Use "clean" command before disconnecting to reduce heat gain.', 'system');
  }

  async cmdScan(args) {
    if (args.length === 0) {
      this.terminal.print('Usage: scan <ip>', 'error');
      return;
    }

    const ip = args[0];
    this.terminal.print(`Scanning ${ip}...`, 'system');

    const result = await this.game.scanTarget(ip);

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print('', '');
    this.terminal.print(`=== SCAN RESULTS: ${ip} ===`, 'info');
    this.terminal.print(`Owner: ${result.owner}`, 'system');
    this.terminal.print(`Security Rating: ${result.securityRating}`,
      result.securityRating === 'HIGH' ? 'error' : result.securityRating === 'MEDIUM' ? 'warning' : 'system');
    this.terminal.print(`Nodes Detected: ${result.nodeCount}`, 'system');
    this.terminal.print(`ICE Detected: ${result.iceCount}`, 'system');
    this.terminal.print('', '');
    this.terminal.print('Network topology mapped. Use "connect" to infiltrate.', 'success');
  }

  async cmdConnect(args) {
    if (args.length === 0) {
      this.terminal.print('Usage: connect <ip>', 'error');
      return;
    }

    const ip = args[0];
    this.terminal.print(`Establishing connection to ${ip}...`, 'system');

    const result = await this.game.connectToTarget(ip);

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print('Connection established.', 'success');
    this.terminal.print(`Entered via: ${result.entryNode}`, 'system');
    this.terminal.print('TRACE INITIATED - Work fast.', 'warning');

    // Update node map
    this.nodeMap.setNetwork(result.network);
    this.nodeMap.setCurrentNode(result.entryNode);

    // Update UI
    this.ui.setConnected(true, ip);
  }

  cmdDisconnect() {
    if (!this.game.state.connection.active) {
      this.terminal.print('Not connected to any server.', 'error');
      return;
    }

    const result = this.game.disconnect(false);
    this.terminal.print('Disconnecting...', 'system');

    if (result.logsCleaned) {
      this.terminal.print('Logs cleaned. Trace evidence removed.', 'success');
    } else {
      this.terminal.print('WARNING: Logs not cleaned. Trace evidence remains.', 'warning');
    }

    this.terminal.print('Connection closed.', 'system');
    this.nodeMap.clear();
    this.ui.setConnected(false);
  }

  cmdMove(args) {
    if (!this.game.state.connection.active) {
      this.terminal.print('Not connected to any server.', 'error');
      return;
    }

    if (args.length === 0) {
      this.terminal.print('Usage: move <node_id>', 'error');
      this.terminal.print('Available nodes:', 'system');
      const adjacent = this.game.getAdjacentNodes();
      adjacent.forEach(n => {
        this.terminal.print(`  ${n.id} - ${n.type} ${n.ice ? '[ICE]' : ''} ${n.breached ? '[BREACHED]' : ''}`, 'system');
      });
      return;
    }

    const nodeId = args[0];
    const result = this.game.moveToNode(nodeId);

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print(`Moved to ${result.node.type} node.`, 'success');
    this.nodeMap.setCurrentNode(nodeId);

    if (result.node.ice && !result.node.breached) {
      this.terminal.print(`ICE detected: ${result.node.ice.name}`, 'warning');
      this.terminal.print('Use "breach" to bypass.', 'system');
    }

    if (result.node.files && result.node.files.length > 0) {
      this.terminal.print(`Files detected: ${result.node.files.length}`, 'info');
    }

    if (result.node.resources && result.node.resources.length > 0) {
      this.terminal.print(`Resources detected: ${result.node.resources.length} types`, 'success');
      this.terminal.print('Use "harvest" to collect.', 'system');
    }
  }

  async cmdBreach() {
    if (!this.game.state.connection.active) {
      this.terminal.print('Not connected to any server.', 'error');
      return;
    }

    const currentNode = this.game.getCurrentNode();
    if (!currentNode.ice) {
      this.terminal.print('No ICE to breach on this node.', 'system');
      return;
    }

    if (currentNode.breached) {
      this.terminal.print('Node already breached.', 'system');
      return;
    }

    this.terminal.print(`Breaching ${currentNode.ice.name}...`, 'system');

    const result = await this.game.breachNode();

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    if (result.success) {
      this.terminal.print('ICE breached successfully!', 'success');
      this.nodeMap.updateNode(currentNode.id, { breached: true });
    } else {
      this.terminal.print('Breach failed. ICE too strong.', 'error');
      if (result.damage) {
        this.terminal.print(`Hardware damage taken: ${result.damage}`, 'error');
      }
    }
  }

  async cmdCrack() {
    if (!this.game.state.connection.active) {
      this.terminal.print('Not connected to any server.', 'error');
      return;
    }

    const currentNode = this.game.getCurrentNode();
    if (!currentNode.password) {
      this.terminal.print('No password protection on this node.', 'system');
      return;
    }

    if (currentNode.cracked) {
      this.terminal.print('Password already cracked.', 'system');
      return;
    }

    this.terminal.print('Running password cracker...', 'system');

    // Animate cracking
    for (let i = 0; i < 5; i++) {
      await this.delay(300);
      this.terminal.print(`Attempting combination ${Math.random().toString(36).substr(2, 8)}...`, 'system');
    }

    const result = await this.game.crackPassword();

    if (result.success) {
      this.terminal.print('Password cracked!', 'success');
      this.nodeMap.updateNode(currentNode.id, { cracked: true });
    } else {
      this.terminal.print('Crack failed. Stronger cracker needed.', 'error');
    }
  }

  cmdLs() {
    // When not connected, show local files
    if (!this.game.state.connection.active) {
      const storageInfo = this.game.getStorageInfo();
      const files = storageInfo.files;

      this.terminal.print('═══════════════════════════════════════', 'info');
      this.terminal.print(`  LOCAL STORAGE [${storageInfo.used}/${storageInfo.capacity} MB]`, 'highlight');
      this.terminal.print('═══════════════════════════════════════', 'info');

      if (files.length === 0) {
        this.terminal.print('  No files.', 'system');
      } else {
        for (const f of files) {
          const size = `${f.size || 1} MB`.padStart(8);
          const type = f.type ? `[${f.type.toUpperCase()}]` : '';
          this.terminal.print(`  ${f.name.padEnd(25)} ${size} ${type}`, 'system');
        }
      }

      this.terminal.print('', 'system');
      this.terminal.print('Commands: cat <file> | rm <file> | storage', 'info');
      return;
    }

    // When connected, show remote server files
    const currentNode = this.game.getCurrentNode();
    const files = currentNode.files || [];

    if (files.length === 0) {
      this.terminal.print('No files on this node.', 'system');
      return;
    }

    this.terminal.print('=== FILES ===', 'info');
    files.forEach(f => {
      const encrypted = f.encrypted ? ' [ENCRYPTED]' : '';
      const size = this.formatSize(f.size);
      this.terminal.print(`  ${f.name.padEnd(30)} ${size.padStart(10)}${encrypted}`, 'system');
    });
  }

  async cmdDownload(args) {
    if (!this.game.state.connection.active) {
      this.terminal.print('Not connected to any server.', 'error');
      return;
    }

    if (args.length === 0) {
      this.terminal.print('Usage: download <filename>', 'error');
      return;
    }

    const filename = args[0];
    const currentNode = this.game.getCurrentNode();
    const file = (currentNode.files || []).find(f => f.name === filename);

    if (!file) {
      this.terminal.print(`File not found: ${filename}`, 'error');
      return;
    }

    this.terminal.print(`Downloading ${filename}...`, 'system');

    const result = await this.game.downloadFile(filename);

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print(`Downloaded: ${filename} (${this.formatSize(file.size)})`, 'success');
    if (result.credits) {
      this.terminal.print(`Value: ${result.credits} CR`, 'success');
    }

    // Save to local storage
    const saveResult = this.game.addLocalFile({
      name: filename,
      size: Math.ceil(file.size / 1024 / 1024) || 1, // Convert to MB
      type: file.encrypted ? 'encrypted' : 'data',
      content: file.content || '[binary data]',
      source: this.game.state.connection.targetIp,
    });

    if (saveResult.success) {
      this.terminal.print(`Saved to local storage.`, 'system');
    } else {
      this.terminal.print(`Warning: ${saveResult.error}`, 'warning');
    }
  }

  cmdStorage() {
    const info = this.game.getStorageInfo();
    const usagePercent = Math.round((info.used / info.capacity) * 100);
    const barWidth = 30;
    const filledWidth = Math.round((info.used / info.capacity) * barWidth);
    const bar = '█'.repeat(filledWidth) + '░'.repeat(barWidth - filledWidth);

    this.terminal.print('═══════════════════════════════════════', 'info');
    this.terminal.print('  LOCAL STORAGE', 'highlight');
    this.terminal.print('═══════════════════════════════════════', 'info');
    this.terminal.print(`  [${bar}] ${usagePercent}%`, usagePercent > 80 ? 'warning' : 'system');
    this.terminal.print(`  Used: ${info.used} MB / ${info.capacity} MB`, 'system');
    this.terminal.print(`  Free: ${info.free} MB`, info.free < 20 ? 'warning' : 'success');
    this.terminal.print('', 'system');
    this.terminal.print(`  Files: ${info.files.length}`, 'system');
    this.terminal.print(`  Software: ${info.installedSoftware.length}`, 'system');
    this.terminal.print('', 'system');
    this.terminal.print('Commands: ls | cat <file> | rm <file>', 'info');
  }

  cmdCat(args) {
    if (args.length === 0) {
      this.terminal.print('Usage: cat <filename>', 'error');
      return;
    }

    const filename = args[0];

    // Check if connected - then cat remote file
    if (this.game.state.connection.active) {
      const currentNode = this.game.getCurrentNode();
      const file = (currentNode.files || []).find(f => f.name === filename);
      if (!file) {
        this.terminal.print(`File not found: ${filename}`, 'error');
        return;
      }
      if (file.encrypted) {
        this.terminal.print(`Cannot read encrypted file. Use decryptor.`, 'warning');
        return;
      }
      this.terminal.print(`=== ${filename} ===`, 'info');
      this.terminal.print(file.content || '[binary data]', 'system');
      return;
    }

    // Not connected - cat local file
    const result = this.game.readLocalFile(filename);
    if (!result.success) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print(`=== ${filename} ===`, 'info');
    this.terminal.print(result.file.content || '[binary data]', 'system');
  }

  cmdRm(args) {
    if (args.length === 0) {
      this.terminal.print('Usage: rm <filename>', 'error');
      return;
    }

    const filename = args[0];

    // Only works on local files when not connected
    if (this.game.state.connection.active) {
      this.terminal.print('Cannot delete local files while connected. Disconnect first.', 'warning');
      return;
    }

    // Protect system files
    if (filename === 'config.sys') {
      this.terminal.print('Cannot delete system files.', 'error');
      return;
    }

    const result = this.game.deleteLocalFile(filename);
    if (!result.success) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print(result.message, 'success');
  }

  async cmdHarvest() {
    if (!this.game.state.connection.active) {
      this.terminal.print('Not connected to any server.', 'error');
      return;
    }

    this.terminal.print('Harvesting resources...', 'system');

    const result = await this.game.harvestResources();

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    if (result.success) {
      result.harvested.forEach(res => {
        this.terminal.print(`Harvested: ${res.amount}x ${res.type.replace('_', ' ').toUpperCase()}`, 'success');
      });
      // Update local resources display
      this.resources = this.game.state.player.resources;
    }
  }

  cmdAbort() {
    if (!this.game.state.connection.active) {
      this.terminal.print('Not connected to any server.', 'error');
      return;
    }

    this.terminal.print('EMERGENCY DISCONNECT', 'error');
    this.terminal.print('WARNING: Logs not cleaned. Trace remains active.', 'warning');

    const result = this.game.disconnect(true);

    this.terminal.print(`Heat increased by ${result.heatGained}%`, 'warning');
    this.nodeMap.clear();
    this.ui.setConnected(false);
  }

  async cmdClean() {
    if (!this.game.state.connection.active) {
      this.terminal.print('Not connected to any server.', 'error');
      return;
    }

    this.terminal.print('Cleaning logs...', 'system');

    const result = await this.game.cleanLogs();

    if (result.success) {
      this.terminal.print(`Logs cleaned (${result.effectiveness}% effective)`, 'success');
    } else {
      this.terminal.print('Log cleaner not installed.', 'error');
    }
  }

  cmdCloak() {
    const result = this.game.activateCloak();

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    if (result.active) {
      this.terminal.print(`Proxy chain activated. Routing through ${result.proxies} proxies.`, 'success');
      this.terminal.print(`Trace reduction: ${result.traceReduction}%`, 'system');
    } else {
      this.terminal.print('Proxy chain not installed.', 'error');
    }
  }

  cmdHardware() {
    const hw = this.game.state.player.hardware;
    this.terminal.print('=== HARDWARE ===', 'info');
    this.terminal.print(`Tier: ${hw.tier} - ${hw.name}`, 'system');
    this.terminal.print(`CPU: ${hw.cpuUsed}/${hw.cpu} cores`, 'system');
    this.terminal.print(`RAM: ${hw.ramUsed}/${hw.ram} MB`, 'system');
    this.terminal.print(`Bandwidth: ${hw.bandwidth} Mb/s`, 'system');
    this.terminal.print(`Trace Resist: ${hw.traceResist}%`, 'system');
    this.terminal.print(`Integrity: ${hw.integrity}%`, hw.integrity < 50 ? 'warning' : 'system');
  }

  cmdSoftware() {
    const software = this.game.state.player.software;
    this.terminal.print('=== INSTALLED SOFTWARE ===', 'info');

    if (software.length === 0) {
      this.terminal.print('No software installed.', 'system');
      return;
    }

    software.forEach(s => {
      this.terminal.print(`  ${s.name} v${s.level} - CPU: ${s.cpuCost} RAM: ${s.ramCost}MB`, 'system');
    });
  }

  cmdContracts() {
    // Open interactive contract board UI
    if (this.contractUI) {
      this.contractUI.open();
      return;
    }

    // Fallback to terminal
    this.terminal.print('Contract board not available.', 'error');
  }

  cmdShop() {
    this.terminal.print('=== BLACK MARKET ===', 'info');
    this.terminal.print('', '');
    this.terminal.print('HARDWARE:', 'warning');
    this.terminal.print('  Use "upgrade <component>" to upgrade hardware', 'system');
    this.terminal.print('', '');
    this.terminal.print('SOFTWARE:', 'warning');

    const available = this.game.getAvailableSoftware();
    available.forEach(s => {
      this.terminal.print(`  [${s.id}] ${s.name} v${s.level} - ${s.price} CR`, 'system');
    });

    this.terminal.print('', '');
    this.terminal.print('Use "buy <id>" to purchase.', 'system');
  }

  async cmdTutorial() {
    this.terminal.print('=== TUTORIAL: BASIC INFILTRATION ===', 'info');
    this.terminal.print('', '');
    this.terminal.print('Welcome, runner. Time to learn the basics.', 'system');
    await this.delay(1000);

    this.terminal.print('', '');
    this.terminal.print('STEP 1: Scan your target', 'warning');
    this.terminal.print('Every hack starts with reconnaissance.', 'system');
    this.terminal.print('Try: scan 10.0.0.1', 'info');
    await this.delay(500);

    // Generate tutorial server
    this.game.generateTutorialServer();
  }

  startGameLoop() {
    setInterval(() => {
      this.game.update();
      this.updateUI();
    }, 100);
  }

  updateUI() {
    const state = this.game.state;

    // Cache DOM elements on first call
    if (!this.domCache.credits) {
      this.domCache = {
        credits: document.getElementById('credits'),
        reputation: document.getElementById('reputation'),
        heat: document.getElementById('heat'),
        traceFill: document.getElementById('trace-fill'),
        tracePercent: document.getElementById('trace-percent'),
        cpuUsage: document.getElementById('cpu-usage'),
        ramUsage: document.getElementById('ram-usage'),
        bandwidth: document.getElementById('bandwidth'),
        clock: document.getElementById('clock'),
      };
    }

    // Update only changed values
    if (this.lastUI.credits !== state.player.credits) {
      this.domCache.credits.textContent = state.player.credits;
      this.lastUI.credits = state.player.credits;
    }

    if (this.lastUI.reputation !== state.player.reputation) {
      this.domCache.reputation.textContent = state.player.reputation;
      this.lastUI.reputation = state.player.reputation;
    }

    const heatText = `${state.player.heat.toFixed(2)}%`;
    const heatClass = `value ${state.player.heat > 70 ? 'heat-high' : state.player.heat > 40 ? 'heat-med' : 'heat-low'}`;
    if (this.lastUI.heat !== heatText) {
      this.domCache.heat.textContent = heatText;
      this.domCache.heat.className = heatClass;
      this.lastUI.heat = heatText;
    }

    // Update trace bar if connected
    if (state.connection.active) {
      const trace = state.connection.trace;
      const traceText = `${trace.toFixed(2)}%`;
      if (this.lastUI.trace !== traceText) {
        this.domCache.traceFill.style.width = `${trace}%`;
        this.domCache.tracePercent.textContent = traceText;
        this.lastUI.trace = traceText;
      }

      if (trace >= 100) {
        this.onTraceComplete();
      }
    }

    // Update hardware status (less frequent, check every 5th update)
    if (!this.uiFrameCount) this.uiFrameCount = 0;
    this.uiFrameCount++;

    if (this.uiFrameCount % 5 === 0) {
      const hw = state.player.hardware;
      this.domCache.cpuUsage.textContent = `${hw.cpuUsed}/${hw.cpu}`;
      this.domCache.ramUsage.textContent = `${hw.ramUsed}/${hw.ram}MB`;
      this.domCache.bandwidth.textContent = `${hw.bandwidth}Mb/s`;
    }

    // Update clock every second (10 frames at 100ms)
    if (this.uiFrameCount % 10 === 0) {
      const now = new Date();
      this.domCache.clock.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    }
  }

  onTraceComplete() {
    if (this.game.state.connection.active) {
      this.terminal.print('', '');
      this.terminal.print('!!! TRACE COMPLETE !!!', 'error');
      this.terminal.print('Your IP has been logged. Connection terminated.', 'error');

      const result = this.game.onTraced();
      this.terminal.print(`Heat increased by ${result.heatGained}%`, 'warning');

      this.nodeMap.clear();
      this.ui.setConnected(false);
    }
  }

  setupActionButtons() {
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.dataset.cmd;
        this.terminal.executeCommand(cmd);
      });
    });
  }

  setupHotkeys() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger if typing in input
      if (document.activeElement === document.getElementById('terminal-input')) {
        if (e.key === 'Escape') {
          this.terminal.executeCommand('abort');
        }
        return;
      }

      const hotkeys = {
        '1': 'scan',
        '2': 'connect',
        '3': 'breach',
        '4': 'download',
        '5': 'crack',
        'c': 'cloak',
        'x': 'clean',
        'Escape': 'abort',
      };

      if (hotkeys[e.key]) {
        e.preventDefault();
        this.terminal.executeCommand(hotkeys[e.key]);
      }
    });
  }

  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // === NEW UNIVERSE COMMANDS ===

  cmdLocation() {
    if (!this.currentNetwork) {
      this.terminal.print('Location data not available.', 'error');
      return;
    }

    const net = this.currentNetwork;
    const loc = this.location;
    const sector = SECTORS[loc?.sectorId?.toUpperCase()];
    const zone = SECURITY_ZONES[net.zone?.toUpperCase()];

    this.terminal.print('=== CURRENT LOCATION ===', 'info');
    this.terminal.print('');
    this.terminal.print(`Zone: ${net.zoneName || net.zone}`, net.zone === 'clearnet' ? 'success' : net.zone === 'greynet' ? 'warning' : 'error');
    this.terminal.print(`Sector: ${sector?.name || loc?.sectorId || 'Unknown'}`, 'system');
    this.terminal.print(`Cluster: ${loc?.clusterId || 'Unknown'}`, 'system');
    this.terminal.print(`Network: ${net.ip}`, 'system');
    this.terminal.print(`Security Level: ${net.security?.toFixed(1) || '?'}`, 'system');
    this.terminal.print(`Owner: ${net.owner || 'Unknown'}`, 'system');
    this.terminal.print('');

    if (zone) {
      this.terminal.print('Zone Rules:', 'warning');
      this.terminal.print(`  Player Attack: ${zone.rules.canAttackPlayers ? 'ALLOWED' : 'FORBIDDEN'}`, 'system');
      this.terminal.print(`  Sentinel Response: ${zone.rules.sentinelResponse ? `${zone.rules.sentinelDelay}s` : 'NONE'}`, 'system');
      this.terminal.print(`  Reward Multiplier: ${zone.rules.rewardMultiplier}x`, 'system');
    }
  }

  cmdSectors() {
    this.terminal.print('=== THE GRID - SECTORS ===', 'info');
    this.terminal.print('');

    for (const [key, sector] of Object.entries(SECTORS)) {
      const zoneColor = sector.zone === 'CLEARNET' ? 'success' : sector.zone === 'GREYNET' ? 'warning' : 'error';
      const current = this.location?.sectorId?.toUpperCase() === key ? ' [CURRENT]' : '';

      this.terminal.print(`${sector.name}${current}`, zoneColor);
      this.terminal.print(`  Zone: ${sector.zone} | Security: ${sector.securityRange[0].toFixed(1)} to ${sector.securityRange[1].toFixed(1)}`, 'system');
      this.terminal.print(`  ${sector.description}`, 'dim');
      this.terminal.print('');
    }

    this.terminal.print('Use "explore <sector_name>" to view clusters.', 'system');
  }

  async cmdExplore(args) {
    if (args.length > 0) {
      // Explore specific sector
      const sectorName = args.join('_').toLowerCase();
      this.terminal.print(`Exploring sector: ${sectorName}...`, 'system');
      // TODO: Send EXPLORE message to server
      this.terminal.print('Sector exploration coming soon.', 'warning');
      return;
    }

    // Explore current cluster
    this.terminal.print('=== CLUSTER NETWORKS ===', 'info');
    this.terminal.print(`Cluster: ${this.location?.clusterId || 'Unknown'}`, 'system');
    this.terminal.print('');

    // For now, show placeholder - this would come from server
    this.terminal.print('Network exploration requires server connection.', 'warning');
    this.terminal.print('Use "navigate <network_id>" to move between networks.', 'system');
  }

  async cmdNavigate(args) {
    if (args.length === 0) {
      this.terminal.print('Usage: navigate <network_id>', 'error');
      this.terminal.print('Use "explore" to see available networks.', 'system');
      return;
    }

    const targetId = args[0];
    this.terminal.print(`Plotting route to ${targetId}...`, 'system');

    // TODO: Send NAVIGATE message to server
    this.terminal.print('Network navigation requires server connection.', 'warning');
  }

  cmdResources() {
    this.terminal.print('=== RESOURCES ===', 'info');
    this.terminal.print('');

    const resources = this.resources || this.game.state?.player?.resources || {};

    const resourceNames = {
      data_packets: 'Data Packets',
      bandwidth_tokens: 'Bandwidth',
      encryption_keys: 'Enc. Keys',
      access_tokens: 'Access Tokens',
      zero_days: 'Zero-Days',
      quantum_cores: 'Quantum Cores',
    };

    let hasResources = false;
    for (const [key, amount] of Object.entries(resources)) {
      if (amount > 0) {
        hasResources = true;
        const name = resourceNames[key] || key;
        this.terminal.print(`  ${name.padEnd(16)} ${amount}`, amount > 0 ? 'success' : 'system');
      }
    }

    if (!hasResources) {
      this.terminal.print('No resources harvested yet.', 'system');
      this.terminal.print('Hack into networks and use "harvest" on resource nodes.', 'system');
    }
  }

  async cmdCrew(args) {
    if (args.length === 0) {
      this.terminal.print('Usage: crew <action> [args]', 'error');
      this.terminal.print('Actions:', 'system');
      this.terminal.print('  create <name>  - Create a new crew (1000 CR)', 'system');
      this.terminal.print('  info           - View current crew info', 'system');
      this.terminal.print('  leave          - Leave current crew', 'system');
      return;
    }

    const action = args[0].toLowerCase();

    switch (action) {
      case 'create':
        if (args.length < 2) {
          this.terminal.print('Usage: crew create <name>', 'error');
          return;
        }
        const name = args.slice(1).join(' ');
        this.terminal.print(`Creating crew "${name}"...`, 'system');

        const createResult = await this.game.createCrew(name);
        if (createResult.error) {
          this.terminal.print(createResult.error, 'error');
        } else {
          this.terminal.print(`Crew "${name}" created successfully.`, 'success');
        }
        break;

      case 'info':
        const infoResult = await this.game.getCrewInfo();
        if (infoResult.error) {
          this.terminal.print(infoResult.error, 'error');
          return;
        }

        const crew = infoResult.info;
        this.terminal.print(`=== ${crew.name} ===`, 'info');
        this.terminal.print(`Type: ${crew.type}`, 'system');
        this.terminal.print(`Leader ID: ${crew.leader}`, 'system');
        this.terminal.print(`Treasury: ${crew.treasury} CR`, 'success');
        this.terminal.print('');
        this.terminal.print('Members:', 'warning');
        crew.members.forEach(m => {
          this.terminal.print(`  ${m.name} [${m.role}]`, 'system');
        });
        break;

      case 'leave':
        this.terminal.print('Leaving crew...', 'system');
        const leaveResult = await this.game.leaveCrew();
        if (leaveResult.error) {
          this.terminal.print(leaveResult.error, 'error');
        } else {
          this.terminal.print('You have left the organization.', 'success');
        }
        break;

      default:
        this.terminal.print(`Unknown crew action: ${action}`, 'error');
    }
  }

  async cmdSov(args) {
    if (args.length === 0) {
      this.terminal.print('Usage: sov <action> [args]', 'error');
      this.terminal.print('Actions:', 'system');
      this.terminal.print('  status         - View local sovereignty status', 'system');
      this.terminal.print('  list           - List available structures', 'system');
      this.terminal.print('  deploy <type>  - Deploy a structure', 'system');
      return;
    }

    const action = args[0].toLowerCase();

    switch (action) {
      case 'status':
        const status = await this.game.getSovereigntyStatus();
        if (status.error) {
          this.terminal.print(status.error, 'error');
          return;
        }
        this.terminal.print(`=== SOVEREIGNTY STATUS: ${status.network} ===`, 'info');
        this.terminal.print(`Zone: ${status.zone.toUpperCase()}`, 'system');
        this.terminal.print(`Sovereignty: ${status.sovereignty}`, status.sovereignty === 'UNCLAIMED' ? 'system' : 'warning');
        this.terminal.print('');
        this.terminal.print('Structures:', 'warning');
        if (status.structures.length === 0) {
          this.terminal.print('  No structures deployed.', 'system');
        } else {
          status.structures.forEach(s => {
            this.terminal.print(`  ${s.name} [${s.status}] - HP: ${s.health}`, 'success');
          });
        }
        break;

      case 'list':
        this.terminal.print('=== AVAILABLE STRUCTURES ===', 'info');
        Object.entries(SOVEREIGNTY_STRUCTURES).forEach(([key, s]) => {
          this.terminal.print(`${s.name} (${key})`, 'warning');
          this.terminal.print(`  Cost: ${s.deployCost} CR`, 'system');
          this.terminal.print(`  Zone: ${s.requiresZone || 'Any'}`, 'system');
          this.terminal.print(`  Org: ${s.requiresOrg.toUpperCase()}`, 'system');
          this.terminal.print(`  ${s.description}`, 'dim');
          this.terminal.print('');
        });
        break;

      case 'deploy':
        if (args.length < 2) {
          this.terminal.print('Usage: sov deploy <type>', 'error');
          return;
        }
        const type = args[1].toUpperCase();
        this.terminal.print(`Initiating deployment: ${type}...`, 'system');

        const result = await this.game.deployStructure(type);
        if (result.error) {
          this.terminal.print(result.error, 'error');
        } else {
          this.terminal.print('Structure deployed successfully.', 'success');
          this.terminal.print(`Online: ${result.structure.name}`, 'success');
        }
        break;

      default:
        this.terminal.print(`Unknown sovereignty action: ${action}`, 'error');
    }
  }

  async cmdSiege(args) {
    if (args.length === 0) {
      this.terminal.print('Usage: siege <structure_id>', 'error');
      return;
    }

    const structureId = args[0];
    this.terminal.print(`Initiating siege on ${structureId}...`, 'warning');

    const result = await this.game.siegeStructure(structureId);

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print('SIEGE LINK ESTABLISHED', 'warning');
    this.terminal.print(`Target: ${result.structure.name}`, 'system');
    this.terminal.print(`Time to Reinforce: ${result.duration}s`, 'warning');
    this.terminal.print('Maintain connection to progress hack.', 'system');
    this.terminal.print('WARNING: Defenders have been alerted.', 'error');
  }

  cmdMap() {
    if (!this.location) {
      this.terminal.print('Map data not available.', 'error');
      return;
    }

    this.terminal.print('=== CLUSTER MAP ===', 'info');
    this.terminal.print(`Cluster: ${this.location.clusterId}`, 'system');
    this.terminal.print('');
    this.terminal.print('Visual map requires server data.', 'warning');
    this.terminal.print('Use "explore" to list networks in cluster.', 'system');
  }

  // === SAFE HOUSE COMMANDS ===

  async cmdDock() {
    this.terminal.print('Attempting to dock at Safe House...', 'system');

    const result = await this.game.sendMessage('DOCK', {});

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    if (result.success) {
      this.terminal.print('', '');
      this.terminal.print('=== DOCKED ===', 'success');
      this.terminal.print(`Safe House: ${result.safeHouse.name}`, 'info');
      if (result.fee > 0) {
        this.terminal.print(`Docking Fee: -${result.fee} CR`, 'warning');
      }
      this.terminal.print('');
      this.terminal.print('Services:', 'system');
      this.terminal.print(`  Repair: ${result.safeHouse.hasRepair ? 'YES' : 'NO'}`, 'system');
      this.terminal.print(`  Market: ${result.safeHouse.hasMarket ? 'YES' : 'NO'}`, 'system');
      this.terminal.print(`  Cloning: ${result.safeHouse.hasCloning ? 'YES' : 'NO'}`, 'system');
      this.terminal.print('');
      this.terminal.print('Commands: hangar, store, retrieve, sethome, undock', 'info');
    }
  }

  async cmdUndock() {
    const result = await this.game.sendMessage('UNDOCK', {});

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print('Undocked. Back in the Grid.', 'success');
  }

  async cmdHangar() {
    const result = await this.game.sendMessage('HANGAR', {});

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print(`=== HANGAR @ ${result.safeHouse} ===`, 'info');
    this.terminal.print('');

    // Show stored rigs
    this.terminal.print('STORED RIGS:', 'warning');
    if (result.rigs.length === 0) {
      this.terminal.print('  No rigs stored.', 'system');
    } else {
      result.rigs.forEach(rig => {
        this.terminal.print(`  [${rig.id}] ${rig.name} - Tier ${rig.hardware.tier}`, 'system');
      });
    }
    this.terminal.print('');

    // Show stored resources
    this.terminal.print('STORED RESOURCES:', 'warning');
    let hasResources = false;
    for (const [type, amount] of Object.entries(result.resources)) {
      if (amount > 0) {
        hasResources = true;
        this.terminal.print(`  ${type.replace('_', ' ')}: ${amount}`, 'success');
      }
    }
    if (!hasResources) {
      this.terminal.print('  No resources stored.', 'system');
    }
  }

  async cmdStore(args) {
    if (args.length < 2) {
      this.terminal.print('Usage: store <type> <resource> [amount]', 'error');
      this.terminal.print('Example: store resources data_packets 100', 'system');
      return;
    }

    const itemType = args[0];
    const itemId = args[1];
    const amount = args[2] ? parseInt(args[2]) : undefined;

    const result = await this.game.sendMessage('STORE_ITEM', { itemType, itemId, amount });

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print(`Stored ${result.stored.amount}x ${result.stored.type}`, 'success');
    this.terminal.print(`Remaining on hand: ${result.remaining}`, 'system');
  }

  async cmdRetrieve(args) {
    if (args.length < 2) {
      this.terminal.print('Usage: retrieve <type> <resource> [amount]', 'error');
      this.terminal.print('Example: retrieve resources data_packets 50', 'system');
      return;
    }

    const itemType = args[0];
    const itemId = args[1];
    const amount = args[2] ? parseInt(args[2]) : undefined;

    const result = await this.game.sendMessage('RETRIEVE_ITEM', { itemType, itemId, amount });

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print(`Retrieved ${result.retrieved.amount}x ${result.retrieved.type}`, 'success');
    this.terminal.print(`Remaining in storage: ${result.remaining}`, 'system');
  }

  async cmdSetHome() {
    const result = await this.game.sendMessage('SET_HOME', {});

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print(`Home set to: ${result.home}`, 'success');
    this.terminal.print('You will respawn here if traced.', 'system');
  }

  // === DEFENDER COUNTER-PLAY COMMANDS ===

  async cmdDefend() {
    this.terminal.print('Scanning for intrusions on your networks...', 'system');

    const result = await this.game.sendMessage('DEFEND_VIEW', {});

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print('', '');
    this.terminal.print('=== NETWORK DEFENSE ===', 'info');

    if (result.intrusions.length === 0) {
      this.terminal.print('No active intrusions detected.', 'success');
    } else {
      this.terminal.print(`ACTIVE INTRUSIONS: ${result.intrusions.length}`, 'warning');
      this.terminal.print('');

      for (const intr of result.intrusions) {
        this.terminal.print(`[${intr.id.slice(0, 8)}] Network: ${intr.networkId}`, 'error');
        this.terminal.print(`  Node: ${intr.attackerNode} | Duration: ${intr.duration}s`, 'system');
        this.terminal.print(`  Trace: ${intr.traceProgress.toFixed(1)}%`, 'warning');
      }
    }

    this.terminal.print('');
    this.terminal.print('COUNTER-PROGRAMS:', 'info');
    for (const prog of result.counterPrograms) {
      this.terminal.print(`  ${prog.name} (${prog.cost} CR) - ${prog.description}`, 'system');
    }

    this.terminal.print('');
    this.terminal.print('Commands: backtrace <id>, counterice <id>, lockdown <networkId>', 'info');
  }

  async cmdBacktrace(args) {
    if (args.length === 0) {
      this.terminal.print('Usage: backtrace <intrusion_id>', 'error');
      this.terminal.print('Use "defend" to see active intrusions.', 'system');
      return;
    }

    const intrusionId = args[0];
    const result = await this.game.sendMessage('DEFEND_BACKTRACE', { intrusionId });

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print(`${result.program} initiated!`, 'success');
    this.terminal.print(`Tracing attacker... ETA: ${result.duration}s`, 'warning');
    this.terminal.print(`Cost: -${result.program === 'Backtrace' ? 500 : 0} CR`, 'system');
  }

  async cmdCounterIce(args) {
    if (args.length === 0) {
      this.terminal.print('Usage: counterice <intrusion_id>', 'error');
      return;
    }

    const intrusionId = args[0];
    const result = await this.game.sendMessage('DEFEND_COUNTERICE', { intrusionId });

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print(`${result.program} deployed!`, 'success');
    this.terminal.print(`Attacking intruder hardware... Impact in ${result.duration}s`, 'warning');
  }

  async cmdLockdown(args) {
    if (args.length === 0) {
      this.terminal.print('Usage: lockdown <network_id>', 'error');
      this.terminal.print('WARNING: Locks network for 5 minutes!', 'warning');
      return;
    }

    const networkId = args[0];
    const result = await this.game.sendMessage('DEFEND_LOCKDOWN', { networkId });

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print('EMERGENCY LOCKDOWN ACTIVATED!', 'error');
    this.terminal.print(`Disconnected ${result.disconnected} intruder(s).`, 'success');
    this.terminal.print(`Network locked for ${result.lockDuration}s`, 'warning');
  }

  // === MARKET ECONOMY COMMANDS ===

  async cmdMarket(args) {
    // Open the visual market UI
    if (this.marketUI) {
      this.marketUI.open();
      this.terminal.print('Opening Market...', 'system');
    } else {
      this.terminal.print('Market UI not available.', 'error');
    }
  }

  async cmdSell(args) {
    if (args.length < 3) {
      this.terminal.print('Usage: sell <resource> <amount> <price_per_unit>', 'error');
      this.terminal.print('Example: sell data_packets 100 5', 'system');
      return;
    }

    const resourceType = args[0];
    const amount = parseInt(args[1]);
    const pricePerUnit = parseInt(args[2]);

    if (isNaN(amount) || isNaN(pricePerUnit)) {
      this.terminal.print('Amount and price must be numbers.', 'error');
      return;
    }

    const result = await this.game.sendMessage('MARKET_SELL', { resourceType, amount, pricePerUnit });

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print(`Listed: ${amount}x ${resourceType} @ ${pricePerUnit} CR each`, 'success');
    this.terminal.print(`Total: ${amount * pricePerUnit} CR | Listing fee: -${result.fee} CR`, 'system');
    this.terminal.print(`Order ID: ${result.orderId}`, 'info');
  }

  async cmdBuy(args) {
    if (args.length === 0) {
      this.terminal.print('Usage: buy <order_id>', 'error');
      this.terminal.print('Use "market" to see available orders.', 'system');
      return;
    }

    // User can provide partial ID
    let orderId = args[0];

    const result = await this.game.sendMessage('MARKET_BUY', { orderId });

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print(`Purchased: ${result.bought.amount}x ${result.bought.resource}`, 'success');
    this.terminal.print(`Paid: -${result.paid} CR | Balance: ${result.credits} CR`, 'system');
  }

  // === RIG & REPAIR COMMANDS ===

  async cmdRig(args) {
    // If no args, show current rig status
    if (!args || args.length === 0) {
      const rigInfo = this.game.getRigInfo();
      const rig = rigInfo.class;

      this.terminal.print('═══════════════════════════════════════', 'info');
      this.terminal.print(`  RIG: ${rig.name.toUpperCase()}`, 'highlight');
      this.terminal.print('═══════════════════════════════════════', 'info');
      this.terminal.print(`  ${rig.description}`, 'system');
      this.terminal.print(`  Specialty: ${rig.specialty}`, 'info');
      this.terminal.print('', 'system');

      // Stats
      this.terminal.print('─── STATS ───', 'info');
      const hw = this.game.state.player.hardware;
      this.terminal.print(`  CPU: ${hw.cpuUsed}/${hw.cpu}`, 'system');
      this.terminal.print(`  RAM: ${hw.ramUsed}/${hw.ram} MB`, 'system');
      this.terminal.print(`  Bandwidth: ${hw.bandwidth} Mbps`, 'system');
      this.terminal.print(`  Trace Resist: ${hw.traceResist}%`, hw.traceResist > 0 ? 'success' : 'system');
      this.terminal.print(`  Integrity: ${hw.integrity}%`, hw.integrity > 50 ? 'success' : 'warning');

      // Slots
      this.terminal.print('', 'system');
      this.terminal.print('─── SLOTS ───', 'info');
      this.terminal.print(`  Core:      ${rigInfo.slots.core.used}/${rigInfo.slots.core.max}`, 'system');
      this.terminal.print(`  Memory:    ${rigInfo.slots.memory.used}/${rigInfo.slots.memory.max}`, 'system');
      this.terminal.print(`  Expansion: ${rigInfo.slots.expansion.used}/${rigInfo.slots.expansion.max}`, 'system');

      // Equipped modules
      if (rigInfo.equippedModules.core.length || rigInfo.equippedModules.memory.length || rigInfo.equippedModules.expansion.length) {
        this.terminal.print('', 'system');
        this.terminal.print('─── EQUIPPED ───', 'info');
        for (const slotType of ['core', 'memory', 'expansion']) {
          for (const mod of rigInfo.equippedModules[slotType]) {
            this.terminal.print(`  [${slotType.toUpperCase()}] ${mod.name}`, 'highlight');
          }
        }
      }

      this.terminal.print('', 'system');
      this.terminal.print('Commands: rigs | fit <module_id> | unfit <module_id> | modules', 'info');
      return;
    }

    // rig buy <id> - purchase and switch to a new rig
    if (args[0] === 'buy' && args[1]) {
      const rigId = args[1].toLowerCase();
      const result = await this.game.selectRig(rigId);

      if (result.error) {
        this.terminal.print(result.error, 'error');
        return;
      }

      this.terminal.print(result.message, 'success');
      this.terminal.print(`New rig: ${result.rig.name} - ${result.rig.description}`, 'highlight');
      this.terminal.print(`Specialty: ${result.rig.specialty}`, 'info');
      return;
    }

    this.terminal.print('Usage: rig | rig buy <rig_id>', 'error');
  }

  cmdRigs() {
    const rigs = this.game.getAvailableRigs();

    this.terminal.print('═══════════════════════════════════════', 'info');
    this.terminal.print('  AVAILABLE RIGS', 'highlight');
    this.terminal.print('═══════════════════════════════════════', 'info');

    for (const rig of rigs) {
      const owned = this.game.state.player.rig.class.id === rig.id;
      const priceStr = rig.price === 0 ? 'FREE' : `${rig.price.toLocaleString()} CR`;

      this.terminal.print('', 'system');
      this.terminal.print(`${owned ? '► ' : '  '}${rig.name.toUpperCase()} [${rig.id}]`, owned ? 'success' : 'highlight');
      this.terminal.print(`  ${rig.description}`, 'system');
      this.terminal.print(`  Specialty: ${rig.specialty} | Price: ${priceStr}`, 'info');
      this.terminal.print(`  CPU: ${rig.baseCpu} | RAM: ${rig.baseRam} | BW: ${rig.baseBandwidth}`, 'system');
      this.terminal.print(`  Slots: Core[${rig.slots.core}] Mem[${rig.slots.memory}] Exp[${rig.slots.expansion}]`, 'system');
    }

    this.terminal.print('', 'system');
    this.terminal.print('Use: rig buy <rig_id> to purchase', 'info');
  }

  cmdModules() {
    const modules = this.game.getAvailableModules();

    this.terminal.print('═══════════════════════════════════════', 'info');
    this.terminal.print('  AVAILABLE MODULES', 'highlight');
    this.terminal.print('═══════════════════════════════════════', 'info');

    const grouped = { core: [], memory: [], expansion: [] };
    for (const mod of modules) {
      grouped[mod.slotType].push(mod);
    }

    for (const slotType of ['core', 'memory', 'expansion']) {
      this.terminal.print('', 'system');
      this.terminal.print(`─── ${slotType.toUpperCase()} MODULES ───`, 'info');
      for (const mod of grouped[slotType]) {
        this.terminal.print(`  ${mod.name} [${mod.id}]`, 'highlight');
        this.terminal.print(`    ${mod.description}`, 'system');
        this.terminal.print(`    CPU: ${mod.cpuCost} | RAM: ${mod.ramCost} | ${mod.price.toLocaleString()} CR`, 'info');
      }
    }

    this.terminal.print('', 'system');
    this.terminal.print('Use: fit <module_id> to equip', 'info');
  }

  cmdFit(args) {
    if (!args || args.length === 0) {
      this.terminal.print('Usage: fit <module_id>', 'error');
      this.terminal.print('Use "modules" to see available modules.', 'info');
      return;
    }

    const moduleId = args[0].toLowerCase();
    const result = this.game.equipModule(moduleId);

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print(result.message, 'success');
  }

  cmdUnfit(args) {
    if (!args || args.length === 0) {
      this.terminal.print('Usage: unfit <module_id>', 'error');
      this.terminal.print('Use "rig" to see equipped modules.', 'info');
      return;
    }

    const moduleId = args[0].toLowerCase();
    const result = this.game.unequipModule(moduleId);

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print(result.message, 'success');
  }

  async cmdRepair() {
    this.terminal.print('Initiating rig repair...', 'system');

    const result = await this.game.sendMessage('REPAIR', {});

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    if (result.partial) {
      this.terminal.print(`Partial repair: +${result.repaired}% integrity`, 'warning');
    } else {
      this.terminal.print(`Full repair: +${result.repaired}% integrity`, 'success');
    }

    this.terminal.print(`Cost: -${result.cost} CR | Integrity: ${result.rigIntegrity}%`, 'system');
  }

  // === CHAT & REPUTATION COMMANDS ===

  async cmdSay(args) {
    if (args.length === 0) {
      this.terminal.print('Usage: say <message>', 'error');
      return;
    }

    const message = args.join(' ');
    await this.game.sendMessage('CHAT_SEND', { channel: 'local', message });
    this.terminal.print(`[LOCAL] You: ${message}`, 'system');
  }

  async cmdShout(args) {
    if (args.length === 0) {
      this.terminal.print('Usage: shout <message>', 'error');
      return;
    }

    const message = args.join(' ');
    await this.game.sendMessage('CHAT_SEND', { channel: 'global', message });
    this.terminal.print(`[GLOBAL] You: ${message}`, 'warning');
  }

  async cmdRep(args) {
    const targetIp = args[0] || null;

    const result = await this.game.sendMessage('GET_REPUTATION', { targetIp });

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print('=== REPUTATION ===', 'info');
    this.terminal.print(`Player: ${result.ip}`, 'system');
    this.terminal.print(`Title: ${result.title}`, 'success');
    this.terminal.print(`Reputation: ${result.reputation}`, 'system');
    this.terminal.print(`Hacks: ${result.successfulHacks} | Traced: ${result.tracedCount} | Trades: ${result.trades}`, 'system');
  }

  // === SPECIALIZATION COMMANDS ===

  async cmdSkills() {
    const result = await this.game.sendMessage('GET_SKILLS', {});

    if (result.error) {
      this.terminal.print(result.error, 'error');
      return;
    }

    this.terminal.print('=== SPECIALIZATION PATHS ===', 'info');

    if (result.specialization) {
      this.terminal.print(`Your path: ${result.specialization.toUpperCase()}`, 'success');
    } else {
      this.terminal.print('No specialization chosen. Use "spec choose <path>"', 'warning');
    }

    this.terminal.print('');

    for (const path of result.paths) {
      const isActive = result.specialization === path.id;
      this.terminal.print(`${path.icon} ${path.name} ${isActive ? '(ACTIVE)' : ''}`, isActive ? 'success' : 'info');
      this.terminal.print(`  ${path.description}`, 'system');

      for (const skill of path.skills) {
        const status = skill.unlocked ? '✓' : '○';
        const color = skill.unlocked ? 'success' : 'system';
        this.terminal.print(`    ${status} L${skill.level}: ${skill.name} (${skill.cost} CR) - ${skill.effect}`, color);
      }
      this.terminal.print('');
    }

    this.terminal.print(`Respec cost: ${result.respecCost} CR`, 'system');
  }

  async cmdSpec(args) {
    if (args.length === 0) {
      this.terminal.print('Usage: spec choose <path> | spec learn <skill_id>', 'error');
      this.terminal.print('Paths: infiltrator, sentinel, broker', 'system');
      return;
    }

    const subCmd = args[0];

    if (subCmd === 'choose') {
      const specId = args[1];
      if (!specId) {
        this.terminal.print('Usage: spec choose <infiltrator|sentinel|broker>', 'error');
        return;
      }

      const result = await this.game.sendMessage('CHOOSE_SPEC', { specId });

      if (result.error) {
        this.terminal.print(result.error, 'error');
        return;
      }

      this.terminal.print(`Specialization chosen: ${result.name}`, 'success');
      this.terminal.print(result.description, 'system');

    } else if (subCmd === 'learn') {
      const skillId = args[1];
      if (!skillId) {
        this.terminal.print('Usage: spec learn <skill_id>', 'error');
        this.terminal.print('Use "skills" to see available skills.', 'system');
        return;
      }

      const result = await this.game.sendMessage('LEARN_SKILL', { skillId });

      if (result.error) {
        this.terminal.print(result.error, 'error');
        return;
      }

      this.terminal.print(`Skill learned: ${result.skill}`, 'success');
      this.terminal.print(`Effect: ${result.effect}`, 'info');
      this.terminal.print(`Cost: -${result.cost} CR | Balance: ${result.credits} CR`, 'system');

    } else {
      this.terminal.print('Unknown subcommand. Use: spec choose <path> | spec learn <skill_id>', 'error');
    }
  }

  initChat() {
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatMessages = document.getElementById('chat-messages');
    const onlineCount = document.getElementById('chat-online-count');

    if (!chatInput || !chatSendBtn || !chatMessages) return;

    // Send chat message
    const sendMessage = () => {
      const message = chatInput.value.trim();
      if (!message) return;

      // Send to server
      this.game.sendMessage('CHAT_SEND', {
        channel: 'global',
        message: message,
      });

      chatInput.value = '';
    };

    // Enter key to send
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });

    // Send button click
    chatSendBtn.addEventListener('click', sendMessage);

    // Listen for incoming chat messages
    window.addEventListener('chat-message', (e) => {
      const { sender, title, titleColor, message, timestamp } = e.detail;
      const time = new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      const isSelf = sender === this.game.state.player.ip;

      const msgEl = document.createElement('div');
      msgEl.className = 'chat-message';
      msgEl.innerHTML = `
        <span class="chat-time">[${time}]</span>
        <span class="chat-user${isSelf ? ' self' : ''}">[${title || 'Anon'}] ${sender}:</span>
        <span class="chat-text">${this.escapeHtml(message)}</span>
      `;

      chatMessages.appendChild(msgEl);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Limit message history to 100 messages
      while (chatMessages.children.length > 100) {
        chatMessages.removeChild(chatMessages.firstChild);
      }
    });

    // Listen for player count updates
    window.addEventListener('player-count', (e) => {
      const { count } = e.detail;
      if (onlineCount) {
        onlineCount.textContent = `${count} online`;
      }
    });

    // Add welcome message
    const welcomeEl = document.createElement('div');
    welcomeEl.className = 'chat-message system';
    welcomeEl.textContent = 'Connected to global chat. All messages are visible to all players.';
    chatMessages.appendChild(welcomeEl);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
