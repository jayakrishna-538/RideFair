const GroupsPage = {
    async render(container) {
        container.innerHTML = `
            <div class="page-header">
                <h1>Friend Groups</h1>
                <button class="btn btn-primary" id="btn-new-group">+ New Group</button>
            </div>
            <div id="groups-list"></div>
        `;

        document.getElementById('btn-new-group').onclick = () => this.showCreateModal();
        await this.loadGroups();
    },

    async loadGroups() {
        const listEl = document.getElementById('groups-list');
        try {
            const groups = await API.get('/groups');
            if (groups.length === 0) {
                listEl.innerHTML = `<div class="empty-state">
                    <h3>No groups yet</h3>
                    <p>Create a friend group to start tracking rides and expenses.</p>
                </div>`;
                return;
            }
            listEl.innerHTML = groups.map(g => `
                <div class="card">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <h3>${g.name}</h3>
                            <p style="color:#757575;font-size:14px;margin-top:4px;">${g.members.length} members</p>
                        </div>
                        <button class="btn btn-sm btn-secondary" onclick="GroupsPage.showManageModal(${g.id})">Manage</button>
                    </div>
                    <div class="checkbox-group" style="margin-top:12px;">
                        ${g.members.map(m => `<span class="chip chip-green">${m.name}</span>`).join('')}
                    </div>
                </div>
            `).join('');
        } catch (e) {
            listEl.innerHTML = `<p style="color:#757575;">Error loading groups.</p>`;
        }
    },

    async showCreateModal() {
        const users = await API.get('/users');
        if (users.length === 0) {
            Toast.error('Create some users first (go to Dashboard or use API).');
            return;
        }
        const checkboxes = users.map(u =>
            `<label><input type="checkbox" value="${u.id}"> ${u.name}</label>`
        ).join('');

        Modal.show('Create Group', `
            <div class="form-group">
                <label>Group Name</label>
                <input type="text" id="group-name" placeholder="e.g. College Riders">
            </div>
            <div class="form-group">
                <label>Members</label>
                <div class="checkbox-group" id="group-members">${checkboxes}</div>
            </div>
        `, async (overlay) => {
            const name = overlay.querySelector('#group-name').value.trim();
            const memberIds = [...overlay.querySelectorAll('#group-members input:checked')]
                .map(cb => parseInt(cb.value));

            if (!name) { Toast.error('Enter a group name'); return; }
            if (memberIds.length < 2) { Toast.error('Select at least 2 members'); return; }

            try {
                await API.post('/groups', { name, memberIds });
                Modal.close(overlay);
                Toast.success('Group created!');
                await this.loadGroups();
            } catch (e) { Toast.error('Failed to create group'); }
        });
    },

    async showManageModal(groupId) {
        const [group, allUsers] = await Promise.all([
            API.get(`/groups/${groupId}`),
            API.get('/users')
        ]);
        const memberIds = group.members.map(m => m.id);
        const nonMembers = allUsers.filter(u => !memberIds.includes(u.id));

        let html = '<h4 style="margin-bottom:8px;">Current Members</h4>';
        html += group.members.map(m => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;">
                <span>${m.name}</span>
                <button class="btn btn-sm btn-danger" onclick="GroupsPage.removeMember(${groupId}, ${m.id})">Remove</button>
            </div>
        `).join('');

        if (nonMembers.length > 0) {
            html += `<h4 style="margin-top:16px;margin-bottom:8px;">Add Members</h4>`;
            html += nonMembers.map(u => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;">
                    <span>${u.name}</span>
                    <button class="btn btn-sm btn-success" onclick="GroupsPage.addMember(${groupId}, ${u.id})">Add</button>
                </div>
            `).join('');
        }

        Modal.show(`Manage: ${group.name}`, html, (overlay) => Modal.close(overlay));
    },

    async addMember(groupId, userId) {
        try {
            await API.post(`/groups/${groupId}/members`, { userId });
            Toast.success('Member added!');
            document.querySelector('.modal-overlay')?.remove();
            await this.loadGroups();
        } catch (e) { Toast.error('Failed to add member'); }
    },

    async removeMember(groupId, userId) {
        try {
            await API.delete(`/groups/${groupId}/members/${userId}`);
            Toast.success('Member removed');
            document.querySelector('.modal-overlay')?.remove();
            await this.loadGroups();
        } catch (e) { Toast.error('Failed to remove member'); }
    }
};
