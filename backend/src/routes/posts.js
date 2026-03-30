const express = require('express');
const db = require('../db');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// --- IMPORTS DES SERVICES (Corrigé) ---
const { 
    getAllPosts,
    getFollowingFeed,
    createPost,
    toggleLike,
    toggleRepost,
    getPostsByUserId,
    getTrendingHashtags,
    getCommentsByPostId,
    addComment,
    getPostsByHashtag,
    incrementView,
    toggleCommentLike
} = require('../services/postsService');

// --- CONFIGURATION MULTER ---
const storage = multer.diskStorage({
    destination: './uploads/tweets/',
    filename: (req, file, cb) => {
        cb(null, 'tweet-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const commentStorage = multer.diskStorage({
  destination: './uploads/comments/', 
  filename: (req, file, cb) => {
      cb(null, 'comment-' + Date.now() + path.extname(file.originalname));
  }
});
const uploadComment = multer({ storage: commentStorage });

// =========================================================================
// ROUTES SPÉCIFIQUES (Doivent impérativement être placées en haut)
// =========================================================================

router.get("/", async (req, res) => {
    try {
        const currentUserId = req.query.userId || null;
        const posts = await getAllPosts(currentUserId);
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ error: "Erreur réseau" });
    }
});

router.get("/following", async (req, res) => {
    try {
        const currentUserId = req.query.userId || null;

        if (!currentUserId) {
            return res.status(400).json({ error: "userId manquant" });
        }

        const posts = await getFollowingFeed(currentUserId);
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ error: "Erreur flux abonnements" });
    }
});

router.get('/trends', async (req, res) => { 
    res.json(await getTrendingHashtags()); 
});

router.get('/hashtag/:tag', async (req, res) => {
    try {
        const posts = await getPostsByHashtag(req.params.tag);
        res.json(posts);
    } catch (error) {
        console.error("Erreur route hashtag:", error);
        res.status(500).json({ error: "Erreur lors de la recherche par hashtag" });
    }
});
// ROUTE CORRIGÉE : Like sur un commentaire
router.post("/comments/:id/like", async (req, res) => {
    try {
        const result = await toggleCommentLike(req.params.id, req.body.userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Erreur like commentaire" });
    }
});

// =========================================================================
// ROUTES AVEC PARAMÈTRES GÉNÉRIQUES (/:id)
// =========================================================================

router.get("/user/:id", async (req, res) => {
    try {
        const currentUserId = req.query.userId || null;
        const posts = await getPostsByUserId(req.params.id, currentUserId);
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des tweets" });
    }
});

router.get('/user/:id/bookmarks', async (req, res) => {
    try {
        const query = `
            SELECT t.id_tweet as id, t.description_tweet as content, t.image_url, t.nb_likes_tweet as likes,
                   u.nom_utilisateur as author_name, u.username_utilisateur as author, u.photo_profil_utilisateur as author_photo, u.id_utilisateur
            FROM tweet t
            JOIN signets s ON t.id_tweet = s.id_tweet
            JOIN utilisateur u ON t.id_utilisateur = u.id_utilisateur
            WHERE s.id_utilisateur = $1 ORDER BY s.date_signet DESC`;
        const result = await db.query(query, [req.params.id]);
        res.json(result.rows);
    } catch (error) { res.status(500).json({ error: "Erreur" }); }
});

router.post("/", upload.single('tweetImage'), async (req, res) => {
    try {
        const { userId, content } = req.body;
        const imageUrl = req.file ? `/uploads/tweets/${req.file.filename}` : null;

        if (!userId || (!content && !imageUrl)) {
            return res.status(400).json({ error: "Contenu ou image requis" });
        }
        const newPost = await createPost(userId, content, imageUrl);
        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la création" });
    }
});

// ROUTE CORRIGÉE : Vues
router.post("/:id/view", async (req, res) => {
    try {
        await incrementView(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Erreur incrémentation vue" });
    }
});

router.post("/:id/like", async (req, res) => {
    try {
        const result = await toggleLike(req.params.id, req.body.userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Erreur like" });
    }
});

router.post("/:id/repost", async (req, res) => {
    try {
        const result = await toggleRepost(req.params.id, req.body.userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Erreur repost" });
    }
});

router.post('/:id/bookmark', async (req, res) => {
    try {
        const { id: postId } = req.params;
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: "User ID manquant" });

        const check = await db.query('SELECT * FROM signets WHERE id_utilisateur = $1 AND id_tweet = $2', [userId, postId]);

        if (check.rows.length === 0) {
            await db.query('INSERT INTO signets (id_utilisateur, id_tweet) VALUES ($1, $2)', [userId, postId]);
            await db.query('UPDATE tweet SET nb_bookmarks_tweet = nb_bookmarks_tweet + 1 WHERE id_tweet = $1', [postId]);
            return res.json({ success: true, bookmarked: true });
        } else {
            await db.query('DELETE FROM signets WHERE id_utilisateur = $1 AND id_tweet = $2', [userId, postId]);
            await db.query('UPDATE tweet SET nb_bookmarks_tweet = nb_bookmarks_tweet - 1 WHERE id_tweet = $1', [postId]);
            return res.json({ success: true, bookmarked: false });
        }
    } catch (error) {
        res.status(500).json({ error: "Erreur bookmark" });
    }
});

router.get('/:id/comments', async (req, res) => {
    try {
        const userId = req.query.userId || null; 
        const comments = await getCommentsByPostId(req.params.id, userId);
        res.json(comments);
    } catch (error) {
        res.status(500).send();
    }
});

router.post('/:id/comments', uploadComment.single('commentImage'), async (req, res) => {
    try {
        const { userId, content } = req.body;
        // On récupère le chemin de l'image si elle existe
        const imageUrl = req.file ? `/uploads/comments/${req.file.filename}` : null;

        if (!userId) return res.status(400).json({ error: "User ID requis" });
        if (!content && !imageUrl) return res.status(400).json({ error: "Message ou image vide" });

        // ATTENTION : postsService.addComment doit être capable de recevoir imageUrl
        await addComment(req.params.id, userId, content, imageUrl);
        
        res.status(201).json({ success: true, imageUrl: imageUrl });
    } catch (error) {
        console.error("Erreur lors de l'ajout du commentaire:", error);
        res.status(500).json({ error: "Erreur lors de la réponse" });
    }
});

module.exports = router;