import { Terminal } from './terminal.js';
import { Game } from './game.js';
import { NodeMap } from './nodeMap.js';
import { UI } from './ui.js';

class App {
  constructor() {
    this.terminal = new Terminal();
    this.game = new Game();
    this.nodeMap = new NodeMap();
    this.ui = new UI();
    
    this.init();
  }

  async init() {
    // Initialize components
    this.ui.init();
    this.terminal.init(this.handleCommand.bind(this));
    this.nodeMap.init();
    
    // Connect to server
    await this.game.connect();
    
    // Display welcome message
    this.showWelcome();
    
    // Start game loop
    this.startGameLoop();
    
    // Setup action buttons
    this.setupActionButtons();
    
    // Setup hotkeys
    this.setupHotkeys();
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
    this.terminal.print('Type "tutorial" to begin the training simulation.', 'system');
    this.terminal.print('');
  }

  async handleCommand(input) {
    const parts = input.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        this.cmdHelp(args);
        break;
      case 'clear':
        this.terminal.clear();
        break;
      case 'status':
        this.cmdStatus();
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
    this.terminal.print('NAVIGATION:', 'warning');
    this.terminal.print('  scan <ip>      - Scan target server', 'system');
    this.terminal.print('  connect <ip>   - Connect to server', 'system');
    this.terminal.print('  disconnect     - Clean disconnect', 'system');
    this.terminal.print('  move <node>    - Move to node', 'system');
    this.terminal.print('');
    this.terminal.print('HACKING:', 'warning');
    this.terminal.print('  breach         - Breach current node ICE', 'system');
    this.terminal.print('  crack          - Crack password', 'system');
    this.terminal.print('  download <f>   - Download file', 'system');
    this.terminal.print('  clean          - Clean logs', 'system');
    this.terminal.print('');
    this.terminal.print('DEFENSE:', 'warning');
    this.terminal.print('  cloak          - Activate proxy chain', 'system');
    this.terminal.print('  abort          - Emergency disconnect', 'system');
    this.terminal.print('');
    this.terminal.print('INFO:', 'warning');
    this.terminal.print('  status         - Current status', 'system');
    this.terminal.print('  hardware       - View hardware', 'system');
    this.terminal.print('  software       - View programs', 'system');
    this.terminal.print('  contracts      - View jobs', 'system');
    this.terminal.print('  shop           - Black market', 'system');
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
    if (!this.game.state.connection.active) {
      this.terminal.print('Not connected to any server.', 'error');
      return;
    }

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
    const contracts = this.game.getAvailableContracts();
    this.terminal.print('=== AVAILABLE CONTRACTS ===', 'info');
    
    if (contracts.length === 0) {
      this.terminal.print('No contracts available. Check back later.', 'system');
      return;
    }

    contracts.forEach(c => {
      this.terminal.print('', '');
      this.terminal.print(`[${c.id}] ${c.title}`, 'warning');
      this.terminal.print(`  Type: ${c.type}`, 'system');
      this.terminal.print(`  Target: ${c.targetIp}`, 'system');
      this.terminal.print(`  Reward: ${c.reward} CR`, 'success');
      this.terminal.print(`  Difficulty: ${c.difficulty}`, 
        c.difficulty === 'HARD' ? 'error' : c.difficulty === 'MEDIUM' ? 'warning' : 'system');
    });
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
    
    // Update status bar
    document.getElementById('credits').textContent = state.player.credits;
    document.getElementById('reputation').textContent = state.player.reputation;
    
    const heatEl = document.getElementById('heat');
    heatEl.textContent = `${state.player.heat}%`;
    heatEl.className = `value ${state.player.heat > 70 ? 'heat-high' : state.player.heat > 40 ? 'heat-med' : 'heat-low'}`;
    
    // Update trace bar if connected
    if (state.connection.active) {
      const trace = state.connection.trace;
      document.getElementById('trace-fill').style.width = `${trace}%`;
      document.getElementById('trace-percent').textContent = `${trace.toFixed(0)}%`;
      
      // Check for trace completion
      if (trace >= 100) {
        this.onTraceComplete();
      }
    }
    
    // Update hardware status
    const hw = state.player.hardware;
    document.getElementById('cpu-usage').textContent = `${hw.cpuUsed}/${hw.cpu}`;
    document.getElementById('ram-usage').textContent = `${hw.ramUsed}/${hw.ram}MB`;
    document.getElementById('bandwidth').textContent = `${hw.bandwidth}Mb/s`;
    
    // Update clock
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString('en-US', { hour12: false });
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
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
