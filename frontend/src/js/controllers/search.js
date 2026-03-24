// frontend/src/js/controllers/search.js
import { api } from '../api.js';

export async function initSearch() {
    // Utilisation d'IDs très spécifiques
    const searchInput = document.getElementById('search-page-input');
    const resultsContainer = document.getElementById('search-page-results');
    const MY_ID = localStorage.getItem('userId');

    if (!searchInput || !resultsContainer) return;

    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim().replace('@', '');

        if (query.length < 2) {
            resultsContainer.innerHTML = `<p class="search-info-msg">Tapez au moins 2 caractères...</p>`;
            return;
        }

        resultsContainer.innerHTML = `<p class="search-info-msg">Recherche...</p>`;

        const users = await api.searchUsers(query);
        
        if (users.length === 0) {
            resultsContainer.innerHTML = `<p class="search-info-msg">Aucun résultat pour "${query}".</p>`;
            return;
        }

        const usersWithStatus = await Promise.all(users.map(async (user) => {
            const status = await api.getFollowStatus(MY_ID, user.id_utilisateur);
            return { ...user, isFollowing: status.isFollowing };
        }));

        // Génération HTML avec des classes UNIQUES "search-specific-xxx"
        resultsContainer.innerHTML = usersWithStatus.map(user => {
            const avatarUrl = user.photo_profil_utilisateur || `https://ui-avatars.com/api/?name=${user.username_utilisateur}&background=random&color=fff`;
            const isMe = user.id_utilisateur == MY_ID;
            
            return `
                <div class="search-user-card">
                    <img src="${avatarUrl}" class="search-card-avatar">
                    <div class="search-card-info">
                        <strong class="search-card-name">${user.nom_utilisateur}</strong>
                        <span class="search-card-handle">@${user.username_utilisateur}</span>
                    </div>
                    <div class="search-card-actions">
                        <button class="btn-search-view-profile" data-id="${user.id_utilisateur}">Profil</button>
                        ${!isMe ? `
                            <button class="btn-search-follow ${user.isFollowing ? 'is-following' : ''}" 
                                    data-id="${user.id_utilisateur}">
                                ${user.isFollowing ? 'Abonné' : 'Suivre'}
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // --- LISTENERS UNIQUES ---

        // Bouton Profil
        document.querySelectorAll('.btn-search-view-profile').forEach(btn => {
            btn.onclick = (e) => {
                localStorage.setItem('viewUserId', e.currentTarget.dataset.id);
                window.location.hash = '#profile'; 
            };
        });

        // Bouton Follow
        document.querySelectorAll('.btn-search-follow').forEach(btn => {
            btn.onclick = async (e) => {
                const targetBtn = e.currentTarget;
                const targetId = targetBtn.dataset.id;
                targetBtn.disabled = true;
                
                const result = await api.toggleFollow(targetId);
                if (result) {
                    const following = result.isFollowing;
                    targetBtn.textContent = following ? 'Abonné' : 'Suivre';
                    // On toggle la classe pour le CSS
                    targetBtn.classList.toggle('is-following', following);
                }
                targetBtn.disabled = false;
            };
        });
    });
}