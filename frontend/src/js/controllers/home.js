import { api } from "../api.js";

export async function initHome() {
    const container = document.getElementById("tweets-container");
    const postBtn = document.getElementById("btn-post");
    const authorInput = document.getElementById("author-input");
    const contentInput = document.getElementById("content-input");
    const charCount = document.getElementById("char-count");

    async function loadFeed() {
        try {
            const posts = await api.getFeed();
            renderPosts(posts, container, loadFeed);
        } catch (error) {
            container.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    if (contentInput && charCount) {
        contentInput.addEventListener("input", () => {
            charCount.textContent = `${contentInput.value.length} / 280`;
        });
    }

    if (postBtn) {
        postBtn.addEventListener("click", async () => {
            const author = authorInput.value.trim();
            const content = contentInput.value.trim();

            if (!author || !content) {
                alert("Veuillez saisir un auteur et un contenu.");
                return;
            }

            try {
                await api.createPost(author, content);
                authorInput.value = "";
                contentInput.value = "";
                charCount.textContent = "0 / 280";
                await loadFeed();
            } catch (error) {
                alert(error.message);
            }
        });
    }

    await loadFeed();
}

function renderPosts(posts, container, reloadFeed) {
    if (!container) return;

    if (!posts.length) {
        container.innerHTML = `<p class="empty-message">Aucun post pour le moment.</p>`;
        return;
    }

    container.innerHTML = posts.map(post => `
        <article class="tweet-card">
            <div class="tweet-header">
                <strong class="tweet-author">${escapeHtml(post.author)}</strong>
                <span class="tweet-date">${formatDate(post.created_at)}</span>
            </div>
            <p class="tweet-content">${escapeHtml(post.content)}</p>
            <div class="tweet-actions">
                <button class="like-button" data-id="${post.id}">
                    ❤️ ${post.likes}
                </button>
            </div>
        </article>
    `).join("");

    container.querySelectorAll(".like-button").forEach(button => {
        button.addEventListener("click", async () => {
            const postId = button.dataset.id;

            try {
                await api.likePost(postId);
                await reloadFeed();
            } catch (error) {
                alert(error.message);
            }
        });
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR");
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}