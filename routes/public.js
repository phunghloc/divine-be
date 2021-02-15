const express = require('express');
const { body } = require('express-validator');

const AdminControllers = require('../api/controllers/admin');
const AuthControllers = require('../api/controllers/auth');
const ShopControllers = require('../api/controllers/shop');

const User = require('../api/models/user');

const { isAuth, isLogined } = require('../middleware/isAuth');

const router = express.Router();

// */devs
router.get('/devs', AdminControllers.getAllDevlopers);

// */auth
router.post(
	'/auth/signup',
	[
		body('email', 'Email không hợp lệ.')
			.trim()
			.isEmail()
			.normalizeEmail()
			.custom((email, { req }) => {
				return User.findOne({ email }).then((findedUser) => {
					if (findedUser) {
						return Promise.reject('Email này đã được sử dụng.');
					}
				});
			}),
		body('name').trim().isLength({ min: 1, max: 40 }),
		body('username')
			.trim()
			.isLength({ min: 1 })
			.custom((username, { req }) => {
				return User.findOne({ username }).then((findedUser) => {
					if (findedUser) {
						return Promise.reject('Tên tài khoản này đã được sử dụng.');
					}
				});
			}),
		body('phoneNumber', 'Số điện thoại không hợp lệ').trim().isNumeric(),
		body('password', 'Mật khẩu ít nhất 6 ký tự').trim().isLength({ min: 6 }),
		body('confirmPassword').custom((confPass, { req }) => {
			if (confPass !== req.body.password) {
				throw new Error('Nhập lại mật khẩu không khớp.');
			}
			return true;
		}),
	],
	AuthControllers.postSignUp,
);

router.post('/auth/login', AuthControllers.postLogin);

router.get('/auth/auto-login', isAuth, AuthControllers.getAutoLogin);

router.get('/auth/get-notifications', isAuth, AuthControllers.getNotifications);

router.get(
	'/auth/mark-as-read-notification/:notifyId',
	isAuth,
	AuthControllers.markAsReadNotification,
);

// */user
router.post('/user/edit/avatar', isAuth, AuthControllers.postAvatar);
router.post(
	'/user/edit/info',
	isAuth,
	[
		body('name', 'Tên không hợp lệ.').trim().isLength({ min: 1, max: 40 }),
		body('phoneNumber', 'Số điện thoại không hợp lệ.').trim().isNumeric(),
	],
	AuthControllers.postChangeInfo,
);
router.post(
	'/user/edit/password',
	isAuth,
	[
		body('password', 'Mật khẩu ít nhất 6 ký tự').trim().isLength({ min: 6 }),
		body('confirmPassword').custom((confPass, { req }) => {
			if (confPass !== req.body.password) {
				throw new Error('Nhập lại mật khẩu không khớp.');
			}
			return true;
		}),
	],
	AuthControllers.postChangePassword,
);
router.get('/user/edit', isAuth, AuthControllers.getOwnerUser);
router.get('/user/:userId', AuthControllers.getUser);

// */
router.get('/', ShopControllers.getGamesHomepage);

//* /detail-game/:gameId
router.get(
	'/detail-game/:gameId',
	isLogined,
	ShopControllers.getDetailGameById,
);

//TODO post comment
router.post(
	'/detail-game/:gameId/comment',
	isAuth,
	[body('comment', 'Bình luận không hợp lệ!').trim().notEmpty()],
	ShopControllers.postCommentInGame,
);

//TODO post reply
router.post(
	'/detail-game/:gameId/:commentId',
	isAuth,
	[body('comment', 'Bình luận không hợp lệ!').trim().notEmpty()],
	ShopControllers.postReplyInCommentGame,
);

//TODO delete comment
router.delete(
	'/detail-game/:gameId/:commentId',
	isAuth,
	ShopControllers.deleteCommentInGame,
);

//TODO delete reply
router.delete(
	'/detail-game/:gameId/:commentId/:replyId',
	isAuth,
	ShopControllers.deleteReplyInGame,
);

// */search-game?name=
router.get('/search-game', ShopControllers.findGameByName);

// */cart
router.get('/cart', isAuth, ShopControllers.getCart);

// */add-to-cart
router.post('/add-to-cart', isAuth, ShopControllers.addToCart);

// */delete-cart-item/:gameId
router.delete(
	'/delete-cart-item/:gameId',
	isAuth,
	ShopControllers.removeItemCart,
);

// */cash
router.get('/cash', isAuth, ShopControllers.createCash);
router.post('/cash', isAuth, ShopControllers.postCash);

// */purchase
router.post('/purchase', isAuth, ShopControllers.postPurchaseGames);

// */orders
router.get('/orders', isAuth, ShopControllers.getOrdersByUserId);

// */order/:orderId
router.get('/order/:orderId', isAuth, ShopControllers.getDetailOrderById);

// */activate-by-key
router.post('/activate-by-key', isAuth, ShopControllers.activatedGameByKeygame);

// */check-key
router.post('/check-key', ShopControllers.checkKeygame);

module.exports = router;
