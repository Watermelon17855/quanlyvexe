const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.post('/', bookingController.createBooking);
router.get('/', bookingController.getAllBookings);
router.put('/cancel/:id', bookingController.cancelBooking);
router.put('/transfer/:bookingId', bookingController.transferBooking);

module.exports = router;    