/**
 * Inventory Express Routes.
 * 
 * Maps `/v1/inventory` endpoints to inventoryController actions.
 */

const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.get('/', inventoryController.getInventory);
router.post('/', inventoryController.bulkUpsertInventory);
router.post('/item', inventoryController.saveInventoryItem);
router.post('/sell', inventoryController.sellInventoryItemAtomic);
router.delete('/item/:id', inventoryController.deleteInventoryItem);

module.exports = router;
