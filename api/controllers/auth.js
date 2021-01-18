const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

// require('dotenv').config();

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
	const { username, password } = req.body;

	try {
		const user = await User.findOne({ username }).populate('cart', {
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
				token: token,
			});
		} else {
			const error = new Error('Tên tài khoản hoặc mật khẩu không chính xác.');
			error.statusCode = 401;
			return next(error);
		}
	} catch (err) {
		const error = new Error(
			'Có lỗi xảy ra với server, xin vui lòng thử lại sau.',
		);
		error.statusCode = 500;
		return next(error);
	}
};

exports.getAutoLogin = async (req, res, next) => {
	try {
		const user = await User.findById(
			req.userId,
			'name balance cart',
		).populate('cart', { name: 1, price: 1, images: { $slice: 1 } });

		const sendBackData = {
			name: user.name,
			balance: user.balance,
			userId: user._id,
			cart: user.cart,
		};
		res.status(200).json(sendBackData);
	} catch (err) {
		console.log(err);
		const error = new Error(
			'Có lỗi xảy ra với server, xin vui lòng thử lại sau.',
		);
		error.statusCode = 500;
		return next(error);
	}
};
