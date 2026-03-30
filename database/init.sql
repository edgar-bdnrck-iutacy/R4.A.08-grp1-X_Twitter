-- 1. Table utilisateur
CREATE TABLE utilisateur (
    id_utilisateur SERIAL PRIMARY KEY,
    nom_utilisateur VARCHAR(50) NOT NULL,
    username_utilisateur VARCHAR(50) UNIQUE NOT NULL,
    date_creation_compte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_utilisateur VARCHAR(100) UNIQUE NOT NULL,
    password_utilisateur VARCHAR(255) NOT NULL,
    photo_profil_utilisateur VARCHAR(200),
    photo_banniere_utilisateur VARCHAR(200),
    bio_utilisateur TEXT,
    nb_followers_utilisateur INT DEFAULT 0,
    nb_followings_utilisateur INT DEFAULT 0
);

-- 2. Table tweet
CREATE TABLE tweet (
    id_tweet SERIAL PRIMARY KEY,
    photo_tweet VARCHAR(200),
    date_publication_tweet TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nb_views_tweet INT DEFAULT 0,
    description_tweet VARCHAR(1000) NOT NULL,
    nb_reposts_tweet INT DEFAULT 0,
    nb_quotes_tweet INT DEFAULT 0,
    nb_likes_tweet INT DEFAULT 0,
    nb_bookmarks_tweet INT DEFAULT 0,
    nb_commentaires_tweet INT DEFAULT 0,
    id_utilisateur INT NOT NULL,
    CONSTRAINT fk_tweet_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE
);

-- 3. Table commentaires
CREATE TABLE commentaires (
    id_commentaire SERIAL PRIMARY KEY,
    date_publication_commentaire TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nb_likes_commentaire INT DEFAULT 0,
    nb_views_commentaire INT DEFAULT 0,
    nb_reposts_commentaire INT DEFAULT 0,
    nb_bookmarks_commentaire INT DEFAULT 0,
    description_commentaire TEXT NOT NULL,
    image_commentaire VARCHAR(200),
    id_tweet INT NOT NULL,
    id_utilisateur INT NOT NULL,
    CONSTRAINT fk_commentaires_tweet FOREIGN KEY (id_tweet) REFERENCES tweet(id_tweet) ON DELETE CASCADE,
    CONSTRAINT fk_commentaires_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE
);

-- 4. Table hashtag
CREATE TABLE hashtag (
    id_hashtag SERIAL PRIMARY KEY,
    nom_hashtag VARCHAR(50) UNIQUE NOT NULL
);

-- 5. Table contient (Liaison Tweet <-> Hashtag)
CREATE TABLE contient (
    id_tweet INT NOT NULL,
    id_hashtag INT NOT NULL,
    PRIMARY KEY (id_tweet, id_hashtag),
    CONSTRAINT fk_contient_tweet FOREIGN KEY (id_tweet) REFERENCES tweet(id_tweet) ON DELETE CASCADE,
    CONSTRAINT fk_contient_hashtag FOREIGN KEY (id_hashtag) REFERENCES hashtag(id_hashtag) ON DELETE CASCADE
);

-- 6. Table possede (Liaison Commentaires <-> Hashtag)
CREATE TABLE possede (
    id_commentaire INT NOT NULL,
    id_hashtag INT NOT NULL,
    PRIMARY KEY (id_commentaire, id_hashtag),
    CONSTRAINT fk_possede_commentaire FOREIGN KEY (id_commentaire) REFERENCES commentaires(id_commentaire) ON DELETE CASCADE,
    CONSTRAINT fk_possede_hashtag FOREIGN KEY (id_hashtag) REFERENCES hashtag(id_hashtag) ON DELETE CASCADE
);

-- 7. Table abonnements (Relations Followers / Followings)
CREATE TABLE abonnements (
    id_suiveur_utilisateur INT NOT NULL,
    id_suivi_utilisateur INT NOT NULL,
    date_abonnement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_suiveur_utilisateur, id_suivi_utilisateur),
    CONSTRAINT fk_abonnements_suiveur FOREIGN KEY (id_suiveur_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT fk_abonnements_suivi FOREIGN KEY (id_suivi_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE
);

-- 8. Table likes (Interactions J'aime sur les tweets)
CREATE TABLE likes (
    id_utilisateur INT NOT NULL,
    id_tweet INT NOT NULL,
    date_like TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_utilisateur, id_tweet),
    CONSTRAINT fk_likes_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT fk_likes_tweet FOREIGN KEY (id_tweet) REFERENCES tweet(id_tweet) ON DELETE CASCADE
);

-- 9. Table reposts (Partages de tweets)
CREATE TABLE reposts (
    id_utilisateur INT NOT NULL,
    id_tweet INT NOT NULL,
    date_repost TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_utilisateur, id_tweet),
    CONSTRAINT fk_reposts_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT fk_reposts_tweet FOREIGN KEY (id_tweet) REFERENCES tweet(id_tweet) ON DELETE CASCADE
);

