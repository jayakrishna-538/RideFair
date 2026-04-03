const BalancesPage = {
    async render(container) {
        const groups = await API.get('/groups');
        const defaultGroup = groups.length === 1 ? groups[0].id : (groups[0]?.id || '');

        container.innerHTML = `
            <div class="page-header">
                <h1>Balances</h1>
                <div class="form-group" style="margin:0;">
                    <select id="bal-group" style="min-width:200px;">
                        ${groups.map(g => `<option value="${g.id}" ${g.id == defaultGroup ? 'selected' : ''}>${g.name}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div id="bal-summary"></div>
            <div class="balance-legend" style="margin-top:16px;">
                <div class="balance-legend-item"><span class="legend-dot green"></span> You are receiving money</div>
                <div class="balance-legend-item"><span class="legend-dot red"></span> You owe money</div>
                <div class="balance-legend-item"><span class="legend-dot blue"></span> Between other members</div>
            </div>
            <div class="card" style="margin-top:16px;">
                <h3>All Pairwise Balances</h3>
                <div id="bal-pairwise" style="margin-top:12px;"></div>
            </div>
            <div class="card" style="margin-top:16px;">
                <h3>Simplified — Minimum Payments</h3>
                <div id="bal-simplified" style="margin-top:12px;"></div>
            </div>
        `;

        document.getElementById('bal-group').addEventListener('change', () => this.loadBalances());
        await this.loadBalances();
    },

    async loadBalances() {
        const groupId = document.getElementById('bal-group')?.value;
        if (!groupId) return;

        const activeUserId = Store.getActiveUserId();

        try {
            const [pairwise, simplified] = await Promise.all([
                API.get(`/balances/group/${groupId}`),
                API.get(`/balances/group/${groupId}/simplified`)
            ]);

            const summaryEl = document.getElementById('bal-summary');
            let youOwe = 0, youAreOwed = 0;
            pairwise.forEach(b => {
                if (b.fromUser.id === activeUserId) youOwe += b.amount;
                if (b.toUser.id === activeUserId) youAreOwed += b.amount;
            });
            const net = youAreOwed - youOwe;

            summaryEl.innerHTML = `
                <div class="stat-cards">
                    <div class="stat-card owe">
                        <div class="stat-label">You Owe</div>
                        <div class="stat-value">₹${youOwe.toFixed(2)}</div>
                    </div>
                    <div class="stat-card owed">
                        <div class="stat-label">You Are Owed</div>
                        <div class="stat-value">₹${youAreOwed.toFixed(2)}</div>
                    </div>
                    <div class="stat-card ${net >= 0 ? 'owed' : 'owe'}">
                        <div class="stat-label">Net</div>
                        <div class="stat-value">₹${Math.abs(net).toFixed(2)}</div>
                    </div>
                </div>
            `;

            const pairwiseEl = document.getElementById('bal-pairwise');
            if (pairwise.length === 0) {
                pairwiseEl.innerHTML = '<p style="color:#757575;">No outstanding balances. Everyone is settled!</p>';
            } else {
                pairwiseEl.innerHTML = pairwise.map(b => {
                    let colorClass = 'bal-others';
                    if (b.toUser.id === activeUserId) colorClass = 'bal-receiving';
                    else if (b.fromUser.id === activeUserId) colorClass = 'bal-owing';
                    return `
                    <div class="balance-row ${colorClass}">
                        <div class="balance-flow">
                            <strong>${b.fromUser.name}${b.fromUser.id === activeUserId ? ' (You)' : ''}</strong>
                            <span class="balance-arrow">→</span>
                            <strong>${b.toUser.name}${b.toUser.id === activeUserId ? ' (You)' : ''}</strong>
                        </div>
                        <div class="balance-amount${b.toUser.id === activeUserId ? ' positive' : ''}">₹${b.amount.toFixed(2)}</div>
                    </div>`;
                }).join('');
            }

            const simplifiedEl = document.getElementById('bal-simplified');
            if (simplified.length === 0) {
                simplifiedEl.innerHTML = '<p style="color:#757575;">All settled! No payments needed.</p>';
            } else {
                simplifiedEl.innerHTML = simplified.map(s => {
                    const isMyDebt = s.fromUser.id === activeUserId;
                    const isMyCredit = s.toUser.id === activeUserId;
                    let colorClass = 'bal-others';
                    if (isMyCredit) colorClass = 'bal-receiving';
                    else if (isMyDebt) colorClass = 'bal-owing';
                    return `
                        <div class="balance-row ${colorClass}">
                            <div class="balance-flow">
                                <strong>${s.fromUser.name}${isMyDebt ? ' (You)' : ''}</strong>
                                <span class="balance-arrow">pays</span>
                                <strong>${s.toUser.name}${isMyCredit ? ' (You)' : ''}</strong>
                            </div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <div class="balance-amount${isMyCredit ? ' positive' : ''}">₹${s.amount.toFixed(2)}</div>
                                ${isMyDebt
                                    ? `<a href="#/settle?to=${s.toUser.id}&amount=${s.amount}" class="btn btn-sm btn-success">Pay</a>`
                                    : ''}
                            </div>
                        </div>
                    `;
                }).join('');
            }
        } catch (e) {
            document.getElementById('bal-pairwise').innerHTML = '<p style="color:#757575;">Error loading balances.</p>';
        }
    }
};
