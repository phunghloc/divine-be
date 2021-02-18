const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Cloudinary = require('../models/cloudinary');

require('dotenv').config();

exports.postSignUp = async (req, res, next) => {
	const result = validationResult(req);

	if (!result.isEmpty()) {
		const error = new Error(result.array()[0].msg);
		error.statusCode = 422;
		return next(error);
	}

	try {
		const userData = { ...req.body };
		const hashedPwd = bcrypt.hashSync(userData.password, 12);
		userData.password = hashedPwd;
		const user = new User(userData);
		const result = await user.save();

		res.status(201).json({
			message: 'user created',
			id: result._id,
			username: result.username,
		});
	} catch (err) {
		console.log(err);
		next(err);
	}
};

exports.postLogin = async (req, res, next) => {
	// TODO: Đăng nhập lấy các thông tin (tên, avatar, balance, cart, số thông báo mới)
	const { username, password } = req.body;

	try {
		const user = await User.findOne(
			{ username },
			{
				name: 1,
				avatar: 1,
				cart: 1,
				balance: 1,
				password: 1,
				'notifications.newNotifications': 1,
			},
		).populate('cart', {
			name: 1,
			price: 1,
			images: { $slice: 1 },
		});

		if (!user) {
			const error = new Error('Tên tài khoản hoặc mật khẩu không chính xác.');
			error.statusCode = 401;
			return next(error);
		}
		const isAuth = bcrypt.compareSync(password, user.password);
		if (isAuth) {
			const token = jwt.sign({ userId: user._id }, process.env.JWT_KEY, {
				expiresIn: '7d',
			});
			res.status(200).json({
				name: user.name,
				userId: user._id,
				balance: user.balance,
				cart: user.cart,
				avatar: user.avatar,
				token: token,
				notifications: user.notifications,
			});
		} else {
			const error = new Error('Tên tài khoản hoặc mật khẩu không chính xác.');
			error.statusCode = 401;
			return next(error);
		}
	} catch (err) {
		console.log(err);
		return next(err);
	}
};

exports.getAutoLogin = async (req, res, next) => {
	// TODO: Đăng nhập lấy các thông tin (tên, avatar, balance, cart, số thông báo mới)
	try {
		const user = await User.findById(req.userId, {
			name: 1,
			avatar: 1,
			balance: 1,
			cart: 1,
			'notifications.newNotifications': 1,
		}).populate('cart', { name: 1, price: 1, images: { $slice: 1 } });

		const sendBackData = {
			name: user.name,
			balance: user.balance,
			userId: user._id,
			cart: user.cart,
			avatar: user.avatar,
			notifications: user.notifications,
		};
		res.status(200).json(sendBackData);
	} catch (err) {
		console.log(err);
		return next(err);
	}
};

exports.getNotifications = async (req, res, next) => {
	// TODO: Lấy 8 thông báo cuối cùng của user
	const { userId } = req;
	const { page = 1 } = req.query;

	try {
		const user = await User.findById(userId, {
			'notifications.newNotifications': 1,
			'notifications.list': { $slice: [-8 * +page, 8] },
		}).populate({
			path: 'notifications.list.logId',
			populate: {
				path: 'userId',
				select: 'name avatar',
			},
		});

		if (user.notifications.newNotifications) {
			user.notifications.newNotifications = 0;
			await user.save();
		}

		res.json({ notifications: user.notifications.list });
	} catch (err) {
		console.log(err);
		next(err);
	}
};

exports.markAsReadNotification = async (req, res, next) => {
	// TODO: tìm notification index -> đánh dấu nó là đã đọc
	const { userId } = req;
	const { notifyId } = req.params;

	try {
		const user = await User.findById(userId, 'notifications');

		const notifyIndex = user.notifications.list.findIndex(
			(n) => n._id.toString() === notifyId,
		);

		if (notifyIndex < 0) {
			return next(new Error());
		}

		user.notifications.list[notifyIndex].hasRead = true;
		await user.save();

		res.json('ok');
	} catch (err) {
		console.log(err);
		next(err);
	}
};

exports.getUser = async (req, res, next) => {
	const { userId } = req.params;

	try {
		const user = await User.findById(
			userId,
			'name balance avatar status createdAt',
		).populate('activatedGames', { name: 1, images: { $slice: 1 } });

		if (!user) {
			throw new Error();
		}

		res.json({ user });
	} catch (err) {
		const error = new Error('Không tìm thấy người dùng');
		error.statusCode = 404;
		next(error);
	}
};

exports.getOwnerUser = async (req, res, next) => {
	const { userId } = req;

	try {
		const user = await User.findById(userId, 'name status phoneNumber avatar');

		res.json({ user });
	} catch (err) {
		next(err);
	}
};

exports.postAvatar = async (req, res, next) => {
	let res_promises = req.files.map(
		(file) =>
			new Promise((resolve, reject) => {
				Cloudinary.uploadMultipleAvatar(file.path).then((result) => {
					resolve(result);
				});
			}),
	);

	Promise.all(res_promises)
		.then(async (arrImg) => {
			const result = arrImg[0];
			const { userId } = req;

			const user = await User.findById(userId);
			user.avatar = result.avatar;
			await user.save();
			res.json({ avatar: user.avatar });
		})
		.catch((err) => {
			next(err);
		});
};

exports.postChangeInfo = async (req, res, next) => {
	const result = validationResult(req);

	if (!result.isEmpty()) {
		const error = new Error(result.array()[0].msg);
		error.statusCode = 422;
		return next(error);
	}

	const newUserData = req.body;
	const { userId } = req;

	try {
		const user = await User.findById(userId);

		for (const key in newUserData) {
			user[key] = newUserData[key];
		}

		await user.save();

		res
			.status(201)
			.json({ message: 'Cập nhật thông tin tài khoản thành công!' });
	} catch (err) {
		console.log(err);
		next(err);
	}
};

exports.postChangePassword = async (req, res, next) => {
	const result = validationResult(req);

	if (!result.isEmpty()) {
		const error = new Error(result.array()[0].msg);
		error.statusCode = 422;
		return next(error);
	}

	const { userId } = req;
	const { oldPassword, password } = req.body;

	try {
		const user = await User.findById(userId);
		const isMatch = bcrypt.compareSync(oldPassword, user.password);

		if (!isMatch) {
			const error = new Error('Mật khẩu không trùng khớp!');
			error.statusCode = 422;
			return next(error);
		}

		const newPassword = bcrypt.hashSync(password, 12);
		user.password = newPassword;
		await user.save();
		res.json({ message: 'Thay đổi mật khẩu thành công!' });
	} catch (err) {
		console.log(err);
		next(err);
	}
};
