import { api } from '../api.js';

export async function initProfile() {
    const nameElement = document.getElementById('profile-name');
    const handleElement = document.getElementById('profile-handle');
    const bioElement = document.getElementById('profile-bio');

    // Récupération des données (ID 1 utilisé à titre d'exemple)
    const profileData = await api.getUserProfile(1);

    // Mise à jour de l'interface utilisateur
    if (nameElement && bioElement) {
        nameElement.textContent = profileData.name;
        handleElement.textContent = profileData.handle;
        bioElement.textContent = profileData.bio;
    }
}