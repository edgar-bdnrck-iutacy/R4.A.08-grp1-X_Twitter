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