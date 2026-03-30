const express = require("express");
const { getUserById } = require("../services/usersService");

// 👈 AJOUT INDISPENSABLE : Import de la connexion à la base de données
const db = require("../db"); // Ajuste le chemin "../db" si ton fichier db.js est ailleurs

const router = express.Router();

// Vérifier si un utilisateur en suit un autre
router.get('/:followerId/is-following/:followedId', async (req, res) => {
  try {
      const { followerId, followedId } = req.params;
      const result = await db.query(
          'SELECT * FROM abonnements WHERE id_suiveur_utilisateur = $1 AND id_suivi_utilisateur = $2',
          [followerId, followedId]
      );
      res.json({ isFollowing: result.rows.length > 0 });
  } catch (error) {
      res.status(500).json({ error: "Erreur check follow" });
  }
});

// À placer AVANT la route GET /:id
router.get('/search', async (req, res) => {
  const query = req.query.q;
  
  if (!query) {
      return res.status(200).json([]);
  }

  try {
      // ILIKE permet une recherche insensible à la casse (majuscule/minuscule)
      // Les % autour de $1 permettent de chercher un mot contenu "au milieu" d'une chaîne
      const sql = `
          SELECT id_utilisateur, nom_utilisateur, username_utilisateur, photo_profil_utilisateur, bio_utilisateur 
          FROM utilisateur 
          WHERE nom_utilisateur ILIKE $1 OR username_utilisateur ILIKE $1
          LIMIT 20;
      `;
      const values = [`%${query}%`];
      const result = await db.query(sql, values);
      
      res.status(200).json(result.rows);
  } catch (error) {
      console.error("Erreur de recherche :", error);
      res.status(500).json({ error: "Erreur serveur lors de la recherche" });
  }
});



router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Identifiant utilisateur invalide" });
    }

    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    user.handle = `@${user.handle}`;

    return res.status(200).json(user);
  } catch (error) {
    console.error("Erreur lors de la récupération du profil :", error);
    return res.status(500).json({ error: "Impossible de récupérer le profil" });
  }
});

