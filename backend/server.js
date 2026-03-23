const express = require("express");
const mysql = require("mysql2");
const app = express();

app.use(express.json());

const db = mysql.createConnection({
  host: "db",
  user: "user",
  password: "password",
  database: "twitter"
});

app.get("/tweets", (req, res) => {
  db.query("SELECT * FROM tweets", (err, result) => {
    res.json(result);
  });
});

app.post("/tweets", (req, res) => {
  const { content } = req.body;

  db.query(
    "INSERT INTO tweets(content) VALUES (?)",
    [content],
    () => res.send("tweet ajouté")
  );
});

app.listen(3000, "0.0.0.0");