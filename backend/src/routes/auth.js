const express = require('express');
const router = express.Router();
const db = require('../db'); // Ton module de connexion PG

// Route de Connexion
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // On cherche l'utilisateur par email et password
        const result = await db.query(
            `SELECT id_utilisateur, nom_utilisateur, username_utilisateur 
             FROM utilisateur 
             WHERE email_utilisateur = $1 AND password_utilisateur = $2`,
            [email, password]
        );

        if (result.rows.length > 0) {
            const user = result.rows[0];
            
            // On renvoie un succès avec les infos nécessaires au front
            res.json({
                success: true,
                user: {
                    id: user.id_utilisateur,
                    name: user.nom_utilisateur,
                    handle: `@${user.username_utilisateur}`
                }
            });
        } else {
            // Si rien n'est trouvé, on envoie une erreur 401
            res.status(401).json({ 
                success: false, 
                message: "Email ou mot de passe incorrect." 
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
});

module.exports = router;

// INSCRIPTION 
router.post('/register', async (req, res) => {
    const { nom, username, email, password } = req.body;

    try {
        // 1. On vérifie si l'email existe déjà
        const checkEmail = await db.query(
            'SELECT * FROM utilisateur WHERE email_utilisateur = $1', 
            [email]
        );
        
        if (checkEmail.rows.length > 0) {
            return res.status(400).json({ success: false, message: "Cet email est déjà utilisé." });
        }

        // 2. On insère le nouvel utilisateur
        const result = await db.query(
            `INSERT INTO utilisateur (nom_utilisateur, username_utilisateur, email_utilisateur, password_utilisateur) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id_utilisateur, nom_utilisateur, username_utilisateur`,
            [nom, username, email, password]
        );

        const user = result.rows[0];
        
        // 3. On connecte directement l'utilisateur après inscription
        res.json({
            success: true,
            user: {
                id: user.id_utilisateur,
                name: user.nom_utilisateur,
                handle: `@${user.username_utilisateur}`
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erreur serveur lors de l'inscription" });
    }
});