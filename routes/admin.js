const express = require('express');
const { body } = require("express-validator")

const AdminController = require('../api/controllers/admin');

const { findGameByName } = require('../middleware/findGame');

const router = express.Router();

// * /admin/devs
router.get('/devs', AdminController.getAllDevlopers);
router.post('/devs', AdminController.postDeveloper);

// */admin/tag
router.get('/tags', AdminController.getTag);
router.post('/tags', AdminController.postTag);

// */admin/game
router.post('/game', findGameByName, AdminController.postGame);

// */admin/games
router.get('/games', AdminController.getGames);

module.exports = router;
