// public/js/profile.js
window.appState = {
    allRuns: [],
    chart: null // Add this to keep track of the chart instance
};

window.initProfile = async () => {
    const { runs, vehicles, tracks, users } = await API.getProfileData();

    document.getElementById('userName').innerText = users.username;
    document.getElementById('userEmail').innerText = users.email;
    window.appState.allRuns = runs;


    renderGarageList(vehicles);
    renderTrackList(tracks);
    renderLogbook(runs);
    window.renderChart(runs); 
};

const renderGarageList = (vehicles) => {
    const list = document.getElementById('garageList');
    list.innerHTML = vehicles.length > 0 ? vehicles.map(v => `
        <div class="card bg-secondary text-white p-2 mb-2">
            ${v.make} ${v.model} (${v.year}) - ${v.engineDisplacement} cc - ${v.hp} HP [${v.carRank}]
            <button class="btn btn-sm btn-danger ms-auto" onclick="deleteVehicle('${v._id}')">X</button>
        </div>
    `).join('') : '<p>Нема додадени возила.</p>';
};

const renderTrackList = (tracks) => {
    const list = document.getElementById('tracksList');
    list.innerHTML = tracks.length > 0 ? tracks.map(t => `
        <div class="card bg-secondary text-white p-2 mb-2">
            ${t.name}
            <button class="btn btn-sm btn-danger ms-auto" onclick="deleteTrack('${t._id}')">X</button>
        </div>
    `).join('') : '<p>Нема додадени патеки.</p>';
};

const renderLogbook = (runs) => {
    const list = document.getElementById('myRunsList');
    list.innerHTML = runs.length > 0 ? runs.map(r => `
        <tr>
            <td>${r.trackId?.name || 'Unknown'}</td>
            <td>${r.carId?.model || 'Unknown'}</td>
            <td>${window.Utils.msToFormat(r.runTime)}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteRun('${r._id}')">Delete</button>
            </td>
        </tr>
    `).join('') : '<tr><td colspan="4">Нема снимени вожњи.</td></tr>';
};

window.renderChart = (runs) => {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    if (window.appState.chart) window.appState.chart.destroy();

    // Create a reversed copy of the runs so the chart order makes sense
    // If your newest runs are at the start, this makes them appear at the end
    const sortedRuns = [...runs].reverse();

    const labels = sortedRuns.map((_, index) => `Run ${index + 1}`);
    const data = sortedRuns.map(r => r.runTime);

    window.renderChartInstance = new Chart(ctx, { // Renamed for clarity
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Време',
                data: data,
                borderColor: '#ffc107',
                backgroundColor: 'rgba(255, 193, 7, 0.2)',
                tension: 0
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    reverse: true, // Smallest time at the top
                    ticks: {
                        callback: (value) => window.Utils.msToFormat(value)
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => 'Време: ' + window.Utils.msToFormat(context.raw)
                    }
                }
            }
        }
    });
};

window.deleteRun = async (id) => {
    if (!confirm("Сигурно сакаш да го избришеш ова време?")) return;

    try {
        await API.deleteRun(id);
        window.appState.allRuns = window.appState.allRuns.filter(r => r._id !== id);
        
        // Re-render both
        renderLogbook(window.appState.allRuns);
        window.renderChart(window.appState.allRuns); // The chart now updates correctly!
    } catch (err) {
        alert("Грешка при бришење.");
    }
};
window.deleteVehicle = async (id) => {
    if (!confirm("Сигурно сакаш да го избришеш ова возило?")) return;

    try {
        await API.deleteVehicle(id);
        window.appState.allVehicles = window.appState.allVehicles.filter(v => v._id !== id);
        renderGarageList(window.appState.allVehicles);
    } catch (err) {
        alert("Грешка при бришење.");
    }
};
window.deleteTrack = async (id) => {
    if (!confirm("Сигурно сакаш да го избришеш ова место?")) return;

    try {
        await API.deleteTrack(id);
        window.appState.allTracks = window.appState.allTracks.filter(t => t._id !== id);
        renderTrackList(window.appState.allTracks);
    } catch (err) {
        alert("Грешка при бришење.");
    }
};