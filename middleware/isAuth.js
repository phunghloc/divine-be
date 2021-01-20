const jwt = require('jsonwebtoken');

require('dotenv').config();

exports.isAuth = (req, res, next) => {
	const authHeader = req.get('Authorization');
	if (!authHeader) {
		const error = new Error('Not login yet');
		error.statusCode = 401;
		return next(error);
	}

	const token = authHeader.split(' ')[1];
	let decodedToken;
	try {
		decodedToken = jwt.verify(token, process.env.JWT_KEY);
	} catch (err) {
		err.statusCode = 422;
		return next(err);
	}

	if (!decodedToken) {
		const error = new Error('Invalid Token');
		error.statusCode = 401;
		return next(error);
	}

	req.userId = decodedToken.userId;
	next();
};

exports.isLogined = (req, res, next) => {
	try {
		const authHeader = req.get('Authorization');

		const token = authHeader.split(' ')[1];
		let decodedToken;
		decodedToken = jwt.verify(token, process.env.JWT_KEY);

		req.userId = decodedToken.userId;
	} catch (err) {}

	next();
};
