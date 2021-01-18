const Game = require('../api/models/game');

exports.findGameByName = async (req, res, next) => {
	// console.log(req.body);
	const gamesName = req.body.name.trim();
	const game = await Game.findOne({ name: gamesName });
	if (game) {
		const error = new Error(`Trong hệ thống đã có game ${req.body.name}`);
		error.statusCode(400);
		return next(error);
	} else {
		next();
	}
};
