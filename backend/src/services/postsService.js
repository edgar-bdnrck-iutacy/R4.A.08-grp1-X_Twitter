const db = require("../db");

/**
 * Récupère tous les posts pour le flux général
 */
async function getAllPosts() {
  const { rows } = await db.query(`
    SELECT
      t.id_tweet AS id,
      u.username_utilisateur AS author,
      u.nom_utilisateur AS author_name,              -- Nom complet (ex: Jean Dupont)
      u.photo_profil_utilisateur AS author_photo,    -- URL de la miniature
      t.description_tweet AS content,
      t.nb_likes_tweet AS likes,
      t.date_publication_tweet AS created_at
    FROM tweet t
    JOIN utilisateur u ON t.id_utilisateur = u.id_utilisateur
    ORDER BY t.date_publication_tweet DESC, t.id_tweet DESC
  `);

  return rows;
}
async function createPost(author, content) {
  // 1. Récupération de l'identifiant de l'utilisateur
  const userResult = await db.query(
    `SELECT id_utilisateur FROM utilisateur WHERE username_utilisateur = $1`,
    [author]
  );

  if (userResult.rows.length === 0) {
    throw new Error("Auteur introuvable dans la base de données.");
  }

  const userId = userResult.rows[0].id_utilisateur;

  // 2. Insertion du tweet
  const insertResult = await db.query(
    `INSERT INTO tweet (id_utilisateur, description_tweet) VALUES ($1, $2) RETURNING id_tweet`,
    [userId, content]
  );

  const newTweetId = insertResult.rows[0].id_tweet;

  // --- NOUVEAUTÉ : GESTION DES HASHTAGS ---
  // On repère tous les mots qui commencent par # (ex: #Innovation)
  const hashtags = content.match(/#[a-zA-Z0-9_]+/g);

  if (hashtags) {
    for (let tag of hashtags) {
      const nomHashtag = tag.substring(1); // On retire le '#' pour la base de données

      // On vérifie si ce hashtag existe déjà dans la table
      let tagResult = await db.query(
        `SELECT id_hashtag FROM hashtag WHERE nom_hashtag = $1`,
        [nomHashtag]
      );

      let tagId;
      if (tagResult.rows.length === 0) {
        // S'il est tout neuf, on le crée
        const newTag = await db.query(
          `INSERT INTO hashtag (nom_hashtag) VALUES ($1) RETURNING id_hashtag`,
          [nomHashtag]
        );
        tagId = newTag.rows[0].id_hashtag;
      } else {
        // S'il existe déjà, on récupère juste son ID
        tagId = tagResult.rows[0].id_hashtag;
      }

      // On crée le lien entre le tweet et le hashtag dans la table 'contient'
      await db.query(
        `INSERT INTO contient (id_tweet, id_hashtag) VALUES ($1, $2)`,
        [newTweetId, tagId]
      );
    }
  }
  // ----------------------------------------

  // 3. Récupération des données formatées (avec photo et nom complet)
  const { rows } = await db.query(
    `
    SELECT
      t.id_tweet AS id,
      u.username_utilisateur AS author,
      u.nom_utilisateur AS author_name,
      u.photo_profil_utilisateur AS author_photo,
      t.description_tweet AS content,
      t.nb_likes_tweet AS likes,
      t.date_publication_tweet AS created_at
    FROM tweet t
    JOIN utilisateur u ON t.id_utilisateur = u.id_utilisateur
    WHERE t.id_tweet = $1
    `,
    [newTweetId]
  );

  return rows[0];
}

/**
 * Gère le Like/Unlike (Toggle)
 */
async function toggleLike(tweetId, userId) {
  const check = await db.query(
    `SELECT * FROM likes WHERE id_utilisateur = $1 AND id_tweet = $2`,
    [userId, tweetId]
  );

  const alreadyLiked = check.rows.length > 0;

  if (alreadyLiked) {
    await db.query(`DELETE FROM likes WHERE id_utilisateur = $1 AND id_tweet = $2`, [userId, tweetId]);
    await db.query(`UPDATE tweet SET nb_likes_tweet = nb_likes_tweet - 1 WHERE id_tweet = $1`, [tweetId]);
  } else {
    await db.query(`INSERT INTO likes (id_utilisateur, id_tweet) VALUES ($1, $2)`, [userId, tweetId]);
    await db.query(`UPDATE tweet SET nb_likes_tweet = nb_likes_tweet + 1 WHERE id_tweet = $1`, [tweetId]);
  }

  const { rows } = await db.query(
    `SELECT nb_likes_tweet AS likes FROM tweet WHERE id_tweet = $1`,
    [tweetId]
  );

  return { 
    id: tweetId, 
    likes: rows[0].likes, 
    isLiked: !alreadyLiked 
  };
}

/**
 * Récupère les posts d'un utilisateur spécifique (Profil)
 */
async function getPostsByUserId(userId) {
  const { rows } = await db.query(`
    SELECT 
      t.id_tweet AS id, 
      u.username_utilisateur AS author,
      u.nom_utilisateur AS author_name,
      u.photo_profil_utilisateur AS author_photo,
      t.description_tweet AS content, 
      t.nb_likes_tweet AS likes, 
      t.date_publication_tweet AS created_at
    FROM tweet t
    JOIN utilisateur u ON t.id_utilisateur = u.id_utilisateur
    WHERE u.id_utilisateur = $1
    ORDER BY t.date_publication_tweet DESC;
  `, [userId]);
  return rows;
}

async function getTrendingHashtags() {
  const { rows } = await db.query(`
    SELECT h.nom_hashtag AS hashtag, COUNT(c.id_tweet) AS total
    FROM hashtag h
    JOIN contient c ON h.id_hashtag = c.id_hashtag
    GROUP BY h.nom_hashtag
    ORDER BY total DESC
    LIMIT 5;
  `);
  return rows;
}

module.exports = {
  getAllPosts,
  createPost,
  toggleLike,
  getPostsByUserId,
  getTrendingHashtags
};