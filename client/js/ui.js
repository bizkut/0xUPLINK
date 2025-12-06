export class UI {
  constructor() {
    this.modalOverlay = null;
    this.modalContent = null;
    this.alertOverlay = null;
  }

  init() {
    this.modalOverlay = document.getElementById('modal-overlay');
    this.modalContent = document.getElementById('modal-content');
    this.alertOverlay = document.getElementById('alert-overlay');

    // Close modal on overlay click
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.hideModal();
      }
    });

    // Alert buttons
    document.getElementById('alert-respond').addEventListener('click', () => {
      this.hideAlert();
      // TODO: Switch to defense mode
    });

    document.getElementById('alert-dismiss').addEventListener('click', () => {
      this.hideAlert();
    });

    // Set initial IP
    document.getElementById('player-ip').textContent =
      `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  }

  setConnected(connected, targetIp = null) {
    const indicator = document.getElementById('connection-indicator');
    const status = document.getElementById('connection-status');

    if (connected) {
      indicator.classList.add('connected');
      status.textContent = targetIp || 'CONNECTED';
    } else {
      indicator.classList.remove('connected');
      status.textContent = 'LOCAL';
      document.getElementById('trace-fill').style.width = '0%';
      document.getElementById('trace-percent').textContent = '0%';
    }
  }

  showModal(title, content, actions = []) {
    this.modalContent.innerHTML = `
      <div class="modal-title">${title}</div>
      <div class="modal-body">${content}</div>
      ${actions.length > 0 ? `
        <div class="modal-actions">
          ${actions.map(a => `
            <button class="action-btn" data-action="${a.id}">${a.label}</button>
          `).join('')}
        </div>
      ` : ''}
    `;

    // Bind action handlers
    actions.forEach(a => {
      const btn = this.modalContent.querySelector(`[data-action="${a.id}"]`);
      if (btn && a.handler) {
        btn.addEventListener('click', () => {
          a.handler();
          if (a.closeOnClick !== false) {
            this.hideModal();
          }
        });
      }
    });

    this.modalOverlay.classList.remove('hidden');
  }

  hideModal() {
    this.modalOverlay.classList.add('hidden');
  }

  showAlert(message) {
    document.getElementById('alert-message').textContent = message;
    this.alertOverlay.classList.remove('hidden');

    // Play alert sound effect (if we had audio)
    this.flashScreen();
  }

  hideAlert() {
    this.alertOverlay.classList.add('hidden');
  }

  flashScreen() {
    const app = document.getElementById('app');
    app.classList.add('glitch');
    setTimeout(() => app.classList.remove('glitch'), 300);
  }

  showNotification(message, type = 'info') {
    // Create floating notification
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    notif.style.cssText = `
      position: fixed;
      top: 60px;
      right: 20px;
      background: var(--bg-secondary);
      border: 1px solid ${type === 'error' ? 'var(--accent-red)' : type === 'success' ? 'var(--text-primary)' : 'var(--border-color)'};
      padding: 12px 20px;
      color: ${type === 'error' ? 'var(--accent-red)' : type === 'success' ? 'var(--text-primary)' : 'var(--text-white)'};
      font-family: var(--font-mono);
      font-size: 12px;
      z-index: 3000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notif);

    setTimeout(() => {
      notif.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => notif.remove(), 300);
    }, 3000);
  }

  // Shop UI
  showShop(software, hardware, onBuy) {
    let content = '<h3>SOFTWARE</h3><div class="shop-items">';

    software.forEach(s => {
      content += `
        <div class="shop-item">
          <div class="item-info">
            <span class="item-name">${s.name} v${s.level}</span>
            <span class="item-stats">CPU: ${s.cpuCost} | RAM: ${s.ramCost}MB</span>
          </div>
          <div class="item-price">${s.price} CR</div>
          <button class="action-btn" data-buy="${s.id}">BUY</button>
        </div>
      `;
    });

    content += '</div>';

    this.showModal('// BLACK MARKET', content, [
      { id: 'close', label: 'CLOSE' }
    ]);

    // Bind buy handlers
    this.modalContent.querySelectorAll('[data-buy]').forEach(btn => {
      btn.addEventListener('click', () => {
        onBuy(btn.dataset.buy);
      });
    });
  }

  // Contract details
  showContract(contract, onAccept) {
    const content = `
      <p><strong>Type:</strong> ${contract.type}</p>
      <p><strong>Target:</strong> ${contract.targetIp}</p>
      <p><strong>Objective:</strong> ${contract.objective}</p>
      <p><strong>Reward:</strong> <span style="color: var(--text-primary)">${contract.reward} CR</span></p>
      <p><strong>Difficulty:</strong> <span style="color: ${contract.difficulty === 'HARD' ? 'var(--accent-red)' :
        contract.difficulty === 'MEDIUM' ? 'var(--accent-amber)' :
          'var(--text-primary)'
      }">${contract.difficulty}</span></p>
    `;

    this.showModal(contract.title, content, [
      { id: 'accept', label: 'ACCEPT CONTRACT', handler: onAccept },
      { id: 'decline', label: 'DECLINE' }
    ]);
  }

  // File browser
  showFileBrowser(files, onDownload) {
    let content = '<div class="file-list">';

    files.forEach(f => {
      const size = this.formatSize(f.size);
      content += `
        <div class="file-item" data-file="${f.name}">
          <span class="file-icon">${f.encrypted ? '🔒' : '📄'}</span>
          <span class="file-name">${f.name}</span>
          <span class="file-size">${size}</span>
          ${f.encrypted ? '<span class="file-encrypted">ENCRYPTED</span>' : ''}
        </div>
      `;
    });

    content += '</div>';

    this.showModal('// FILES', content, [
      { id: 'close', label: 'CLOSE' }
    ]);

    // Bind download handlers
    this.modalContent.querySelectorAll('.file-item').forEach(item => {
      item.addEventListener('dblclick', () => {
        onDownload(item.dataset.file);
      });
    });
  }

  // === SIDEBAR STATUS UPDATES ===

  initSidebar(commandHandler) {
    // Wire up all sidebar buttons
    document.querySelectorAll('.sidebar-btn[data-cmd]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.getAttribute('data-cmd');
        if (cmd && commandHandler) {
          commandHandler(cmd);
        }
      });
    });
  }

  updateRigStatus(integrity, max = 100) {
    const fill = document.getElementById('rig-fill');
    const value = document.getElementById('rig-value');
    const btn = document.getElementById('btn-repair');

    if (!fill || !value) return;

    const percent = Math.round((integrity / max) * 100);
    fill.style.width = `${percent}%`;
    value.textContent = `${percent}%`;

    // Update color based on integrity
    fill.classList.remove('warning', 'danger');
    if (percent <= 25) {
      fill.classList.add('danger');
    } else if (percent <= 50) {
      fill.classList.add('warning');
    }

    // Show/hide repair button
    if (btn) {
      btn.style.display = percent < 100 ? 'block' : 'none';
    }
  }

  updateResources(resources) {
    const mapping = {
      data_packets: 'res-data',
      bandwidth_tokens: 'res-bw',
      encryption_keys: 'res-keys',
      access_tokens: 'res-tokens',
      zero_days: 'res-zerodays',
      quantum_cores: 'res-quantum',
    };

    for (const [key, elementId] of Object.entries(mapping)) {
      const el = document.getElementById(elementId);
      if (el) {
        el.textContent = resources[key] || 0;
      }
    }
  }

  updateReputation(rep, title) {
    const titleEl = document.getElementById('player-title');
    const scoreEl = document.getElementById('rep-score');

    if (titleEl) titleEl.textContent = title || 'Unknown';
    if (scoreEl) scoreEl.textContent = rep || 0;
  }

  updateHeatDisplay(heat, tier) {
    const heatEl = document.getElementById('heat');
    if (!heatEl) return;

    heatEl.textContent = `${heat}%`;

    // Update color class
    heatEl.className = 'value';
    if (tier === 'federal') {
      heatEl.classList.add('heat-federal');
    } else if (tier === 'hunted') {
      heatEl.classList.add('heat-hunted');
    } else if (tier === 'hot') {
      heatEl.classList.add('heat-hot');
    } else if (tier === 'warm') {
      heatEl.classList.add('heat-warm');
    } else {
      heatEl.classList.add('heat-low');
    }
  }

  // Show/hide contextual action groups
  showContextActions(context) {
    // Hide all context groups first
    document.querySelectorAll('.context-group').forEach(g => {
      g.classList.add('hidden');
    });

    // Show relevant group
    if (context === 'safehouse') {
      document.getElementById('safehouse-actions')?.classList.remove('hidden');
    } else if (context === 'connected') {
      document.getElementById('hacking-actions')?.classList.remove('hidden');
    } else if (context === 'defense') {
      document.getElementById('defense-actions')?.classList.remove('hidden');
    }
    // 'default' or null = show nothing extra
  }

  updateCredits(credits) {
    const el = document.getElementById('credits');
    if (el) el.textContent = credits;
  }

  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);
