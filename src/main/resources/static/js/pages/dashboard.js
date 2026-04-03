const DashboardPage = {
    async render(container) {
        container.innerHTML = `
            <div class="page-header"><h1>Dashboard</h1></div>
            <div class="stat-cards" id="dash-stats"></div>
            <div class="card">
                <h3>Registered Members</h3>
                <div id="dash-users" style="margin-top:12px;"></div>
                <p style="color:var(--text-secondary);font-size:13px;margin-top:10px;">Friends can join by registering at the login page.</p>
            </div>
            <div class="card" style="margin-top:16px;">
                <h3>Recent Rides</h3>
                <div id="dash-recent" style="margin-top:12px;"></div>
            </div>
        `;

        const activeUserId = Store.getActiveUserId();
        const statsEl = document.getElementById('dash-stats');
        const recentEl = document.getElementById('dash-recent');

        await this.loadUsers();

        try {
            const [groups, rides] = await Promise.all([
                API.get('/groups'),
                API.get('/rides')
            ]);

            let youOwe = 0;
            let youAreOwed = 0;

            if (activeUserId && groups.length > 0) {
                for (const group of groups) {
                    try {
                        const balance = await API.get(`/balances/user/${activeUserId}/group/${group.id}`);
                        if (balance < 0) youOwe += Math.abs(balance);
                        else youAreOwed += balance;
                    } catch (e) { /* skip */ }
                }
            }

            statsEl.innerHTML = `
                <div class="stat-card owe">
                    <div class="stat-label">You Owe</div>
                    <div class="stat-value">${activeUserId ? '₹' + youOwe.toFixed(2) : '—'}</div>
                </div>
                <div class="stat-card owed">
                    <div class="stat-label">You Are Owed</div>
                    <div class="stat-value">${activeUserId ? '₹' + youAreOwed.toFixed(2) : '—'}</div>
                </div>
                <div class="stat-card neutral">
                    <div class="stat-label">Total Rides</div>
                    <div class="stat-value">${rides.length}</div>
                </div>
            `;

            if (rides.length === 0) {
                recentEl.innerHTML = '<p style="color:#757575;">No rides yet. Log your first ride!</p>';
            } else {
                recentEl.innerHTML = `<div class="table-container"><table>
                    <thead><tr><th>Date</th><th>Bike</th><th>Riders</th><th>Distance</th><th>Cost</th></tr></thead>
                    <tbody>${rides.slice(0, 5).map(r => `
                        <tr>
                            <td>${new Date(r.dateTime).toLocaleDateString()}</td>
                            <td>${r.bikeName}</td>
                            <td>${r.borrowers.map(b => b.name).join(', ')}</td>
                            <td>${r.distance} km</td>
                            <td>₹${r.rideCost}</td>
                        </tr>
                    `).join('')}</tbody>
                </table></div>`;
            }
        } catch (e) {
            statsEl.innerHTML = '<p style="color:#757575;">Create some users and groups to get started.</p>';
            recentEl.innerHTML = '';
        }
    },

    async loadUsers() {
        const usersEl = document.getElementById('dash-users');
        try {
            const users = await API.get('/users');
            if (users.length === 0) {
                usersEl.innerHTML = '<p style="color:#757575;">No members yet. Ask your friends to register!</p>';
            } else {
                usersEl.innerHTML = `<div class="checkbox-group">${users.map(u =>
                    `<span class="chip chip-green">${u.name}</span>`
                ).join('')}</div>`;
            }
        } catch (e) {
            usersEl.innerHTML = '';
        }
    }
};
