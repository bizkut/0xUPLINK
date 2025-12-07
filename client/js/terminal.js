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

    // Safety check for autocomplete
    try {
      this.hideAutocomplete();
    } catch (e) {
      console.warn('Error hiding autocomplete:', e);
    }

    if (input.length === 0) return;

    try {
      // Add to history
      this.history.push(input);
      this.historyIndex = this.history.length;

      // Print command
      this.print(input, 'command');

      // Execute command (if handler exists)
      if (this.commandHandler) {
        this.commandHandler(input);
      }
    } catch (err) {
      console.error('Error executing command:', err);
      try {
        this.print('Error: ' + err.message, 'error');
      } catch (e) {
        console.error('Failed to print error to terminal:', e);
      }
    } finally {
      // ALWAYS clear input
      if (this.input) {
        this.input.value = '';
      }
    }
  }

  executeCommand(cmd) {
    if (this.input) {
      this.input.value = cmd;
      this.submitCommand();
    }
  }

  // ... (navigateHistory remains the same) ...

  hideAutocomplete() {
    if (this.autocomplete) {
      this.autocomplete.classList.remove('visible');
    }
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
