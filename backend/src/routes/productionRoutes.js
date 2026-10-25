/**
 * Production Express Routes.
 * 
 * Maps `/v1/production` endpoints to productionController actions.
 */

const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');

router.get('/', productionController.getProduction);
router.post('/', productionController.bulkUpsertProduction);
router.delete('/item/:id', productionController.deleteProductionItem);

module.exports = router;
