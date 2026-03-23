import { initHome } from './controllers/home.js';
import { initProfile } from './controllers/profile.js';

const appContainer = document.getElementById('app-container');

async function loadPage(page) {
    try {
        // Remplacement de ./ par / pour cibler le dossier à la racine
        const response = await fetch(`/pages/${page}.html`);
        if (!response.ok) throw new Error('Page introuvable');
        
        const html = await response.text();
        appContainer.innerHTML = html;

        if (page === 'home') {
            initHome();
        } else if (page === 'profile') {
            initProfile();
        }
    } catch (error) {
        appContainer.innerHTML = `<h2>Erreur 404</h2><p>La page demandée n'existe pas.</p>`;
        console.error("Erreur de routage:", error);
    }
}

function handleRouting() {
    const hash = window.location.hash.substring(1) || 'home';
    loadPage(hash);
}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('DOMContentLoaded', handleRouting);