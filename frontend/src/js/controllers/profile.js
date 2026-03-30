// frontend/src/js/controllers/profile.js
import { api } from '../api.js';

export async function initProfile() {
    const MY_ID = localStorage.getItem('userId');
    let targetIdRaw = localStorage.getItem('viewUserId');

    let TARGET_ID = (targetIdRaw && targetIdRaw !== "undefined" && targetIdRaw !== "null") 
                    ? targetIdRaw 
                    : MY_ID;

    if (!TARGET_ID) {
        window.location.href = '/auth.html';
        return;
    }

    // --- SÉLECTION DES ÉLÉMENTS DU DOM ---
    const headerName = document.getElementById('profile-name');
    const infoName = document.getElementById('profile-name-text');
    const handleElement = document.getElementById('profile-handle');
    const bioElement = document.getElementById('profile-bio');
    const joinDateElement = document.getElementById('profile-join-date');
    const container = document.getElementById('user-tweets-container');
    const avatar = document.querySelector('.avatar-placeholder');
    const banner = document.querySelector('.profile-banner');
    
    const modal = document.getElementById('edit-profile-modal');
    const openBtn = document.getElementById('open-edit-modal');
    const closeBtn = document.getElementById('close-modal');
    const saveBtn = document.getElementById('save-profile');
    const form = document.getElementById('edit-profile-form');

    const followersCount = document.getElementById('count-followers');
    const followingCount = document.getElementById('count-following');
    const followBtn = document.getElementById('btn-follow');

    const followModal = document.getElementById('follow-list-modal');
    const closeFollowModal = document.getElementById('close-follow-modal');
    const followModalTitle = document.getElementById('follow-modal-title');
    const followListContainer = document.getElementById('follow-list-container');

    try {
        const [userData, stats, followStatus, initialTweets] = await Promise.all([
            api.getUserProfile(TARGET_ID),
            api.getFollowStats(TARGET_ID),
            api.getFollowStatus(MY_ID, TARGET_ID),
            api.getUserPosts(TARGET_ID)
        ]);

        if (!userData) {
            if (headerName) headerName.textContent = "Utilisateur introuvable";
            return;
        }

        const name = userData.nom_utilisateur || userData.name || "Utilisateur";
        const handle = userData.username_utilisateur || userData.handle || "unknown";

        // Mise à jour de l'UI
        if (headerName) headerName.textContent = name;
        if (infoName) infoName.textContent = name;
        if (handleElement) handleElement.textContent = `@${handle}`;
        if (bioElement) bioElement.textContent = userData.bio_utilisateur || userData.bio || "Pas encore de bio.";
        
        if (joinDateElement && userData.date_inscription) {
            const date = new Date(userData.date_inscription).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            joinDateElement.textContent = `📅 A rejoint en ${date}`;
        }

        if (followersCount) followersCount.textContent = stats.followers || 0;
        if (followingCount) followingCount.textContent = stats.following || 0;

        if (avatar) {
            const avatarUrl = userData.photo_profil_utilisateur || userData.photo_profil || `https://ui-avatars.com/api/?name=${handle}&background=random&color=fff`;
            avatar.style.backgroundImage = `url('${avatarUrl}')`;
            avatar.style.backgroundSize = 'cover';
        }

        if (banner) {
            const bannerUrl = userData.photo_banniere_utilisateur || userData.photo_banniere;
            banner.style.backgroundImage = bannerUrl ? `url('${bannerUrl}')` : 'none';
        }

        const isMe = (MY_ID === TARGET_ID);

        // --- BOUTON FOLLOW / EDIT ---
        if (isMe) {
            if (openBtn) openBtn.style.display = 'block';
            if (followBtn) followBtn.style.display = 'none';
        } else {
            if (openBtn) openBtn.style.display = 'none';
            if (followBtn) {
                followBtn.style.display = 'block';
                updateFollowUI(followBtn, followStatus.isFollowing);
                followBtn.onclick = async () => {
                    followBtn.disabled = true;
                    const result = await api.toggleFollow(TARGET_ID);
                    if (result) {
                        updateFollowUI(followBtn, result.isFollowing);
                        const newStats = await api.getFollowStats(TARGET_ID);
                        if (followersCount) followersCount.textContent = newStats.followers;
                    }
                    followBtn.disabled = false;
                };
            }
        }

        // --- MODALE ABONNÉS ---
        if (closeFollowModal) {
            closeFollowModal.onclick = () => followModal.style.display = 'none';
        }

        async function showFollowList(type) {
            followModal.style.display = 'flex';
            followModalTitle.textContent = type === 'followers' ? 'Abonnés' : 'Abonnements';
            followListContainer.innerHTML = '<p style="text-align:center; padding: 20px;">Chargement...</p>';
            let users = type === 'followers' ? await api.getFollowers(TARGET_ID) : await api.getFollowing(TARGET_ID);
            if (users.length === 0) {
                followListContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-muted);">Personne ici pour le moment.</p>';
                return;
            }
            followListContainer.innerHTML = users.map(u => {
                const avatarUrl = u.photo_profil || `https://ui-avatars.com/api/?name=${u.handle}&background=random&color=fff`;
                return `
                    <div class="follow-user-item" style="display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid var(--border-color); cursor: pointer;" 
                         onclick="localStorage.setItem('viewUserId', ${u.id}); window.location.reload();">
                        <img src="${avatarUrl}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
                        <div style="flex: 1;">
                            <div style="font-weight: bold; color: var(--text-main);">${u.name}</div>
                            <div style="color: var(--text-muted); font-size: 0.9rem;">@${u.handle}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        if (followersCount) followersCount.parentElement.onclick = () => showFollowList('followers');
        if (followingCount) followingCount.parentElement.onclick = () => showFollowList('following');

        // --- MODALE ÉDITION ---
        if (isMe && openBtn && modal) {
            openBtn.onclick = () => {
                document.getElementById('edit-name').value = userData.nom_utilisateur || userData.name || "";
                document.getElementById('edit-bio').value = userData.bio_utilisateur || userData.bio || "";
                document.getElementById('edit-avatar').value = userData.photo_profil_utilisateur || userData.photo_profil || "";
                document.getElementById('edit-banner').value = userData.photo_banniere_utilisateur || userData.photo_banniere || "";
                modal.style.display = 'flex';
            };
            closeBtn.onclick = () => modal.style.display = 'none';
            saveBtn.onclick = async () => {
                if (!form.reportValidity()) return;
                const updatedData = {
                    name: document.getElementById('edit-name').value.trim(),
                    bio: document.getElementById('edit-bio').value.trim(),
                    photo_profil: document.getElementById('edit-avatar').value.trim(),
                    photo_banniere: document.getElementById('edit-banner').value.trim()
                };
                saveBtn.disabled = true;
                const result = await api.updateUserProfile(MY_ID, updatedData);
                if (result) window.location.reload();
                saveBtn.disabled = false;
            };
        }

        // --- GESTION DES ONGLETS & INTERACTIONS ---
        const tabs = document.querySelectorAll('.profile-tabs button');
        tabs.forEach(tab => {
            tab.onclick = async (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                container.innerHTML = `<p style="text-align:center; padding:40px;">Chargement...</p>`;
                const tabName = e.target.dataset.tab;
                let data = [];
                if (tabName === 'posts') data = await api.getUserPosts(TARGET_ID);
                else if (tabName === 'replies') data = await api.getUserReplies(TARGET_ID);
                else if (tabName === 'likes') data = await api.getUserLikes(TARGET_ID);
                else if (tabName === 'bookmarks') data = await api.getUserBookmarks(TARGET_ID); 
                renderUserTweets(data, container, TARGET_ID);
            };
        });

        // Event Listener centralisé pour les boutons Like/Signets/Coms
        container.addEventListener('click', async (e) => {
            // Navigation Profil
            const profileTrigger = e.target.closest('.go-to-profile');
            if (profileTrigger) {
                const targetId = profileTrigger.dataset.id;
                if (targetId && targetId !== "undefined") {
                    localStorage.setItem('viewUserId', targetId);
                    window.location.hash = '#profile';
                    window.location.reload();
                }
                return;
            }

            // Like
            const likeBtn = e.target.closest('.btn-like');
            if (likeBtn) {
                const postId = likeBtn.dataset.id;
                const result = await api.likePost(postId);
                if (result) {
                    const counter = likeBtn.querySelector('.like-count');
                    const svg = likeBtn.querySelector('svg');
                    if (counter) counter.textContent = result.likes;
                    if (svg) {
                        svg.setAttribute('fill', result.isLiked ? '#f91880' : 'none');
                        svg.setAttribute('stroke', result.isLiked ? '#f91880' : 'currentColor');
                    }
                    likeBtn.style.color = result.isLiked ? '#f91880' : 'var(--text-muted)';
                }
                return;
            }

            const repostBtn = e.target.closest('.btn-repost');
            if (repostBtn) {
                const postId = repostBtn.dataset.id;
                const result = await api.repostPost(postId);

                if (result) {
                    const counter = repostBtn.querySelector('.repost-count');
                    const svg = repostBtn.querySelector('.repost-icon');

                    if (counter) counter.textContent = result.reposts;
                    if (svg) {
                        svg.setAttribute('fill', result.isReposted ? '#00ba7c' : 'none');
                        svg.setAttribute('stroke', result.isReposted ? '#00ba7c' : 'currentColor');
                    }

                    repostBtn.style.color = result.isReposted ? '#00ba7c' : 'var(--text-muted)';
                }

                return;
            }

            // Signet
            const bookmarkBtn = e.target.closest('.btn-bookmark');
            if (bookmarkBtn) {
                const postId = bookmarkBtn.dataset.id;
                const result = await api.bookmarkPost(postId);
                if (result && result.success) {
                    const svg = bookmarkBtn.querySelector('svg');
                    const isBookmarked = result.bookmarked;
                    svg.setAttribute('fill', isBookmarked ? '#1d9bf0' : 'none');
                    svg.setAttribute('stroke', isBookmarked ? '#1d9bf0' : 'currentColor');
                    
                    // Disparition si on est dans l'onglet Signets
                    const activeTab = document.querySelector('.profile-tabs button.active');
                    if (activeTab?.dataset.tab === 'bookmarks' && !isBookmarked) {
                        const card = bookmarkBtn.closest('.tweet-card');
                        card.style.opacity = "0";
                        setTimeout(() => card.remove(), 300);
                    }
                }
                return;
            }

            // Commentaires
            const commentBtn = e.target.closest('.btn-comment');
            if (commentBtn) {
                const postId = commentBtn.dataset.id;
                const section = document.getElementById(`comments-${postId}`);
                if (section.style.display === "block") {
                    section.style.display = "none";
                } else {
                    section.style.display = "block";
                    section.innerHTML = `<p style="padding:10px;">Chargement...</p>`;
                    const comments = await api.getComments(postId);
                    renderCommentsUI(postId, comments, section);
                }
                return;
            }

            // Soumettre Com
            if (e.target.classList.contains('btn-submit-comment')) {
                const postId = e.target.dataset.id;
                const input = document.getElementById(`input-comment-${postId}`);
                if (input.value.trim()) {
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

        // Rendu initial
        renderUserTweets(initialTweets, container, TARGET_ID);

    } catch (error) {
        console.error("Erreur critique sur le profil:", error);
    }
}

function updateFollowUI(btn, isFollowing) {
    btn.textContent = isFollowing ? 'Abonné' : 'Suivre';
    btn.style.background = isFollowing ? 'transparent' : 'white';
    btn.style.color = isFollowing ? 'white' : 'black';
    btn.style.border = isFollowing ? '1px solid #536471' : 'none';
}

function renderUserTweets(tweets, container, TARGET_ID) {
    if (!container) return;
    if (!tweets || tweets.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding:40px; color: var(--text-muted);">Aucun tweet à afficher.</p>`;
        return;
    }

    container.innerHTML = tweets.map(tweet => {
        const profilePic = tweet.author_photo || `https://ui-avatars.com/api/?name=${tweet.author}&background=random&color=fff`;
        const authorId = tweet.id_utilisateur || TARGET_ID;
        const heartFill = tweet.isLiked ? '#f91880' : 'none';
        const heartStroke = tweet.isLiked ? '#f91880' : 'currentColor';
        const bookmarkFill = tweet.isBookmarked ? '#1d9bf0' : 'none';
        const bookmarkStroke = tweet.isBookmarked ? '#1d9bf0' : 'currentColor';

        return `
        <div class="tweet-card" style="display: flex; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border-color); transition: opacity 0.3s;">
            <div class="tweet-avatar-col go-to-profile" data-id="${authorId}" style="flex-shrink: 0; cursor: pointer;">
                <img src="${profilePic}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
            </div>
            <div class="tweet-content-col" style="flex: 1; min-width: 0;">
                ${tweet.isRepost ? `
                    <div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 6px;">
                        🔁 ${tweet.reposted_by_name} a reposté
                    </div>
                ` : ''}
    
                <div class="tweet-header go-to-profile" data-id="${authorId}" style="margin-bottom: 4px; cursor: pointer;">
                    <strong style="color: var(--text-main);">${tweet.author_name || tweet.author}</strong> 
                    <span style="color: var(--text-muted); margin-left: 5px;">@${tweet.author}</span>
                </div>
    
                <p style="color: var(--text-main); margin-bottom: 10px; line-height: 1.4; overflow-wrap: break-word;">${tweet.content}</p>
    
                ${tweet.image_url ? `
                    <div style="margin: 10px 0; border-radius: 16px; overflow: hidden; border: 1px solid var(--border-color);">
                        <img src="http://localhost:3001${tweet.image_url}" style="width: 100%; display: block;">
                    </div>
                ` : ''}
    
                <div class="tweet-footer" style="display: flex; gap: 40px; color: var(--text-muted); font-size: 0.9rem; align-items: center;">
                    <span class="btn-like" data-id="${tweet.id}" style="cursor:pointer; display: flex; align-items: center; gap: 5px; color: ${tweet.isLiked ? '#f91880' : 'inherit'}">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="${heartStroke}" fill="${heartFill}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        <span class="like-count">${tweet.likes || 0}</span>
                    </span>
    
                    <span class="btn-repost" data-id="${tweet.id}" style="cursor:pointer; display:flex; align-items:center; gap:5px; color: ${tweet.isReposted ? '#00ba7c' : 'inherit'}">
                        <svg class="repost-icon" viewBox="0 0 24 24" width="18" height="18" stroke="${tweet.isReposted ? '#00ba7c' : 'currentColor'}" fill="${tweet.isReposted ? '#00ba7c' : 'none'}" stroke-width="2">
                            <path d="M17 1l4 4-4 4"></path>
                            <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                            <path d="M7 23l-4-4 4-4"></path>
                            <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                        </svg>
                        <span class="repost-count">${tweet.reposts || 0}</span>
                    </span>
    
                    <span class="btn-comment" data-id="${tweet.id}" style="cursor:pointer; display: flex; align-items: center; gap: 5px;">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                        <span class="comment-count">${parseInt(tweet.comments) || 0}</span>
                    </span>
    
                    <span class="btn-bookmark" data-id="${tweet.id}" style="cursor:pointer;">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="${bookmarkStroke}" fill="${bookmarkFill}" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    </span>
                </div>
    
                <div class="comments-section" id="comments-${tweet.id}" style="display: none; margin-top: 15px;"></div>
            </div>
        </div>
    `;
    }).join('');
}

function renderCommentsUI(postId, comments, section) {
    let html = comments.length === 0 
        ? `<p style="color: var(--text-muted); font-size: 0.9rem; padding: 10px;">Aucun commentaire.</p>`
        : comments.map(c => `
            <div style="display: flex; gap: 10px; margin-bottom: 12px; padding: 0 10px;">
                <img src="${c.author_photo}" onerror="this.src='https://ui-avatars.com/api/?name=${c.author}&background=random';" style="width: 32px; height: 32px; border-radius: 50%;">
                <div>
                    <strong style="font-size: 0.85rem;">${c.author_name}</strong>
                    <p style="font-size: 0.9rem; overflow-wrap: break-word;">${c.content}</p>
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