/**
 * Transaction Express Routes.
 * 
 * Maps `/v1/transactions` endpoints to transactionController actions.
 */

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

router.get('/', transactionController.getTransactions);
router.post('/', transactionController.saveTransactions);

module.exports = router;
