const db = require("../db");

/**
 * Récupère tous les posts pour le flux général
 */
async function getAllPosts() {
  const { rows } = await db.query(`
    SELECT
      t.id_tweet AS id,
      u.id_utilisateur AS id_utilisateur,             -- AJOUTÉ : ID pour le lien profil
      u.username_utilisateur AS author,
      u.nom_utilisateur AS author_name,
      u.photo_profil_utilisateur AS author_photo,
      t.description_tweet AS content,
      t.nb_likes_tweet AS likes,
      (SELECT COUNT(*)::int FROM commentaires c WHERE c.id_tweet = t.id_tweet) AS comments,          
      t.date_publication_tweet AS created_at
    FROM tweet t
    JOIN utilisateur u ON t.id_utilisateur = u.id_utilisateur
    ORDER BY t.date_publication_tweet DESC, t.id_tweet DESC
  `);

  return rows;
}

/**
 * Créer un nouveau post et retourne le tweet formaté
 */
async function createPost(userId, content) {
  // Insertion du tweet
  const insertResult = await db.query(
      `INSERT INTO tweet (id_utilisateur, description_tweet) VALUES ($1, $2) RETURNING id_tweet`,
      [userId, content]
  );

  const newTweetId = insertResult.rows[0].id_tweet;

  // --- GESTION DES HASHTAGS ---
  const hashtags = content.match(/#[a-zA-Z0-9_]+/g);
  if (hashtags) {
      for (let tag of hashtags) {
          const nomHashtag = tag.substring(1); 
          let tagResult = await db.query(
              `SELECT id_hashtag FROM hashtag WHERE nom_hashtag = $1`,
              [nomHashtag]
          );

          let tagId;
          if (tagResult.rows.length === 0) {
              const newTag = await db.query(
                  `INSERT INTO hashtag (nom_hashtag) VALUES ($1) RETURNING id_hashtag`,
                  [nomHashtag]
              );
              tagId = newTag.rows[0].id_hashtag;
          } else {
              tagId = tagResult.rows[0].id_hashtag;
          }

          await db.query(
              `INSERT INTO contient (id_tweet, id_hashtag) VALUES ($1, $2)`,
              [newTweetId, tagId]
          );
      }
  }

  // Récupération des données formatées pour le frontend
  const { rows } = await db.query(
      `
      SELECT
          t.id_tweet AS id,
          u.id_utilisateur AS id_utilisateur,         -- AJOUTÉ
          u.username_utilisateur AS author,
          u.nom_utilisateur AS author_name,
          u.photo_profil_utilisateur AS author_photo,
          t.description_tweet AS content,
          t.nb_likes_tweet AS likes,
          (SELECT COUNT(*)::int FROM commentaires c WHERE c.id_tweet = t.id_tweet) AS comments,
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
      u.id_utilisateur AS id_utilisateur,             -- AJOUTÉ
      u.username_utilisateur AS author,
      u.nom_utilisateur AS author_name,
      u.photo_profil_utilisateur AS author_photo,
      t.description_tweet AS content, 
      t.nb_likes_tweet AS likes, 
      (SELECT COUNT(*)::int FROM commentaires c WHERE c.id_tweet = t.id_tweet) AS comments,           
      t.date_publication_tweet AS created_at
    FROM tweet t
    JOIN utilisateur u ON t.id_utilisateur = u.id_utilisateur
    WHERE u.id_utilisateur = $1
    ORDER BY t.date_publication_tweet DESC;
  `, [userId]);
  return rows;
}

/**
 * Récupère les hashtags les plus utilisés
 */
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

/**
 * Récupère les commentaires liés à un tweet spécifique
 */
async function getCommentsByPostId(postId) {
  const { rows } = await db.query(`
      SELECT 
          c.id_commentaire AS id,
          u.id_utilisateur AS id_utilisateur,         -- AJOUTÉ (pour cliquer sur les profils en com)
          u.username_utilisateur AS author,
          u.nom_utilisateur AS author_name,
          u.photo_profil_utilisateur AS author_photo,
          c.description_commentaire AS content,
          c.date_publication_commentaire AS created_at
      FROM commentaires c
      JOIN utilisateur u ON c.id_utilisateur = u.id_utilisateur
      WHERE c.id_tweet = $1
      ORDER BY c.date_publication_commentaire ASC;
  `, [postId]);
  return rows;
}

/**
 * Ajoute un commentaire
 */
async function addComment(postId, userId, content) {
  await db.query(
      `INSERT INTO commentaires (id_tweet, id_utilisateur, description_commentaire) VALUES ($1, $2, $3)`,
      [postId, userId, content]
  );
}

/* Récupère les tweets liés à un hashtag spécifique */
async function getPostsByHashtag(hashtag) {
  const { rows } = await db.query(`
    SELECT
      t.id_tweet AS id,
      u.id_utilisateur AS id_utilisateur,
      u.username_utilisateur AS author,
      u.nom_utilisateur AS author_name,
      u.photo_profil_utilisateur AS author_photo,
      t.description_tweet AS content,
      t.nb_likes_tweet AS likes,
      (SELECT COUNT(*)::int FROM commentaires c WHERE c.id_tweet = t.id_tweet) AS comments,
      t.date_publication_tweet AS created_at
    FROM tweet t
    JOIN utilisateur u ON t.id_utilisateur = u.id_utilisateur
    JOIN contient c ON t.id_tweet = c.id_tweet
    JOIN hashtag h ON c.id_hashtag = h.id_hashtag
    WHERE h.nom_hashtag ILIKE $1
    ORDER BY t.date_publication_tweet DESC
  `, [hashtag]);

  return rows;
}

module.exports = {
  getAllPosts,
  createPost,
  toggleLike,
  getPostsByUserId,
  getTrendingHashtags,
  getCommentsByPostId,
  addComment,
  getPostsByHashtag
};