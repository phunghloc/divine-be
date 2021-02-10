const express = require('express');

const PostController = require('../api/controllers/post');

const { isAuth, isLogined } = require('../middleware/isAuth');

const router = express.Router();

// /posts
router.get('/', isLogined, PostController.getPosts);

// '/posts/create/'
router.post('/create', isAuth, PostController.createPost);

// /posts/toggle-like
router.get('/toggle-like/:postId', isAuth, PostController.toggleLikePost);

// /posts/comment/:commentId
router.post('/:postId/comment', isAuth, PostController.postComment);

// /posts/loadmore/:postId/:lastCommentId
router.get('/loadmore/:postId/:lastCommentId', PostController.loadmoreCommentInPost);

// TODO: PUT
router.put('/:postId/:commentId', isAuth, PostController.updateComment);

// TODO: DELETE
// /posts/delete/
router.delete(
	'/delete/:postId/:commentId',
	isAuth,
	PostController.deleteComment,
);
router.delete('/delete/:postId', isAuth, PostController.deletePost);

module.exports = router;
