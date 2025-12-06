export class NodeMap {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.overlay = null;
    this.network = null;
    this.currentNode = null;
    this.nodePositions = {};
    this.animationFrame = null;
  }

  init() {
    this.canvas = document.getElementById('node-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.overlay = document.getElementById('node-overlay');

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.startAnimation();
  }

  resize() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;

    if (this.network) {
      this.calculatePositions();
      this.render();
    }
  }

  setNetwork(network) {
    this.network = network;
    this.calculatePositions();
    this.renderNodes();
  }

  setCurrentNode(nodeId) {
    this.currentNode = nodeId;
    this.updateNodeStates();
  }

  updateNode(nodeId, updates) {
    if (!this.network) return;

    const node = this.network.nodes.find(n => n.id === nodeId);
    if (node) {
      Object.assign(node, updates);
      this.updateNodeStates();
    }
  }

  clear() {
    this.network = null;
    this.currentNode = null;
    this.nodePositions = {};
    this.overlay.innerHTML = '';
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    document.getElementById('target-name').textContent = 'NO CONNECTION';
  }

  calculatePositions() {
    if (!this.network) return;

    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const nodes = this.network.nodes;

    // Simple force-directed-ish layout
    // Start with gateway on left, spread others to the right
    const levelMap = {};
    const visited = new Set();
    const queue = [{ id: 'gateway', level: 0 }];

    while (queue.length > 0) {
      const { id, level } = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);

      if (!levelMap[level]) levelMap[level] = [];
      levelMap[level].push(id);

      const node = nodes.find(n => n.id === id);
      if (node) {
        node.connections.forEach(connId => {
          if (!visited.has(connId)) {
            queue.push({ id: connId, level: level + 1 });
          }
        });
      }
    }

    const levels = Object.keys(levelMap).length;
    const levelWidth = (width - 120) / Math.max(levels, 1);

    Object.entries(levelMap).forEach(([level, nodeIds]) => {
      const levelNum = parseInt(level);
      const x = 60 + levelNum * levelWidth + levelWidth / 2;
      const nodeHeight = (height - 60) / (nodeIds.length + 1);

      nodeIds.forEach((nodeId, i) => {
        const y = 30 + (i + 1) * nodeHeight;
        this.nodePositions[nodeId] = { x, y };
      });
    });
  }

  renderNodes() {
    if (!this.network) return;

    this.overlay.innerHTML = '';

    document.getElementById('target-name').textContent =
      `${this.network.owner} @ ${this.network.ip}`;

    this.network.nodes.forEach(node => {
      const pos = this.nodePositions[node.id];
      if (!pos) return;

      const el = document.createElement('div');
      el.className = 'node';
      el.dataset.id = node.id;

      let stateClass = '';
      if (node.id === this.currentNode) stateClass = 'current';
      else if (node.breached) stateClass = 'breached';
      else if (node.ice) stateClass = 'locked';

      el.innerHTML = `
        <div class="node-icon ${node.shape || 'circle'} ${stateClass}">
          <span>${node.icon}</span>
        </div>
        <div class="node-label">${node.id.split('_')[0]}</div>
      `;

      el.style.left = `${pos.x - 30}px`;
      el.style.top = `${pos.y - 30}px`;

      el.addEventListener('click', () => this.onNodeClick(node.id));

      this.overlay.appendChild(el);
    });

    this.render();
  }

  updateNodeStates() {
    if (!this.network) return;

    this.network.nodes.forEach(node => {
      const el = this.overlay.querySelector(`[data-id="${node.id}"]`);
      if (!el) return;

      const iconEl = el.querySelector('.node-icon');
      iconEl.classList.remove('current', 'breached', 'locked', 'ice');

      if (node.id === this.currentNode) {
        iconEl.classList.add('current');
      } else if (node.breached) {
        iconEl.classList.add('breached');
      } else if (node.ice) {
        iconEl.classList.add('locked');
      }
    });
  }

  onNodeClick(nodeId) {
    // Dispatch custom event for game to handle
    window.dispatchEvent(new CustomEvent('node-click', { detail: { nodeId } }));

    // Also try to move via terminal command
    if (window.app) {
      window.app.terminal.executeCommand(`move ${nodeId}`);
    }
  }

  render() {
    if (!this.network) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw connections - EVE style colors
    this.ctx.lineWidth = 1;

    this.network.nodes.forEach(node => {
      const pos = this.nodePositions[node.id];
      if (!pos) return;

      node.connections.forEach(connId => {
        const connPos = this.nodePositions[connId];
        if (!connPos) return;

        // Determine line color based on node states - EVE theme
        const connNode = this.network.nodes.find(n => n.id === connId);
        if (node.breached && connNode && connNode.breached) {
          this.ctx.strokeStyle = 'rgba(68, 170, 102, 0.5)'; // Green for breached
        } else if (node.id === this.currentNode || connId === this.currentNode) {
          this.ctx.strokeStyle = 'rgba(255, 153, 0, 0.6)'; // Amber for current
        } else {
          this.ctx.strokeStyle = 'rgba(58, 69, 85, 0.8)'; // Dark blue-gray
        }

        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        this.ctx.lineTo(connPos.x, connPos.y);
        this.ctx.stroke();
      });
    });

    // Draw device shapes on canvas
    this.drawDevices();

    // Draw data flow animation on breached paths
    this.drawDataFlow();
  }

  drawDevices() {
    if (!this.network) return;

    this.network.nodes.forEach(node => {
      const pos = this.nodePositions[node.id];
      if (!pos) return;

      const radius = 18;

      // Determine colors based on state
      let fillColor = 'rgba(20, 25, 35, 0.9)';
      let strokeColor = 'rgba(58, 69, 85, 1)';

      if (node.id === this.currentNode) {
        strokeColor = 'rgba(255, 153, 0, 1)'; // Amber
        fillColor = 'rgba(255, 153, 0, 0.15)';
      } else if (node.breached) {
        strokeColor = 'rgba(68, 170, 102, 1)'; // Green
        fillColor = 'rgba(68, 170, 102, 0.15)';
      } else if (node.ice) {
        strokeColor = 'rgba(204, 68, 68, 1)'; // Red for locked
        fillColor = 'rgba(204, 68, 68, 0.1)';
      }

      // Draw based on node shape
      this.ctx.fillStyle = fillColor;
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = 2;

      switch (node.shape) {
        case 'square':
          this.ctx.beginPath();
          this.ctx.rect(pos.x - radius, pos.y - radius, radius * 2, radius * 2);
          this.ctx.fill();
          this.ctx.stroke();
          break;
        case 'diamond':
          this.ctx.beginPath();
          this.ctx.moveTo(pos.x, pos.y - radius);
          this.ctx.lineTo(pos.x + radius, pos.y);
          this.ctx.lineTo(pos.x, pos.y + radius);
          this.ctx.lineTo(pos.x - radius, pos.y);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
          break;
        case 'hexagon':
          this.drawHexagon(pos.x, pos.y, radius);
          this.ctx.fill();
          this.ctx.stroke();
          break;
        case 'triangle':
          this.ctx.beginPath();
          this.ctx.moveTo(pos.x, pos.y - radius);
          this.ctx.lineTo(pos.x + radius, pos.y + radius * 0.8);
          this.ctx.lineTo(pos.x - radius, pos.y + radius * 0.8);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
          break;
        default: // circle
          this.ctx.beginPath();
          this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();
      }
    });
  }

  drawHexagon(x, y, radius) {
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const px = x + radius * Math.cos(angle);
      const py = y + radius * Math.sin(angle);
      if (i === 0) this.ctx.moveTo(px, py);
      else this.ctx.lineTo(px, py);
    }
    this.ctx.closePath();
  }

  drawDataFlow() {
    if (!this.network) return;

    const time = Date.now() / 1000;

    this.network.nodes.forEach(node => {
      if (!node.breached) return;
      const pos = this.nodePositions[node.id];
      if (!pos) return;

      node.connections.forEach(connId => {
        const connNode = this.network.nodes.find(n => n.id === connId);
        if (!connNode || !connNode.breached) return;

        const connPos = this.nodePositions[connId];
        if (!connPos) return;

        // Animated dot along the line
        const progress = (time % 2) / 2;
        const x = pos.x + (connPos.x - pos.x) * progress;
        const y = pos.y + (connPos.y - pos.y) * progress;

        this.ctx.fillStyle = 'rgba(0, 255, 157, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 3, 0, Math.PI * 2);
        this.ctx.fill();
      });
    });
  }

  startAnimation() {
    const animate = () => {
      if (this.network) {
        this.render();
      }
      this.animationFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  stopAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}
