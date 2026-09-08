// public/js/search.js

window.handleSearch = (query) => {
    const searchTerm = query.toLowerCase().trim();
    
    // Ensure we are accessing the data correctly based on your models
    const filteredRuns = window.appState.allRuns.filter(run => 
        (run.trackId?.name || '').toLowerCase().includes(searchTerm) ||
        (run.carId?.model || '').toLowerCase().includes(searchTerm) ||
        (run.carId?.make || '').toLowerCase().includes(searchTerm)
    );

    // Update the UI
    renderLogbook(filteredRuns);
};