import { api } from './api.js';
import { initHome } from './controllers/home.js';
import { initProfile } from './controllers/profile.js';
// Ajout du contrôleur pour la recherche
import { initSearch } from './controllers/search.js'; 

const appContainer = document.getElementById('app-container');




const navProfileLink = document.querySelector('a[href="#profile"]');
if (navProfileLink) {
    navProfileLink.addEventListener('click', () => {
        // ON SUPPRIME la cible pour forcer le chargement de NOTRE profil
        localStorage.removeItem('viewUserId');
        console.log("🧹 Navigation: viewUserId supprimé (retour au profil perso)");
    });
}

// --- GESTION DE LA DÉCONNEXION ---
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('userId');
        window.location.href = '/auth.html'; // Redirige vers la page de login
    });
}

// --- SYNC DU PROFIL DANS LA SIDEBAR ---
async function loadSidebarProfile() {
    // On récupère l'ID stocké, si rien n'est stocké on redirige
    const USER_ID = localStorage.getItem('userId');

    if (!USER_ID) {
        // Si on n'est pas déjà sur auth.html, on y va
        if (!window.location.pathname.includes('auth.html')) {
            window.location.href = '/auth.html';
        }
        return; 
    }
    
    try {
        const profileData = await api.getUserProfile(USER_ID);
        if (profileData) {
            const avatarImg = document.getElementById('current-user-avatar');
            const nameElement = document.getElementById('current-user-name');
            const handleElement = document.getElementById('current-user-handle');

            if (nameElement) nameElement.textContent = profileData.name || profileData.nom_utilisateur;
            if (handleElement) handleElement.textContent = profileData.handle || `@${profileData.username_utilisateur}`;
            if (avatarImg) {
                avatarImg.src = profileData.photo_profil || profileData.photo_profil_utilisateur || 
                    `https://ui-avatars.com/api/?name=${profileData.name || profileData.nom_utilisateur}&background=random&color=fff`;
            }
        }
    } catch (error) {
        console.error("Erreur de synchronisation sidebar :", error);
    }
}

// --- ROUTAGE SPA ---
async function loadPage(page) {
    try {
        const response = await fetch(`/pages/${page}.html`);
        if (!response.ok) throw new Error('Page introuvable');
        
        const html = await response.text();
        appContainer.innerHTML = html;

        // Branchement des différents contrôleurs selon la page
        if (page === 'home') {
            await initHome();
        } else if (page === 'profile') {
            await initProfile();
        } else if (page === 'search') {
            await initSearch(); // Initialisation de la vue recherche
        }

        updateActiveLink(page);
    } catch (error) {
        appContainer.innerHTML = `<div style="text-align: center;"><h2>Erreur 404</h2></div>`;
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

// Initialisation
loadSidebarProfile();

window.addEventListener('hashchange', handleRouting);
window.addEventListener('DOMContentLoaded', handleRouting);