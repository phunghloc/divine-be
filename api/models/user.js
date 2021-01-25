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
		watched: [
			{
				type: Schema.Types.ObjectId,
				required: true,
				ref: 'Game',
			},
		],
		cart: [{ type: Schema.Types.ObjectId, required: true, ref: 'Game' }],
		chargedHistory: [
			{
				type: Schema.Types.ObjectId,
				required: true,
				// ref: 'Order',
			},
		],
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
