/**
 * Market UI - Eve Online Style Interactive Market
 * Handles market browsing, searching, and buying
 */

export class MarketUI {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.currentCategory = 'all';
    this.currentTab = 'buy'; // 'buy', 'sell', or 'my-orders'
    this.selectedOrder = null;
    this.orders = [];       // All market orders
    this.myOrders = [];     // Current player's orders
    this.searchQuery = '';
    this.sortColumn = 'itemName';
    this.sortDirection = 'asc';

    this.init();
  }

  init() {
    this.createDOM();
    this.attachEvents();
  }

  createDOM() {
    const modal = document.createElement('div');
    modal.id = 'market-modal';
    modal.innerHTML = `
      <div class="market-window">
        <!-- Header -->
        <div class="market-header">
          <span class="market-title">📊 Regional Market</span>
          <button class="market-close" id="market-close">×</button>
        </div>

        <!-- Tabs -->
        <div class="market-tabs">
          <button class="market-tab active" data-tab="buy">Buy Orders</button>
          <button class="market-tab" data-tab="sell">Sell Orders</button>
          <button class="market-tab" data-tab="my-orders">My Orders</button>
        </div>

        <!-- Body -->
        <div class="market-body">
          <!-- Left: Categories -->
          <div class="market-categories">
            <div class="category-header">Categories</div>
            <div class="category-item active" data-category="all">
              All Items <span class="count" id="cat-count-all">0</span>
            </div>
            <div class="category-item" data-category="computer">
              Computers <span class="count" id="cat-count-computer">0</span>
            </div>
            <div class="category-item" data-category="module">
              Modules <span class="count" id="cat-count-module">0</span>
            </div>
            <div class="category-header" style="margin-top: 8px;">Module Types</div>
            <div class="category-item" data-category="core">
              ├ Core <span class="count" id="cat-count-core">0</span>
            </div>
            <div class="category-item" data-category="memory">
              ├ Memory <span class="count" id="cat-count-memory">0</span>
            </div>
            <div class="category-item" data-category="expansion">
              └ Expansion <span class="count" id="cat-count-expansion">0</span>
            </div>
          </div>

          <!-- Center: Item List -->
          <div class="market-items">
            <div class="market-search">
              <input type="text" id="market-search-input" placeholder="Search items..." autocomplete="off">
            </div>
            <div class="market-table-container">
              <table class="market-table">
                <thead>
                  <tr>
                    <th data-sort="itemName">Item</th>
                    <th data-sort="quantity">Qty</th>
                    <th data-sort="price">Price</th>
                    <th data-sort="itemTier">Tier</th>
                  </tr>
                </thead>
                <tbody id="market-table-body">
                  <!-- Items populated dynamically -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- Right: Details -->
          <div class="market-details" id="market-details">
            <div class="market-empty">
              <div class="market-empty-icon">📦</div>
              <div class="market-empty-text">Select an item</div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modal = modal;
    this.tableBody = document.getElementById('market-table-body');
    this.detailsPanel = document.getElementById('market-details');
    this.searchInput = document.getElementById('market-search-input');
  }

  attachEvents() {
    // Close button
    document.getElementById('market-close').addEventListener('click', () => this.close());

    // Click outside to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    // Category clicks
    this.modal.querySelectorAll('.category-item').forEach(el => {
      el.addEventListener('click', () => {
        this.modal.querySelectorAll('.category-item').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
        this.currentCategory = el.dataset.category;
        this.renderTable();
      });
    });

    // Tab clicks
    this.modal.querySelectorAll('.market-tab').forEach(el => {
      el.addEventListener('click', () => {
        this.modal.querySelectorAll('.market-tab').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
        this.currentTab = el.dataset.tab;
        this.selectedOrder = null;
        this.renderView();
      });
    });

    // Search input
    this.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.renderTable();
    });

    // Column sorting
    this.modal.querySelectorAll('.market-table th[data-sort]').forEach(el => {
      el.addEventListener('click', () => {
        const column = el.dataset.sort;
        if (this.sortColumn === column) {
          this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortColumn = column;
          this.sortDirection = 'asc';
        }
        this.updateSortIndicators();
        this.renderTable();
      });
    });

    // Listen for market data from server
    window.addEventListener('market-list-result', (e) => {
      if (this.isOpen && e.detail) {
        this.updateOrders(e.detail.orders || [], e.detail.myOrders || []);
      }
    });

    // Listen for buy result
    window.addEventListener('market-buy-result', (e) => {
      if (this.isOpen && e.detail) {
        this.handleBuyResult(e.detail);
      }
    });

    // Listen for sell result
    window.addEventListener('market-sell-result', (e) => {
      if (this.isOpen && e.detail) {
        const resultEl = document.getElementById('sell-result');
        if (e.detail.success) {
          if (resultEl) resultEl.innerHTML = '<span style="color: #3fb950;">✓ Order created!</span>';
          setTimeout(() => this.requestMarketData(), 500);
        } else {
          if (resultEl) resultEl.innerHTML = `<span style="color: #f85149;">${e.detail.error || 'Failed'}</span>`;
        }
      }
    });

    // Listen for cancel result
    window.addEventListener('market-cancel-result', (e) => {
      if (this.isOpen && e.detail) {
        this.requestMarketData();
      }
    });

    // Store reference for onclick handlers
    window.marketUI = this;
  }

  updateSortIndicators() {
    this.modal.querySelectorAll('.market-table th').forEach(th => {
      th.classList.remove('sorted-asc', 'sorted-desc');
      if (th.dataset.sort === this.sortColumn) {
        th.classList.add(`sorted-${this.sortDirection}`);
      }
    });
  }

  open() {
    this.isOpen = true;
    this.modal.classList.add('visible');
    this.searchInput.focus();
    this.requestMarketData();
  }

  close() {
    this.isOpen = false;
    this.modal.classList.remove('visible');
    this.selectedOrder = null;
  }

  requestMarketData() {
    // Send raw message without messageId so response goes to event handler
    if (this.game.ws && this.game.ws.readyState === WebSocket.OPEN) {
      this.game.ws.send(JSON.stringify({
        type: 'MARKET_LIST',
        payload: {}
      }));
    }
  }

  updateOrders(orders, myOrders = []) {
    this.orders = orders || [];
    this.myOrders = myOrders || [];
    this.updateCategoryCounts();
    this.renderView();
  }

  renderView() {
    // Render based on current tab
    if (this.currentTab === 'my-orders') {
      this.renderMyOrders();
    } else if (this.currentTab === 'sell') {
      this.renderSellForm();
    } else {
      this.renderTable();
    }
  }

  updateCategoryCounts() {
    const counts = {
      all: this.orders.length,
      computer: 0,
      module: 0,
      core: 0,
      memory: 0,
      expansion: 0
    };

    this.orders.forEach(o => {
      if (o.itemType === 'computer') counts.computer++;
      if (o.itemType === 'module') {
        counts.module++;
        if (o.itemCategory === 'core') counts.core++;
        if (o.itemCategory === 'memory') counts.memory++;
        if (o.itemCategory === 'expansion') counts.expansion++;
      }
    });

    Object.keys(counts).forEach(key => {
      const el = document.getElementById(`cat-count-${key}`);
      if (el) el.textContent = counts[key];
    });
  }

  getFilteredOrders() {
    let filtered = [...this.orders];

    // Category filter
    if (this.currentCategory !== 'all') {
      if (['computer', 'module'].includes(this.currentCategory)) {
        filtered = filtered.filter(o => o.itemType === this.currentCategory);
      } else {
        // Module subcategories
        filtered = filtered.filter(o => o.itemCategory === this.currentCategory);
      }
    }

    // Search filter
    if (this.searchQuery) {
      filtered = filtered.filter(o =>
        o.itemName?.toLowerCase().includes(this.searchQuery) ||
        o.itemId?.toLowerCase().includes(this.searchQuery)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[this.sortColumn];
      let bVal = b[this.sortColumn];

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }

  renderTable() {
    const orders = this.getFilteredOrders();

    if (orders.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: #484f58; padding: 40px;">
            No items found
          </td>
        </tr>
      `;
      return;
    }

    this.tableBody.innerHTML = orders.map(order => `
      <tr data-order-id="${order.id}" class="${this.selectedOrder?.id === order.id ? 'selected' : ''}">
        <td>
          ${order.itemName}
          <span class="tier-badge tier-${order.itemTier || 1}">T${order.itemTier || 1}</span>
        </td>
        <td>${order.quantity || order.amount || 1}</td>
        <td class="price-cell">${this.formatCredits(order.price || order.pricePerUnit)}</td>
        <td>${order.itemCategory || order.itemType || '-'}</td>
      </tr>
    `).join('');

    // Row click handlers
    this.tableBody.querySelectorAll('tr[data-order-id]').forEach(row => {
      row.addEventListener('click', () => {
        const orderId = row.dataset.orderId;
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
          this.selectOrder(order);
          // Update selection UI
          this.tableBody.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
          row.classList.add('selected');
        }
      });
    });
  }

  selectOrder(order) {
    this.selectedOrder = order;
    this.renderDetails(order);
  }

  renderDetails(order) {
    const maxQty = order.quantity || order.amount || 1;

    this.detailsPanel.innerHTML = `
      <div class="details-header">
        <div class="details-title">${order.itemName}</div>
        <div class="details-category">${order.itemType} - ${order.itemCategory || 'General'}</div>
      </div>
      
      <div class="details-body">
        <div class="details-section">
          <div class="details-section-title">Market Info</div>
          <div class="details-row">
            <span class="label">Seller</span>
            <span class="value">${order.seller || 'Anonymous'}</span>
          </div>
          <div class="details-row">
            <span class="label">Available</span>
            <span class="value">${maxQty}</span>
          </div>
          <div class="details-row">
            <span class="label">Price Each</span>
            <span class="value price">${this.formatCredits(order.price || order.pricePerUnit)}</span>
          </div>
          <div class="details-row">
            <span class="label">Tier</span>
            <span class="value">T${order.itemTier || 1}</span>
          </div>
        </div>
        
        <div class="details-section">
          <div class="details-section-title">Item Stats</div>
          <div class="details-row">
            <span class="label">Type</span>
            <span class="value">${order.itemType}</span>
          </div>
          <div class="details-row">
            <span class="label">Category</span>
            <span class="value">${order.itemCategory || '-'}</span>
          </div>
        </div>
      </div>
      
      <div class="buy-section">
        <div class="quantity-input">
          <label>Quantity</label>
          <input type="number" id="buy-quantity" min="1" max="${maxQty}" value="1">
        </div>
        <div class="total-row">
          <span class="label">Total Cost</span>
          <span class="value" id="buy-total">${this.formatCredits(order.price || order.pricePerUnit)}</span>
        </div>
        <button class="buy-btn" id="buy-btn">Buy Now</button>
      </div>
    `;

    // Quantity input handler
    const qtyInput = document.getElementById('buy-quantity');
    const totalEl = document.getElementById('buy-total');
    const price = order.price || order.pricePerUnit;

    qtyInput.addEventListener('input', () => {
      let qty = parseInt(qtyInput.value) || 1;
      qty = Math.max(1, Math.min(qty, maxQty));
      qtyInput.value = qty;
      totalEl.textContent = this.formatCredits(price * qty);
    });

    // Buy button
    document.getElementById('buy-btn').addEventListener('click', () => {
      const qty = parseInt(qtyInput.value) || 1;
      this.buyItem(order, qty);
    });
  }

  buyItem(order, quantity) {
    if (this.game.ws && this.game.ws.readyState === WebSocket.OPEN) {
      this.game.ws.send(JSON.stringify({
        type: 'MARKET_BUY',
        payload: {
          orderId: order.id,
          quantity: quantity
        }
      }));
    }
  }

  handleBuyResult(result) {
    if (result.success) {
      // Refresh market data
      this.requestMarketData();
      // Show success in details panel
      if (this.detailsPanel) {
        const buySection = this.detailsPanel.querySelector('.buy-section');
        if (buySection) {
          buySection.innerHTML = `
            <div style="text-align: center; color: #3fb950; padding: 20px;">
              ✓ Purchase successful!
            </div>
          `;
        }
      }
    } else {
      alert(result.error || 'Purchase failed');
    }
  }

  formatCredits(amount) {
    if (!amount) return '0 CR';
    return amount.toLocaleString() + ' CR';
  }

  // Render Sell Form for creating sell orders
  renderSellForm() {
    // Get player resources for sell dropdown
    const resources = this.game.state?.player?.resources || {};

    this.tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="padding: 20px;">
          <div style="max-width: 400px; margin: 0 auto;">
            <div style="font-size: 14px; color: #00ff41; margin-bottom: 16px; text-transform: uppercase;">
              Create Sell Order
            </div>
            
            <div style="margin-bottom: 12px;">
              <label style="display: block; color: #7d8590; font-size: 10px; margin-bottom: 4px;">RESOURCE</label>
              <select id="sell-resource" style="width: 100%; padding: 8px; background: #161b22; border: 1px solid #30363d; color: #c9d1d9; font-family: 'Courier New', monospace;">
                <option value="">Select resource...</option>
                <option value="data_packets">Data Packets (${resources.data_packets || 0})</option>
                <option value="crypto_keys">Crypto Keys (${resources.crypto_keys || 0})</option>
                <option value="access_tokens">Access Tokens (${resources.access_tokens || 0})</option>
                <option value="exploit_code">Exploit Code (${resources.exploit_code || 0})</option>
              </select>
            </div>
            
            <div style="margin-bottom: 12px;">
              <label style="display: block; color: #7d8590; font-size: 10px; margin-bottom: 4px;">AMOUNT</label>
              <input type="number" id="sell-amount" min="1" value="1" style="width: 100%; padding: 8px; background: #161b22; border: 1px solid #30363d; color: #00ff41; font-family: 'Courier New', monospace;">
            </div>
            
            <div style="margin-bottom: 16px;">
              <label style="display: block; color: #7d8590; font-size: 10px; margin-bottom: 4px;">PRICE PER UNIT (CR)</label>
              <input type="number" id="sell-price" min="1" value="10" style="width: 100%; padding: 8px; background: #161b22; border: 1px solid #30363d; color: #3fb950; font-family: 'Courier New', monospace;">
            </div>
            
            <button id="create-sell-order" class="buy-btn" style="width: 100%;">
              Create Sell Order
            </button>
            
            <div id="sell-result" style="margin-top: 12px; text-align: center;"></div>
          </div>
        </td>
      </tr>
    `;

    // Clear details panel
    this.detailsPanel.innerHTML = `
      <div class="market-empty">
        <div class="market-empty-icon">💰</div>
        <div class="market-empty-text">Sell Resources</div>
      </div>
    `;

    // Attach sell button handler
    document.getElementById('create-sell-order')?.addEventListener('click', () => {
      this.createSellOrder();
    });
  }

  // Create a sell order
  createSellOrder() {
    const resourceType = document.getElementById('sell-resource')?.value;
    const amount = parseInt(document.getElementById('sell-amount')?.value) || 0;
    const pricePerUnit = parseInt(document.getElementById('sell-price')?.value) || 0;
    const resultEl = document.getElementById('sell-result');

    if (!resourceType) {
      if (resultEl) resultEl.innerHTML = '<span style="color: #f85149;">Select a resource</span>';
      return;
    }
    if (amount <= 0 || pricePerUnit <= 0) {
      if (resultEl) resultEl.innerHTML = '<span style="color: #f85149;">Invalid amount or price</span>';
      return;
    }

    // Send sell order request
    if (this.game.ws && this.game.ws.readyState === WebSocket.OPEN) {
      this.game.ws.send(JSON.stringify({
        type: 'MARKET_SELL',
        payload: { resourceType, amount, pricePerUnit }
      }));

      if (resultEl) resultEl.innerHTML = '<span style="color: #7d8590;">Creating order...</span>';
    }
  }

  // Render My Orders tab
  renderMyOrders() {
    if (this.myOrders.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: #484f58; padding: 40px;">
            You have no active orders
          </td>
        </tr>
      `;
      this.detailsPanel.innerHTML = `
        <div class="market-empty">
          <div class="market-empty-icon">📋</div>
          <div class="market-empty-text">No active orders</div>
        </div>
      `;
      return;
    }

    this.tableBody.innerHTML = this.myOrders.map(order => `
      <tr data-order-id="${order.id}">
        <td>
          ${order.itemName || order.resource}
          <span class="tier-badge tier-${order.itemTier || 1}">T${order.itemTier || 1}</span>
        </td>
        <td>${order.quantity || order.amount || 1}</td>
        <td class="price-cell">${this.formatCredits(order.price || order.pricePerUnit)}</td>
        <td>
          <button class="cancel-order-btn" data-order-id="${order.id}" 
                  style="padding: 4px 8px; background: #f85149; border: none; color: #fff; cursor: pointer; font-size: 10px;">
            CANCEL
          </button>
        </td>
      </tr>
    `).join('');

    // Attach cancel handlers
    this.tableBody.querySelectorAll('.cancel-order-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const orderId = btn.dataset.orderId;
        this.cancelOrder(orderId);
      });
    });

    // Row click for details
    this.tableBody.querySelectorAll('tr[data-order-id]').forEach(row => {
      row.addEventListener('click', () => {
        const orderId = row.dataset.orderId;
        const order = this.myOrders.find(o => o.id === orderId);
        if (order) this.renderMyOrderDetails(order);
      });
    });

    // Clear details
    this.detailsPanel.innerHTML = `
      <div class="market-empty">
        <div class="market-empty-icon">📋</div>
        <div class="market-empty-text">Select an order</div>
      </div>
    `;
  }

  renderMyOrderDetails(order) {
    this.detailsPanel.innerHTML = `
      <div class="details-header">
        <div class="details-title">${order.itemName || order.resource}</div>
        <div class="details-category">Your Sell Order</div>
      </div>
      
      <div class="details-body">
        <div class="details-section">
          <div class="details-section-title">Order Info</div>
          <div class="details-row">
            <span class="label">Amount</span>
            <span class="value">${order.quantity || order.amount}</span>
          </div>
          <div class="details-row">
            <span class="label">Price Each</span>
            <span class="value price">${this.formatCredits(order.price || order.pricePerUnit)}</span>
          </div>
          <div class="details-row">
            <span class="label">Total Value</span>
            <span class="value price">${this.formatCredits((order.price || order.pricePerUnit) * (order.quantity || order.amount))}</span>
          </div>
        </div>
      </div>
      
      <div class="buy-section">
        <button class="buy-btn" style="background: linear-gradient(180deg, #f85149 0%, #da3633 100%); border-color: #f85149;" 
                onclick="window.marketUI?.cancelOrder('${order.id}')">
          Cancel Order
        </button>
      </div>
    `;
  }

  cancelOrder(orderId) {
    if (this.game.ws && this.game.ws.readyState === WebSocket.OPEN) {
      this.game.ws.send(JSON.stringify({
        type: 'MARKET_CANCEL',
        payload: { orderId }
      }));

      // Refresh after short delay
      setTimeout(() => this.requestMarketData(), 500);
    }
  }
}

// Export for use
window.MarketUI = MarketUI;
