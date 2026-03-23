import { api } from './api.js';
import { initHome } from './controllers/home.js';
import { initProfile } from './controllers/profile.js';

const appContainer = document.getElementById('app-container');

async function loadSidebarProfile() {
    const USER_ID = 1; // L'ID de Jean ou John dans ta table
    const user = await api.getUserProfile(USER_ID);

    if (user) {
        const avatar = document.getElementById('current-user-avatar');
        const name = document.getElementById('current-user-name');
        const handle = document.getElementById('current-user-handle');

        if (name) name.textContent = user.nom_utilisateur; 
        if (handle) handle.textContent = `@${user.username_utilisateur}`;
        
        if (avatar) {
            // On utilise la colonne photo_profil_utilisateur
            avatar.src = user.photo_profil_utilisateur || 
                `https://ui-avatars.com/api/?name=${user.nom_utilisateur}&background=random&color=fff`;
        }
    }
}

async function loadPage(page) {
    try {
        // On récupère le fichier HTML correspondant dans le dossier /pages
        const response = await fetch(`/pages/${page}.html`);
        if (!response.ok) throw new Error('Page introuvable');
        
        const html = await response.text();
        appContainer.innerHTML = html;

        // On initialise le contrôleur de la page
        // On utilise 'await' ici pour que la page soit totalement prête
        if (page === 'home') {
            await initHome();
        } else if (page === 'profile') {
            await initProfile();
        }

        // Petit bonus : mettre à jour la classe .active sur les liens de la sidebar
        updateActiveLink(page);

    } catch (error) {
        appContainer.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h2>Erreur 404</h2>
                <p>Désolé, la page "${page}" est introuvable.</p>
                <a href="#home" style="color: var(--twitter-blue);">Retour à l'accueil</a>
            </div>`;
        console.error("Erreur de routage:", error);
    }
}


function updateActiveLink(page) {
    document.querySelectorAll('#sidebar a').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${page}`);
    });
}

function handleRouting() {
    const hash = window.location.hash.substring(1) || 'home';
    loadPage(hash);
}


loadSidebarProfile();


window.addEventListener('hashchange', handleRouting);
window.addEventListener('DOMContentLoaded', handleRouting);