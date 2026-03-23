const app = require('./src/app');
const db = require('./src/db'); 

// On passe par défaut sur 3001 pour matcher ton frontend
const PORT = process.env.PORT || 3001;

// On ajoute '0.0.0.0' pour que Docker accepte les connexions externes
app.listen(PORT, '0.0.0.0', () => {
  console.log(` Le serveur backend est démarré !`);
  console.log(` Écoute sur : http://0.0.0.0:${PORT}`);
  console.log(` Accessible depuis ton navigateur sur : http://localhost:${PORT}`);
});