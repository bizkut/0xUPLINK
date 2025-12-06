/**
 * Login Screen Module
 * Handles user authentication UI with hacker aesthetic
 */

class LoginScreen {
    constructor(game) {
        this.game = game;
        this.currentMode = 'login'; // 'login' or 'register'
        this.isLoading = false;

        this.init();
    }

    init() {
        this.createDOM();
        this.attachEvents();
        this.initMatrixRain();
    }

    createDOM() {
        const screen = document.createElement('div');
        screen.id = 'login-screen';
        screen.innerHTML = `
      <canvas id="matrix-rain"></canvas>
      
      <div class="login-window">
        <div class="window-titlebar">
          <div class="window-controls">
            <span class="window-dot close"></span>
            <span class="window-dot minimize"></span>
            <span class="window-dot maximize"></span>
          </div>
          <span class="window-title">UPLINK_AUTH.exe</span>
        </div>
        
        <div class="window-content">
          <div class="login-header">
            <div class="login-logo">0xUPLINK</div>
            <div class="login-subtitle">Neural Network Access Terminal</div>
          </div>
          
          <div class="error-message" id="auth-error"></div>
          <div class="success-message" id="auth-success"></div>
          
          <div class="form-container">
            <!-- Login Form -->
            <form class="auth-form active" id="login-form">
              <div class="input-group">
                <label class="input-label">USERNAME</label>
                <input type="text" class="input-field" id="login-username" 
                       placeholder="Enter username..." autocomplete="off" required>
              </div>
              
              <div class="input-group">
                <label class="input-label">PASSWORD</label>
                <input type="password" class="input-field" id="login-password" 
                       placeholder="Enter password..." required>
              </div>
              
              <button type="submit" class="submit-btn" id="login-btn">
                INITIALIZE CONNECTION
              </button>
              
              <div class="auth-toggle">
                <span class="toggle-text">New to the network? </span>
                <a class="toggle-link" id="show-register">Create Access Key</a>
              </div>
            </form>
            
            <!-- Register Form -->
            <form class="auth-form hidden" id="register-form">
              <div class="input-group">
                <label class="input-label">USERNAME</label>
                <input type="text" class="input-field" id="register-username" 
                       placeholder="Choose username..." autocomplete="off" required minlength="3">
              </div>
              
              <div class="input-group">
                <label class="input-label">PASSWORD</label>
                <input type="password" class="input-field" id="register-password" 
                       placeholder="Create password..." required minlength="6">
              </div>
              
              <div class="input-group">
                <label class="input-label">CONFIRM PASSWORD</label>
                <input type="password" class="input-field" id="register-confirm" 
                       placeholder="Confirm password..." required>
              </div>
              
              <button type="submit" class="submit-btn" id="register-btn">
                GENERATE ACCESS KEY
              </button>
              
              <div class="auth-toggle">
                <span class="toggle-text">Already have access? </span>
                <a class="toggle-link" id="show-login">Login Here</a>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <div class="boot-text">UPLINK v0.4.0 // Neural Gateway Systems</div>
    `;

        document.body.prepend(screen);
        document.body.classList.add('show-login');

        // Cache elements
        this.screen = screen;
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.errorEl = document.getElementById('auth-error');
        this.successEl = document.getElementById('auth-success');
    }

    attachEvents() {
        // Form submissions
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));

        // Toggle between forms
        document.getElementById('show-register').addEventListener('click', () => this.showForm('register'));
        document.getElementById('show-login').addEventListener('click', () => this.showForm('login'));

        // Enter key handling
        document.querySelectorAll('.input-field').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const form = input.closest('form');
                    form.dispatchEvent(new Event('submit'));
                }
            });
        });
    }

    showForm(mode) {
        this.currentMode = mode;
        this.hideMessages();

        const loginForm = this.loginForm;
        const registerForm = this.registerForm;

        if (mode === 'register') {
            loginForm.classList.remove('active');
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            registerForm.classList.add('active');
            document.getElementById('register-username').focus();
        } else {
            registerForm.classList.remove('active');
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            loginForm.classList.add('active');
            document.getElementById('login-username').focus();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        if (this.isLoading) return;

        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            this.showError('Please enter username and password');
            return;
        }

        this.setLoading(true, 'login-btn');
        this.hideMessages();

        try {
            const result = await this.game.login(username, password);

            if (result.error) {
                this.showError(result.error);
            } else {
                this.showSuccess('Access granted. Initializing neural link...');
                setTimeout(() => this.hide(), 1500);
            }
        } catch (err) {
            this.showError('Connection failed. Please try again.');
        } finally {
            this.setLoading(false, 'login-btn');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        if (this.isLoading) return;

        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;

        if (!username || !password || !confirm) {
            this.showError('All fields are required');
            return;
        }

        if (password !== confirm) {
            this.showError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }

        this.setLoading(true, 'register-btn');
        this.hideMessages();

        try {
            const result = await this.game.register(username, password);

            if (result.error) {
                this.showError(result.error);
            } else {
                this.showSuccess('Access key generated. Welcome to the network!');
                setTimeout(() => this.hide(), 1500);
            }
        } catch (err) {
            this.showError('Registration failed. Please try again.');
        } finally {
            this.setLoading(false, 'register-btn');
        }
    }

    setLoading(loading, btnId) {
        this.isLoading = loading;
        const btn = document.getElementById(btnId);
        if (loading) {
            btn.classList.add('loading');
            btn.disabled = true;
        } else {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }

    showError(msg) {
        this.errorEl.textContent = msg;
        this.errorEl.classList.add('visible');
        this.successEl.classList.remove('visible');
    }

    showSuccess(msg) {
        this.successEl.textContent = msg;
        this.successEl.classList.add('visible');
        this.errorEl.classList.remove('visible');
    }

    hideMessages() {
        this.errorEl.classList.remove('visible');
        this.successEl.classList.remove('visible');
    }

    hide() {
        this.screen.classList.add('hidden');
        document.body.classList.remove('show-login');

        // Focus terminal after login
        const terminalInput = document.getElementById('terminal-input');
        if (terminalInput) terminalInput.focus();
    }

    show() {
        this.screen.classList.remove('hidden');
        document.body.classList.add('show-login');
    }

    // Matrix Rain Effect
    initMatrixRain() {
        const canvas = document.getElementById('matrix-rain');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
        const fontSize = 14;
        const columns = Math.floor(canvas.width / fontSize);
        const drops = new Array(columns).fill(1);

        const draw = () => {
            ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#00ff41';
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const char = chars[Math.floor(Math.random() * chars.length)];
                const x = i * fontSize;
                const y = drops[i] * fontSize;

                ctx.fillStyle = `rgba(0, 255, 65, ${Math.random() * 0.5 + 0.5})`;
                ctx.fillText(char, x, y);

                if (y > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        setInterval(draw, 50);
    }
}

// Export for use in main.js
window.LoginScreen = LoginScreen;
