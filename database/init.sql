CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50)
);

CREATE TABLE tweets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);