router.put('/:id', async (req, res) => {
  const userId = req.params.id;
  const { name, bio, photo_profil, photo_banniere } = req.body;

  try {
      const query = `
          UPDATE utilisateur 
          SET nom_utilisateur = $1, 
              bio_utilisateur = $2, 
              photo_profil_utilisateur = $3, 
              photo_banniere_utilisateur = $4
          WHERE id_utilisateur = $5
          RETURNING *;
      `;
      
      const result = await db.query(query, [name, bio, photo_profil, photo_banniere, userId]);
      
      if (result.rows.length === 0) {
          return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      
      res.status(200).json({ success: true, user: result.rows[0] });
  } catch (error) {
      console.error("Erreur serveur lors de la mise à jour :", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour du profil" });
  }
});



router.get('/:id/likes', async (req, res) => {
  try {
      const query = `
          SELECT 
              t.id_tweet AS id,
              t.description_tweet AS content,
              t.nb_likes_tweet AS likes,
              (SELECT COUNT(*) FROM commentaires c WHERE c.id_tweet = t.id_tweet) AS comments,
              true AS "isLiked",
              u.nom_utilisateur AS author_name, 
              u.username_utilisateur AS author, 
              u.photo_profil_utilisateur AS author_photo
          FROM tweet t
          JOIN likes l ON t.id_tweet = l.id_tweet
          JOIN utilisateur u ON t.id_utilisateur = u.id_utilisateur
          WHERE l.id_utilisateur = $1
          ORDER BY l.date_like DESC;
      `;
      const result = await db.query(query, [req.params.id]);
      res.status(200).json(result.rows);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur serveur" });
  }
});
// --- ROUTE : Réponses de l'utilisateur ---
router.get('/:id/replies', async (req, res) => {
  try {
      const query = `
          SELECT 
              c.id_commentaire AS id, 
              c.description_commentaire AS content, 
              c.nb_likes_commentaire AS likes,
              0 AS comments,
              false AS "isLiked",
              u.nom_utilisateur AS author_name, 
              u.username_utilisateur AS author, 
              u.photo_profil_utilisateur AS author_photo
          FROM commentaires c
          JOIN utilisateur u ON c.id_utilisateur = u.id_utilisateur
          WHERE c.id_utilisateur = $1
          ORDER BY c.date_publication_commentaire DESC;
      `;
      const result = await db.query(query, [req.params.id]);
      res.status(200).json(result.rows);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur serveur" });
  }
});


// --- ROUTE : Obtenir les statistiques d'abonnement ---
router.get('/:id/stats', async (req, res) => {
  try {
      const followers = await db.query('SELECT COUNT(*) FROM abonnements WHERE id_suivi_utilisateur = $1', [req.params.id]);
      const following = await db.query('SELECT COUNT(*) FROM abonnements WHERE id_suiveur_utilisateur = $1', [req.params.id]);
      
      res.status(200).json({ 
          followers: parseInt(followers.rows[0].count), 
          following: parseInt(following.rows[0].count) 
      });
  } catch (error) { 
      res.status(500).json({ error: "Erreur lors du comptage" }); 
  }
});

// --- ROUTE : S'abonner / Se désabonner ---
router.post('/:id/follow', async (req, res) => {
    const targetId = Number(req.params.id);
    const currentUserId = Number(req.body.userId);
  
    try {
        if (!Number.isInteger(targetId) || targetId <= 0) {
            return res.status(400).json({ error: "Utilisateur cible invalide" });
        }
  
        if (!Number.isInteger(currentUserId) || currentUserId <= 0) {
            return res.status(400).json({ error: "Utilisateur courant invalide" });
        }
  
        if (targetId === currentUserId) {
            return res.status(400).json({ error: "Impossible de se suivre soi-même" });
        }
  
        const check = await db.query(
            'SELECT 1 FROM abonnements WHERE id_suiveur_utilisateur = $1 AND id_suivi_utilisateur = $2',
            [currentUserId, targetId]
        );
  
        if (check.rows.length > 0) {
            await db.query(
                'DELETE FROM abonnements WHERE id_suiveur_utilisateur = $1 AND id_suivi_utilisateur = $2',
                [currentUserId, targetId]
            );
            return res.status(200).json({ isFollowing: false });
        }
  
        await db.query(
            'INSERT INTO abonnements (id_suiveur_utilisateur, id_suivi_utilisateur) VALUES ($1, $2)',
            [currentUserId, targetId]
        );
  
        return res.status(200).json({ isFollowing: true });
    } catch (error) {
        console.error("Erreur route follow :", error);
        return res.status(500).json({ error: "Erreur lors de l'abonnement" });
    }
  });

// --- ROUTE : Obtenir la liste des abonnés (Followers) ---
router.get('/:id/followers', async (req, res) => {
    try {
        const query = `
            SELECT u.id_utilisateur AS id, u.nom_utilisateur AS name, u.username_utilisateur AS handle, u.photo_profil_utilisateur AS photo_profil, u.bio_utilisateur AS bio
            FROM abonnements a
            JOIN utilisateur u ON a.id_suiveur_utilisateur = u.id_utilisateur
            WHERE a.id_suivi_utilisateur = $1
            ORDER BY a.date_abonnement DESC;
        `;
        const result = await db.query(query, [req.params.id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur lors de la récupération des abonnés" });
    }
});

// --- ROUTE : Obtenir la liste des abonnements (Following) ---
router.get('/:id/following', async (req, res) => {
    try {
        const query = `
            SELECT u.id_utilisateur AS id, u.nom_utilisateur AS name, u.username_utilisateur AS handle, u.photo_profil_utilisateur AS photo_profil, u.bio_utilisateur AS bio
            FROM abonnements a
            JOIN utilisateur u ON a.id_suivi_utilisateur = u.id_utilisateur
            WHERE a.id_suiveur_utilisateur = $1
            ORDER BY a.date_abonnement DESC;
        `;
        const result = await db.query(query, [req.params.id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur lors de la récupération des abonnements" });
    }
});

module.exports = router;