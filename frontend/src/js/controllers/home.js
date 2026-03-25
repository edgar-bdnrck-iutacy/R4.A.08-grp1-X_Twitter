// frontend/src/js/controllers/home.js
import { api } from '../api.js';

export async function initHome() {
    const composeAvatar = document.getElementById('compose-avatar');
    const sidebarAvatar = document.getElementById('current-user-avatar'); 

    if (composeAvatar && sidebarAvatar) {
        setTimeout(() => {
            if (sidebarAvatar.src) {
                composeAvatar.src = sidebarAvatar.src;
            }
        }, 150);
    }

    const container = document.getElementById('tweets-container');
    const postBtn = document.getElementById('btn-post');
    const textarea = document.querySelector('.compose-tweet textarea');

    async function refreshFeed() {
        const tweets = await api.getFeed();
        renderTweets(tweets, container);
    }

    await refreshFeed();
    await renderTrends();

    // --- GESTIONNAIRE D'ÉVÉNEMENTS CENTRALISÉ (Inspiré du Search) ---
    container.addEventListener('click', async (e) => {
        
        // 1. Action : Navigation Profil (Avatar ou Nom)
        const profileTrigger = e.target.closest('.go-to-profile');
        if (profileTrigger) {
            const targetId = profileTrigger.dataset.id;
            
            // On vérifie que l'ID n'est pas "undefined" ou vide
            if (targetId && targetId !== "undefined") {
                localStorage.setItem('viewUserId', targetId);
                window.location.hash = '#profile';
            } else {
                console.error("ID utilisateur introuvable sur cet élément");
            }
            return;
        }

        // 2. Action : "J'aime"
        const likeBtn = e.target.closest('.btn-like');
        if (likeBtn) {
            const postId = likeBtn.dataset.id;
            const result = await api.likePost(postId);
            if (result) {
                const counter = likeBtn.querySelector('.like-count');
                if (counter) counter.textContent = result.likes;
                
                // --- MISE À JOUR DU SVG ET DE LA COULEUR ---
                const iconSvg = likeBtn.querySelector('.heart-icon');
                if (result.isLiked) {
                    likeBtn.style.color = "#f91880";
                    iconSvg.setAttribute('fill', 'currentColor');
                    iconSvg.setAttribute('stroke', 'none');
                } else {
                    likeBtn.style.color = "";
                    iconSvg.setAttribute('fill', 'none');
                    iconSvg.setAttribute('stroke', 'currentColor');
                }
                
                // Petit effet de rebond
                likeBtn.style.display = "inline-flex";
                likeBtn.style.transition = "transform 0.15s ease-in-out";
                likeBtn.style.transform = "scale(1.2)";
                setTimeout(() => likeBtn.style.transform = "scale(1)", 150);
            }
            return;
        }

        // 3. Action : Commentaires (Afficher/Masquer)
        const commentBtn = e.target.closest('.btn-comment');
        if (commentBtn) {
            const postId = commentBtn.dataset.id;
            const commentsSection = document.getElementById(`comments-${postId}`);
            
            if (commentsSection.style.display === "block") {
                commentsSection.style.display = "none";
            } else {
                commentsSection.style.display = "block";
                commentsSection.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem; padding: 10px;">Chargement...</p>`;
                const comments = await api.getComments(postId);
                renderCommentsUI(postId, comments, commentsSection);
            }
            return;
        }

        // 4. Action : Envoyer un commentaire
        if (e.target.classList.contains('btn-submit-comment')) {
            const postId = e.target.dataset.id;
            const inputField = document.getElementById(`input-comment-${postId}`);
            const content = inputField?.value.trim();

            if (content) {
                e.target.disabled = true;
                const success = await api.addComment(postId, content);
                if (success) {
                    inputField.value = '';
                    await refreshFeed();
                } else {
                    e.target.disabled = false;
                    alert("Erreur publication.");
                }
            }
            return;
        }
    });

    // Publication Tweet
    if (postBtn) {
        postBtn.onclick = async () => {
            const content = textarea.value.trim();
            if (content) {
                postBtn.disabled = true;
                const result = await api.createPost(content);
                if (result) {
                    textarea.value = '';
                    await refreshFeed();
                    await renderTrends();
                }
                postBtn.disabled = false;
            }
        };
    }
}

