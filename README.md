# Projet X-Clone : Virtualisation et Modélisation de Données

## Présentation du projet
Ce projet consiste en la conception et le déploiement d'une plateforme de microblogging inspirée de X (Twitter). L'objectif est de démontrer une maîtrise de la chaîne de développement moderne : de la modélisation de bases de données relationnelles à l'orchestration de services virtualisés via Docker. Ce travail constitue une première étape concrète vers les méthodologies DevOps.

---

## Architecture Technique et Virtualisation
L'application est décomposée en trois services isolés communiquant au sein d'un réseau virtuel Docker :

* **Frontend** : Serveur web (Nginx ou Node) distribuant une Single Page Application en JavaScript Vanille.
* **Backend** : API REST développée sous Node.js (Express), gérant la logique métier et les points d'accès.
* **Database** : Instance PostgreSQL pour la persistance des données.
* **Réseau & Volumes** : Utilisation d'un bridge network pour l'isolation des flux et de volumes persistants pour le stockage des médias et des données SQL.

---

## Installation et Déploiement
Le projet utilise **Docker Compose** pour automatiser l'orchestration des conteneurs.

### Lancement de l'infrastructure
Exécutez la commande suivante à la racine du projet pour construire les images et démarrer les services :

    docker-compose up -d --build

### Accès aux services

    Interface utilisateur : http://localhost:8080

    API Backend : http://localhost:3001

    Stockage Médias : http://localhost:3001/uploads/


### Email & Mot de passe / POUR LES TESTS DE L'APP

    jean.dupont@email.com motdepasse123
        
    marie.curie@email.com science456
        
    alan.turing@email.com enigma789


### Fonctionnalités Clés

    Gestion du Flux : Publication de tweets (texte et images) avec système de hashtags dynamiques.

    Interactions Sociales : Système de Likes, Signets (Bookmarks) et Reposts.

    Système de Réponses : Commentaires filaires avec support média et likes indépendants.

    Analytics & Vues : Incrémentation en temps réel du compteur de vues par publication.

    Profils Utilisateurs : Personnalisation (avatars/bannières) et historique des activités.

### Action,Commande

    Arrêter les services,docker-compose down
    Reset total (Données + Volumes),docker-compose down -v
    Logs backend (temps réel),docker-compose logs -f backend
    Mise à jour du code backend,docker-compose up -d --build backend
    Accès shell au conteneur DB,docker exec -it twitter-db psql -U user -d twitter_db
