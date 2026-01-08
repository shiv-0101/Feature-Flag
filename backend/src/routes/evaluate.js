const express = require('express');
const router = express.Router();
const evaluateController = require('../controllers/evaluateController');

router.post('/', evaluateController.evaluate);
router.post('/bulk', evaluateController.evaluateBulk);
router.post('/all', evaluateController.getAllFlagsForClient);

module.exports = router;