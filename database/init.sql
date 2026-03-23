DROP TABLE IF EXISTS posts;

CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    author VARCHAR(50) NOT NULL,
    content VARCHAR(280) NOT NULL,
    likes INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO posts (author, content, likes) VALUES
('Edgar', 'Premier post du projet X/Twitter', 0),
('Malak', 'Backend + frontend + DB avec Docker Compose', 2),
('Ian', 'Le projet démarre bien', 1);