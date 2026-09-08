window.initAddTrack = async () => {
    // Helper function to wait for elements
    const waitForElements = (selector) => {
        return new Promise((resolve) => {
            let attempts = 0;
            const interval = setInterval(() => {
                const el = document.querySelector(selector);
                if (el || attempts >= 10) {
                    clearInterval(interval);
                    resolve(el);
                }
                attempts++;
            }, 50);
        });
    };

    // Wait for the form to appear
    const form = await waitForElements('#addTrackForm');
    const countrySelect = document.getElementById('countrySelect');

    if (!form || !countrySelect) {
        console.error("Could not find form elements after waiting.");
        return;
    }

    // 1. Load countries
    try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2');
        const countries = await response.json();
        if (Array.isArray(countries)) {
            countries.sort((a, b) => a.name.common.localeCompare(b.name.common));
            countrySelect.innerHTML = '<option value="">Select a country...</option>' + 
                countries.map(c => `<option value="${c.cca2}">${c.name.common}</option>`).join('');
        }
    } catch (err) {
        console.error("Could not load countries", err);
    }

    // 2. Attach submit listener
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const trackData = {
            name: document.getElementById('trackName')?.value,
            location: document.getElementById('trackCity')?.value,
            countryCode: countrySelect.value,
            length: parseFloat(document.getElementById('trackLength')?.value),
            surface: document.getElementById('trackSurface')?.value
        };
        
        if (!trackData.name || !trackData.location || !trackData.countryCode) {
            alert("Ве молиме пополнете ги сите полиња!");
            return;
        }

        try {
            await API.addTrack(trackData);
            alert("Патеката е успешно додадена!");
            form.reset();
            loadView('stopwatch');
        } catch (err) {
            alert("Грешка: " + err.message);
        }
    };
};