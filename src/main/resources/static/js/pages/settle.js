const SettlePage = {
    async render(container) {
        const users = await API.get('/users');
        const activeUserId = Store.getActiveUserId();
        const loggedInUser = Store.getLoggedInUser();

        const params = new URLSearchParams(location.hash.split('?')[1] || '');
        const prefillTo = params.get('to') || '';
        const prefillAmount = params.get('amount') || '';

        const otherUsers = users.filter(u => u.id !== activeUserId);

        container.innerHTML = `
            <div class="page-header"><h1>Settle Up</h1></div>
            <div class="card">
                <h3>Record a Payment</h3>
                <form id="settle-form" style="margin-top:16px;">
                    <div class="form-row">
                        <div class="form-group">
                            <label>From (you)</label>
                            <input type="text" value="${loggedInUser ? loggedInUser.name : 'You'}" disabled
                                style="background:var(--bg);font-weight:600;color:var(--primary-dark);">
                        </div>
                        <div class="form-group">
                            <label>To (who you're paying)</label>
                            <select id="settle-to">
                                <option value="" disabled ${!prefillTo ? 'selected' : ''}>Select person</option>
                                ${otherUsers.map(u => `<option value="${u.id}" ${u.id == prefillTo ? 'selected' : ''}>${u.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Amount (₹)</label>
                            <input type="number" id="settle-amount" value="${prefillAmount}" placeholder="e.g. 250" step="0.01">
                        </div>
                        <div class="form-group">
                            <label>Note (optional)</label>
                            <input type="text" id="settle-note" placeholder="e.g. March settlement">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary" style="margin-top:8px;width:100%;">Record Payment</button>
                </form>
            </div>
            <div class="card" style="margin-top:24px;">
                <h3>Your Payment History</h3>
                <div id="settle-history" style="margin-top:12px;"></div>
            </div>
        `;

        document.getElementById('settle-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const toUserId = parseInt(document.getElementById('settle-to').value);
            const amount = parseFloat(document.getElementById('settle-amount').value);
            const note = document.getElementById('settle-note').value.trim();

            if (!toUserId) { Toast.error('Select who you are paying'); return; }
            if (!amount || amount <= 0) { Toast.error('Enter a valid amount'); return; }

            try {
                await API.post('/transactions', { fromUserId: activeUserId, toUserId, amount, note });
                Toast.success('Payment recorded!');
                document.getElementById('settle-amount').value = '';
                document.getElementById('settle-note').value = '';
                await this.loadHistory();
            } catch (e) { Toast.error('Failed to record payment'); }
        });

        await this.loadHistory();
    },

    async loadHistory() {
        const listEl = document.getElementById('settle-history');
        const activeUserId = Store.getActiveUserId();

        try {
            const transactions = await API.get(`/transactions/user/${activeUserId}`);
            if (transactions.length === 0) {
                listEl.innerHTML = '<p style="color:#757575;">No payments recorded yet.</p>';
                return;
            }
            listEl.innerHTML = `<div class="table-container"><table>
                <thead><tr><th>Date</th><th>From</th><th>To</th><th>Amount</th><th>Note</th></tr></thead>
                <tbody>${transactions.map(t => `
                    <tr>
                        <td>${new Date(t.date).toLocaleDateString()}</td>
                        <td>${t.fromUser.name}${t.fromUser.id === activeUserId ? ' (You)' : ''}</td>
                        <td>${t.toUser.name}${t.toUser.id === activeUserId ? ' (You)' : ''}</td>
                        <td>₹${t.amount.toFixed(2)}</td>
                        <td>${t.note || '—'}</td>
                    </tr>
                `).join('')}</tbody>
            </table></div>`;
        } catch (e) {
            listEl.innerHTML = '<p style="color:#757575;">Error loading payment history.</p>';
        }
    }
};
