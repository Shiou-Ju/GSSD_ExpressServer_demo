const express = require("express");
const {
  getPosts,
  getSinglePost,
  addPost,
  updatePost,
  deletePost,
} = require("../controllers/posts");

const Post = require("../models/Post");

//init router
const router = express.Router({ mergeParams: true });

//middlewares
const advancedResults = require("../middleware/advancedResults");
const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .get(advancedResults(Post), getPosts)
  .post(protect, authorize("admin"), addPost);

router
  .route("/:id")
  .get(getSinglePost)
  .put(protect, authorize("admin"), updatePost)
  .delete(protect, authorize("admin"), deletePost);

module.exports = router;
