// public/js/add-vehicle.js

window.initAddVehicle = () => {
    const form = document.getElementById('addVehicleForm');
    const hpInput = document.getElementById('hp');
    const rankPreview = document.getElementById('rankPreview');
    const engineDisplacementInput = document.getElementById('engineDisplacement');
    const yearInput = document.getElementById('year');
    
    
    if (!form || !hpInput) return;

    const calculateRank = (hp) => {
        const h = parseInt(hp);
        if (isNaN(h)) return '-';
        return h < 150 ? 'E' : h < 250 ? 'D' : h < 400 ? 'C' : h < 600 ? 'B' : 'A';
    };

    hpInput.addEventListener('input', (e) => {
        rankPreview.innerText = calculateRank(e.target.value);
    });

    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const hp = parseInt(hpInput.value);
        if (isNaN(hp) || hp <= 0) {
            alert("Ве молиме внесете валидна вредност за коњски сили.");
            return;
        }

        const vehicleData = {
            make: document.getElementById('make').value.trim(),
            model: document.getElementById('model').value.trim(),
            year: parseInt(document.getElementById('year').value),
            engineDisplacement: parseFloat(document.getElementById('engineDisplacement').value),
            hp: hp,
            carRank: rankPreview.innerText
        };

        try {
            await API.addVehicle(vehicleData);
            alert("Возилото е успешно додадено!");
            form.reset(); 
            rankPreview.innerText = '-'; // Explicitly reset preview
            loadView('stopwatch');
        } catch (err) {
            alert("Грешка: " + err.message);
            console.error(err);
        }
    };
};