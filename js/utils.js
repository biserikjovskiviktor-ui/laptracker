// public/js/utils.js

window.Utils = {
    // Converts "HH:MM:SS.mmm" -> Total Milliseconds
    formatToMs: (str) => {
        if (!str || typeof str !== 'string') return 0;
        const parts = str.split(/[:.]/);
        const [h, m, s, ms] = parts.map(Number);
        return (h * 3600000) + (m * 60000) + (s * 1000) + (ms || 0);
    },

    // Converts Total Milliseconds -> "HH:MM:SS.mmm"
    msToFormat: (ms) => {
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        const msPart = ms % 1000;
        
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${msPart.toString().padStart(3, '0')}`;
    },

    // Calculate difference between two times
    calculateGap: (time1, time2) => {
        const diff = Math.abs(time1 - time2);
        const prefix = time1 > time2 ? '+' : '-';
        return `${prefix}${window.Utils.msToFormat(diff)}`;
    },

    // Format Date for Macedonian locale
    formatDate: (dateString) => {
        return new Date(dateString).toLocaleDateString('mk-MK');
    },
    getWeatherIcon: (condition) => {
        const icons = {
            'Clear': 'fa-sun',
            'Clouds': 'fa-cloud',
            'Rain': 'fa-cloud-showers-heavy',
            'Drizzle': 'fa-cloud-rain',
            'Thunderstorm': 'fa-bolt',
            'Snow': 'fa-snowflake',
            'Mist': 'fa-smog',
            'Fog': 'fa-smog'
        };
        // Default to 'fa-question' or 'fa-sun' if not found
        return icons[condition] || 'fa-question';
    },
    // Clamp value between min and max
    clamp: (val, min, max) => Math.min(Math.max(val, min), max)
    
};