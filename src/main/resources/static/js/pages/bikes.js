const BikesPage = {
    async render(container) {
        container.innerHTML = `
            <div class="page-header">
                <h1>Bikes</h1>
                <button class="btn btn-primary" id="btn-new-bike">+ Register Bike</button>
            </div>
            <div class="card-grid" id="bikes-list"></div>
        `;

        document.getElementById('btn-new-bike').onclick = () => this.showCreateModal();
        await this.loadBikes();
    },

    async loadBikes() {
        const listEl = document.getElementById('bikes-list');
        try {
            const bikes = await API.get('/bikes');
            if (bikes.length === 0) {
                listEl.innerHTML = `<div class="empty-state">
                    <h3>No bikes registered</h3>
                    <p>Register a bike to start logging rides.</p>
                </div>`;
                return;
            }
            listEl.innerHTML = bikes.map(b => `
                <div class="card">
                    <h3>${b.name}</h3>
                    <div style="margin-top:10px;font-size:14px;color:#757575;">
                        <p>Owner: <strong style="color:#212121;">${b.owner.name}</strong></p>
                        <p>Mileage: <strong style="color:#212121;">${b.fuelEfficiency} km/l</strong></p>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            listEl.innerHTML = '<p style="color:#757575;">Error loading bikes.</p>';
        }
    },

    async showCreateModal() {
        const users = await API.get('/users');
        if (users.length === 0) {
            Toast.error('Create some users first.');
            return;
        }
        const ownerOptions = users.map(u =>
            `<option value="${u.id}">${u.name}</option>`
        ).join('');

        Modal.show('Register Bike', `
            <div class="form-group">
                <label>Bike Name</label>
                <input type="text" id="bike-name" placeholder="e.g. Pulsar 150">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Mileage (km/l)</label>
                    <input type="number" id="bike-mileage" placeholder="e.g. 40" step="0.1">
                </div>
                <div class="form-group">
                    <label>Owner</label>
                    <select id="bike-owner">${ownerOptions}</select>
                </div>
            </div>
        `, async (overlay) => {
            const name = overlay.querySelector('#bike-name').value.trim();
            const fuelEfficiency = parseFloat(overlay.querySelector('#bike-mileage').value);
            const ownerId = parseInt(overlay.querySelector('#bike-owner').value);

            if (!name) { Toast.error('Enter a bike name'); return; }
            if (!fuelEfficiency || fuelEfficiency <= 0) { Toast.error('Enter valid mileage'); return; }

            try {
                await API.post('/bikes', { name, fuelEfficiency, ownerId });
                Modal.close(overlay);
                Toast.success('Bike registered!');
                await this.loadBikes();
            } catch (e) { Toast.error('Failed to register bike'); }
        });
    }
};
