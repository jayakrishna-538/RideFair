const API = {
    async request(method, path, body) {
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) opts.body = JSON.stringify(body);

        const res = await fetch(`/api${path}`, opts);

        if (res.status === 401) {
            Store.clearSession();
            if (location.hash !== '#/login') {
                location.hash = '#/login';
            }
            throw new Error('Session expired. Please log in again.');
        }
        if (!res.ok) {
            const text = await res.text();
            let msg;
            try { msg = JSON.parse(text).error || text; } catch { msg = text; }
            throw new Error(msg);
        }
        return res.json();
    },

    get(path) { return this.request('GET', path); },
    post(path, body) { return this.request('POST', path, body); },
    delete(path) { return this.request('DELETE', path); }
};

const Store = {
    get(key, fallback = null) {
        try {
            const val = localStorage.getItem(`ridefair_${key}`);
            return val ? JSON.parse(val) : fallback;
        } catch { return fallback; }
    },

    set(key, value) {
        localStorage.setItem(`ridefair_${key}`, JSON.stringify(value));
    },

    getActiveUserId() {
        return this.get('activeUserId', null);
    },

    setActiveUserId(id) {
        this.set('activeUserId', id);
    },

    getLastPetrolPrice() {
        return this.get('lastPetrolPrice', 100.0);
    },

    setLastPetrolPrice(price) {
        this.set('lastPetrolPrice', price);
    },

    getLoggedInUser() {
        return this.get('loggedInUser', null);
    },

    setLoggedInUser(user) {
        this.set('loggedInUser', user);
        if (user) this.setActiveUserId(user.id);
    },

    clearSession() {
        localStorage.removeItem('ridefair_loggedInUser');
        localStorage.removeItem('ridefair_activeUserId');
    },

    isLoggedIn() {
        return this.getLoggedInUser() !== null;
    }
};
