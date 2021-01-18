const jwt = require('jsonwebtoken');

// require('dotenv').config();

module.exports = (req, res, next) => {
	const authHeader = req.get('Authorization');
	if (!authHeader) {
		const error = new Error('Not login yet');
		error.statusCode = 401;
		next(error);
	}

	const token = authHeader.split(' ')[1];
	let decodedToken;
	try {
		decodedToken = jwt.verify(token, process.env.JWT_KEY);
	} catch (err) {
		err.statusCode = 422;
		next(err);
	}

	if (!decodedToken) {
		const error = new Error('Invalid Token');
		error.statusCode = 401;
		next(error);
	}

	req.userId = decodedToken.userId;
	next();
};
