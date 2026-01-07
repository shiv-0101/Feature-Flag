const express = require('express');
const router = express.Router();
const flagController = require('../controllers/flagController');
const { validateFlag, validateFlagKey } = require('../middleware/validateFlag');

router.post('/', validateFlag, flagController.createFlag);
router.get('/', flagController.getAllFlags);
router.get('/:key', validateFlagKey, flagController.getFlagByKey);
router.put('/:key', validateFlagKey, validateFlag, flagController.updateFlag);
router.delete('/:key', validateFlagKey, flagController.deleteFlag);
router.patch('/:key/toggle', validateFlagKey, flagController.toggleFlag);

module.exports = router;
