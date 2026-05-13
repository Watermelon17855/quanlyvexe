const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/webhook-sepay', paymentController.sepayWebhook);

module.exports = router;