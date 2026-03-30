const db = require("../db");

/**
 * Récupère tous les posts pour le flux général
 */
async function getAllPosts(currentUserId = null) {
  const { rows } = await db.query(`
    SELECT *
    FROM (
      SELECT
        t.id_tweet AS id,
        u.id_utilisateur AS id_utilisateur,
        u.username_utilisateur AS author,
        u.nom_utilisateur AS author_name,
        u.photo_profil_utilisateur AS author_photo,
        t.description_tweet AS content,
        t.image_url,
        t.nb_likes_tweet AS likes,
        t.nb_reposts_tweet AS reposts,
        t.nb_views_tweet,
        (SELECT COUNT(*)::int FROM commentaires c WHERE c.id_tweet = t.id_tweet) AS comments,
        t.date_publication_tweet AS created_at,
        FALSE AS "isRepost",
        NULL::INT AS reposted_by_id,
        NULL::VARCHAR AS reposted_by_username,
        NULL::VARCHAR AS reposted_by_name,
        EXISTS(
          SELECT 1
          FROM likes l
          WHERE l.id_utilisateur = $1 AND l.id_tweet = t.id_tweet
        ) AS "isLiked",
        EXISTS(
          SELECT 1
          FROM reposts r2
          WHERE r2.id_utilisateur = $1 AND r2.id_tweet = t.id_tweet
        ) AS "isReposted"
      FROM tweet t
      JOIN utilisateur u ON t.id_utilisateur = u.id_utilisateur

      UNION ALL

      SELECT
        t.id_tweet AS id,
        u.id_utilisateur AS id_utilisateur,
        u.username_utilisateur AS author,
        u.nom_utilisateur AS author_name,
        u.photo_profil_utilisateur AS author_photo,
        t.description_tweet AS content,
        t.image_url,
        t.nb_likes_tweet AS likes,
        t.nb_reposts_tweet AS reposts,
        t.nb_views_tweet,
        (SELECT COUNT(*)::int FROM commentaires c WHERE c.id_tweet = t.id_tweet) AS comments,
        r.date_repost AS created_at,
        TRUE AS "isRepost",
        ru.id_utilisateur AS reposted_by_id,
        ru.username_utilisateur AS reposted_by_username,
        ru.nom_utilisateur AS reposted_by_name,
        EXISTS(
          SELECT 1
          FROM likes l
          WHERE l.id_utilisateur = $1 AND l.id_tweet = t.id_tweet
        ) AS "isLiked",
        EXISTS(
          SELECT 1
          FROM reposts r2
          WHERE r2.id_utilisateur = $1 AND r2.id_tweet = t.id_tweet
        ) AS "isReposted"
      FROM reposts r
      JOIN tweet t ON t.id_tweet = r.id_tweet
      JOIN utilisateur u ON t.id_utilisateur = u.id_utilisateur
      JOIN utilisateur ru ON ru.id_utilisateur = r.id_utilisateur
    ) feed
    ORDER BY created_at DESC, id DESC
  `, [currentUserId]);

  return rows;
}

async function getFollowingFeed(currentUserId) {
  const { rows } = await db.query(`
    SELECT
      t.id_tweet AS id,
      u.id_utilisateur AS id_utilisateur,
      u.username_utilisateur AS author,
      u.nom_utilisateur AS author_name,
      u.photo_profil_utilisateur AS author_photo,
      t.description_tweet AS content,
      t.image_url,
      t.nb_likes_tweet AS likes,
      t.nb_reposts_tweet AS reposts,
      t.nb_views_tweet,
      (SELECT COUNT(*)::int FROM commentaires c WHERE c.id_tweet = t.id_tweet) AS comments,
      t.date_publication_tweet AS created_at,
      FALSE AS "isRepost",
      NULL::INT AS reposted_by_id,
      NULL::VARCHAR AS reposted_by_username,
      NULL::VARCHAR AS reposted_by_name,
      EXISTS(
        SELECT 1
        FROM likes l
        WHERE l.id_utilisateur = $1
          AND l.id_tweet = t.id_tweet
      ) AS "isLiked",
      EXISTS(
        SELECT 1
        FROM reposts r
        WHERE r.id_utilisateur = $1
          AND r.id_tweet = t.id_tweet
      ) AS "isReposted"
    FROM tweet t
    JOIN utilisateur u ON t.id_utilisateur = u.id_utilisateur
    JOIN abonnements a ON a.id_suivi_utilisateur = u.id_utilisateur
    WHERE a.id_suiveur_utilisateur = $1
    ORDER BY t.date_publication_tweet DESC, t.id_tweet DESC
  `, [currentUserId]);

  return rows;
}

