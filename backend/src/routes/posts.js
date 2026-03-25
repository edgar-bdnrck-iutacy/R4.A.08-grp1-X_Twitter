const express = require('express');
const db = require('../db');
const router = express.Router();

const { 
  getAllPosts, createPost, toggleLike, getPostsByUserId, getTrendingHashtags, getCommentsByPostId, addComment, getPostsByHashtag 
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

      if (!userId || !content || typeof content !== "string") {
          return res.status(400).json({ error: "L'identifiant utilisateur et le contenu sont requis." });
      }

      const cleanContent = content.trim();
      if (cleanContent.length === 0 || cleanContent.length > 280) {
          return res.status(400).json({ error: "Le contenu doit être compris entre 1 et 280 caractères." });
      }

      const newPost = await createPost(userId, cleanContent);
      return res.status(201).json(newPost);
  } catch (error) {
      console.error("POST /posts error:", error);
      return res.status(500).json({ error: "Erreur lors de la création du post" });
  }
});

// 4. Liker un post
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

// 5. Tendances
router.get('/trends', async (req, res) => {
  try {
    const trends = await getTrendingHashtags();
    res.json(trends);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la récupération des tendances" });
  }
});

// 6. Récupérer les commentaires
// Nouvelle route pour chercher des tweets par hashtag
router.get('/search/hashtag/:tag', async (req, res) => {
  try {
      const posts = await getPostsByHashtag(req.params.tag);
      res.json(posts);
  } catch (error) {
      console.error("Erreur GET hashtag:", error);
      res.status(500).json({ error: "Erreur lors de la recherche par hashtag" });
  }
});

// Nouvelle route GET pour les commentaires
router.get('/:id/comments', async (req, res) => {
  try {
      const postId = req.params.id;
      const comments = await getCommentsByPostId(postId);
      res.json(comments);
  } catch (error) {
      console.error("Erreur GET comments:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des commentaires" });
  }
});

// 7. Ajouter un commentaire
router.post('/:id/comments', async (req, res) => {
  try {
      const { userId, content } = req.body;
      if (!userId || !content) return res.status(400).json({ error: "Données requises" });
      
      await addComment(req.params.id, userId, content);
      res.status(201).json({ success: true });
  } catch (error) {
      res.status(500).json({ error: "Erreur lors de la création du commentaire" });
  }
});

// =========================================================================
// --- NOUVEAUTÉS : LES SIGNETS (BOOKMARKS) ---
// =========================================================================

// 8. AJOUTER / RETIRER un signet (Le "Toggle" qui te manquait)
router.post('/:id/bookmark', async (req, res) => {
    try {
        const postId = req.params.id;
        const { userId } = req.body;

        if (!userId) return res.status(400).json({ error: "User ID manquant" });

        // On vérifie si le signet existe déjà
        const check = await db.query(
            'SELECT * FROM signets WHERE id_utilisateur = $1 AND id_tweet = $2',
            [userId, postId]
        );

        if (check.rows.length === 0) {
            // S'il n'existe pas : On l'ajoute
            await db.query(
                'INSERT INTO signets (id_utilisateur, id_tweet) VALUES ($1, $2)',
                [userId, postId]
            );
            await db.query(
                'UPDATE tweet SET nb_bookmarks_tweet = nb_bookmarks_tweet + 1 WHERE id_tweet = $1',
                [postId]
            );
            return res.json({ success: true, message: "Ajouté", bookmarked: true });
        } else {
            // S'il existe déjà : On le retire
            await db.query(
                'DELETE FROM signets WHERE id_utilisateur = $1 AND id_tweet = $2',
                [userId, postId]
            );
            await db.query(
                'UPDATE tweet SET nb_bookmarks_tweet = nb_bookmarks_tweet - 1 WHERE id_tweet = $1',
                [postId]
            );
            return res.json({ success: true, message: "Retiré", bookmarked: false });
        }
    } catch (error) {
        console.error("Erreur bookmark:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// 9. RÉCUPÉRER les signets d'un utilisateur pour son profil
router.get('/user/:id/bookmarks', async (req, res) => {
    try {
        const userId = req.params.id;
        const query = `
            SELECT t.id_tweet as id, t.description_tweet as content, t.nb_likes_tweet as likes, t.nb_commentaires_tweet as comments,
                   u.nom_utilisateur as author_name, u.username_utilisateur as author, u.photo_profil_utilisateur as author_photo
            FROM tweet t
            JOIN signets s ON t.id_tweet = s.id_tweet
            JOIN utilisateur u ON t.id_utilisateur = u.id_utilisateur
            WHERE s.id_utilisateur = $1
            ORDER BY s.date_signet DESC
        `;
        const result = await db.query(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error("Erreur récupération signets:", error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

module.exports = router;