-- 10. Table signets (Bookmarks)
CREATE TABLE signets (
    id_utilisateur INT NOT NULL,
    id_tweet INT NOT NULL,
    date_signet TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_utilisateur, id_tweet),
    CONSTRAINT fk_signets_utilisateur FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT fk_signets_tweet FOREIGN KEY (id_tweet) REFERENCES tweet(id_tweet) ON DELETE CASCADE
);


-- 1. Insertion des utilisateurs avec photos et bannières
INSERT INTO utilisateur (nom_utilisateur, username_utilisateur, email_utilisateur, password_utilisateur, bio_utilisateur, photo_profil_utilisateur, photo_banniere_utilisateur) 
VALUES 
('Jean Dupont', 'jdupont', 'jean.dupont@email.com', 'motdepasse123', 'Développeur passionné.', 
 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop', 
 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=250&fit=crop'),

('Marie Curie', 'mcurie', 'marie.curie@email.com', 'science456', 'La science est magique.', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Marie_Curie_1903.jpg/200px-Marie_Curie_1903.jpg', 
 'https://images.unsplash.com/photo-1532187863486-abf51ad9f69d?w=800&h=250&fit=crop'),

('Alan Turing', 'aturing', 'alan.turing@email.com', 'enigma789', 'Pionnier de l''informatique.', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Alan_Turing_Aged_16.jpg/200px-Alan_Turing_Aged_16.jpg', 
 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=250&fit=crop'),

('Ada Lovelace', 'alovelace', 'ada@ordinateur.com', 'poeticalscience', 'La première programmeuse.', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Ada_Lovelace_portrait.jpg/200px-Ada_Lovelace_portrait.jpg', 
 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=250&fit=crop'),

('Grace Hopper', 'ghopper', 'grace@cobol.com', 'nanosecond', 'J''ai trouvé le premier bug !', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Commodore_Grace_M._Hopper%2C_USN_%28official_portrait%29.jpg/200px-Commodore_Grace_M._Hopper%2C_USN_%28official_portrait%29.jpg', 
 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&h=250&fit=crop'),

('Linus Torvalds', 'ltorvalds', 'linus@linux.org', 'penguin', 'Juste pour le fun.', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/LinuxCon_Europe_Linus_Torvalds_03_%28cropped%29.jpg/200px-LinuxCon_Europe_Linus_Torvalds_03_%28cropped%29.jpg', 
 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&h=250&fit=crop'),

('Tim Berners-Lee', 'timberners', 'tim@www.com', 'http1989', 'Inventeur du World Wide Web.', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Sir_Tim_Berners-Lee_%28cropped%29.jpg/200px-Sir_Tim_Berners-Lee_%28cropped%29.jpg', 
 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=250&fit=crop'),

('Margaret Hamilton', 'mhamilton', 'margaret@apollo.com', 'moonlanding', 'Ingénieure logicielle pour la NASA.', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Margaret_Hamilton_in_action.jpg/200px-Margaret_Hamilton_in_action.jpg', 
 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=250&fit=crop'),

('Jack Dorsey', 'jack', 'jack@reseau.com', 'twttr123', 'Créateur de réseaux.', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Jack_Dorsey_2014_%28cropped%29.jpg/200px-Jack_Dorsey_2014_%28cropped%29.jpg', 
 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=800&h=250&fit=crop'),

('Steve Jobs', 'sjobs', 'steve@pomme.com', 'stayhungry', 'Stay hungry, stay foolish.', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Steve_Jobs_Headshot_2010-edit_%28cropped%29.jpg/200px-Steve_Jobs_Headshot_2010-edit_%28cropped%29.jpg', 
 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=800&h=250&fit=crop'),

('Bill Gates', 'bgates', 'bill@fenetres.com', 'msdos1981', 'Philanthrope et développeur.', 
 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Bill_Gates_2017_%28cropped%29.jpg/200px-Bill_Gates_2017_%28cropped%29.jpg', 
 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=250&fit=crop');
-- 2. Insertion des tweets
INSERT INTO tweet (id_utilisateur, description_tweet, nb_views_tweet, nb_likes_tweet) 
VALUES 
(1, 'Bonjour tout le monde ! C''est mon tout premier tweet sur cette plateforme.', 150, 12),
(2, 'Le radium est vraiment un élément fascinant. Une belle journée pour la recherche.', 340, 45),
(3, 'Quelqu''un a-t-il résolu le problème de l''arrêt ?', 500, 89),
(4, 'L''Analytical Engine a tellement de potentiel.', 1200, 300),
(5, 'Toujours vérifier les relais pour les mites. #Bug', 850, 150),
(6, 'Je travaille sur un petit système d''exploitation gratuit.', 5000, 1200),
(7, 'Ce truc appelé "hypertexte" pourrait être utile à tout le monde.', 3200, 800),
(8, 'Le code source d''Apollo 11 était à peu près aussi grand que moi !', 4500, 2100),
(4, 'Les mathématiques sont la poésie de l''univers.', 600, 80),
(6, 'L''open source est la clé de l''innovation.', 3000, 950),
(9, 'just setting up my twttr', 150000, 50000),
(10, 'Nous avons créé quelque chose de magique aujourd''hui. #Innovation', 85000, 42000),
(11, 'Qui se souvient du doux son du modem 56k ? #Nostalgie', 60000, 15000);

-- 3. Insertion des commentaires
INSERT INTO commentaires (id_tweet, id_utilisateur, description_commentaire, nb_likes_commentaire) 
VALUES 
(1, 2, 'Bienvenue sur le réseau, Jean !', 3),
(3, 1, 'C''est un problème indécidable, Alan.', 15),
(4, 5, 'Fascinant, Ada !', 45),
(6, 7, 'Cela pourrait s''intégrer parfaitement avec mon réseau de documents.', 120),
(8, 2, 'Un travail incroyable, Margaret.', 300),
(5, 6, 'Il faut toujours déboguer.', 50),
(7, 3, 'Une idée brillante qui va tout changer.', 200),
(11, 10, 'Moi, mais je préfère de loin le Wi-Fi !', 800),
(12, 11, 'La vraie magie, c''est le logiciel qui fait tourner le matériel.', 1200);

-- 4. Insertion des hashtags
INSERT INTO hashtag (nom_hashtag) 
VALUES 
('PremierTweet'),
('Science'),
('Informatique'),
('Bienvenue'),
('Histoire'),
('OpenSource'),
('Web'),
('Espace'),
('Code'),
('Nostalgie'),
('Innovation');

-- 5. Insertion dans la table contient (Liaison Tweet <-> Hashtag)
INSERT INTO contient (id_tweet, id_hashtag) 
VALUES 
(1, 1), (2, 2), (3, 3), 
(4, 5), (6, 6), (7, 7), 
(8, 8), (10, 6), (12, 11), (13, 10);

-- 6. Insertion dans la table possede (Liaison Commentaires <-> Hashtag)
INSERT INTO possede (id_commentaire, id_hashtag) 
VALUES 
(1, 4), 
(4, 9), 
(5, 7);

-- 7. Insertion des abonnements
INSERT INTO abonnements (id_suiveur_utilisateur, id_suivi_utilisateur) 
VALUES 
(1, 4), (1, 3), (2, 1), (3, 1),
(4, 5), (5, 4), (6, 7), (7, 6), 
(8, 4), (8, 5), (9, 10), (10, 9), 
(11, 10), (10, 11);

-- 8. Insertion des likes
INSERT INTO likes (id_utilisateur, id_tweet) 
VALUES 
(2, 1), (1, 2), (1, 3),
(4, 5), (5, 4), (6, 7), (7, 6), 
(8, 8), (10, 11), (11, 12), (9, 13);

-- 9. Insertion des reposts
INSERT INTO reposts (id_utilisateur, id_tweet) 
VALUES 
(3, 2), (6, 7), (7, 6), 
(8, 4), (11, 12), (10, 13);

-- 10. Insertion des signets (Bookmarks)
INSERT INTO signets (id_utilisateur, id_tweet) 
VALUES 
(1, 2), (2, 3), (4, 8), 
(5, 6), (7, 8), (9, 12), (11, 11);




ALTER TABLE tweet ADD COLUMN image_url TEXT;


-- S'assurer que la colonne vues existe
ALTER TABLE tweet ADD COLUMN IF NOT EXISTS nb_views_tweet INT DEFAULT 0;

-- Créer la table pour les likes de commentaires (Indispensable !)
CREATE TABLE IF NOT EXISTS likes_commentaires (
    id_utilisateur INT NOT NULL,
    id_commentaire INT NOT NULL,
    PRIMARY KEY (id_utilisateur, id_commentaire),
    CONSTRAINT fk_likes_com_user FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT fk_likes_com_item FOREIGN KEY (id_commentaire) REFERENCES commentaires(id_commentaire) ON DELETE CASCADE
);