/**
 * Créer un nouveau post
 */
async function createPost(userId, content, imageUrl = null) {
  const insertResult = await db.query(
      `INSERT INTO tweet (id_utilisateur, description_tweet, image_url) 
       VALUES ($1, $2, $3) RETURNING id_tweet`,
      [userId, content, imageUrl]
  );

  const newTweetId = insertResult.rows[0].id_tweet;

  // --- GESTION HASHTAGS (Nettoyée) ---
  const hashtags = content.match(/#[a-zA-Z0-9_]+/g);
  if (hashtags) {
      for (let tag of hashtags) {
          const nomHashtag = tag.substring(1).toLowerCase(); // On met tout en minuscule pour la cohérence
          
          // On insère le hashtag s'il n'existe pas encore
          await db.query(
              `INSERT INTO hashtag (nom_hashtag) VALUES ($1) ON CONFLICT (nom_hashtag) DO NOTHING`, 
              [nomHashtag]
          );

          // On récupère l'id (nécessaire car le ON CONFLICT ne renvoie rien s'il existe déjà)
          const tagResult = await db.query(`SELECT id_hashtag FROM hashtag WHERE nom_hashtag = $1`, [nomHashtag]);
          const tagId = tagResult.rows[0].id_hashtag;

          // On fait le lien avec le tweet
          await db.query(
              `INSERT INTO contient (id_tweet, id_hashtag) VALUES ($1, $2) ON CONFLICT DO NOTHING`, 
              [newTweetId, tagId]
          );
      }
  }

  const { rows } = await db.query(`
      SELECT
          t.id_tweet AS id,
          u.id_utilisateur AS id_utilisateur,
          u.username_utilisateur AS author,
          u.nom_utilisateur AS author_name,
          u.photo_profil_utilisateur AS author_photo,
          t.description_tweet AS content,
          t.image_url,
          t.nb_likes_tweet AS likes,
          t.nb_views_tweet,                                 -- CORRIGÉ
          (SELECT COUNT(*)::int FROM commentaires c WHERE c.id_tweet = t.id_tweet) AS comments,
          t.date_publication_tweet AS created_at
      FROM tweet t
      JOIN utilisateur u ON t.id_utilisateur = u.id_utilisateur
      WHERE t.id_tweet = $1
  `, [newTweetId]);

  return rows[0];
}

/**
 * Like/Unlike Tweet
 */
async function toggleLike(tweetId, userId) {
  const check = await db.query(`SELECT * FROM likes WHERE id_utilisateur = $1 AND id_tweet = $2`, [userId, tweetId]);
  const alreadyLiked = check.rows.length > 0;

  if (alreadyLiked) {
    await db.query(`DELETE FROM likes WHERE id_utilisateur = $1 AND id_tweet = $2`, [userId, tweetId]);
    await db.query(`UPDATE tweet SET nb_likes_tweet = nb_likes_tweet - 1 WHERE id_tweet = $1`, [tweetId]);
  } else {
    await db.query(`INSERT INTO likes (id_utilisateur, id_tweet) VALUES ($1, $2)`, [userId, tweetId]);
    await db.query(`UPDATE tweet SET nb_likes_tweet = nb_likes_tweet + 1 WHERE id_tweet = $1`, [tweetId]);
  }

  const { rows } = await db.query(`SELECT nb_likes_tweet AS likes FROM tweet WHERE id_tweet = $1`, [tweetId]);
  return { id: tweetId, likes: rows[0].likes, isLiked: !alreadyLiked };
}

async function toggleRepost(tweetId, userId) {
  const check = await db.query(
    `SELECT * FROM reposts WHERE id_utilisateur = $1 AND id_tweet = $2`,
    [userId, tweetId]
  );

  const alreadyReposted = check.rows.length > 0;

  if (alreadyReposted) {
    await db.query(
      `DELETE FROM reposts WHERE id_utilisateur = $1 AND id_tweet = $2`,
      [userId, tweetId]
    );
    await db.query(
      `UPDATE tweet
       SET nb_reposts_tweet = GREATEST(nb_reposts_tweet - 1, 0)
       WHERE id_tweet = $1`,
      [tweetId]
    );
  } else {
    await db.query(
      `INSERT INTO reposts (id_utilisateur, id_tweet) VALUES ($1, $2)`,
      [userId, tweetId]
    );
    await db.query(
      `UPDATE tweet
       SET nb_reposts_tweet = nb_reposts_tweet + 1
       WHERE id_tweet = $1`,
      [tweetId]
    );
  }

  const { rows } = await db.query(
    `SELECT nb_reposts_tweet AS reposts FROM tweet WHERE id_tweet = $1`,
    [tweetId]
  );

  return {
    id: tweetId,
    reposts: rows[0].reposts,
    isReposted: !alreadyReposted
  };
}

/**
 * Posts d'un utilisateur
 */
async function getPostsByUserId(userId, currentUserId = null) {
  const { rows } = await db.query(`
    SELECT *
    FROM (
      SELECT
        t.id_tweet AS id,
        u.id_utilisateur AS id_utilisateur,
        u.username_utilisateur AS author,
        u.nom_utilisateur AS author_name,
        u.photo_profil_utilisateur AS author_photo,
        t.description_tweet AS content,
        t.image_url,
        t.nb_likes_tweet AS likes,
        t.nb_reposts_tweet AS reposts,
        t.nb_views_tweet,
        (SELECT COUNT(*)::int FROM commentaires c WHERE c.id_tweet = t.id_tweet) AS comments,
        t.date_publication_tweet AS created_at,
        FALSE AS "isRepost",
        NULL::INT AS reposted_by_id,
        NULL::VARCHAR AS reposted_by_username,
        NULL::VARCHAR AS reposted_by_name,
        EXISTS(
          SELECT 1
          FROM likes l
          WHERE l.id_utilisateur = $2 AND l.id_tweet = t.id_tweet
        ) AS "isLiked",
        EXISTS(
          SELECT 1
          FROM reposts r2
          WHERE r2.id_utilisateur = $2 AND r2.id_tweet = t.id_tweet
        ) AS "isReposted",
        EXISTS(
          SELECT 1 
          FROM signets s 
          WHERE s.id_tweet = t.id_tweet AND s.id_utilisateur = $2
        ) AS "isBookmarked"
      FROM tweet t
      JOIN utilisateur u ON t.id_utilisateur = u.id_utilisateur
      WHERE t.id_utilisateur = $1

      UNION ALL

      SELECT
        t.id_tweet AS id,
        u.id_utilisateur AS id_utilisateur,
        u.username_utilisateur AS author,
        u.nom_utilisateur AS author_name,
        u.photo_profil_utilisateur AS author_photo,
        t.description_tweet AS content,
        t.image_url,
        t.nb_likes_tweet AS likes,
        t.nb_reposts_tweet AS reposts,
        t.nb_views_tweet,
        (SELECT COUNT(*)::int FROM commentaires c WHERE c.id_tweet = t.id_tweet) AS comments,
        r.date_repost AS created_at,
        TRUE AS "isRepost",
        ru.id_utilisateur AS reposted_by_id,
        ru.username_utilisateur AS reposted_by_username,
        ru.nom_utilisateur AS reposted_by_name,
        EXISTS(
          SELECT 1
          FROM likes l
          WHERE l.id_utilisateur = $2 AND l.id_tweet = t.id_tweet
        ) AS "isLiked",
        EXISTS(
          SELECT 1
          FROM reposts r2
          WHERE r2.id_utilisateur = $2 AND r2.id_tweet = t.id_tweet
        ) AS "isReposted",
        EXISTS(
          SELECT 1 
          FROM signets s 
          WHERE s.id_tweet = t.id_tweet AND s.id_utilisateur = $2
        ) AS "isBookmarked"
      FROM reposts r
      JOIN tweet t ON t.id_tweet = r.id_tweet
      JOIN utilisateur u ON t.id_utilisateur = u.id_utilisateur
      JOIN utilisateur ru ON ru.id_utilisateur = r.id_utilisateur
      WHERE r.id_utilisateur = $1
    ) profile_feed
    ORDER BY created_at DESC, id DESC
  `, [userId, currentUserId]);

  return rows;
}

/**
 * Hashtags Trends
 */
async function getTrendingHashtags() {
  const { rows } = await db.query(`
    SELECT h.nom_hashtag AS hashtag, COUNT(c.id_tweet) AS total
    FROM hashtag h
    JOIN contient c ON h.id_hashtag = c.id_hashtag
    GROUP BY h.nom_hashtag
    ORDER BY total DESC LIMIT 5;
  `);
  return rows;
}

/**
 * Commentaires d'un tweet (CORRIGÉ pour inclure l'état du Like)
 */
async function getCommentsByPostId(postId, currentUserId = null) {
  const { rows } = await db.query(`
      SELECT 
          c.id_commentaire AS id,
          u.id_utilisateur AS id_utilisateur,
          u.username_utilisateur AS author,
          u.nom_utilisateur AS author_name,
          u.photo_profil_utilisateur AS author_photo,
          c.description_commentaire AS content,
          c.image_commentaire,
          c.nb_likes_commentaire,                    -- CORRIGÉ : Nom exact de la colonne
          c.date_publication_commentaire AS created_at,
          EXISTS(SELECT 1 FROM likes_commentaires lc WHERE lc.id_commentaire = c.id_commentaire AND lc.id_utilisateur = $2) AS "isLiked"
      FROM commentaires c
      JOIN utilisateur u ON c.id_utilisateur = u.id_utilisateur
      WHERE c.id_tweet = $1
      ORDER BY c.date_publication_commentaire ASC;
  `, [postId, currentUserId]);
  return rows;
}

async function addComment(postId, userId, content, imageUrl = null) {
  await db.query(
      `INSERT INTO commentaires (id_tweet, id_utilisateur, description_commentaire, image_commentaire) 
       VALUES ($1, $2, $3, $4)`,
      [postId, userId, content, imageUrl]
  );
}

async function getPostsByHashtag(hashtag) {
  const { rows } = await db.query(`
    SELECT
      t.id_tweet AS id,
      u.id_utilisateur AS id_utilisateur,
      u.username_utilisateur AS author,
      u.nom_utilisateur AS author_name,
      u.photo_profil_utilisateur AS author_photo,
      t.description_tweet AS content,
      t.image_url,
      t.nb_likes_tweet AS likes,
      t.nb_views_tweet,                               -- CORRIGÉ
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

async function incrementView(postId) {
  await db.query('UPDATE tweet SET nb_views_tweet = nb_views_tweet + 1 WHERE id_tweet = $1', [postId]);
}

/**
* Toggle Like sur un commentaire
*/
async function toggleCommentLike(commentId, userId) {
  const check = await db.query(
      'SELECT * FROM likes_commentaires WHERE id_utilisateur = $1 AND id_commentaire = $2',
      [userId, commentId]
  );

  const alreadyLiked = check.rows.length > 0;

  if (alreadyLiked) {
      await db.query('DELETE FROM likes_commentaires WHERE id_utilisateur = $1 AND id_commentaire = $2', [userId, commentId]);
      await db.query('UPDATE commentaires SET nb_likes_commentaire = nb_likes_commentaire - 1 WHERE id_commentaire = $1', [commentId]);
  } else {
      await db.query('INSERT INTO likes_commentaires (id_utilisateur, id_commentaire) VALUES ($1, $2)', [userId, commentId]);
      await db.query('UPDATE commentaires SET nb_likes_commentaire = nb_likes_commentaire + 1 WHERE id_commentaire = $1', [commentId]);
  }

  const { rows } = await db.query('SELECT nb_likes_commentaire as likes FROM commentaires WHERE id_commentaire = $1', [commentId]);
  return { likes: rows[0].likes, isLiked: !alreadyLiked };
}

module.exports = {
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
};