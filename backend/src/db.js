const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.connect()
  .then(() => console.log("Connexion à la base de données PostgreSQL réussie."))
  .catch(err => console.error("Erreur de connexion à la base de données", err));

module.exports = pool;