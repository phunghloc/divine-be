const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const postSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'User',
		},
		content: String,
		images: [{ url: String, path: String }],
		likes: [
			{
				type: Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		comments: [
			{
				userId: {
					type: Schema.Types.ObjectId,
					ref: 'User',
				},
				comment: {
					type: String,
					required: true,
				},
				commentDate: {
					type: Date,
					default: Date.now,
				},
			},
		],
		subcribers: [
			{
				type: Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		available: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true },
);

module.exports = mongoose.model('Post', postSchema);
