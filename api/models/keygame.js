const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const keygameSchema = new Schema(
	{
		key: {
			type: String,
			required: true,
			immutable: true,
			unique: true,
		},
		gameId: {
			type: Schema.Types.ObjectId,
			ref: 'Game',
		},
		activatedBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
	},
	{ timestamps: true },
);

module.exports = mongoose.model('Keygame', keygameSchema);
