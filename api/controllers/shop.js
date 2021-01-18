const { v4 } = require('uuid');

const Game = require('../models/game');
const User = require('../models/user');
const Cash = require('../models/cash');
const Keygame = require('../models/keygame');
const Order = require('../models/order');

exports.getGamesHomepage = async (req, res, next) => {
	try {
		const games = await Game.find({}, 'name price images')
			.sort('-createdAt')
			.limit(12);
		const sendBackGames = games.map((game) => {
			const newGame = { ...game._doc };
			newGame.images = newGame.images[0].url;
			return newGame;
		});
		res.status(200).json({ games: sendBackGames });
	} catch (err) {
		console.log(err);
		const error = new Error('Có lỗi với server, xin vui lòng thử lại sau.');
		error.statusCode = 500;
		next(error);
	}
};

exports.findGameByName = async (req, res, next) => {
	const name = req.query.name || '';
	// const page = req.query.page || '';

	const nameReg = new RegExp(name);
	try {
		games = await Game.find(
			{ name: { $regex: nameReg, $options: 'i' } },
			'name price images',
		)
			.sort('-createdAt')
			.limit(5);

		const sendBackGames = games.map((game) => {
			const newGame = { ...game._doc };
			newGame.images = newGame.images[0].url;
			return newGame;
		});

		res.json({ games: sendBackGames });
	} catch (err) {
		next(err);
	}
};

exports.getDetailGameById = async (req, res, next) => {
	const { idGame } = req.params;
	try {
		const game = await Game.findById(idGame).populate('developer tags.tagId');

		if (!game) {
			throw new Error();
		}

		res.status(200).json({ game });
	} catch (err) {
		console.log(err);
		const error = new Error('Không tìm thấy game');
		error.statusCode = 404;
		next(error);
	}
};

exports.addToCart = async (req, res, next) => {
	const { gameId } = req.body;

	try {
		const user = await User.findById(req.userId);

		// *Check xem trong giỏ hàng đã có game đó chưa
		if (user.cart.includes(gameId)) {
			const error = new Error('Game đã có trong giỏ hàng');
			error.statusCode = 422;
			return next(error);
		}

		// *lấy thông tin game, add vào giỏ hàng của user, trả res
		const resGame = await Game.findById(gameId, {
			name: 1,
			price: 1,
			images: { $slice: 1 },
		});

		await user.addItemToCart(gameId);

		res
			.status(201)
			.json({ message: 'Thêm sản phẩm thành công', game: resGame });
	} catch (err) {
		console.log(err);
		const error = new Error('Yêu cầu không hợp lệ!');
		error.statusCode = 422;
		next(error);
	}
};

exports.removeItemCart = async (req, res, next) => {
	const { gameId } = req.params;
	const userId = req.userId;

	try {
		const user = await User.findById(userId);
		const result = await user.removeItemFromCart(gameId);

		res.json(result);
	} catch (err) {
		console.log(err);
		next(err);
	}
};

exports.createCash = async (req, res, next) => {
	try {
		const cashData = {
			serial: Math.random().toString().replace('0.', ''),
			code: v4(),
			denominate: Math.round(Math.random() * 10) * 100000,
		};
		const cash = await new Cash(cashData);
		const result = await cash.save();

		res.status(201).json(result);
	} catch (err) {
		console.log(err);
		next(err);
	}
};

exports.postCash = async (req, res, next) => {
	const { serial, code } = req.body;
	const userId = req.userId;

	try {
		const cash = await Cash.findOne({ serial, code });

		// *Mã không tồn tại
		if (!cash) {
			const error = new Error('Không tìm thấy mã');
			error.statusCode = 404;
			return next(error);
		}

		// *Đã có người nạp
		if (cash.activatedBy) {
			const error = new Error('Mã đã có người nạp');
			error.statusCode = 422;
			return next(error);
		}

		// *Thực hiện nạp cash
		const user = await User.findById(userId);
		user.balance += cash.denominate;
		const result = await user.save();

		cash.activatedBy = userId;
		await cash.save();

		res.status(201).json({
			message: `Nạp thành công ${cash.denominate} vào tài khoản ${user.username}.`,
			balance: result.balance,
		});
	} catch (err) {
		console.log(err);
		next(err);
	}
};

exports.postPurchaseGames = async (req, res, next) => {
	const { games } = req.body;
	const userId = req.userId;

	try {
		const gamesList = await Game.find({ _id: { $in: games } }, 'price');
		const TOTAL_PRICE = gamesList.reduce(
			(total, game) => total + game.price,
			0,
		);

		const user = await User.findById(userId, 'balance');

		if (user.balance < TOTAL_PRICE) {
			const error = new Error(
				'Tài khoản của bạn không đủ để thực hiện thanh toán',
			);
			error.statusCode = 422;
			throw error;
		}

		const order = new Order({ userId });

		// *tạo key cho từng game trong order gửi lên
		// *push vào order
		for (const gameId of games) {
			const keygame = new Keygame({ gameId, key: v4() });
			const result = await keygame.save();
			const game = gamesList.find((game) => game._id.toString() === gameId);
			order.games.push({
				game,
				price: game.price,
				key: result,
			});
		}
		user.balance -= TOTAL_PRICE;
		user.cart = [];

		await user.save();
		await order.save();

		res.json({ message: 'Mua game thành công', newBalance: user.balance });
	} catch (err) {
		console.log(err);
		next(err);
	}
};

exports.getOrdersByUserId = async (req, res, next) => {
	const { userId } = req;

	try {
		const orders = await Order.find({ userId }, '-userId')
			.populate('games.game', {
				name: 1,
				images: { $slice: 1 },
			})
			.populate('games.key', 'key');

		res.status(200).json({
			orders: orders.map((order) => {
				return { ...order._doc, key: order._id };
			}),
		});
	} catch (err) {
		console.log(err);
		next(err);
	}
};
