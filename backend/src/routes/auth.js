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