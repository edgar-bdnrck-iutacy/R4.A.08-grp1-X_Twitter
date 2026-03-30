// frontend/src/js/controllers/search.js
import { api } from '../api.js';

export async function initSearch() {
    const searchInput = document.getElementById('search-page-input');
    const resultsContainer = document.getElementById('search-page-results');
    const MY_ID = localStorage.getItem('userId');

    if (!searchInput || !resultsContainer) return;

    // --- NOUVEAU : GESTION DES LIKES, SIGNETS ET COMS ---
    resultsContainer.addEventListener('click', async (e) => {
        // Like
        const likeBtn = e.target.closest('.btn-like');
        if (likeBtn) {
            const postId = likeBtn.dataset.id;
            const result = await api.likePost(postId);
            if (result) {
                likeBtn.querySelector('.like-count').textContent = result.likes;
                const iconSvg = likeBtn.querySelector('.heart-icon');
                likeBtn.style.color = result.isLiked ? "#f91880" : "";
                iconSvg.setAttribute('fill', result.isLiked ? 'currentColor' : 'none');
                iconSvg.setAttribute('stroke', result.isLiked ? 'none' : 'currentColor');
            }
            return;
        }

        // Signet
        const bookmarkBtn = e.target.closest('.btn-bookmark');
        if (bookmarkBtn) {
            const result = await api.bookmarkPost(bookmarkBtn.dataset.id);
            if (result?.success) {
                const svg = bookmarkBtn.querySelector('svg');
                svg.setAttribute('fill', result.bookmarked ? '#1d9bf0' : 'none');
                svg.setAttribute('stroke', result.bookmarked ? '#1d9bf0' : 'currentColor');
            }
            return;
        }

        // Commentaire (Afficher/Masquer)
        const commentBtn = e.target.closest('.btn-comment');
        if (commentBtn) {
            const postId = commentBtn.dataset.id;
            const section = document.getElementById(`comments-${postId}`);
            if (section) {
                if (section.style.display === "block") {
                    section.style.display = "none";
                } else {
                    section.style.display = "block";
                    section.innerHTML = `<p style="padding:10px; color:gray;">Chargement...</p>`;
                    const comments = await api.getComments(postId);
                    renderCommentsUI(postId, comments, section);
                }
            }
            return;
        }

        // Soumettre Commentaire
        if (e.target.classList.contains('btn-submit-comment')) {
            const postId = e.target.dataset.id;
            const input = document.getElementById(`input-comment-${postId}`);
            if (input && input.value.trim()) {
                const ok = await api.addComment(postId, input.value.trim());
                if (ok) {
                    input.value = '';
                    const comments = await api.getComments(postId);
                    renderCommentsUI(postId, comments, document.getElementById(`comments-${postId}`));
                }
            }
            return;
        }
    });

    searchInput.addEventListener('input', async (e) => {
        const rawQuery = e.target.value.trim();

        if (rawQuery.length < 2) {
            resultsContainer.innerHTML = `<p class="search-info-msg">Tapez au moins 2 caractères...</p>`;
            return;
        }

        resultsContainer.innerHTML = `<p class="search-info-msg">Recherche...</p>`;

        // === RECHERCHE PAR HASHTAG ===
        if (rawQuery.startsWith('#')) {
            const tag = rawQuery.replace('#', '');
            const posts = await api.searchPostsByHashtag(tag);

            if (posts.length === 0) {
                resultsContainer.innerHTML = `<p class="search-info-msg">Aucun résultat pour #${tag}.</p>`;
                return;
            }

            resultsContainer.innerHTML = posts.map(post => {
                const avatarUrl = post.author_photo || `https://ui-avatars.com/api/?name=${post.author_name || post.author}&background=random&color=fff`;
                const bookmarkFill = post.isBookmarked ? '#1d9bf0' : 'none';
                const bookmarkStroke = post.isBookmarked ? '#1d9bf0' : 'currentColor';
                const heartFill = post.isLiked ? 'currentColor' : 'none';
                const heartStroke = post.isLiked ? 'none' : 'currentColor';
                
                // Correction 1 : On s'assure qu'il n'y a qu'un seul '@'
                const username = (post.handle || post.author || '').replace(/^@/, '');

                return `
                    <div class="tweet-card" style="display: flex; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border-color); width: 100%; box-sizing: border-box; transition: opacity 0.3s;">
                        
                        <div class="tweet-avatar-col tweet-profile-link" data-id="${post.id_utilisateur}" style="flex-shrink: 0; cursor: pointer;">
                            <img src="${avatarUrl}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
                        </div>
                        
                        <div class="tweet-content-col" style="flex: 1; min-width: 0;">
                            
                            <div class="tweet-header tweet-profile-link" data-id="${post.id_utilisateur}" style="margin-bottom: 4px; cursor: pointer;">
                                <strong style="color: var(--text-main);">${post.author_name}</strong> 
                                <span style="color: var(--text-muted); margin-left: 5px;">@${username}</span>
                            </div>
                            
                            <p style="color: var(--text-main); margin-bottom: 10px; line-height: 1.4; overflow-wrap: break-word; white-space: pre-wrap;">${post.content}</p>
                            
                            ${post.image_url ? `
                                <div style="margin: 10px 0; border-radius: 16px; overflow: hidden; border: 1px solid var(--border-color);">
                                    <img src="http://localhost:3001${post.image_url}" style="width: 100%; display: block;">
                                </div>
                            ` : ''}

                            <div class="tweet-footer" style="display: flex; justify-content: flex-start; gap: 40px; color: var(--text-muted); font-size: 0.9rem; align-items: center;">
                                
                                <span class="btn-like" data-id="${post.id}" style="cursor:pointer; display:flex; align-items:center; gap:5px; ${post.isLiked ? 'color:#f91880' : ''}">
                                    <svg class="heart-icon" viewBox="0 0 24 24" width="18" height="18" stroke="${heartStroke}" fill="${heartFill}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                    <span class="like-count">${post.likes || 0}</span>
                                </span>

                                <span class="btn-comment" data-id="${post.id}" style="cursor:pointer; display:flex; align-items:center; gap:5px;">
                                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                    <span class="comment-count">${parseInt(post.comments) || 0}</span>
                                </span>

                                <span class="btn-bookmark" data-id="${post.id}" style="cursor:pointer;">
                                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="${bookmarkStroke}" fill="${bookmarkFill}" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                                </span>
                            </div>
                            <div class="comments-section" id="comments-${post.id}" style="display: none; margin-top: 15px;"></div>
                        </div>
                    </div>
                `;
            }).join('');

            // Navigation profil (mise à jour pour écouter la nouvelle classe)
            document.querySelectorAll('.tweet-profile-link').forEach(btn => {
                btn.onclick = (e) => {
                    localStorage.setItem('viewUserId', e.currentTarget.dataset.id);
                    window.location.hash = '#profile'; 
                };
            });

        } 
        // === RECHERCHE PAR UTILISATEUR ===
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

// Fonction pour afficher l'interface des commentaires
function renderCommentsUI(postId, comments, section) {
    let html = comments.length === 0 
        ? `<p style="color: var(--text-muted); font-size: 0.9rem; padding: 10px;">Aucun commentaire.</p>`
        : comments.map(c => `
            <div style="display: flex; gap: 10px; margin-bottom: 12px; padding: 0 10px;">
                <img src="${c.author_photo || `https://ui-avatars.com/api/?name=${c.author}&background=random`}" style="width: 32px; height: 32px; border-radius: 50%;">
                <div>
                    <strong style="font-size: 0.85rem;">${c.author_name}</strong>
                    <p style="font-size: 0.9rem; margin-top: 2px;">${c.content}</p>
                </div>
            </div>
        `).join('');

    html += `
        <div style="display: flex; gap: 10px; margin-top: 10px; padding: 10px; border-top: 1px solid var(--border-color);">
            <input type="text" id="input-comment-${postId}" placeholder="Répondre..." style="flex: 1; padding: 8px 15px; border-radius: 20px; border: 1px solid var(--border-color); background: transparent; color: white; outline: none;">
            <button class="btn-submit-comment" data-id="${postId}" style="padding: 6px 12px; border-radius: 20px; background: white; color: black; font-weight: bold; border: none; cursor: pointer;">Répondre</button>
        </div>
    `;
    section.innerHTML = html;
}