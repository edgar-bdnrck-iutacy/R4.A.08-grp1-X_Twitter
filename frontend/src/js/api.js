const API_BASE_URL = 'http://localhost:3001/api';

export const api = {
    getCurrentUserId() {
        return localStorage.getItem('userId') || 1;
    },
    
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



    async createPost(content) {
      
        const userId = this.getCurrentUserId(); 

        try {
            const response = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, content }) 
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
        const userId = this.getCurrentUserId(); // Récupère l'ID du localStorage côté FRONT
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
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


    async getComments(postId) {
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`);
            if (!response.ok) throw new Error("Erreur lors de la récupération");
            return await response.json();
        } catch (error) {
            console.error("Erreur getComments:", error);
            return [];
        }
    },

    async addComment(postId, content) {
        const userId = this.getCurrentUserId();
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, content })
            });
            return response.ok;
        } catch (error) {
            console.error("Erreur addComment:", error);
            return false;
        }
    }
    
};





