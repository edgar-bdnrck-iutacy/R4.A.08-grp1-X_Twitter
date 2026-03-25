// frontend/src/js/controllers/search.js
import { api } from '../api.js';

export async function initSearch() {
    // Utilisation d'IDs très spécifiques
    const searchInput = document.getElementById('search-page-input');
    const resultsContainer = document.getElementById('search-page-results');
    const MY_ID = localStorage.getItem('userId');

    if (!searchInput || !resultsContainer) return;

    searchInput.addEventListener('input', async (e) => {
        const rawQuery = e.target.value.trim();

        if (rawQuery.length < 2) {
            resultsContainer.innerHTML = `<p class="search-info-msg">Tapez au moins 2 caractères...</p>`;
            return;
        }

        resultsContainer.innerHTML = `<p class="search-info-msg">Recherche...</p>`;

        // === RECHERCHE PAR HASHTAG ===
        if (rawQuery.startsWith('#')) {
            const tag = rawQuery.replace('#', ''); // On retire le # pour l'API
            const posts = await api.searchPostsByHashtag(tag);

            if (posts.length === 0) {
                resultsContainer.innerHTML = `<p class="search-info-msg">Aucun résultat pour #${tag}.</p>`;
                return;
            }

            resultsContainer.innerHTML = posts.map(post => {
                const avatarUrl = post.author_photo || `https://ui-avatars.com/api/?name=${post.author}&background=random&color=fff`;
                return `
                    <div class="search-tweet-card" style="padding: 15px; border-bottom: 1px solid var(--border-color); display: flex; gap: 15px; transition: background 0.2s;">
                        <img src="${avatarUrl}" class="btn-search-view-profile" data-id="${post.id_utilisateur}" style="width: 48px; height: 48px; border-radius: 50%; cursor: pointer;">
                        <div style="flex: 1;">
                            <div style="margin-bottom: 5px;">
                                <strong class="btn-search-view-profile" data-id="${post.id_utilisateur}" style="cursor: pointer; font-size: 1rem;">${post.author_name}</strong>
                                <span style="color: var(--text-muted); font-size: 0.9rem;">${post.handle}</span>
                                <span style="color: var(--text-muted); font-size: 0.9rem;"> • ${new Date(post.created_at).toLocaleDateString()}</span>
                            </div>
                            <div style="font-size: 0.95rem; line-height: 1.5; margin-bottom: 10px;">
                                ${post.content}
                            </div>
                            <div style="display: flex; gap: 20px; color: var(--text-muted); font-size: 0.9rem;">
                                <span>💬 ${post.comments}</span>
                                <span>❤️ ${post.likes}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // On réattache l'événement pour visiter le profil sur les tweets
            document.querySelectorAll('.btn-search-view-profile').forEach(btn => {
                btn.onclick = (e) => {
                    localStorage.setItem('viewUserId', e.currentTarget.dataset.id);
                    window.location.hash = '#profile'; 
                };
            });

        } 
        // === RECHERCHE PAR UTILISATEUR (Comportement existant) ===
        else {
            const query = rawQuery.replace('@', '');
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
            document.querySelectorAll('.btn-search-view-profile').forEach(btn => {
                btn.onclick = (e) => {
                    localStorage.setItem('viewUserId', e.currentTarget.dataset.id);
                    window.location.hash = '#profile'; 
                };
            });

            document.querySelectorAll('.btn-search-follow').forEach(btn => {
                btn.onclick = async (e) => {
                    const targetBtn = e.currentTarget;
                    const targetId = targetBtn.dataset.id;
                    targetBtn.disabled = true;
                    
                    const result = await api.toggleFollow(targetId);
                    if (result) {
                        const following = result.isFollowing;
                        targetBtn.textContent = following ? 'Abonné' : 'Suivre';
                        targetBtn.classList.toggle('is-following', following);
                    }
                    targetBtn.disabled = false;
                };
            });
        }
    });
}