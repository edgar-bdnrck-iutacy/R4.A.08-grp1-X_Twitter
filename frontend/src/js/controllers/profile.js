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

        if (headerName) headerName.textContent = name;
        if (infoName) infoName.textContent = name;
        if (handleElement) handleElement.textContent = `${handle}`;
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

        // --- GESTION DE LA MODALE D'ÉDITION (CORRIGÉE) ---
        if (isMe && openBtn && modal) {
            openBtn.onclick = () => {
                // On pré-remplit avec les URLs existantes
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
                // NOUVELLE LIGNE POUR LES SIGNETS
                else if (tabName === 'bookmarks') data = await api.getUserBookmarks(TARGET_ID); 
                
                renderUserTweets(data, container);

                container.addEventListener('click', async (e) => {
                    // 1. Action J'aime
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
                                likeBtn.style.color = result.isLiked ? '#f91880' : 'var(--text-muted)';
                            }
                        }
                        return;
                    }
        
                    // 2. Action Signet
                    const bookmarkBtn = e.target.closest('.btn-bookmark');
                    if (bookmarkBtn) {
                        const postId = bookmarkBtn.dataset.id;
                        const result = await api.bookmarkPost(postId);
                        
                        if (result && result.success) {
                            const svg = bookmarkBtn.querySelector('svg');
                            if (svg) {
                                svg.style.transition = "all 0.2s ease-in-out";
                                svg.style.transform = "scale(1.4)";
                                
                                if (result.bookmarked) {
                                    svg.setAttribute('fill', '#1d9bf0');
                                    svg.setAttribute('stroke', '#1d9bf0');
                                } else {
                                    svg.setAttribute('fill', 'none');
                                    svg.setAttribute('stroke', 'currentColor');

                                    // --- NOUVEAU : Disparition si on est sur l'onglet Signets ---
                                    const activeTab = document.querySelector('.profile-tabs button.active');
                                    if (activeTab && activeTab.dataset.tab === 'bookmarks') {
                                        const tweetCard = bookmarkBtn.closest('.tweet-card');
                                        if (tweetCard) {
                                            // On ajoute un effet de fondu avant de le faire disparaître
                                            tweetCard.style.transition = "opacity 0.3s";
                                            tweetCard.style.opacity = "0";
                                            setTimeout(() => tweetCard.style.display = 'none', 300);
                                        }
                                    }
                                    // -------------------------------------------------------------
                                }
                                
                                setTimeout(() => svg.style.transform = "scale(1)", 200);
                            }
                        }
                        return;
                    }
                });

            };
        });

        renderUserTweets(initialTweets, container);

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

function renderUserTweets(tweets, container) {
    if (!container) return;
    if (!tweets || tweets.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding:40px; color: var(--text-muted);">Aucun tweet à afficher.</p>`;
        return;
    }

    container.innerHTML = tweets.map(tweet => {
        const profilePic = tweet.author_photo || `https://ui-avatars.com/api/?name=${tweet.author}&background=random&color=fff`;
        const likedStyle = tweet.isLiked ? 'style="color: #f91880;"' : '';
        const commentCount = parseInt(tweet.comments) || 0;

        // --- NOUVEAU : On définit la couleur du signet selon l'état ---
        const bookmarkFill = tweet.isBookmarked ? '#1d9bf0' : 'none';
        const bookmarkStroke = tweet.isBookmarked ? '#1d9bf0' : 'currentColor';

        return `
            <div class="tweet-card" style="display: flex; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border-color);">
                <div class="tweet-avatar-col" style="flex-shrink: 0;">
                </div>
                <div style="flex: 1;">
                    <div style="margin-bottom: 4px;">
                        <strong style="color: var(--text-main);">${tweet.author_name || tweet.author}</strong> 
                        <span style="color: var(--text-muted); margin-left: 5px;">@${tweet.author}</span>
                    </div>
                    <p style="color: var(--text-main); margin-bottom: 10px; line-height: 1.4;">${tweet.content}</p>
                    
                    <div class="tweet-footer" style="display: flex; gap: 40px; color: var(--text-muted); font-size: 0.9rem; align-items: center; margin-top: 10px;">
                        
                        <span class="btn-like" data-id="${tweet.id}" style="cursor:pointer; display: flex; align-items: center; gap: 5px; color: ${tweet.isLiked ? '#f91880' : 'currentColor'}">
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="${tweet.isLiked ? '#f91880' : 'none'}"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                            <span class="like-count">${tweet.likes || 0}</span>
                        </span>
                        
                        <span class="btn-comment" data-id="${tweet.id}" style="cursor:pointer; display: flex; align-items: center; gap: 5px;">
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                            <span class="comment-count">${commentCount}</span>
                        </span>

                        <span class="btn-bookmark" data-id="${tweet.id}" style="cursor:pointer; display: flex; align-items: center;" title="Sauvegarder">
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="${bookmarkStroke}" stroke-width="2" fill="${bookmarkFill}"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}