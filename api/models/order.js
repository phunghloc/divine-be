const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		games: [
			{
				game: {
					type: Schema.Types.ObjectId,
					ref: 'Game',
				},
				price: Number,
        key: {
					type: Schema.Types.ObjectId,
					ref: 'Keygame',
        }
			},
		],
	},
	{ timestamps: true },
);

module.exports = mongoose.model('Order', orderSchema);
