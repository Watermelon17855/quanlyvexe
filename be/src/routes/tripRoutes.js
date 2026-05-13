const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

router.get('/', tripController.getAllTrips);
router.put('/bulk-update-price', tripController.bulkUpdatePrice);
router.delete('/bulk-delete', tripController.bulkDeleteTrips);
router.get('/:id/booked-seats', tripController.getBookedSeats);
router.get('/locations', tripController.getLocations);
router.post('/', tripController.createTrip);
router.delete('/:id', tripController.deleteTrip);
router.put('/:id', tripController.updateTrip);

router.get('/search', tripController.searchTrips);

module.exports = router;