const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');

router.get('/', vehicleController.getAllVehicles);
router.post('/', vehicleController.addVehicle);
router.put('/:id/location', vehicleController.updateVehicleLocation);
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;