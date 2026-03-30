document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('http://localhost:3001/api/auth/login', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
           
            localStorage.setItem('userId', data.user.id);
            // On redirige vers l'index à la racine
            window.location.href = '../index.html';
        } else {
            alert("Erreur : " + data.message);
        }
    } catch (err) {
        console.error("Erreur connexion :", err);
    }
});


// --- LOGIQUE DE BASCULE CONNEXION / INSCRIPTION ---
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const toggleBtn = document.getElementById('toggle-auth');
const switchText = document.getElementById('auth-switch-text');
let isLogin = true;

toggleBtn.addEventListener('click', () => {
    isLogin = !isLogin;
    if (isLogin) {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        switchText.textContent = "Vous n'avez pas de compte ?";
        toggleBtn.textContent = "S'inscrire";
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        switchText.textContent = "Vous avez déjà un compte ?";
        toggleBtn.textContent = "Se connecter";
    }
});

// --- LOGIQUE D'INSCRIPTION ---
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nom = document.getElementById('reg-nom').value;
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const passwordError = document.getElementById('password-error'); 

    const passwordRegex = /^(?=.*[0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
        passwordError.style.display = 'block';
        return; 
    } else {
        passwordError.style.display = 'none';
    }

    try {
        const response = await fetch('http://localhost:3001/api/auth/register', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom, username, email, password })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('userId', data.user.id);
            window.location.href = '../index.html';
        } else {
            alert("Erreur : " + data.message);
        }
    } catch (err) {
        console.error("Erreur inscription :", err);
    }
});