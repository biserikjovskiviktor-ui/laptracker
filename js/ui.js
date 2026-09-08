// public/js/ui.js

window.initGarage = async () => {
    const list = document.getElementById('garageList');
    if (!list) return;

    list.innerHTML = `<div class="text-center text-white p-3">Се вчитува...</div>`;

    try {
        const vehicles = await API.getVehicles();
        
        if (vehicles.length === 0) {
            list.innerHTML = `<div class="text-center text-white">Нема пронајдени возила.</div>`;
            return;
        }

        list.innerHTML = vehicles.map(v => `
            <div class="card bg-secondary text-white mb-2">
                <div class="card-body">
                    <h5 class="card-title">${v.make || 'Unknown'} ${v.model || ''} (${v.year || 'N/A'})</h5>
                    <p class="card-text">Класа: <span class="badge bg-warning text-dark">${v.carRank || 'N/A'}</span> | HP: ${v.hp || 0}</p>
                </div>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = `<div class="alert alert-danger">Грешка при вчитување на возилата!</div>`;
        console.error(err);
    }
};

window.initDbManagement = () => {
    const seedBtn = document.getElementById('seedBtn');
    const clearBtn = document.getElementById('clearBtn');

    // Проверка дали елементите постојат пред да се додаде event listener
    if (seedBtn) seedBtn.onclick = window.seedDatabase;
    if (clearBtn) clearBtn.onclick = window.clearDatabase;
};

window.seedDatabase = async () => {
    const btn = document.getElementById('seedBtn');
    btn.disabled = true; // Оневозможи копче за да се избегне двоен клик
    btn.innerText = "Се вчитува...";
    
    try {
        await API.seedDatabase();
        alert("Тест податоци додадени!");
    } catch (err) {
        alert("Грешка при сеење: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "Внеси иницијални податоци";
    }
};

window.clearDatabase = async () => {
    if(confirm("Дали сте сигурни дека сакате да ја исчистите целата база?")) {
        try {
            await API.resetDatabase();
            alert("Базата е успешно исчистена.");
            if(document.getElementById('garageList')) window.initGarage();
        } catch (err) {
            alert("Грешка при чистење: " + err.message);
        }
    }
};
window.updateNavbar = () => {
    const token = localStorage.getItem('userToken');
    const isAdmin = localStorage.getItem('isAdmin') === 'true'; 

    document.getElementById('navAuth').style.display = token ? 'none' : 'block';
    document.getElementById('navLogout').style.display = token ? 'block' : 'none';
    document.getElementById('navProfile').style.display = token ? 'block' : 'none';
    document.getElementById('navStopwatch').style.display = token ? 'block' : 'none';
    document.getElementById('navAdmin').style.display = isAdmin && token ? 'block' : 'none';
};

window.handleLogout = () => {
    API.logout();
    window.location.href = '/'; // Refresh to clear views
};