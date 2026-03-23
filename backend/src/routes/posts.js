const express = require("express");
const {
  getAllPosts,
  createPost,
  likePost
} = require("../services/postsService");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const posts = await getAllPosts();
    res.status(200).json(posts);
  } catch (error) {
    console.error("GET /posts error:", error);
    res.status(500).json({
      error: "Unable to fetch posts"
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const author = typeof req.body.author === "string" ? req.body.author.trim() : "";
    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";

    if (!author) {
      return res.status(400).json({
        error: "Author is required"
      });
    }

    if (!content) {
      return res.status(400).json({
        error: "Content is required"
      });
    }

    if (author.length > 50) {
      return res.status(400).json({
        error: "Author must not exceed 50 characters"
      });
    }

    if (content.length > 280) {
      return res.status(400).json({
        error: "Content must not exceed 280 characters"
      });
    }

    const newPost = await createPost(author, content);

    return res.status(201).json(newPost);
  } catch (error) {
    console.error("POST /posts error:", error);
    return res.status(500).json({
      error: "Unable to create post"
    });
  }
});

router.post("/:id/like", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid post id"
      });
    }

    const updatedPost = await likePost(id);

    if (!updatedPost) {
      return res.status(404).json({
        error: "Post not found"
      });
    }

    return res.status(200).json(updatedPost);
  } catch (error) {
    console.error("POST /posts/:id/like error:", error);
    return res.status(500).json({
      error: "Unable to like post"
    });
  }
});

module.exports = router;