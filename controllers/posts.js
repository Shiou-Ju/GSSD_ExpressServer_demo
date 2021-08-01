const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Post = require("../models/Post");

// @desc    Get Posts
// @route   GET /api/v1/posts
// @access  Public

exports.getPosts = asyncHandler(async (req, res, next) => {
  if (req.params.id) {
    const posts = await Post.find({ listing: req.params.id });
    return res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single post
// @route   GET /api/v1/posts/:id
// @access  Public

exports.getSinglePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorResponse(`無此公告${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: post,
  });
});

// @desc    Add Post
// @route   POST /api/v1/posts
// @access  Private

exports.addPost = asyncHandler(async (req, res, next) => {
  req.body.user = req.user.id;

  const post = await Post.create(req.body);

  res.status(201).json({
    success: true,
    data: post,
  });
});

// @desc    Update Post
// @route   PUT /api/v1/posts/:id
// @access  Private

exports.updatePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);
  if (!post) {
    return next(new ErrorResponse(`無此公告${req.params.id}`, 404));
  }

  post = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true, //return updated
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: post,
  });
});

// @desc    Delete post
// @route   DELETE /api/v1/posts/:id
// @access  Private

exports.deletePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);
  if (!post) {
    return next(new ErrorResponse(`無此公告${req.params.id}`, 404));
  }

  await post.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});
