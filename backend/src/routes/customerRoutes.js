/**
 * Customer Express Routes.
 * 
 * Maps `/v1/customers` endpoints to customerController actions.
 */

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.post('/update', customerController.updateCustomer);

module.exports = router;
