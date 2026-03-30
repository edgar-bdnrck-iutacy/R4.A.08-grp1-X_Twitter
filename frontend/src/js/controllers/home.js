import { api } from '../api.js';

export async function initHome() {
    const composeAvatar = document.getElementById('compose-avatar');
    const sidebarAvatar = document.getElementById('current-user-avatar'); 

    if (composeAvatar && sidebarAvatar) {
        setTimeout(() => {
            if (sidebarAvatar.src) composeAvatar.src = sidebarAvatar.src;
        }, 150);
    }

    const container = document.getElementById('tweets-container');
    const postBtn = document.getElementById('btn-post');
    const textarea = document.querySelector('.compose-tweet textarea');
    const fileInput = document.getElementById('input-tweet-image');
    const uploadBtn = document.getElementById('btn-upload-img');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('image-preview');
    const removePreview = document.getElementById('remove-preview');
    
    let selectedFile = null;
    const selectedCommentFiles = {}; // Stockage des images pour les coms

    if (uploadBtn) uploadBtn.onclick = () => fileInput.click();

    if (fileInput) {
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                selectedFile = file;
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    previewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        };
    }

    if (removePreview) {
        removePreview.onclick = () => {
            selectedFile = null;
            fileInput.value = '';
            previewContainer.style.display = 'none';
        };
    }

    async function refreshFeed() {
        const tweets = await api.getFeed();
        // const myId = localStorage.getItem('userId');
        
        // if (myId) {
        //     try {
        //         const myBookmarks = await api.getUserBookmarks(myId);
        //         const bookmarkedIds = myBookmarks.map(b => b.id);
        //         tweets.forEach(tweet => {
        //             tweet.isBookmarked = bookmarkedIds.includes(tweet.id);
        //         });
        //     } catch (err) { console.error(err); }
        // }
        
        container.innerHTML = "";
        renderTweets(tweets, container);
        tweets.forEach(t => api.viewPost(t.id));
    }

    await refreshFeed();
    await renderTrends();

    container.addEventListener('click', async (e) => {
        // Navigation Profil
        const profileTrigger = e.target.closest('.go-to-profile');
        if (profileTrigger) {
            const targetId = profileTrigger.dataset.id;
            if (targetId && targetId !== "undefined") {
                localStorage.setItem('viewUserId', targetId);
                window.location.hash = '#profile';
            }
            return;
        }

        // Like Tweet
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

        // --- NOUVEAU : Like Commentaire ---
        const likeComBtn = e.target.closest('.btn-like-comment');
        if (likeComBtn) {
            const comId = likeComBtn.dataset.id;
            const result = await api.likeComment(comId);
            if (result) {
                likeComBtn.querySelector('.com-like-count').textContent = result.likes;
                const svg = likeComBtn.querySelector('svg');
                svg.setAttribute('fill', result.isLiked ? '#f91880' : 'none');
                svg.setAttribute('stroke', result.isLiked ? '#f91880' : 'currentColor');
                likeComBtn.style.color = result.isLiked ? '#f91880' : '';
            }
            return;
        }

        // Commentaires (Afficher/Masquer)
        const commentBtn = e.target.closest('.btn-comment');
        if (commentBtn) {
            const postId = commentBtn.dataset.id;
            const section = document.getElementById(`comments-${postId}`);
            if (section.style.display === "block") {
                section.style.display = "none";
                delete selectedCommentFiles[postId];
            } else {
                section.style.display = "block";
                section.innerHTML = `<p style="padding:10px; color:gray;">Chargement...</p>`;
                const comments = await api.getComments(postId);
                renderCommentsUI(postId, comments, section);
            }
            return;
        }

        // Trigger Upload Image Commentaire
        const triggerCommentImg = e.target.closest('.btn-trigger-comment-img');
        if (triggerCommentImg) {
            document.getElementById(`file-comment-${triggerCommentImg.dataset.id}`).click();
            return;
        }

        // Supprimer Image Commentaire
        const removeCommentImg = e.target.closest('.btn-remove-comment-img');
        if (removeCommentImg) {
            const postId = removeCommentImg.dataset.id;
            delete selectedCommentFiles[postId];
            document.getElementById(`comment-preview-container-${postId}`).style.display = 'none';
            document.getElementById(`file-comment-${postId}`).value = '';
            return;
        }

        // Signets
        const bookmarkBtn = e.target.closest('.btn-bookmark');
        if (bookmarkBtn) {
            const result = await api.bookmarkPost(bookmarkBtn.dataset.id);
            if (result?.success) {
                const svg = bookmarkBtn.querySelector('svg');
                svg.setAttribute('fill', result.bookmarked ? '#1d9bf0' : 'none');
                svg.setAttribute('stroke', result.bookmarked ? '#1d9bf0' : '#71767b');
            }
            return;
        }

        // Soumettre Commentaire
        const submitCommentBtn = e.target.closest('.btn-submit-comment');
        if (submitCommentBtn) {
            const postId = submitCommentBtn.dataset.id;
            const input = document.getElementById(`input-comment-${postId}`);
            const file = selectedCommentFiles[postId] || null;
            if (input.value.trim() || file) {
                submitCommentBtn.disabled = true;
                const ok = await api.addComment(postId, input.value.trim(), file);
                if (ok) {
                    input.value = '';
                    delete selectedCommentFiles[postId];
                    await refreshFeed();
                } else { submitCommentBtn.disabled = false; }
            }
            return;
        }
    });

    // Preview Image Commentaire
    container.addEventListener('change', (e) => {
        if (e.target.classList.contains('comment-file-input')) {
            const postId = e.target.dataset.id;
            const file = e.target.files[0];
            if (file) {
                selectedCommentFiles[postId] = file;
                const previewImg = document.getElementById(`comment-preview-img-${postId}`);
                const previewContainer = document.getElementById(`comment-preview-container-${postId}`);
                previewImg.src = URL.createObjectURL(file);
                previewContainer.style.display = 'block';
            }
        }
    });

    if (postBtn) {
        postBtn.onclick = async () => {
            const content = textarea.value.trim();
            if (content || selectedFile) {
                postBtn.disabled = true;
                const result = await api.createPost(content, selectedFile);
                if (result) {
                    textarea.value = '';
                    selectedFile = null;
                    fileInput.value = '';
                    previewContainer.style.display = 'none';
                    await refreshFeed();
                }
                postBtn.disabled = false;
            }
        };
    }
}

