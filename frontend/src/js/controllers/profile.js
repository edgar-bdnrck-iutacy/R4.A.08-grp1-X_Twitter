// frontend/src/js/controllers/profile.js
import { api } from '../api.js';

export async function initProfile() {
    // 1. Sélection des éléments du DOM
    const headerName = document.getElementById('profile-name');
    const infoName = document.getElementById('profile-name-text');
    const handleElement = document.getElementById('profile-handle');
    const bioElement = document.getElementById('profile-bio');
    const container = document.getElementById('user-tweets-container');
    const avatar = document.querySelector('.avatar-placeholder');
    const banner = document.querySelector('.profile-banner');

    const USER_ID = 1; // Toujours Jean Dupont pour le test

    // 2. Récupération des données du profil via l'API
    const profileData = await api.getUserProfile(USER_ID);

    if (profileData) {
        // Mise à jour des textes
        if (headerName) headerName.textContent = profileData.name;
        if (infoName) infoName.textContent = profileData.name;
        if (handleElement) handleElement.textContent = `${profileData.handle}`;
        if (bioElement) bioElement.textContent = profileData.bio;

        // Fix images (Avatar)
        if (avatar) {
            // Fallback image si l'utilisateur n'en a pas
            const avatarUrl = profileData.photo_profil || `https://ui-avatars.com/api/?name=${profileData.handle}&background=random&color=fff`;
            avatar.style.backgroundImage = `url('${avatarUrl}')`;
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';
        }

        // Mise à jour de la bannière
        if (banner && profileData.photo_banniere) {
            banner.style.backgroundImage = `url('${profileData.photo_banniere}')`;
            banner.style.backgroundSize = 'cover';
            banner.style.backgroundPosition = 'center';
        }
    }

    // 3. Chargement et affichage des tweets de l'utilisateur
    const tweets = await api.getUserPosts(USER_ID);
    renderUserTweets(tweets, container);
}

/**
 * Génère le HTML pour la liste des tweets du profil
 * Modifié pour inclure la photo miniature
 */
function renderUserTweets(tweets, container) {
    if (!container) return;

    if (!tweets || tweets.length === 0) {
        container.innerHTML = `
            <p style="text-align:center; padding:40px; color: var(--text-muted);">
                Cet utilisateur n'a pas encore posté de tweets.
            </p>`;
        return;
    }

    container.innerHTML = tweets.map(tweet => {
        // Fallback image pour éviter le blocage tracking
        const profilePic = tweet.author_photo || `https://ui-avatars.com/api/?name=${tweet.author}&background=random&color=fff`;
        const likedStyle = tweet.isLiked ? 'style="color: #f91880;"' : '';

        return `
            <div class="tweet-card" style="display: flex; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border-color);">
                <div class="tweet-avatar-col" style="flex-shrink: 0;">
                    <img src="${profilePic}" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${tweet.author}&background=random&color=fff';"
                        class="tweet-avatar-mini" alt="avatar" 
                        style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
                </div>

                <div class="tweet-content-col" style="flex: 1;">
                    <div class="tweet-header" style="margin-bottom: 4px;">
                        <strong style="color: var(--text-main); font-weight: 700;">${tweet.author_name || tweet.author}</strong> 
                        <span class="handle" style="color: var(--text-muted); margin-left: 5px;">@${tweet.author}</span>
                    </div>
                    <p class="tweet-text" style="color: var(--text-main); margin-bottom: 10px; line-height: 1.4;">${tweet.content}</p>
                    <div class="tweet-footer" style="display: flex; gap: 40px; color: var(--text-muted); font-size: 0.9rem;">
                        <span class="btn-like" data-id="${tweet.id}" ${likedStyle} style="cursor:pointer; display: flex; align-items: center; gap: 5px;">
                            ❤️ <span class="like-count">${tweet.likes || 0}</span>
                        </span>
                        <span>💬 0</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}