const RidesPage = {
    bikes: [],
    groups: [],
    fuelToggled: false,

    async render(container) {
        const [bikes, groups] = await Promise.all([
            API.get('/bikes'),
            API.get('/groups')
        ]);
        this.bikes = bikes;
        this.groups = groups;

        const lastPrice = Store.getLastPetrolPrice();
        const defaultGroup = groups.length === 1 ? groups[0].id : '';

        const bikeOptions = bikes.length > 0 ? bikes.map(b =>
            `<option value="${b.id}" data-owner="${b.owner.id}" data-owner-name="${b.owner.name}" data-mileage="${b.fuelEfficiency}">${b.name} (${b.owner.name})</option>`
        ).join('') : '';

        const groupPlaceholder = groups.length > 1
            ? '<option value="" disabled selected>Select a group</option>' : '';
        const groupOptions = groupPlaceholder + groups.map(g =>
            `<option value="${g.id}" ${groups.length === 1 ? 'selected' : ''}>${g.name}</option>`
        ).join('');

        container.innerHTML = `
            <div class="page-header"><h1>Rides</h1></div>
            <div class="card">
                <h3>Log a Ride</h3>
                <form id="ride-form" style="margin-top:16px;">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Bike</label>
                            <select id="ride-bike" ${!bikes.length ? 'disabled' : ''}>${bikes.length ? bikeOptions : '<option value="">No bikes registered</option>'}</select>
                        </div>
                        <div class="form-group">
                            <label>Group *</label>
                            <select id="ride-group" required>${groupOptions}</select>
                        </div>
                    </div>
                    <div id="bike-info" class="form-info" style="margin-bottom:16px;"></div>
                    <div class="form-group">
                        <label>Who went on this ride?</label>
                        <div class="checkbox-group" id="ride-borrowers"></div>
                        <p id="borrower-hint" style="color:var(--text-secondary);font-size:13px;margin-top:6px;"></p>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Distance (km)</label>
                            <input type="number" id="ride-distance" placeholder="e.g. 20" step="0.1" required>
                        </div>
                        <div class="form-group">
                            <label>Petrol Price (₹/l)</label>
                            <input type="number" id="ride-price" value="${lastPrice}" step="0.01">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Did anyone fill petrol?</label>
                        <div class="toggle-group">
                            <div class="toggle-option" id="fuel-no" onclick="RidesPage.toggleFuel(false)">No</div>
                            <div class="toggle-option" id="fuel-yes" onclick="RidesPage.toggleFuel(true)">Yes</div>
                        </div>
                    </div>
                    <div id="fuel-fields" style="display:none;">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Amount Filled (₹)</label>
                                <input type="number" id="ride-fuel" placeholder="e.g. 150" step="0.01">
                            </div>
                            <div class="form-group">
                                <label>Filled By</label>
                                <select id="ride-filler"><option value="">Select a rider first</option></select>
                            </div>
                        </div>
                    </div>
                    <div id="cost-preview"></div>
                    <div class="btn-center" style="margin-top:16px;">
                        <button type="submit" class="btn btn-primary" ${!bikes.length ? 'disabled' : ''}>Log Ride</button>
                    </div>
                </form>
            </div>
            <div class="card" style="margin-top:24px;">
                <h3>Ride History</h3>
                <div id="rides-list" style="margin-top:12px;"></div>
            </div>
        `;

        this.fuelToggled = false;
        this.toggleFuel(false);
        this.updateBikeInfo();
        this.updateBorrowersForGroup();
        this.attachListeners();
        await this.loadRides();
    },

    updateBorrowersForGroup() {
        const groupId = parseInt(document.getElementById('ride-group')?.value);
        const borrowersEl = document.getElementById('ride-borrowers');
        const hintEl = document.getElementById('borrower-hint');
        const activeUserId = Store.getActiveUserId();

        if (!groupId) {
            borrowersEl.innerHTML = '';
            hintEl.textContent = 'Select a group first to see members.';
            return;
        }

        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;

        const members = group.members || [];
        const isUserInGroup = members.some(m => m.id === activeUserId);

        borrowersEl.innerHTML = members.map(m =>
            `<label><input type="checkbox" value="${m.id}" ${m.id === activeUserId ? 'checked' : ''}> ${m.name}</label>`
        ).join('');

        hintEl.textContent = isUserInGroup ? '' : 'You are not a member of this group.';

        borrowersEl.querySelectorAll('input').forEach(cb => {
            cb.addEventListener('change', () => {
                this.updateFillerDropdown();
                this.updatePreview();
            });
        });

        this.updateFillerDropdown();
        this.updatePreview();
    },

    updateFillerDropdown() {
        const fillerSelect = document.getElementById('ride-filler');
        const activeUserId = Store.getActiveUserId();
        const checkedIds = [...document.querySelectorAll('#ride-borrowers input:checked')]
            .map(cb => parseInt(cb.value));

        const groupId = parseInt(document.getElementById('ride-group')?.value);
        const group = this.groups.find(g => g.id === groupId);
        if (!group) {
            fillerSelect.innerHTML = '<option value="">Select a rider first</option>';
            return;
        }

        const riders = group.members.filter(m => checkedIds.includes(m.id));

        if (riders.length === 0) {
            fillerSelect.innerHTML = '<option value="">Select riders first</option>';
            return;
        }

        const prevValue = parseInt(fillerSelect.value);
        fillerSelect.innerHTML = riders.map(r =>
            `<option value="${r.id}" ${r.id === activeUserId ? 'selected' : ''}>${r.name}</option>`
        ).join('');

        if (riders.some(r => r.id === prevValue)) {
            fillerSelect.value = prevValue;
        }
    },

    toggleFuel(show) {
        this.fuelToggled = show;
        document.getElementById('fuel-fields').style.display = show ? 'block' : 'none';
        document.getElementById('fuel-yes').classList.toggle('active', show);
        document.getElementById('fuel-no').classList.toggle('active', !show);
        this.updatePreview();
    },

    updateBikeInfo() {
        const select = document.getElementById('ride-bike');
        const info = document.getElementById('bike-info');
        if (!select || !select.selectedOptions[0] || !select.selectedOptions[0].dataset.ownerName) {
            info.innerHTML = this.bikes.length === 0
                ? '<span style="color:var(--danger);">Please register a bike first before logging rides.</span>'
                : '';
            return;
        }
        const opt = select.selectedOptions[0];
        info.innerHTML = `Owner: <strong>${opt.dataset.ownerName}</strong> &nbsp;|&nbsp; Mileage: <strong>${opt.dataset.mileage} km/l</strong>`;
    },

    updatePreview() {
        const previewEl = document.getElementById('cost-preview');
        const bikeSelect = document.getElementById('ride-bike');
        if (!bikeSelect || !bikeSelect.selectedOptions[0] || !bikeSelect.selectedOptions[0].dataset.mileage) {
            if (previewEl) previewEl.innerHTML = '';
            return;
        }

        const mileage = parseFloat(bikeSelect.selectedOptions[0].dataset.mileage);
        const distance = parseFloat(document.getElementById('ride-distance')?.value) || 0;
        const price = parseFloat(document.getElementById('ride-price')?.value) || 0;
        const borrowerCount = document.querySelectorAll('#ride-borrowers input:checked').length;
        const fuelFilled = this.fuelToggled ? (parseFloat(document.getElementById('ride-fuel')?.value) || 0) : 0;

        if (distance <= 0 || price <= 0 || borrowerCount === 0) {
            previewEl.innerHTML = '';
            return;
        }

        const rideCost = (distance / mileage) * price;
        const perPerson = rideCost / borrowerCount;
        const excess = fuelFilled - rideCost;

        previewEl.innerHTML = `
            <div class="cost-preview">
                <h3>Cost Breakdown</h3>
                <div class="cost-line"><span>Ride cost (${distance} km / ${mileage} km/l × ₹${price})</span><span>₹${rideCost.toFixed(2)}</span></div>
                <div class="cost-line"><span>Per person (${borrowerCount} rider${borrowerCount > 1 ? 's' : ''})</span><span>₹${perPerson.toFixed(2)}</span></div>
                ${fuelFilled > 0 ? `
                    <div class="cost-line"><span>Fuel filled</span><span>₹${fuelFilled.toFixed(2)}</span></div>
                    <div class="cost-line total">
                        <span>${excess >= 0 ? 'Extra fuel in owner\'s tank' : 'Deficit (borrowers still owe owner)'}</span>
                        <span>₹${Math.abs(excess).toFixed(2)}</span>
                    </div>
                ` : ''}
            </div>
        `;
    },

    attachListeners() {
        document.getElementById('ride-bike').addEventListener('change', () => {
            this.updateBikeInfo();
            this.updatePreview();
        });

        document.getElementById('ride-group').addEventListener('change', () => {
            this.updateBorrowersForGroup();
        });

        ['ride-distance', 'ride-price', 'ride-fuel'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this.updatePreview());
        });

        document.getElementById('ride-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const groupId = parseInt(document.getElementById('ride-group').value);
            if (!groupId) { Toast.error('Select a group'); return; }

            const bikeId = parseInt(document.getElementById('ride-bike').value);
            const borrowerIds = [...document.querySelectorAll('#ride-borrowers input:checked')]
                .map(cb => parseInt(cb.value));
            const distance = parseFloat(document.getElementById('ride-distance').value);
            const petrolPrice = parseFloat(document.getElementById('ride-price').value);
            const fuelFilled = this.fuelToggled ? (parseFloat(document.getElementById('ride-fuel').value) || 0) : 0;
            const fuelFilledById = this.fuelToggled ? parseInt(document.getElementById('ride-filler').value) : null;

            if (borrowerIds.length === 0) { Toast.error('Select at least one rider'); return; }
            if (!distance || distance <= 0) { Toast.error('Enter a valid distance'); return; }
            if (this.fuelToggled && fuelFilled > 0 && !fuelFilledById) { Toast.error('Select who filled petrol'); return; }

            try {
                await API.post('/rides', { bikeId, borrowerIds, distance, fuelFilled, fuelFilledById, petrolPrice, groupId });
                Store.setLastPetrolPrice(petrolPrice);
                Toast.success('Ride logged!');
                document.getElementById('ride-distance').value = '';
                document.getElementById('ride-fuel').value = '';
                this.toggleFuel(false);
                document.getElementById('cost-preview').innerHTML = '';
                await this.loadRides();
            } catch (e) { Toast.error('Failed to log ride: ' + e.message); }
        });
    },

    async loadRides() {
        const listEl = document.getElementById('rides-list');
        try {
            const rides = await API.get('/rides');
            if (rides.length === 0) {
                listEl.innerHTML = '<p style="color:#757575;">No rides logged yet.</p>';
                return;
            }
            listEl.innerHTML = `<div class="table-container"><table>
                <thead><tr><th>Date</th><th>Bike</th><th>Riders</th><th>Distance</th><th>Fuel Filled</th><th>Ride Cost</th></tr></thead>
                <tbody>${rides.map(r => `
                    <tr>
                        <td>${new Date(r.dateTime).toLocaleDateString()}</td>
                        <td>${r.bikeName}</td>
                        <td>${r.borrowers.map(b => b.name).join(', ')}</td>
                        <td>${r.distance} km</td>
                        <td>${r.fuelFilled > 0 ? '₹' + r.fuelFilled + (r.fuelFilledByName ? ' (' + r.fuelFilledByName + ')' : '') : '—'}</td>
                        <td>₹${r.rideCost}</td>
                    </tr>
                `).join('')}</tbody>
            </table></div>`;
        } catch (e) {
            listEl.innerHTML = '<p style="color:#757575;">Error loading rides.</p>';
        }
    }
};
