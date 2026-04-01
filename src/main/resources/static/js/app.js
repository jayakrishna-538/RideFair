const Router = {
    routes: {
        '#/': DashboardPage,
        '#/groups': GroupsPage,
        '#/bikes': BikesPage,
        '#/rides': RidesPage,
        '#/expenses': ExpensesPage,
        '#/balances': BalancesPage,
        '#/settle': SettlePage,
        '#/login': LoginPage
    },

    publicRoutes: ['#/login'],

    async navigate(hash) {
        const baseHash = hash.split('?')[0];
        const content = document.getElementById('content');
        const navbar = document.getElementById('navbar');

        if (!this.publicRoutes.includes(baseHash)) {
            const loggedIn = await this.checkAuth();
            if (!loggedIn) {
                location.hash = '#/login';
                return;
            }
        }

        if (baseHash === '#/login') {
            navbar.innerHTML = '';
        } else {
            await Navbar.render();
        }

        const page = this.routes[baseHash] || this.routes['#/'];
        content.innerHTML = '<div style="text-align:center;padding:48px;color:#757575;">Loading...</div>';

        try {
            await page.render(content);
        } catch (e) {
            console.error('Page render error:', e);
            content.innerHTML = `<div class="card" style="text-align:center;padding:48px;">
                <h3>Something went wrong</h3>
                <p style="color:#757575;margin-top:8px;">${e.message}</p>
            </div>`;
        }
    },

    async checkAuth() {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const user = await res.json();
                Store.setLoggedInUser(user);
                return true;
            }
            Store.clearSession();
            return false;
        } catch {
            Store.clearSession();
            return false;
        }
    }
};

window.addEventListener('hashchange', () => Router.navigate(location.hash));
window.addEventListener('DOMContentLoaded', () => {
    if (!location.hash) location.hash = '#/';
    Router.navigate(location.hash);
});
