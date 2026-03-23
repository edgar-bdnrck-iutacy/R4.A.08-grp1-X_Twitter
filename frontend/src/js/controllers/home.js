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

    // Gestion du TOGGLE LIKE
    container.addEventListener('click', async (e) => {
        const likeBtn = e.target.closest('.btn-like');
        if (!likeBtn) return;

        const postId = likeBtn.dataset.id;
        const result = await api.likePost(postId);
        
        if (result) {
            const counter = likeBtn.querySelector('.like-count');
            counter.textContent = result.likes;

            if (result.isLiked) {
                likeBtn.style.color = "#f91880";
            } else {
                likeBtn.style.color = "";
            }
            
            likeBtn.style.transition = "transform 0.1s ease-in-out";
            likeBtn.style.transform = "scale(1.2)";
            setTimeout(() => likeBtn.style.transform = "scale(1)", 100);
        }
    });

    if (postBtn) {
        postBtn.addEventListener('click', async () => {
            const content = textarea.value.trim();
            const author = "jdupont"; 

            if (content !== "") {
                const result = await api.createPost(author, content);
                if (result) {
                    textarea.value = '';
                    await refreshFeed();
                    await renderTrends(); // C'EST ICI LE FIX : On recharge la barre !
                }
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

async function renderTrends() {
    const sidebar = document.querySelector('aside') || document.querySelector('.right-sidebar');
    if (!sidebar) return;

    // Récupération des données réelles
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