const API_BASE_URL = "http://localhost:3001";

export const api = {
    async getFeed() {
        const response = await fetch(`${API_BASE_URL}/posts`);

        if (!response.ok) {
            throw new Error("Impossible de récupérer les posts");
        }

        return response.json();
    },

    async createPost(author, content) {
        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ author, content })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Impossible de créer le post");
        }

        return response.json();
    },

    async likePost(id) {
        const response = await fetch(`${API_BASE_URL}/posts/${id}/like`, {
            method: "POST"
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Impossible de liker le post");
        }

        return response.json();
    }
};