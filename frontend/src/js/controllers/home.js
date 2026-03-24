import { api } from '../api.js';

export async function initHome() {
    const container = document.getElementById('tweets-container');
    const postBtn = document.getElementById('btn-post');
    const textarea = document.querySelector('.compose-tweet textarea');

    async function refreshFeed() {
        const tweets = await api.getFeed();
        renderTweets(tweets, container);
    }

    // Chargement initial du flux et des tendances
    await refreshFeed();
    await renderTrends();

    // Gestionnaire d'événements centralisé pour le flux
    container.addEventListener('click', async (e) => {
        
        // 1. Action : "J'aime" un tweet
        const likeBtn = e.target.closest('.btn-like');
        if (likeBtn) {
            const postId = likeBtn.dataset.id;
            const result = await api.likePost(postId);
            
            if (result) {
                const counter = likeBtn.querySelector('.like-count');
                counter.textContent = result.likes;
                likeBtn.style.color = result.isLiked ? "#f91880" : "";
                
                likeBtn.style.transition = "transform 0.1s ease-in-out";
                likeBtn.style.transform = "scale(1.2)";
                setTimeout(() => likeBtn.style.transform = "scale(1)", 100);
            }
            return;
        }

        // 2. Action : Afficher/Masquer les commentaires
        const commentBtn = e.target.closest('.btn-comment');
        if (commentBtn) {
            const postId = commentBtn.dataset.id;
            const commentsSection = document.getElementById(`comments-${postId}`);
            
            if (commentsSection.style.display === "block") {
                commentsSection.style.display = "none";
                return;
            }

            commentsSection.style.display = "block";
            commentsSection.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem; padding: 10px;">Chargement des commentaires...</p>`;

            const comments = await api.getComments(postId);
            let commentsHtml = '';
            
            if (!comments || comments.length === 0) {
                commentsHtml = `<p style="color: var(--text-muted); font-size: 0.9rem; padding: 10px;">Aucun commentaire pour l'instant.</p>`;
            } else {
                commentsHtml = comments.map(comment => `
                    <div style="display: flex; gap: 10px; margin-bottom: 15px; padding: 0 10px;">
                        <img src="${comment.author_photo}" onerror="this.src='https://ui-avatars.com/api/?name=${comment.author}&background=random&color=fff';" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
                        <div>
                            <div style="display: flex; gap: 5px; align-items: baseline;">
                                <strong style="color: var(--text-main); font-size: 0.9rem;">${comment.author_name}</strong>
                                <span style="color: var(--text-muted); font-size: 0.85rem;">@${comment.author}</span>
                            </div>
                            <p style="color: var(--text-main); font-size: 0.95rem; margin-top: 2px;">${comment.content}</p>
                        </div>
                    </div>
                `).join('');
            }

            // Ajout du formulaire de saisie pour un nouveau commentaire
            commentsHtml += `
                <div style="display: flex; gap: 10px; margin-top: 15px; padding: 10px; border-top: 1px solid var(--border-color);">
                    <input type="text" id="input-comment-${postId}" placeholder="Poster votre réponse..." 
                           style="flex: 1; padding: 10px; border-radius: 20px; border: 1px solid var(--border-color); background: transparent; color: var(--text-main); outline: none;">
                    <button class="btn-submit-comment" data-id="${postId}" 
                            style="padding: 8px 15px; border-radius: 20px; background: var(--text-main); color: black; font-weight: bold; border: none; cursor: pointer;">
                        Répondre
                    </button>
                </div>
            `;

            commentsSection.innerHTML = commentsHtml;
            return;
        }

        // 3. Action : Soumettre un nouveau commentaire
        if (e.target.classList.contains('btn-submit-comment')) {
            const postId = e.target.dataset.id;
            const inputField = document.getElementById(`input-comment-${postId}`);
            
            if (!inputField) return;
            const content = inputField.value.trim();

            if (content !== "") {
                e.target.disabled = true;
                e.target.textContent = '...';

                const success = await api.addComment(postId, content);
                if (success) {
                    inputField.value = '';
                    await refreshFeed(); // Rafraîchissement global pour mettre à jour les compteurs
                } else {
                    e.target.disabled = false;
                    e.target.textContent = 'Répondre';
                    alert("Une erreur est survenue lors de la publication.");
                }
            }
            return;
        }
    });

    // Action : Publier un nouveau tweet
    if (postBtn) {
        postBtn.addEventListener('click', async () => {
            const content = textarea.value.trim();

            if (content !== "") {
                postBtn.disabled = true;
                const result = await api.createPost(content);
                if (result) {
                    textarea.value = '';
                    await refreshFeed();
                    await renderTrends();
                }
                postBtn.disabled = false;
            }
        });
    }
}

function renderTweets(tweets, container) {
    if (!container) return;
    
    if (tweets.length === 0) {
        container.innerHTML = `<p style="text-align:center; padding:20px; color: var(--text-muted);">Aucun tweet à afficher.</p>`;
        return;
    }

    container.innerHTML = tweets.map(tweet => {
        const profilePic = tweet.author_photo || `https://ui-avatars.com/api/?name=${tweet.author}&background=random&color=fff`;
        const likedStyle = tweet.isLiked ? 'style="color: #f91880;"' : '';
        const commentCount = parseInt(tweet.comments) || 0;

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
                        
                        <span class="btn-comment" data-id="${tweet.id}" style="cursor:pointer; display: flex; align-items: center; gap: 5px;">
                            💬 <span class="comment-count">${commentCount}</span>
                        </span>
                    </div>

                    <div class="comments-section" id="comments-${tweet.id}" style="display: none; margin-top: 15px; padding-top: 10px; border-top: 1px solid var(--border-color);">
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function renderTrends() {
    const sidebar = document.querySelector('aside') || document.querySelector('.right-sidebar');
    if (!sidebar) return;

    const trends = await api.getTrends();

    if (!trends || trends.length === 0) return;

    const trendsHtml = trends.map((trend, index) => `
        <div class="trend-item" style="padding: 12px 15px; cursor: pointer;">
            <div style="color: var(--text-muted); font-size: 0.8rem;">Tendance ${index + 1}</div>
            <strong style="color: var(--text-main); font-size: 1rem;">#${trend.hashtag}</strong>
            <div style="color: var(--text-muted); font-size: 0.85rem;">${trend.total} posts</div>
        </div>
    `).join('');

    const trendsContainer = document.createElement('div');
    trendsContainer.style.backgroundColor = '#16181c';
    trendsContainer.style.borderRadius = '16px';
    trendsContainer.style.marginTop = '15px';
    trendsContainer.style.padding = '15px 0';

    const titleHtml = `<h3 style="color: var(--text-main); margin: 0 0 10px 15px; font-weight: 800; font-size: 1.2rem;">Tendances pour vous</h3>`;
    trendsContainer.innerHTML = titleHtml + trendsHtml;

    const existingTrends = sidebar.querySelector('.trends-block');
    if (existingTrends) existingTrends.remove();
    
    trendsContainer.classList.add('trends-block');
    sidebar.appendChild(trendsContainer);
}