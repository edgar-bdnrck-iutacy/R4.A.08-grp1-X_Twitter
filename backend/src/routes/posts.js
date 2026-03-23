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
    const author = typeof req.body.author === "string" ? req.body.author.trim() : "";
    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";

    // Validations
    if (!author || !content) {
      return res.status(400).json({ error: "Author and Content are required" });
    }
    if (author.length > 50 || content.length > 280) {
      return res.status(400).json({ error: "Limits exceeded (Author 50, Content 280)" });
    }

    const newPost = await createPost(author, content);
    return res.status(201).json(newPost);
  } catch (error) {
    console.error("POST /posts error:", error);
    return res.status(500).json({ error: "Unable to create post" });
  }
});

router.post("/:id/like", async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = 1; // On garde l'ID 1 (jdupont) pour le test

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