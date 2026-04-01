const LoginPage = {
    async render(container) {
        container.innerHTML = `
            <div style="max-width:420px;margin:60px auto;">
                <div style="text-align:center;margin-bottom:32px;">
                    <h1 style="font-size:32px;color:var(--primary);font-weight:800;">RideFair</h1>
                    <p style="color:var(--text-secondary);margin-top:6px;">Track shared rides, split costs fairly</p>
                </div>
                <div class="card">
                    <div class="toggle-group" style="margin-bottom:20px;justify-content:center;">
                        <div class="toggle-option active" id="tab-login" onclick="LoginPage.switchTab('login')">Sign In</div>
                        <div class="toggle-option" id="tab-register" onclick="LoginPage.switchTab('register')">Register</div>
                    </div>
                    <form id="login-form">
                        <div class="form-group">
                            <label>Username</label>
                            <input type="text" id="auth-username" placeholder="e.g. karthik" required autocomplete="username">
                        </div>
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" id="auth-password" placeholder="Enter password" required autocomplete="current-password">
                        </div>
                        <div id="register-fields" style="display:none;">
                            <div class="form-group">
                                <label>Display Name</label>
                                <input type="text" id="auth-name" placeholder="e.g. Karthik" autocomplete="name">
                            </div>
                            <div class="form-group">
                                <label>Phone (optional)</label>
                                <input type="text" id="auth-phone" placeholder="e.g. 9876543210" autocomplete="tel">
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px;" id="auth-submit-btn">Sign In</button>
                    </form>
                    <div id="auth-error" style="margin-top:12px;display:none;padding:10px 14px;background:var(--danger-light);color:var(--danger);border-radius:8px;font-size:14px;"></div>
                </div>
            </div>
        `;

        this.isRegister = false;

        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorEl = document.getElementById('auth-error');
            errorEl.style.display = 'none';

            const username = document.getElementById('auth-username').value.trim();
            const password = document.getElementById('auth-password').value;

            if (!username || !password) {
                errorEl.textContent = 'Please fill in all required fields';
                errorEl.style.display = 'block';
                return;
            }

            try {
                if (this.isRegister) {
                    const name = document.getElementById('auth-name').value.trim();
                    const phone = document.getElementById('auth-phone').value.trim();
                    if (!name) {
                        errorEl.textContent = 'Display name is required for registration';
                        errorEl.style.display = 'block';
                        return;
                    }
                    const res = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, username, password, phone: phone || null })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Registration failed');
                    Toast.success('Account created! Signing you in...');
                }

                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Login failed');

                Store.setLoggedInUser(data);
                Toast.success(`Welcome, ${data.name}!`);
                location.hash = '#/';
            } catch (e) {
                errorEl.textContent = e.message;
                errorEl.style.display = 'block';
            }
        });
    },

    switchTab(tab) {
        this.isRegister = (tab === 'register');
        document.getElementById('tab-login').classList.toggle('active', !this.isRegister);
        document.getElementById('tab-register').classList.toggle('active', this.isRegister);
        document.getElementById('register-fields').style.display = this.isRegister ? 'block' : 'none';
        document.getElementById('auth-submit-btn').textContent = this.isRegister ? 'Create Account' : 'Sign In';
        document.getElementById('auth-error').style.display = 'none';
    }
};
