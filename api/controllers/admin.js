const Developer = require('../models/developer');
const Tag = require('../models/tag');
const Game = require('../models/game');
const Cloudinary = require('../models/cloudinary');

exports.getAllDevlopers = async (req, res) => {
	try {
		const devs = await Developer.find({}, '_id name').sort({ name: 1 });

		res.status(200).json({ devs });
	} catch (err) {
		console.log(err);

		const error = new Error('Cant action to Database');
		error.statusCode = 500;
		throw error;
	}
};

exports.postDeveloper = async (req, res, next) => {
	const devData = req.body;

	const dev = await Developer.findOne({ name: req.body.name.trim() });

	if (dev) {
		console.log(dev);
		const error = new Error(`Đã có nhà phát triển ${req.body.name}`);
		error.statusCode = 400;
		next(error);
	} else {
		const newDev = new Developer(devData);

		try {
			const result = await newDev.save();
			res.status(201).json({ developer: result });
		} catch (err) {
			console.log(err);

			const error = new Error('Cant action to Database');
			error.statusCode = 500;
			throw error;
		}
	}
};

exports.postTag = async (req, res) => {
	const tag = new Tag(req.body);
	try {
		const result = await tag.save();
		res.status(201).json({ result });
	} catch (err) {
		console.log(err);

		const error = new Error('Cant action to Database');
		error.statusCode = 500;
		throw error;
	}
};

exports.getTag = async (req, res) => {
	try {
		const tags = await Tag.find({}, 'label value');
		res.status(200).json(tags);
	} catch (err) {
		console.log(err);
		const error = new Error('Cant action to Database');
		error.statusCode = 500;
		throw error;
	}
};

exports.postGame = async (req, res) => {
	// console.log(req.files, req.body);
	let res_promises = req.files.map(
		(file) =>
			new Promise((resolve, reject) => {
				Cloudinary.uploadMultiple(file.path, 'home').then((result) => {
					resolve(result);
				});
			}),
	);

	Promise.all(res_promises)
		.then(async (arrImg) => {
			// arrImg = { url, path }
			const { name, price, developer, description, linkSteam } = req.body;

			const minimumRequirement = {
				os: req.body['minimum.os'],
				processor: req.body['minimum.processor'],
				memory: req.body['minimum.memory'],
				graphic: req.body['minimum.graphic'],
				storage: req.body['minimum.storage'],
			};

			const recommendRequirement = {
				os: req.body['recommend.os'],
				processor: req.body['recommend.processor'],
				memory: req.body['recommend.memory'],
				graphic: req.body['recommend.graphic'],
				storage: req.body['recommend.storage'],
			};

			const tags = req.body.tags.split(' ').map((tag) => {
				return { tagId: tag };
			});

			const gameData = {
				name,
				price,
				developer,
				minimumRequirement,
				recommendRequirement,
				tags,
				images: arrImg,
				description,
				linkSteam,
			};

			const game = new Game(gameData);
			try {
				const result = await game.save();

				res.status(201).json(result);
			} catch (err) {
				console.log(err);
				const error = new Error('Cant action to Database');
				error.statusCode = 500;
				throw error;
			}
		})
		.catch((err) => {
			console.log(err);
			const error = new Error("Something's wrong in Cloudinary");
			error.statusCode = 500;
			throw error;
		});
};

exports.getGames = async (req, res, next) => {
	const page = req.query.page || 1;
	const ITEM_PER_PAGE = 12;
	try {
		const total = await Game.find().countDocuments();
		const games = await Game.find({}, 'name price images.url')
			.skip((page - 1) * ITEM_PER_PAGE)
			.limit(ITEM_PER_PAGE);

		const resGames = games.map((game) => {
			return { ...game._doc, images: game.images[0].url };
		});

		res.status(200).json({ games: resGames, total });
	} catch (err) {
		next(err);
	}
};
