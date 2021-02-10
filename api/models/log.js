const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const logSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
		},
		rootId: {
			type: Schema.Types.ObjectId,
		},
		type: String,
	},
	{ timestamps: true },
);

module.exports = mongoose.model('Log', logSchema);

// type:
// 'like',
// 'comment game',
// 'comment post',
// 'create post',
// 'delete post',
// 'delete comment'
