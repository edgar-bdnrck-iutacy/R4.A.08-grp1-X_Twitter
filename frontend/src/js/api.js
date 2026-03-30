const API_BASE_URL = 'http://localhost:3001/api';

export const api = {
    getCurrentUserId() {
        return localStorage.getItem('userId') || 1;
    },
    
    // 1. Récupérer tous les tweets
    async getFeed() {
        const userId = this.getCurrentUserId(); 
        try {
            
            const response = await fetch(`${API_BASE_URL}/posts?userId=${userId}`);
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



    async createPost(content, imageFile = null) {
        const userId = this.getCurrentUserId(); 
        
        // On utilise FormData au lieu d'un objet JSON classique
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('content', content);
        
        // On ajoute l'image seulement si l'utilisateur en a choisi une
        if (imageFile) {
            formData.append('tweetImage', imageFile);
        }
    
        try {
            const response = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
                // ATTENTION : On ne met SURTOUT PAS de Content-Type header ici.
                // Le navigateur va le mettre tout seul avec le "boundary" FormData.
                body: formData 
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Erreur publication");
            }
    
            return await response.json();
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

    async getUserPosts(targetUserId) {
        const currentUserId = this.getCurrentUserId(); 
        try {
            const response = await fetch(`${API_BASE_URL}/posts/user/${targetUserId}?userId=${currentUserId}`);
            const posts = await response.json();
            return posts.map(p => ({ ...p, handle: `@${p.author}` }));
        } catch (error) {
            return [];
        }
    },

    async likePost(postId) {
        const userId = this.getCurrentUserId(); 
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
    
    async repostPost(postId) {
        const userId = this.getCurrentUserId();
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}/repost`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
    
            if (!response.ok) throw new Error("Impossible de repost");
            return await response.json();
        } catch (error) {
            console.error("Erreur repostPost:", error);
            return null;
        }
    },


    // Fonction pour ajouter un signet
    async bookmarkPost(postId) {
        const userId = this.getCurrentUserId(); 
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}/bookmark`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            if (!response.ok) throw new Error("Impossible d'ajouter aux signets");
            
            return await response.json();
        } catch (error) {
            console.error("Erreur bookmarkPost:", error);
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
        // On récupère l'ID de l'utilisateur actuel
        const userId = this.getCurrentUserId(); 
        try {
            // On ajoute le userId dans l'URL pour que le back puisse checker les likes
            const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments?userId=${userId}`);
            
            if (!response.ok) throw new Error("Erreur lors de la récupération");
            return await response.json();
        } catch (error) {
            console.error("Erreur getComments:", error);
            return [];
        }
    },

    async addComment(postId, content, imageFile = null) {
        const userId = this.getCurrentUserId();
        
        // On crée un FormData (obligatoire pour envoyer des fichiers)
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('content', content);
        
        // On ajoute l'image seulement si elle existe
        if (imageFile) {
            // "commentImage" doit être EXACTEMENT le même nom que dans ton routes/posts.js
            formData.append('commentImage', imageFile); 
        }
    
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
                method: 'POST',
                // SURTOUT PAS de headers "Content-Type" ici, le navigateur le gère seul
                body: formData
            });
            return response.ok;
        } catch (error) {
            console.error("Erreur addComment:", error);
            return false;
        }
    },

    async updateUserProfile(userId, updatedData) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });

            if (response.ok) {
                return await response.json();
            } else {
                return null;
            }
        } catch (err) {
            console.error(err);
            return null;
        }
    },
    
    async getUserLikes(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}/likes`);
            const posts = await response.json();
            return posts.map(p => ({ ...p, handle: `@${p.author}` }));
        } catch (error) { return []; }
    },

    async getUserReplies(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}/replies`);
            const replies = await response.json();
            return replies.map(p => ({ ...p, handle: `@${p.author}` }));
        } catch (error) { return []; }
    },
    async getUserBookmarks(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/posts/user/${userId}/bookmarks`);
            if (!response.ok) throw new Error("Erreur signets");
            const posts = await response.json();
            
            // AJOUT ICI : On force 'isBookmarked' à true puisqu'on sait qu'on récupère la liste des signets !
            return posts.map(p => ({ ...p, handle: `@${p.author}`, isBookmarked: true }));
        } catch (error) {
            return [];
        }
    },

    // Récupérer le nombre d'abonnés/abonnements
    async getFollowStats(userId) {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${userId}/stats`);
            if (!res.ok) throw new Error("Erreur stats");
            return await res.json();
        } catch (e) { 
            return { followers: 0, following: 0 }; 
        }
    },

    async getFollowers(userId) {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${userId}/followers`);
            if (!res.ok) throw new Error("Erreur récupération followers");
            return await res.json();
        } catch (e) {
            console.error(e);
            return [];
        }
    },

    async getFollowing(userId) {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${userId}/following`);
            if (!res.ok) throw new Error("Erreur récupération following");
            return await res.json();
        } catch (e) {
            console.error(e);
            return [];
        }
    },

    // S'abonner ou se désabonner
    async toggleFollow(targetUserId) {
        const userId = this.getCurrentUserId();
        try {
            const res = await fetch(`${API_BASE_URL}/users/${targetUserId}/follow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            return await res.json();
        } catch (e) { 
            return null; 
        }
    },


    async searchUsers(query) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error("Erreur recherche");
            return await response.json();
        } catch (error) {
            console.error("Erreur searchUsers:", error);
            return [];
        }
    },
    
    async getFollowStatus(myId, targetId) {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${myId}/is-following/${targetId}`);
            return await res.json();
        } catch (e) {
            return { isFollowing: false };
        }
    },

    async searchPostsByHashtag(hashtag) {
        try {
            // On enlève le # s'il est présent pour l'URL
            const cleanTag = hashtag.replace('#', '');
            const response = await fetch(`${API_BASE_URL}/posts/search/hashtag/${encodeURIComponent(cleanTag)}`);
            if (!response.ok) throw new Error("Erreur recherche hashtag");
            const posts = await response.json();
            return posts.map(post => ({
                ...post,
                handle: `@${post.author}`
            }));
        } catch (error) {
            console.error("Erreur searchPostsByHashtag:", error);
            return [];
        }
    },
    async likeComment(commentId) {
        const userId = this.getCurrentUserId();
        const res = await fetch(`${API_BASE_URL}/posts/comments/${commentId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        return await res.json();
    },
    
    async viewPost(postId) {
        return await fetch(`${API_BASE_URL}/posts/${postId}/view`, { method: 'POST' });
    }
};