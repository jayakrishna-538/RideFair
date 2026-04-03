const ExpensesPage = {
    groups: [],

    async render(container) {
        const groups = await API.get('/groups');
        this.groups = groups;

        const activeUserId = Store.getActiveUserId();
        const defaultGroup = groups.length === 1 ? groups[0].id : '';

        const groupPlaceholder = groups.length > 1
            ? '<option value="" disabled selected>Select a group</option>' : '';

        container.innerHTML = `
            <div class="page-header"><h1>Expenses</h1></div>
            <div class="card">
                <h3>Add Manual Expense</h3>
                <form id="expense-form" style="margin-top:16px;">
                    <div class="form-group">
                        <label>Group *</label>
                        <select id="exp-group" required>
                            ${groupPlaceholder}
                            ${groups.map(g => `<option value="${g.id}" ${groups.length === 1 ? 'selected' : ''}>${g.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <input type="text" id="exp-desc" placeholder="e.g. Lunch at Cafe">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Amount (₹)</label>
                            <input type="number" id="exp-amount" placeholder="e.g. 300" step="0.01">
                        </div>
                        <div class="form-group">
                            <label>Paid By</label>
                            <select id="exp-paidby"></select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Split Among</label>
                        <div class="checkbox-group" id="exp-split"></div>
                        <p id="exp-hint" style="color:var(--text-secondary);font-size:13px;margin-top:6px;"></p>
                    </div>
                    <div class="btn-center" style="margin-top:8px;">
                        <button type="submit" class="btn btn-primary">Add Expense</button>
                    </div>
                </form>
            </div>
            <div class="card" style="margin-top:24px;">
                <h3>Expense History</h3>
                <div class="form-group" style="margin-top:12px;">
                    <select id="exp-history-group" style="max-width:300px;">
                        ${groups.map(g => `<option value="${g.id}" ${g.id == defaultGroup ? 'selected' : ''}>${g.name}</option>`).join('')}
                    </select>
                </div>
                <div id="expenses-list" style="margin-top:12px;"></div>
            </div>
        `;

        document.getElementById('exp-group').addEventListener('change', () => {
            this.updateMembersForGroup();
        });

        this.updateMembersForGroup();

        document.getElementById('expense-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const groupId = parseInt(document.getElementById('exp-group').value);
            if (!groupId) { Toast.error('Select a group'); return; }

            const description = document.getElementById('exp-desc').value.trim();
            const totalAmount = parseFloat(document.getElementById('exp-amount').value);
            const paidById = parseInt(document.getElementById('exp-paidby').value);
            const splitAmongIds = [...document.querySelectorAll('#exp-split input:checked')]
                .map(cb => parseInt(cb.value));

            if (!description) { Toast.error('Enter a description'); return; }
            if (!totalAmount || totalAmount <= 0) { Toast.error('Enter a valid amount'); return; }
            if (splitAmongIds.length < 1) { Toast.error('Select at least one person to split among'); return; }

            try {
                await API.post('/expenses', { description, totalAmount, paidById, splitAmongIds, groupId });
                Toast.success(`Expense added! ₹${(totalAmount / splitAmongIds.length).toFixed(2)} per person`);
                document.getElementById('exp-desc').value = '';
                document.getElementById('exp-amount').value = '';
                await this.loadExpenses();
            } catch (e) { Toast.error('Failed to add expense'); }
        });

        document.getElementById('exp-history-group').addEventListener('change', () => this.loadExpenses());
        await this.loadExpenses();
    },

    updateMembersForGroup() {
        const groupId = parseInt(document.getElementById('exp-group')?.value);
        const paidByEl = document.getElementById('exp-paidby');
        const splitEl = document.getElementById('exp-split');
        const hintEl = document.getElementById('exp-hint');
        const activeUserId = Store.getActiveUserId();

        if (!groupId) {
            paidByEl.innerHTML = '<option value="">Select a group first</option>';
            splitEl.innerHTML = '';
            hintEl.textContent = 'Select a group to see its members.';
            return;
        }

        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        const members = group.members || [];

        paidByEl.innerHTML = members.map(m =>
            `<option value="${m.id}" ${m.id === activeUserId ? 'selected' : ''}>${m.name}</option>`
        ).join('');

        splitEl.innerHTML = members.map(m =>
            `<label><input type="checkbox" value="${m.id}" checked> ${m.name}</label>`
        ).join('');

        hintEl.textContent = '';
    },

    async loadExpenses() {
        const listEl = document.getElementById('expenses-list');
        const groupId = document.getElementById('exp-history-group')?.value;
        if (!groupId) return;

        try {
            const expenses = await API.get(`/expenses/group/${groupId}`);
            if (expenses.length === 0) {
                listEl.innerHTML = '<p style="color:#757575;">No expenses in this group yet.</p>';
                return;
            }
            listEl.innerHTML = `<div class="table-container"><table>
                <thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Paid By</th><th>Type</th><th>Split</th></tr></thead>
                <tbody>${expenses.map(exp => `
                    <tr>
                        <td>${exp.date}</td>
                        <td>${exp.description}</td>
                        <td>₹${exp.totalAmount.toFixed(2)}</td>
                        <td>${exp.paidByName}</td>
                        <td><span class="chip ${exp.type === 'MANUAL' ? 'chip-grey' : 'chip-green'}">${exp.type.replace('_', ' ')}</span></td>
                        <td>${exp.shares.map(s => s.userName + ': ₹' + s.amount.toFixed(2)).join(', ')}</td>
                    </tr>
                `).join('')}</tbody>
            </table></div>`;
        } catch (e) {
            listEl.innerHTML = '<p style="color:#757575;">Error loading expenses.</p>';
        }
    }
};
