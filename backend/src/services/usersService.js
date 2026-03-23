const db = require("../db");

async function getUserById(id) {
    const { rows } = await db.query(
      `SELECT
         id_utilisateur AS id,
         nom_utilisateur AS name,
         username_utilisateur AS handle,
         bio_utilisateur AS bio,
         photo_profil_utilisateur AS photo_profil,    
         photo_banniere_utilisateur AS photo_banniere 
       FROM utilisateur
       WHERE id_utilisateur = $1`,
      [id]
    );
    return rows[0] || null;
  }

module.exports = { getUserById };