function renderTweets(tweets, container) {
    if (!container) return;
    if (tweets.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding:40px; color: var(--text-muted);">Rien à voir ici...</p>`;
        return;
    }

    container.innerHTML = tweets.map(tweet => {
        const profilePic = tweet.author_photo || `https://ui-avatars.com/api/?name=${tweet.author}&background=random&color=fff`;
        
        // On prépare le style et les attributs du SVG en fonction du statut "isLiked"
        const likedColor = tweet.isLiked ? 'color: #f91880;' : '';
        const heartFill = tweet.isLiked ? 'currentColor' : 'none';
        const heartStroke = tweet.isLiked ? 'none' : 'currentColor';
        
        const authorId = tweet.id_utilisateur;

        return `
            <div class="tweet-card" style="display: flex; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border-color);">
                <div class="tweet-avatar-col go-to-profile" data-id="${authorId}" style="flex-shrink: 0; cursor: pointer;">
                    <img src="${profilePic}" class="tweet-avatar-mini" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
                </div>

                <div class="tweet-content-col" style="flex: 1;">
                    <div class="tweet-header go-to-profile" data-id="${authorId}" style="margin-bottom: 4px; cursor: pointer;">
                        <strong style="color: var(--text-main); font-weight: 700;">${tweet.author_name || tweet.author}</strong> 
                        <span class="handle" style="color: var(--text-muted); margin-left: 5px;">@${tweet.author}</span>
                    </div>

                    <p class="tweet-text" style="color: var(--text-main); margin-bottom: 10px; line-height: 1.4; overflow-wrap: break-word; word-break: break-word;">${tweet.content}</p>
                    
                    <div class="tweet-footer" style="display: flex; gap: 40px; color: var(--text-muted); font-size: 0.9rem;">
                        
                        <span class="btn-like" data-id="${tweet.id}" style="cursor:pointer; display: flex; align-items: center; transition: color 0.2s; ${likedColor}">
                            <svg class="heart-icon" viewBox="0 0 24 24" fill="${heartFill}" stroke="${heartStroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; margin-right: 6px; transition: fill 0.2s, stroke 0.2s;">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span class="like-count">${tweet.likes || 0}</span>
                        </span>

                        <span class="btn-comment" data-id="${tweet.id}" style="cursor:pointer; display: flex; align-items: center; transition: color 0.2s;">
                            <svg class="comment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; margin-right: 6px;">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span class="comment-count">${parseInt(tweet.comments) || 0}</span>
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
        ? `<p style="color: var(--text-muted); font-size: 0.9rem; padding: 10px;">Soyez le premier à répondre !</p>`
        : comments.map(c => `
            <div style="display: flex; gap: 10px; margin-bottom: 12px; padding: 0 10px;">
                <img src="${c.author_photo}" onerror="this.src='https://ui-avatars.com/api/?name=${c.author}&background=random';" style="width: 32px; height: 32px; border-radius: 50%;">
                <div>
                    <strong style="color: var(--text-main); font-size: 0.85rem;">${c.author_name}</strong>
                    <p style="color: var(--text-main); font-size: 0.9rem;">${c.content}</p>
                </div>
            </div>
        `).join('');

    html += `
        <div style="display: flex; gap: 10px; margin-top: 10px; padding: 10px; border-top: 1px solid var(--border-color);">
            <input type="text" id="input-comment-${postId}" placeholder="Postez votre réponse" style="flex: 1; padding: 8px 15px; border-radius: 20px; border: 1px solid var(--border-color); background: transparent; color: white; outline: none; font-size: 0.9rem;">
            <button class="btn-submit-comment" data-id="${postId}" style="padding: 6px 12px; border-radius: 20px; background: white; color: black; font-weight: bold; border: none; cursor: pointer; font-size: 0.85rem;">Répondre</button>
        </div>
    `;
    section.innerHTML = html;
}

async function renderTrends() {
    const sidebar = document.querySelector('aside') || document.querySelector('.right-sidebar');
    if (!sidebar) return;
    const trends = await api.getTrends();
    if (!trends || trends.length === 0) return;

    const container = document.createElement('div');
    container.className = 'trends-block';
    container.style.cssText = "background: #16181c; border-radius: 16px; margin-top: 15px; padding: 15px 0;";
    
    const items = trends.map((t, i) => `
        <div style="padding: 10px 15px; cursor: pointer;">
            <div style="color: var(--text-muted); font-size: 0.75rem;">Tendance ${i + 1}</div>
            <strong style="color: white; display: block;">#${t.hashtag}</strong>
            <div style="color: var(--text-muted); font-size: 0.8rem;">${t.total} posts</div>
        </div>
    `).join('');

    container.innerHTML = `<h3 style="color: white; margin: 0 15px 10px; font-size: 1.1rem;">Tendances pour vous</h3>` + items;
    const old = sidebar.querySelector('.trends-block');
    if (old) old.remove();
    sidebar.appendChild(container);
}