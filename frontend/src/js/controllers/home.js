import { api } from '../api.js';

export async function initHome() {
    const container = document.getElementById('tweets-container');
    const postBtn = document.getElementById('btn-post');

    // Récupération et affichage du flux
    const tweets = await api.getFeed();
    renderTweets(tweets, container);

    // Gestion du bouton de publication
    if (postBtn) {
        postBtn.addEventListener('click', () => {
            const textarea = document.querySelector('.compose-tweet textarea');
            if (textarea.value.trim() !== "") {
                console.log("Nouveau post à envoyer à l'API :", textarea.value);
                textarea.value = ''; 
                // Ici, il faudrait appeler une méthode api.postTweet() puis recharger le flux
            }
        });
    }
}

function renderTweets(tweets, container) {
    if (!container) return;
    container.innerHTML = tweets.map(tweet => `
        <div class="tweet-card" style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px;">
            <strong>${tweet.author}</strong> <span>${tweet.handle}</span>
            <p>${tweet.content}</p>
            <small>❤️ ${tweet.likes}</small>
        </div>
    `).join('');
}