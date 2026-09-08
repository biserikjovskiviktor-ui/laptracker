// public/js/spa.js
async function loadView(viewName) {
    const app = document.getElementById('app');
    const token = localStorage.getItem('userToken');

    // Explicitly define which pages are accessible to guests
    const publicPages = ['auth', 'register', 'leaderboard'];
    
    // Auth Guard: If not logged in and page is not public, redirect to auth
    if (!token && !publicPages.includes(viewName)) {
        return loadView('auth');
    }

    try {
        const response = await fetch(`templates/${viewName}.html`);
        if (!response.ok) throw new Error(`Template ${viewName} not found`);
        
        const html = await response.text();
        app.innerHTML = html;

        // Dynamic function name generator
        const funcName = 'init' + viewName.split('-').map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
        ).join('');
        
        if (window[funcName] && typeof window[funcName] === 'function') {
            await window[funcName]();
        }
        
        // Update visibility of links (ensure this function handles guests)
        if (typeof window.updateNavbar === 'function') {
            window.updateNavbar();
        }
    } catch (error) {
        console.error("Navigation error:", error);
        app.innerHTML = `<div class="alert alert-danger text-center">Грешка при вчитување на страницата!</div>`;
    }
}

// Redirect to login if not authenticated on start
window.onload = () => {
    const token = localStorage.getItem('userToken');
    loadView(token ? 'stopwatch' : 'auth');
};