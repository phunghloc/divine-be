const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const tagSchema = new Schema({
	label: {
		type: String,
		required: true,
	},
	value: {
		type: String,
		required: true,
	},
});

module.exports = mongoose.model('Tag', tagSchema);
