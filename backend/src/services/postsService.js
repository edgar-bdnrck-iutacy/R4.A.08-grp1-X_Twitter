const db = require("../db");

async function getAllPosts() {
  const [rows] = await db.query(`
    SELECT
      id,
      author,
      content,
      likes,
      created_at
    FROM posts
    ORDER BY created_at DESC, id DESC
  `);

  return rows;
}

async function createPost(author, content) {
  const [result] = await db.query(
    `
      INSERT INTO posts (author, content)
      VALUES (?, ?)
    `,
    [author, content]
  );

  const [rows] = await db.query(
    `
      SELECT
        id,
        author,
        content,
        likes,
        created_at
      FROM posts
      WHERE id = ?
    `,
    [result.insertId]
  );

  return rows[0];
}

async function likePost(id) {
  const [updateResult] = await db.query(
    `
      UPDATE posts
      SET likes = likes + 1
      WHERE id = ?
    `,
    [id]
  );

  if (updateResult.affectedRows === 0) {
    return null;
  }

  const [rows] = await db.query(
    `
      SELECT
        id,
        author,
        content,
        likes,
        created_at
      FROM posts
      WHERE id = ?
    `,
    [id]
  );

  return rows[0];
}

module.exports = {
  getAllPosts,
  createPost,
  likePost
};