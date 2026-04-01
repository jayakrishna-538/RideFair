const Navbar = {
    async render() {
        const navbar = document.getElementById('navbar');
        const currentHash = location.hash.split('?')[0] || '#/';
        const loggedInUser = Store.getLoggedInUser();

        const links = [
            { hash: '#/', label: 'Dashboard' },
            { hash: '#/groups', label: 'Groups' },
            { hash: '#/bikes', label: 'Bikes' },
            { hash: '#/rides', label: 'Rides' },
            { hash: '#/expenses', label: 'Expenses' },
            { hash: '#/balances', label: 'Balances' },
            { hash: '#/settle', label: 'Settle Up' }
        ];

        navbar.className = 'navbar';
        navbar.innerHTML = `
            <a href="#/" class="navbar-brand">RideFair</a>
            <div class="navbar-links">
                ${links.map(l =>
                    `<a href="${l.hash}" class="${currentHash === l.hash ? 'active' : ''}">${l.label}</a>`
                ).join('')}
            </div>
            <div class="navbar-user">
                ${loggedInUser
                    ? `<span style="font-size:14px;font-weight:600;color:var(--primary);">${loggedInUser.name}</span>
                       <button class="btn btn-sm btn-secondary" id="btn-logout">Logout</button>`
                    : `<a href="#/login" class="btn btn-sm btn-primary">Sign In</a>`
                }
            </div>
        `;

        document.getElementById('btn-logout')?.addEventListener('click', async () => {
            try {
                await fetch('/api/auth/logout', { method: 'POST' });
            } catch { /* ignore */ }
            Store.clearSession();
            Toast.info('Logged out');
            location.hash = '#/login';
        });
    }
};
