export const api = {
    async getFeed() {
        // Simulation d'une requête réseau
        return [
            { id: 1, author: "Alice", handle: "@alice", content: "Premier post sur ce nouveau réseau !", likes: 12 },
            { id: 2, author: "Bob", handle: "@bob", content: "L'architecture frontend se met en place.", likes: 5 }
        ];
    },
    
    async getUserProfile(userId) {
        // Simulation de récupération de profil
        return {
            id: userId,
            name: "ian b",
            handle: "@ianB",
            bio: "Développeur passionné par la création d'applications web."
        };
    }
};