// Contract Board UI Module
// Eve Online-style player contract marketplace

export class ContractUI {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.currentTab = 'available'; // available, my, create
        this.contracts = [];
        this.myContracts = [];
        this.selectedContract = null;

        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'contract-modal';
        this.modal.innerHTML = `
      <div class="contract-container">
        <div class="contract-header">
          <span class="contract-title">📋 Contract Board</span>
          <button class="contract-close">×</button>
        </div>
        
        <div class="contract-tabs">
          <button class="contract-tab active" data-tab="available">Available</button>
          <button class="contract-tab" data-tab="my">My Contracts</button>
          <button class="contract-tab" data-tab="create">Create Contract</button>
        </div>
        
        <div class="contract-content">
          <div class="contract-list"></div>
          <div class="contract-details">
            <div class="contract-details-empty">
              <div class="contract-details-icon">📋</div>
              <div>Select a contract</div>
            </div>
          </div>
        </div>
      </div>
    `;

        document.body.appendChild(this.modal);

        // Cache elements
        this.listPanel = this.modal.querySelector('.contract-list');
        this.detailsPanel = this.modal.querySelector('.contract-details');

        // Close button
        this.modal.querySelector('.contract-close').addEventListener('click', () => this.close());

        // Tab clicks
        this.modal.querySelectorAll('.contract-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentTab = tab.dataset.tab;
                this.modal.querySelectorAll('.contract-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.selectedContract = null;
                this.renderView();
            });
        });

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
    }

    setupEventListeners() {
        // Contract list result
        window.addEventListener('contract-list-result', (e) => {
            if (this.isOpen && e.detail) {
                this.contracts = e.detail.contracts || [];
                this.myContracts = e.detail.myContracts || [];
                this.renderView();
            }
        });

        // Contract create result
        window.addEventListener('contract-create-result', (e) => {
            if (this.isOpen && e.detail) {
                const resultEl = document.getElementById('create-result');
                if (e.detail.success) {
                    if (resultEl) resultEl.innerHTML = '<span style="color: #3fb950;">✓ Contract created!</span>';
                    setTimeout(() => {
                        this.currentTab = 'my';
                        this.modal.querySelectorAll('.contract-tab').forEach(t => t.classList.remove('active'));
                        this.modal.querySelector('[data-tab="my"]').classList.add('active');
                        this.requestContracts();
                    }, 1000);
                } else {
                    if (resultEl) resultEl.innerHTML = `<span style="color: #f85149;">${e.detail.error || 'Failed'}</span>`;
                }
            }
        });

        // Contract accept result
        window.addEventListener('contract-accept-result', (e) => {
            if (this.isOpen && e.detail) {
                if (e.detail.success) {
                    setTimeout(() => this.requestContracts(), 500);
                }
            }
        });

        // Store global reference
        window.contractUI = this;
    }

    open() {
        this.isOpen = true;
        this.modal.classList.add('active');
        this.requestContracts();
    }

    close() {
        this.isOpen = false;
        this.modal.classList.remove('active');
        this.selectedContract = null;
    }

    requestContracts() {
        if (this.game.ws && this.game.ws.readyState === WebSocket.OPEN) {
            this.game.ws.send(JSON.stringify({ type: 'CONTRACT_LIST', payload: {} }));
        }
    }

    renderView() {
        switch (this.currentTab) {
            case 'available':
                this.renderAvailable();
                break;
            case 'my':
                this.renderMyContracts();
                break;
            case 'create':
                this.renderCreateForm();
                break;
        }
    }

    renderAvailable() {
        if (this.contracts.length === 0) {
            this.listPanel.innerHTML = `
        <div class="contract-empty">
          <div class="contract-empty-icon">📋</div>
          <div class="contract-empty-text">No contracts available</div>
        </div>
      `;
            this.renderEmptyDetails();
            return;
        }

        this.listPanel.innerHTML = this.contracts.map(c => `
      <div class="contract-item" data-id="${c.id}">
        <div class="contract-icon">${c.icon}</div>
        <div class="contract-info">
          <div class="contract-type-name">${c.typeName}</div>
          <div class="contract-desc">${c.description}</div>
          <div class="contract-expiry">Expires in ${c.expiresIn} min</div>
        </div>
        <div class="contract-reward">${c.reward} CR</div>
      </div>
    `).join('');

        this.attachItemHandlers(this.contracts);
        this.renderEmptyDetails();
    }

    renderMyContracts() {
        if (this.myContracts.length === 0) {
            this.listPanel.innerHTML = `
        <div class="contract-empty">
          <div class="contract-empty-icon">📋</div>
          <div class="contract-empty-text">No active contracts</div>
        </div>
      `;
            this.renderEmptyDetails();
            return;
        }

        this.listPanel.innerHTML = this.myContracts.map(c => `
      <div class="contract-item" data-id="${c.id}">
        <div class="contract-icon">${c.icon}</div>
        <div class="contract-info">
          <div class="contract-type-name">${c.typeName} <span class="status-badge status-${c.status}">${c.status}</span></div>
          <div class="contract-desc">${c.description}</div>
          <div class="contract-expiry">Expires in ${c.expiresIn} min</div>
        </div>
        <div class="contract-reward">${c.reward} CR</div>
      </div>
    `).join('');

        this.attachItemHandlers(this.myContracts, true);
        this.renderEmptyDetails();
    }

    attachItemHandlers(contractList, isMine = false) {
        this.listPanel.querySelectorAll('.contract-item').forEach(item => {
            item.addEventListener('click', () => {
                const contract = contractList.find(c => c.id === item.dataset.id);
                if (contract) {
                    this.selectedContract = contract;
                    this.listPanel.querySelectorAll('.contract-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                    this.renderContractDetails(contract, isMine);
                }
            });
        });
    }

    renderEmptyDetails() {
        this.detailsPanel.innerHTML = `
      <div class="contract-details-empty">
        <div class="contract-details-icon">📋</div>
        <div>Select a contract</div>
      </div>
    `;
    }

    renderContractDetails(contract, isMine) {
        const isIssuer = contract.issuerName === 'You';
        const isAssignee = contract.assigneeId === this.game.player?.id;

        this.detailsPanel.innerHTML = `
      <div class="details-header">
        <div class="details-title">${contract.icon} ${contract.typeName}</div>
        <div class="details-subtitle">${contract.status.toUpperCase()}</div>
      </div>
      
      <div class="details-row">
        <span class="details-label">Description</span>
      </div>
      <div style="color: #8b949e; font-size: 11px; margin-bottom: 12px;">${contract.description}</div>
      
      <div class="details-row">
        <span class="details-label">Reward</span>
        <span class="details-value reward">${contract.reward} CR</span>
      </div>
      <div class="details-row">
        <span class="details-label">Issuer</span>
        <span class="details-value">${contract.issuerName}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Expires In</span>
        <span class="details-value warning">${contract.expiresIn} min</span>
      </div>
      
      <div class="details-actions">
        ${!isMine && contract.status === 'open' ? `
          <button class="contract-btn accept" onclick="window.contractUI?.acceptContract('${contract.id}')">
            Accept Contract
          </button>
        ` : ''}
        ${isIssuer && contract.status === 'open' ? `
          <button class="contract-btn cancel" onclick="window.contractUI?.cancelContract('${contract.id}')">
            Cancel Contract
          </button>
        ` : ''}
      </div>
    `;
    }

    renderCreateForm() {
        this.listPanel.innerHTML = '';
        this.detailsPanel.innerHTML = `
      <div class="contract-form">
        <div class="form-group">
          <label class="form-label">Contract Type</label>
          <select class="form-select" id="contract-type">
            <option value="bounty">🎯 Bounty (100-50,000 CR)</option>
            <option value="data_theft">📁 Data Theft (200-10,000 CR)</option>
            <option value="defense">🛡️ Network Defense (500-5,000 CR)</option>
            <option value="delivery">📦 Courier (50-2,000 CR)</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" id="contract-desc" placeholder="Optional details..."></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">Reward (CR)</label>
          <input type="number" class="form-input" id="contract-reward" placeholder="500" min="50" max="50000" value="500">
          <div class="form-hint">You'll escrow 120% of this amount as collateral</div>
        </div>
        
        <div class="form-cost">
          <div class="form-cost-row">
            <span>Collateral (120%)</span>
            <span id="cost-collateral">600 CR</span>
          </div>
          <div class="form-cost-row">
            <span>Creation Fee</span>
            <span>50 CR</span>
          </div>
          <div class="form-cost-row total">
            <span>Total Cost</span>
            <span id="cost-total">650 CR</span>
          </div>
        </div>
        
        <div id="create-result" style="text-align: center; margin: 12px 0;"></div>
        
        <button class="contract-btn create" onclick="window.contractUI?.createContract()">
          Create Contract
        </button>
      </div>
    `;

        // Update cost on reward change
        document.getElementById('contract-reward')?.addEventListener('input', (e) => {
            const reward = parseInt(e.target.value) || 0;
            const collateral = Math.floor(reward * 1.2);
            const total = collateral + 50;
            document.getElementById('cost-collateral').textContent = `${collateral} CR`;
            document.getElementById('cost-total').textContent = `${total} CR`;
        });
    }

    createContract() {
        const type = document.getElementById('contract-type')?.value;
        const description = document.getElementById('contract-desc')?.value || '';
        const reward = parseInt(document.getElementById('contract-reward')?.value) || 0;
        const resultEl = document.getElementById('create-result');

        if (reward <= 0) {
            if (resultEl) resultEl.innerHTML = '<span style="color: #f85149;">Enter a valid reward</span>';
            return;
        }

        if (this.game.ws && this.game.ws.readyState === WebSocket.OPEN) {
            this.game.ws.send(JSON.stringify({
                type: 'CONTRACT_CREATE',
                payload: { type, description, reward }
            }));
            if (resultEl) resultEl.innerHTML = '<span style="color: #7d8590;">Creating...</span>';
        }
    }

    acceptContract(contractId) {
        if (this.game.ws && this.game.ws.readyState === WebSocket.OPEN) {
            this.game.ws.send(JSON.stringify({
                type: 'CONTRACT_ACCEPT',
                payload: { contractId }
            }));
        }
    }

    cancelContract(contractId) {
        if (this.game.ws && this.game.ws.readyState === WebSocket.OPEN) {
            this.game.ws.send(JSON.stringify({
                type: 'CONTRACT_CANCEL',
                payload: { contractId }
            }));
            setTimeout(() => this.requestContracts(), 500);
        }
    }
}

// Export for use
window.ContractUI = ContractUI;
