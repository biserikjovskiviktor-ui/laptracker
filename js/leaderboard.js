// public/js/leaderboard.js

window.initLeaderboard = async () => {
    try {
        const laps = await API.getLeaderboard();
        const tableBody = document.getElementById('leaderboardBody');
        // Check if current user is admin
        const isAdmin = localStorage.getItem('isAdmin') === 'true'; 
        
        if (!tableBody) return;

        tableBody.innerHTML = laps.map(lap => `
            <tr>
                <td>${lap.driverId?.username || 'Anonymous'}</td>
                <td>${lap.trackId?.name || 'Unknown'}</td>
                <td>${lap.carId ? `${lap.carId.make} ${lap.carId.model} [${lap.carId.carRank}]` : 'N/A'}</td>
                <td>${lap.bestTime ? window.Utils.msToFormat(lap.bestTime) : '--:--:--.---'}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="showDetails('${lap.runId}')">Детали</button>
                    <button class="btn btn-sm btn-danger" onclick="compete('${lap.trackId?._id}', '${lap.bestTime}')">Compete</button>
                    
                    ${isAdmin ? `<button class="btn btn-sm btn-warning" onclick="deleteRun('${lap.runId}')">Избриши</button>` : ''}
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Failed to load:", err);
    }
};
window.deleteRun = async (id) => {
    if (!confirm("Сигурно сакаш да го избришеш овој запис?")) return;

    try {
        // Assuming you have a deleteRun method in your API
        await API.deleteRun(id);
        alert("Записот е избришан.");
        window.initLeaderboard(); // Refresh the table
    } catch (err) {
        alert("Грешка при бришење.");
    }
};
window.compete = (trackId, targetTime) => {
    loadView('stopwatch');
    // Format the time for display
    const formattedTime = window.Utils.msToFormat(targetTime);
    
    // Use a slightly longer timeout to ensure the DOM is ready
    setTimeout(() => {
        const courseSelect = document.getElementById('courseSelect');
        const pbDisplay = document.getElementById('pbPreStartDisplay');
        const pbTimeValue = document.getElementById('pbTimeValue');
        const prevDisplay = document.getElementById('previousTimeDisplay');
        
        // 1. Set the Track
        if (courseSelect) {
            courseSelect.value = trackId;
            // Trigger weather check for the selected track
            if (typeof window.checkInputs === 'function') window.checkInputs();
        }
        
        // 2. Set the "Time to Beat" display
        if (pbDisplay) pbDisplay.style.display = 'block';
        if (pbTimeValue) pbTimeValue.innerText = formattedTime;
        if (prevDisplay) prevDisplay.innerText = formattedTime;
        
        alert(`Предизвик прифатен! Time to beat: ${formattedTime}.`);
    }, 300);
};

showDetails = async (runId) => {
    try {
        const run = await API.getRunById(runId);
        if (!run) {
            alert("Детали не се достапни.");
            return;
        }
        const details = `
            Driver: ${run.userId?.username || 'Anonymous'}
            Track: ${run.trackId?.name || 'Unknown'}
            Car: ${run.carId ? `${run.carId.make} ${run.carId.model} ${run.carId.carRank}` : 'N/A'}
            Best Time: ${run.bestTime ? window.Utils.msToFormat(run.bestTime) : '--:--:--.---'}
        `;
        alert(details);
    } catch (err) {
        console.error("Failed to load lap details:", err);
        alert("Грешка при вчитување на детали.");
    }
};

