const path = require('path');

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const morgan = require('morgan');

require('dotenv').config();

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/public');

const app = express();
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.join(__dirname, 'images'));
	},
	filename: (req, file, cb) => {
		cb(null, file.originalname);
	},
});
const upload = multer({ storage });
const port = process.env.PORT || 4808;

app.use(cors());
app.use(express.json());
app.use(upload.any());
app.use(morgan('tiny'));

app.use('/Admin-ryQbkvWamg', adminRoutes);
app.use(shopRoutes);

app.use((req, res, next) => {
	const error = new Error('404 not found!');
	error.statusCode = 404;
	return next(error);
});

app.use((err, req, res, next) => {
	const status = err.statusCode || 500;
	const message =
		err.message || 'Có lỗi xảy ra với server, xin vui lòng thử lại sau.';

	res.status(status).json({
		message,
	});
});

mongoose
	.connect(process.env.MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then((result) => {
		app.listen(port, () => {
			console.log(`app listen on ${port}`);
		});
	})
	.catch((err) => {
		console.log(err);
	});
