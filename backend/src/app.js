const express = require("express");
const cors = require("cors");
const postsRouter = require("./routes/posts");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Twitter/X backend is running"
  });
});

app.use("/posts", postsRouter);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

module.exports = app;