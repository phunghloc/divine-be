const Post = require('../models/post');
const Cloudinary = require('../models/cloudinary');
const User = require('../models/user');
const Log = require('../models/log');

const socketIO = require('../../io');

exports.createPost = async (req, res, next) => {
	const { userId } = req;
	const { content } = req.body;

	if (!req.files.length && !content) {
		const error = new Error('Bài đăng bao gồm ít nhất hình ảnh / nội dung!');
		error.status(422);
		return next(error);
	}

	let res_promises = req.files.map(
		(file) =>
			new Promise((resolve, reject) => {
				Cloudinary.uploadMultiple(file.path, 'post').then((result) => {
					resolve(result);
				});
			}),
	);

	Promise.all(res_promises)
		.then(async (arrImg) => {
			const post = new Post({
				userId,
				content,
				images: arrImg,
				subcribers: [userId],
			});

			const result = await post.save();

			const log = new Log({ userId, rootId: post._id, type: 'create post' });

			await log.save();

			res.status(201).json({ result });

			const socketPost = await Post.findById(post._id, '-subcribers')
				.populate('userId', 'name avatar')
				.populate('comments.userId', 'name avatar');

			socketIO.getIO().emit('new post', {
				...socketPost._doc,
				likes: 0,
				likedThisPost: false,
			});
		})
		.catch((err) => {
			console.log(err);
			next(err);
		});
};

exports.getPosts = async (req, res, next) => {
	const page = req.query.page || 0;
	const POST_PER_PAGE = 10;
	const { userId } = req;
	try {
		const total = await Post.find({ available: true }).countDocuments();

		const posts = await Post.find({ available: true }, '-subcribers')
			.skip(page * POST_PER_PAGE)
			.limit(POST_PER_PAGE)
			.sort({ createdAt: -1 })
			.populate('userId', 'name avatar')
			.populate('comments.userId', 'name avatar');

		const sendBackPost = posts.map((post) => {
			let likedThisPost = false;
			if (userId) {
				likedThisPost = !!post.likes.find((uid) => uid.toString() === userId);
			}
			return {
				...post._doc,
				likes: post.likes.length,
				likedThisPost,
				commentsCount: post.comments.length,
				comments: post.comments.slice(-1),
			};
		});
		setTimeout(() => {
			res.json({ posts: sendBackPost, total });
		}, 2000);
	} catch (err) {
		console.log(err);
		next(err);
	}
};

exports.deletePost = async (req, res, next) => {
	const { userId } = req;
	const { postId } = req.params;

	// TODO: tìm post -> xác thực có đúng người đăng hay không -> xóa -> lưu log -> socket
	try {
		const post = await Post.findOne({ _id: postId, userId });

		if (!post) {
			const error = new Error('Không thể thực hiện thao tác!');
			error.statusCode = 422;
			return next(error);
		}

		post.available = false;
		await post.save();

		// Lưu lại log
		const log = new Log({ userId, rootId: postId, type: 'delete post' });
		await log.save();

		socketIO.getIO().emit('delete post', { postId });

		res.json({ message: 'Đã xóa bài đăng!' });
	} catch (err) {
		console.log(err);
		next(err);
	}
};

exports.toggleLikePost = async (req, res, next) => {
	const { userId } = req;
	const { postId } = req.params;

	try {
		// TODO: tìm post -> toggle like
		const post = await Post.findById(postId);

		if (!post) {
			const error = new Error('Không tìm thấy bài đăng!');
			error.statusCode = 404;
			return next(err);
		}

		const userIndex = post.likes.findIndex((uid) => uid.toString() === userId);

		let likedThisPost = false;
		if (userIndex >= 0) {
			post.likes.splice(userIndex, 1);
		} else {
			post.likes.push(userId);
			likedThisPost = true;
		}

		await post.save();

		// TODO: ghi lại log
		const log = await Log.findOne({ userId, rootId: postId, type: 'like' });
		console.log(log);

		if (!log) {
			const saveLog = new Log({ userId, rootId: postId, type: 'like' });
			saveLog.save();
		}

		res.json({ likedThisPost, likes: post.likes.length });
	} catch (err) {
		console.log(err);
		next(err);
	}
};

