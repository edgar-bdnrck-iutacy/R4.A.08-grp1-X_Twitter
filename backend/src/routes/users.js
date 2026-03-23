const express = require("express");
const { getUserById } = require("../services/usersService");

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Identifiant utilisateur invalide" });
    }

    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    // Ajout du préfixe @ pour correspondre aux attentes du frontend
    user.handle = `@${user.handle}`;

    return res.status(200).json(user);
  } catch (error) {
    console.error("Erreur lors de la récupération du profil :", error);
    return res.status(500).json({ error: "Impossible de récupérer le profil" });
  }
});

module.exports = router;