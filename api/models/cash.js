const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const cashSchema = new Schema(
	{
		code: {
			type: String,
			required: true,
		},
		serial: {
			type: String,
			required: true,
		},
		denominate: {
			type: Number,
			required: true,
		},
		activatedBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
	},
	{ timestamps: true },
);

module.exports = mongoose.model('Cash', cashSchema);