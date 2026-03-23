const app = require('./src/app');
const db = require('./src/db'); // Initialise la connexion à la base

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Le serveur backend est démarré et écoute sur le port ${PORT}.`);
});