function renderTweets(tweets, container) {
    if (!container) return;
    container.innerHTML = tweets.map(tweet => {
        const profilePic = tweet.author_photo || `https://ui-avatars.com/api/?name=${tweet.author}&background=random&color=fff`;
        const bookmarkFill = tweet.isBookmarked ? '#1d9bf0' : 'none';
        const bookmarkStroke = tweet.isBookmarked ? '#1d9bf0' : 'currentColor';
        const heartFill = tweet.isLiked ? 'currentColor' : 'none';
        const heartStroke = tweet.isLiked ? 'none' : 'currentColor';

        return `
            <div class="tweet-card" style="display: flex; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border-color); width: 100%; box-sizing: border-box;">
                <div class="tweet-avatar-col go-to-profile" data-id="${tweet.id_utilisateur}" style="flex-shrink: 0; cursor: pointer;">
                    <img src="${profilePic}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div class="tweet-header go-to-profile" data-id="${tweet.id_utilisateur}" style="cursor: pointer;">
                        <strong>${tweet.author_name}</strong> <span style="color: gray;">@${tweet.author}</span>
                    </div>
                    <p style="margin-bottom: 10px; word-wrap: break-word; white-space: pre-wrap;">${tweet.content}</p>
                    
                    ${tweet.image_url ? `
                        <div style="margin: 10px 0; border-radius: 16px; overflow: hidden; border: 1px solid var(--border-color);">
                            <img src="http://localhost:3001${tweet.image_url}" style="width: 100%; display: block;">
                        </div>
                    ` : ''}

                    <div class="tweet-footer" style="display: flex; justify-content: flex-start; gap: 40px; color: var(--text-muted); font-size: 0.9rem; align-items: center;">
                        <span class="btn-comment" data-id="${tweet.id}" style="cursor:pointer; display:flex; align-items:center; gap:5px;">
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                            <span>${parseInt(tweet.comments) || 0}</span>
                        </span>

                        <span class="btn-like" data-id="${tweet.id}" style="cursor:pointer; display:flex; align-items:center; gap:5px; ${tweet.isLiked ? 'color:#f91880' : ''}">
                            <svg class="heart-icon" viewBox="0 0 24 24" width="18" height="18" stroke="${heartStroke}" fill="${heartFill}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                            <span class="like-count">${tweet.likes || 0}</span>
                        </span>

                        <span style="display: flex; align-items: center; gap: 5px;">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            <span>${tweet.nb_views_tweet || 0}</span>
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
    let html = comments.map(c => `
        <div style="display: flex; gap: 10px; margin-bottom: 12px; padding: 0 10px;">
            <img src="${c.author_photo}" onerror="this.src='https://ui-avatars.com/api/?name=${c.author}&background=random';" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
            <div style="flex: 1;">
                <div>
                    <strong style="font-size: 0.85rem;">${c.author_name}</strong>
                    <span style="color: gray; font-size: 0.8rem;"> @${c.author}</span>
                </div>
                <p style="font-size: 0.9rem; margin: 2px 0;">${c.content}</p>
                ${c.image_commentaire ? `<img src="http://localhost:3001${c.image_commentaire}" style="max-width: 100%; border-radius: 10px; margin-top: 5px; max-height: 200px; border: 1px solid var(--border-color);">` : ''}
                
                <div style="margin-top: 5px;">
                    <span class="btn-like-comment" data-id="${c.id}" style="cursor:pointer; display:flex; align-items:center; gap:5px; font-size: 0.8rem; color: var(--text-muted);">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        <span class="com-like-count">${c.nb_likes_commentaire || 0}</span>
                    </span>
                </div>
            </div>
        </div>
    `).join('');

    html += `
        <div style="border-top: 1px solid var(--border-color); padding: 10px;">
            <div id="comment-preview-container-${postId}" style="display: none; position: relative; margin-bottom: 8px;">
                <img id="comment-preview-img-${postId}" src="" style="max-width: 100px; border-radius: 8px; border: 1px solid #2f3336;">
                <button class="btn-remove-comment-img" data-id="${postId}" style="position: absolute; top: -5px; left: 85px; background: #f4212e; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer;">×</button>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="text" id="input-comment-${postId}" placeholder="Postez votre réponse" style="flex: 1; padding: 8px 15px; border-radius: 20px; border: 1px solid var(--border-color); background: transparent; color: white; outline: none;">
                <input type="file" id="file-comment-${postId}" class="comment-file-input" data-id="${postId}" accept="image/*" style="display: none;">
                <button class="btn-trigger-comment-img" data-id="${postId}" style="background: none; border: none; cursor: pointer; color: #1d9bf0;">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"></path></svg>
                </button>
                <button class="btn-submit-comment" data-id="${postId}" style="padding: 6px 12px; border-radius: 20px; background: white; color: black; font-weight: bold; border: none; cursor: pointer;">Répondre</button>
            </div>
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