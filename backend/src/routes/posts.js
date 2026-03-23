const express = require('express');
const router = express.Router();
const { 
  getAllPosts, 
  createPost, 
  toggleLike,
  getPostsByUserId ,
  getTrendingHashtags
} = require('../services/postsService');

// 1. Récupérer tous les posts (Flux général)
router.get("/", async (req, res) => {
  try {
    const posts = await getAllPosts();
    res.status(200).json(posts);
  } catch (error) {
    console.error("GET /posts error:", error);
    res.status(500).json({ error: "Unable to fetch posts" });
  }
});

// 2. Récupérer les posts d'un utilisateur précis (Profil)
router.get("/user/:id", async (req, res) => {
  try {
    const posts = await getPostsByUserId(req.params.id);
    res.json(posts);
  } catch (error) {
    console.error("GET /posts/user/:id error:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des posts" });
  }
});

// 3. Créer un nouveau post

router.post("/", async (req, res) => {
  try {
      const { userId, content } = req.body;

      // Validations strictes
      if (!userId || !content || typeof content !== "string") {
          return res.status(400).json({ error: "L'identifiant utilisateur et le contenu sont requis." });
      }

      const cleanContent = content.trim();
      if (cleanContent.length === 0 || cleanContent.length > 280) {
          return res.status(400).json({ error: "Le contenu doit être compris entre 1 et 280 caractères." });
      }

      // Appel au service avec le userId
      const newPost = await createPost(userId, cleanContent);
      return res.status(201).json(newPost);
  } catch (error) {
      console.error("POST /posts error:", error);
      return res.status(500).json({ error: "Erreur lors de la création du post" });
  }
});


router.post("/:id/like", async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body; 

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const result = await toggleLike(postId, userId);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur toggle like" });
  }
});

router.get('/trends', async (req, res) => {
  try {
    const trends = await getTrendingHashtags();
    res.json(trends);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des tendances" });
  }
});



module.exports = router;