exports.postComment = async (req, res, next) => {
	const { userId } = req;
	const { postId } = req.params;
	const { comment } = req.body;

	try {
		const post = await Post.findById(postId);

		if (!post) {
			const error = new Error('Không tìm thấy bài đăng!');
			error.statusCode = 404;
			return next(err);
		}

		// TODO: push thêm comment vào bài đăng
		post.comments.push({ userId, comment });

		const isSubcribed = post.subcribers.find(
			(sub) => sub.toString() === userId,
		);
		if (!isSubcribed) post.subcribers.push(userId);

		await post.save();

		// TODO: lấy thông tin để emit socket
		const userComment = await User.findById(userId, 'name avatar');

		const io = socketIO.getIO();

		io.to('community').emit('update comment', {
			postId: post._id,
			_id: post.comments.slice(-1)[0]._id,
			userId: userComment,
			comment,
		});

		// TODO: ghi lại log
		const log = new Log({ userId, rootId: post._id, type: 'comment post' });
		await log.save();

		res.status(201).json({ message: 'ok' });
	} catch (err) {
		console.log(err);
		next(err);
	}
};

exports.updateComment = async (req, res, next) => {
	const { userId } = req;
	const { commentId, postId } = req.params;
	const { newComment } = req.body;

	// TODO: Tìm post -> tìm comment -> kiểm tra user chỉnh sửa === user comment -> chỉnh sửa -> ghi log

	try {
		const post = await Post.findById(postId, 'comments');

		// 404: Không tìm thấy post
		if (!post) {
			const error = new Error('Không tìm thấy bài đăng!');
			error.statusCode = 404;
			return next(error);
		}

		const commentIndex = post.comments.findIndex(
			(c) => c._id.toString() === commentId,
		);

		// 404: Không tìm thấy comment
		if (commentIndex < 0) {
			const error = new Error('Không tìm thấy bình luận!');
			error.statusCode = 404;
			return next(error);
		}

		// 402: Không có quyền chỉnh sửa
		if (post.comments[commentIndex].userId.toString() !== userId) {
			const error = new Error('Không thể chỉnh sửa bình luận của người khác!');
			error.statusCode = 402;
			return next(error);
		}

		// chỉnh sửa và lưu vào database
		post.comments[commentIndex].comment = newComment;
		await post.save();

		// ghi log
		const log = new Log({
			userId,
			rootId: post._id,
			type: 'edit comment',
		});
		await log.save();

		res.status(201).json({ message: 'Chỉnh sửa comment thành công!' });
	} catch (err) {
		console.log(err);
		next(err);
	}
};

exports.deleteComment = async (req, res, next) => {
	const { userId } = req;
	const { postId, commentId } = req.params;

	try {
		// TODO: Tìm post => tìm comment => kiểm tra userId => xóa comment
		const post = await Post.findById(postId, 'comments');

		// Nếu không tìm được post
		if (!post) {
			const error = new Error('Không tìm thấy bài đăng!');
			error.statusCode = 404;
			return next(error);
		}

		const commentIndex = post.comments.findIndex(
			(comment) => comment._id.toString() === commentId,
		);

		// Nếu cmt của người khác thì không có quyền xóa
		if (post.comments[commentIndex].userId.toString() !== userId) {
			const error = new Error('Không thể xóa bình luận của người khác!');
			error.statusCode = 422;
			return next(error);
		}
		post.comments.splice(commentIndex, 1);
		await post.save();

		// Lưu log và emit socket
		const log = new Log({ userId, rootId: postId, type: 'delete comment' });
		await log.save();

		socketIO.getIO().emit('delete comment', { postId, commentId });

		res.json({ message: 'Đã xóa bình luận' });
	} catch (err) {
		console.log(err);
		next(err);
	}
};

exports.loadmoreCommentInPost = async (req, res, next) => {
	// TODO: tìm post -> tìm comment cuối mà user đang hiện thị trên dom -> lấy 5 comment trước đó
	const { postId, lastCommentId } = req.params;
	try {
		const post = await Post.findById(postId, 'comments').populate(
			'comments.userId',
			'name avatar',
		);

		const commentIndex = post.comments.findIndex(
			(comment) => comment._id.toString() === lastCommentId,
		);

		res.json({
			comments: post.comments.slice(
				Math.max(commentIndex - 5, 0),
				commentIndex,
			),
		});
	} catch (err) {
		console.log(err);
		return next(err);
	}
};
