const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const gameSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
		},
		developer: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Developer',
		},
		price: {
			type: Number,
			required: true,
		},
		tags: [
			{
				tagId: {
					type: Schema.Types.ObjectId,
					ref: 'Tag',
				},
			},
		],
		description: { type: String, required: true },
		linkSteam: { type: String, required: true },
		minimumRequirement: Object,
		recommendRequirement: Object,
		images: [{ url: String, path: String, main: String, thumb: String }],
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
				createdDate: {
					type: Date,
					default: Date.now,
				},
				updatedDate: {
					type: Date,
					default: Date.now,
				},
				replies: [
					{
						userId: {
							type: Schema.Types.ObjectId,
							ref: 'User',
						},
						comment: {
							type: String,
							required: true,
						},
						createdDate: {
							type: Date,
							default: Date.now,
						},
						updatedDate: {
							type: Date,
							default: Date.now,
						},
					},
				],
			},
		],
	},
	{ timestamps: true },
);

module.exports = mongoose.model('Game', gameSchema);
