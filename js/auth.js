// public/js/auth.js

window.initAuth = () => {
    console.log("Auth view loaded. Ready to login/register.");
};
window.toggleMode = () => {
    const isRegister = document.getElementById('username').style.display === 'none';
    
    // Менување на видливоста на полето за корисничко име
    document.getElementById('username').style.display = isRegister ? 'block' : 'none';
    
    // Менување на насловот и функциите на копчињата
    document.getElementById('authTitle').innerText = isRegister ? 'Регистрација' : 'Добредојдовте';
    document.getElementById('mainBtn').innerText = isRegister ? 'Регистрирај се' : 'Најава';
    document.getElementById('mainBtn').onclick = isRegister ? handleRegister : handleLogin;
    document.getElementById('toggleBtn').innerText = isRegister ? 'Назад кон Најава' : 'Регистрација';
    document.getElementById('toggleBtn').onclick = isRegister ? toggleMode : toggleMode;
};
window.handleRegister = async () => {
    const username = document.getElementById('username')?.value;
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    if (!username || !email || !password) {
        return alert("Ве молиме пополнете ги сите полиња!");
    }

    const result = await API.register(email, password, username);

        if (result.success) {
            alert("Успешна регистрација!");
            loadView('login'); 
        } else {
            // Look inside .data for the error
            alert("Регистрацијата не успеа: " + (result.data?.error || "Грешка."));
        }
};

window.handleLogin = async () => {
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    if (!email || !password) return alert("Внесете e-mail и лозинка!");

    const result = await API.login(email, password);

    if (result.success && result.data.token) {
        alert("Најавата е успешна!");
        loadView('stopwatch'); 
    } else {
        alert("Неуспешна најава: " + (result.data?.error || "Погрешни податоци."));
    }
};
