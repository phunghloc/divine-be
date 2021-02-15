const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema(
	{
		username: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
		},
		password: {
			type: String,
			required: true,
		},
		phoneNumber: {
			type: String,
			required: true,
		},
		balance: {
			type: Number,
			default: 100000,
		},
		cart: [{ type: Schema.Types.ObjectId, required: true, ref: 'Game' }],
		activatedGames: [
			{
				type: Schema.Types.ObjectId,
				required: true,
				ref: 'Game',
			},
		],
		admin: {
			type: Boolean,
			default: false,
		},
		avatar: {
			type: String,
			default:
				'https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_1280.png',
		},
		status: {
			type: String,
			default: 'Xin chào',
		},
		notifications: {
			newNotifications: {
				type: Number,
				default: 0,
			},
			list: [
				{
					hasRead: {
						type: Boolean,
						default: false,
					},
					logId: {
						type: Schema.Types.ObjectId,
						ref: 'Log',
					},
				},
			],
		},
	},
	{ timestamps: true },
);

userSchema.methods.addItemToCart = function (gameId) {
	this.cart.push(gameId);
	return this.save();
};

userSchema.methods.removeItemFromCart = function (gameId) {
	this.cart = this.cart.filter((game) => game.toString() !== gameId.toString());
	return this.save();
};

module.exports = mongoose.model('User', userSchema);
