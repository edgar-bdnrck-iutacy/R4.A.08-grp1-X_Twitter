const express = require('express');
const path = require('path');
const app = express();

// Autorise l'accès à tous les fichiers du dossier courant
app.use(express.static(__dirname));

// Renvoie toujours index.html par défaut (idéal pour notre routeur)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Écoute sur 0.0.0.0 pour que Docker puisse faire le lien vers l'extérieur
app.listen(3000, '0.0.0.0', () => {
    console.log('Serveur frontend au top et prêt sur le port 3000 !');
});