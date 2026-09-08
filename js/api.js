const API = {
    state: {
        weather: ""
    },

    // --- Helper for Authorized Requests ---
    async authorizedFetch(url, options = {}) {
        const token = localStorage.getItem('userToken');
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
    };
    
    const res = await fetch(url, { ...options, headers });
    
    if (res.status === 401) {
        this.logout();
        window.location.reload();
    }

    // NEW: Check if the response is valid before parsing
    if (!res.ok) {
        const errorText = await res.text(); // Get the raw error from the server
        console.error("Server returned error:", errorText);
        throw new Error(`Request failed with status ${res.status}`);
    }
    
    return res;
},
    // --- Data Fetching Methods ---
    async getTracks() {
        const res = await fetch('/api/tracks');
        return await res.json();
    },
    async getTrackCity(id) {
        const res = await fetch(`/api/tracks/${id}`);
        return await res.json();
    },

    async getVehicles() {
        const res = await this.authorizedFetch('/api/vehicles');
        return await res.json();
    },
    async getRunById(id) {
        const res = await this.authorizedFetch(`/api/runs/${id}`);
        return await res.json();
    },

    async addRun(runData) {
        const res = await this.authorizedFetch('/api/runs', {
            method: 'POST',
            body: JSON.stringify(runData)
        });
        return await res.json();
    },

    async getWeather(city, countryCode) {
    const apiKey = 'a4d752f23f10ecaa556da8b11b6e8eb5';
    const query = `${city},${countryCode}`;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${apiKey}&units=metric`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        
        if (res.ok) {
            return data; // Return the FULL object
        }
        throw new Error(data.message || "Failed to fetch");
    } catch (error) {
        console.error("Weather fetch error:", error);
        throw error; // Let the UI handle the error state
    }
    },
    async getPB(trackId, carId) {
    // Note the path change from /api/leaderboard/ to /api/runs/
    const res = await this.authorizedFetch(`/api/runs/pb/${trackId}/${carId}`);
    return await res.json();
    },
    async addTrack(trackData) {
        const res = await this.authorizedFetch('/api/tracks', {
            method: 'POST',
            body: JSON.stringify(trackData)
        });
        return await res.json();
    },

    async addVehicle(vehicleData) {
        const res = await this.authorizedFetch('/api/vehicles', {
            method: 'POST',
            body: JSON.stringify(vehicleData)
        });
        return await res.json();
    },

    async register(email, password, username) {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, username })
        });
        const data = await res.json();
        return { success: res.ok, data };
    },

    async login(email, password) {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        
        if (res.ok && data.token) {
            localStorage.setItem('userToken', data.token);
            localStorage.setItem('isAdmin', data.isAdmin);
            localStorage.setItem('userEmail', data.email);
            localStorage.setItem('userId', data.userId);
        }
        
        return { success: res.ok, data };
    },

    async getProfileData() {
        const userId = localStorage.getItem('userId');
        const [runsRes, vehiclesRes, tracksRes, userRest] = await Promise.all([
            this.authorizedFetch(`/api/runs/user/${userId}`),
            this.authorizedFetch(`/api/vehicles`),
            this.authorizedFetch(`/api/tracks`),
            this.authorizedFetch(`/api/auth/user/${userId}`)
        ]);
        return { 
            runs: await runsRes.json(), 
            vehicles: await vehiclesRes.json(), 
            tracks: await tracksRes.json(),
            users: await userRest.json()
        };
    },

    async deleteRun(id) {
        return await this.authorizedFetch(`/api/runs/${id}`, { method: 'DELETE' });
    },
    async deleteTrack(id) {
        return await this.authorizedFetch(`/api/tracks/${id}`, { method: 'DELETE' });
    },
    async deleteVehicle(id) {
        return await this.authorizedFetch(`/api/vehicles/${id}`, { method: 'DELETE' });
    },

    async logout() {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userId');
    },
    async getLeaderboard() {
        const res = await fetch('/api/leaderboard');
        return await res.json();
    },
    // --- Admin/DB Methods ---
    async resetDatabase() {
        return await this.authorizedFetch('/api/db/reset', { 
            method: 'POST'
        });
    },

    async seedDatabase() {
        return await this.authorizedFetch('/api/db/seed', { 
            method: 'POST' 
        });
    }
};