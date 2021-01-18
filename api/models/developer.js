const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const devSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		games: [
			{
				game: {
					type: Schema.Types.ObjectId,
					required: true,
					ref: 'Game',
				},
			},
		],
	},
	{ timestamps: true },
);

module.exports = mongoose.model('Developer', devSchema);
