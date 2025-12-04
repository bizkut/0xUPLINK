import { COMMANDS } from '../../shared/constants.js';

export class Terminal {
  constructor() {
    this.output = null;
    this.input = null;
    this.autocomplete = null;
    this.commandHandler = null;
    this.history = [];
    this.historyIndex = -1;
    this.selectedAutocomplete = 0;
  }

  init(commandHandler) {
    this.output = document.getElementById('terminal-output');
    this.input = document.getElementById('terminal-input');
    this.autocomplete = document.getElementById('autocomplete-dropdown');
    this.commandHandler = commandHandler;

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
    const matches = COMMANDS.filter(c => 
      c.cmd.startsWith(value.toLowerCase().split(' ')[0])
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
