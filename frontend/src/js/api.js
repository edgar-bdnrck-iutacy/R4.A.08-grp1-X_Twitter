const API_BASE_URL = 'http://localhost:3001/api';

export const api = {
    // 1. Récupérer tous les tweets
    async getFeed() {
        try {
            const response = await fetch(`${API_BASE_URL}/posts`);
            if (!response.ok) throw new Error("Erreur réseau");
            const posts = await response.json();
            return posts.map(post => ({
                ...post,
                handle: `@${post.author}`
            }));
        } catch (error) {
            console.error("Erreur getFeed:", error);
            return [];
        }
    },

    // 2. Créer un nouveau tweet
    async createPost(author, content) {
        try {
            const response = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author, content })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Erreur lors de la publication");
            }

            const newPost = await response.json();
            return { ...newPost, handle: `@${newPost.author}` };
        } catch (error) {
            console.error("Erreur createPost:", error);
            return null;
        }
    },

    // 3. Récupérer un profil utilisateur
    async getUserProfile(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`);
            if (!response.ok) throw new Error("Profil introuvable");
            const user = await response.json();
            return user;
        } catch (error) {
            console.error("Erreur getUserProfile:", error);
            return null;
        }
    },

    async getUserPosts(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/posts/user/${userId}`);
            const posts = await response.json();
            return posts.map(p => ({ ...p, handle: `@${p.author}` }));
        } catch (error) {
            return [];
        }
    },

    async likePost(postId) {
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
                method: 'POST'
            });
            if (!response.ok) throw new Error("Impossible de liker");
            return await response.json();
        } catch (error) {
            console.error("Erreur likePost:", error);
            return null;
        }
    },
    
    // 4. Récupérer les tendances
    getTrends: async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/posts/trends`);
            return res.ok ? await res.json() : [];
        } catch (error) {
            console.error("Erreur récupération tendances:", error);
            return [];
        }
    },
    
};





