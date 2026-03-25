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

        // --- GESTION DE LA MODALE ABONNÉS / ABONNEMENTS ---
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
                // Cliquer sur un utilisateur redirige vers son profil
                return `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: background-color 0.2s;" 
                         onmouseover="this.style.backgroundColor='rgba(255, 255, 255, 0.05)'" 
                         onmouseout="this.style.backgroundColor='transparent'"
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

        // Rendre les compteurs cliquables (en ciblant le parent span)
        if (followersCount) followersCount.parentElement.onclick = () => showFollowList('followers');
        if (followingCount) followingCount.parentElement.onclick = () => showFollowList('following');

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
                
                renderUserTweets(data, container);
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

        return `
            <div class="tweet-card" style="display: flex; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border-color);">
                <div class="tweet-avatar-col" style="flex-shrink: 0;">
                    <img src="${profilePic}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
                </div>
                <div style="flex: 1;">
                    <div style="margin-bottom: 4px;">
                        <strong style="color: var(--text-main);">${tweet.author_name || tweet.author}</strong> 
                        <span style="color: var(--text-muted); margin-left: 5px;">@${tweet.author}</span>
                    </div>
                    <p style="color: var(--text-main); margin-bottom: 10px; line-height: 1.4;">${tweet.content}</p>
                    <div style="display: flex; gap: 40px; color: var(--text-muted); font-size: 0.9rem;">
                        <span ${likedStyle} style="cursor:pointer;">❤️ ${tweet.likes || 0}</span>
                        <span style="cursor:pointer;">💬 ${commentCount}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}