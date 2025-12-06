import { COMMANDS } from '../../shared/constants.js';

export class Terminal {
  constructor() {
    this.output = null;
    this.input = null;
    this.autocomplete = null;
    this.commandHandler = null;
    this.fileProvider = null; // Callback to get file suggestions
    this.history = [];
    this.historyIndex = -1;
    this.selectedAutocomplete = 0;
  }

  init(commandHandler, fileProvider = null) {
    this.output = document.getElementById('terminal-output');
    this.input = document.getElementById('terminal-input');
    this.autocomplete = document.getElementById('autocomplete-dropdown');
    this.commandHandler = commandHandler;
    this.fileProvider = fileProvider;

    this.input.addEventListener('keydown', this.onKeyDown.bind(this));
    this.input.addEventListener('input', this.onInput.bind(this));
    this.input.focus();

    // Keep focus on terminal
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.action-btn') && !e.target.closest('#modal-overlay')) {
        this.input.focus();
      }
    });
  }

  onKeyDown(e) {
    // Ctrl+key shortcuts
    if (e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'd':
          e.preventDefault();
          this.executeCommand('disconnect');
          return;
        case 's':
          e.preventDefault();
          this.executeCommand('status');
          return;
        case 'h':
          e.preventDefault();
          this.executeCommand('help');
          return;
        case 'l':
          e.preventDefault();
          this.clear();
          return;
        case 'r':
          e.preventDefault();
          this.executeCommand('rig');
          return;
        case 'm':
          e.preventDefault();
          this.executeCommand('market');
          return;
      }
    }

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        this.submitCommand();
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (this.autocomplete.classList.contains('visible')) {
          this.navigateAutocomplete(-1);
        } else {
          this.navigateHistory(-1);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (this.autocomplete.classList.contains('visible')) {
          this.navigateAutocomplete(1);
        } else {
          this.navigateHistory(1);
        }
        break;
      case 'Tab':
        e.preventDefault();
        this.completeCommand();
        break;
      case 'Escape':
        this.hideAutocomplete();
        break;
    }
  }

  onInput() {
    const value = this.input.value.trim();
    if (value.length > 0) {
      this.showAutocomplete(value);
    } else {
      this.hideAutocomplete();
    }
  }

  submitCommand() {
    const input = this.input.value.trim();
    this.hideAutocomplete();

    if (input.length === 0) return;

    // Add to history
    this.history.push(input);
    this.historyIndex = this.history.length;

    // Print command
    this.print(input, 'command');

    // Clear input
    this.input.value = '';

    // Execute
    if (this.commandHandler) {
      this.commandHandler(input);
    }
  }

  executeCommand(cmd) {
    this.input.value = cmd;
    this.submitCommand();
  }

  navigateHistory(direction) {
    const newIndex = this.historyIndex + direction;

    if (newIndex < 0 || newIndex > this.history.length) return;

    this.historyIndex = newIndex;

    if (newIndex === this.history.length) {
      this.input.value = '';
    } else {
      this.input.value = this.history[newIndex];
    }
  }

  showAutocomplete(value) {
    const parts = value.toLowerCase().split(' ');
    const cmd = parts[0];

    // If we have a command and are typing arguments, show contextual suggestions
    if (parts.length > 1) {
      const contextualSuggestions = this.getContextualSuggestions(cmd, parts.slice(1).join(' '));

      if (contextualSuggestions.length > 0) {
        this.autocomplete.innerHTML = contextualSuggestions.map((s, i) => `
          <div class="autocomplete-item ${i === this.selectedAutocomplete ? 'selected' : ''}" data-cmd="${cmd} ${s.value}">
            <span class="cmd">${s.value}</span>
            <span class="desc">${s.desc}</span>
          </div>
        `).join('');

        this.autocomplete.querySelectorAll('.autocomplete-item').forEach(item => {
          item.addEventListener('click', () => {
            this.input.value = item.dataset.cmd + ' ';
            this.hideAutocomplete();
            this.input.focus();
          });
        });

        this.autocomplete.classList.add('visible');
        this.selectedAutocomplete = 0;
        return;
      }
    }

    // Standard command autocomplete
    const matches = COMMANDS.filter(c =>
      c.cmd.startsWith(cmd)
    );

    if (matches.length === 0) {
      this.hideAutocomplete();
      return;
    }

    this.autocomplete.innerHTML = matches.map((c, i) => `
      <div class="autocomplete-item ${i === this.selectedAutocomplete ? 'selected' : ''}" data-cmd="${c.cmd}">
        <span class="cmd">${c.cmd}</span>
        <span class="desc">${c.desc}</span>
      </div>
    `).join('');

    this.autocomplete.querySelectorAll('.autocomplete-item').forEach(item => {
      item.addEventListener('click', () => {
        this.input.value = item.dataset.cmd + ' ';
        this.hideAutocomplete();
        this.input.focus();
      });
    });

    this.autocomplete.classList.add('visible');
    this.selectedAutocomplete = 0;
  }

  getContextualSuggestions(cmd, partial) {
    const resourceTypes = [
      { value: 'data_packets', desc: 'Common data resource' },
      { value: 'bandwidth_tokens', desc: 'Network bandwidth' },
      { value: 'encryption_keys', desc: 'Security resource' },
      { value: 'access_tokens', desc: 'Access credentials' },
      { value: 'zero_days', desc: 'Rare exploit (DarkNet)' },
      { value: 'quantum_cores', desc: 'Ultra-rare resource' },
    ];

    // Commands that take resource types
    if (['sell', 'store', 'retrieve', 'market'].includes(cmd)) {
      return resourceTypes.filter(r => r.value.startsWith(partial));
    }

    // Commands that take node types
    if (cmd === 'move') {
      const nodes = ['gateway', 'database', 'firewall', 'logs', 'core', 'vault'];
      return nodes
        .filter(n => n.startsWith(partial))
        .map(n => ({ value: n, desc: 'Node type' }));
    }

    // Crew commands
    if (cmd === 'crew') {
      const subCmds = [
        { value: 'create', desc: 'Create new crew' },
        { value: 'invite', desc: 'Invite player' },
        { value: 'info', desc: 'Show crew info' },
        { value: 'leave', desc: 'Leave crew' },
      ];
      return subCmds.filter(s => s.value.startsWith(partial));
    }

    // File commands - get suggestions from fileProvider
    if (['cat', 'rm', 'download'].includes(cmd) && this.fileProvider) {
      const files = this.fileProvider(cmd);
      return files
        .filter(f => f.name.toLowerCase().startsWith(partial.toLowerCase()))
        .map(f => ({
          value: f.name,
          desc: f.type ? `${f.size || 1} MB [${f.type.toUpperCase()}]` : `${f.size || 1} MB`,
        }));
    }

    // Rig commands
    if (cmd === 'rig' && partial.startsWith('buy')) {
      return [
        { value: 'buy phantom', desc: 'Stealth rig' },
        { value: 'buy harvester', desc: 'Mining rig' },
        { value: 'buy razorback', desc: 'Assault rig' },
        { value: 'buy bastion', desc: 'Defense rig' },
        { value: 'buy mule', desc: 'Storage rig' },
        { value: 'buy wraith', desc: 'Evasion rig' },
        { value: 'buy hydra', desc: 'Multi-target rig' },
        { value: 'buy blacksite', desc: 'Counterintel rig' },
      ].filter(r => r.value.startsWith(partial));
    }

    return [];
  }

  hideAutocomplete() {
    this.autocomplete.classList.remove('visible');
    this.selectedAutocomplete = 0;
  }

  navigateAutocomplete(direction) {
    const items = this.autocomplete.querySelectorAll('.autocomplete-item');
    if (items.length === 0) return;

    items[this.selectedAutocomplete].classList.remove('selected');
    this.selectedAutocomplete = (this.selectedAutocomplete + direction + items.length) % items.length;
    items[this.selectedAutocomplete].classList.add('selected');
  }

  completeCommand() {
    const items = this.autocomplete.querySelectorAll('.autocomplete-item');
    if (items.length === 0) return;

    const selected = items[this.selectedAutocomplete];
    if (selected) {
      this.input.value = selected.dataset.cmd + ' ';
      this.hideAutocomplete();
    }
  }

  print(text, type = '') {
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    line.textContent = text;
    this.output.appendChild(line);
    this.scrollToBottom();
  }

  printRaw(text, type = '') {
    const line = document.createElement('pre');
    line.className = `terminal-line ${type}`;
    line.textContent = text;
    this.output.appendChild(line);
    this.scrollToBottom();
  }

  printHTML(html) {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.innerHTML = html;
    this.output.appendChild(line);
    this.scrollToBottom();
  }

  clear() {
    this.output.innerHTML = '';
  }

  scrollToBottom() {
    this.output.scrollTop = this.output.scrollHeight;
  }

  async typeText(text, delay = 30) {
    const line = document.createElement('div');
    line.className = 'terminal-line typing';
    this.output.appendChild(line);

    for (const char of text) {
      line.textContent += char;
      this.scrollToBottom();
      await new Promise(r => setTimeout(r, delay));
    }

    line.classList.remove('typing');
  }
}
