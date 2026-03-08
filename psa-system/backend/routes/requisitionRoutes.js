const express = require('express');
const router = express.Router();

router.get("/:id/pdf", requisitionController.generatePDF);
const auth = require('../middleware/auth');
const requisitionController = require('../controller/requisitionController');

router.post('/', auth, requisitionController.createRequisition);

router.get('/', auth, requisitionController.getAllRequisitions);

router.get('/my', auth, requisitionController.getMyRequisitions);

router.put('/:id/approve', auth, requisitionController.approveRequisition);

router.put('/:id/reject', auth, requisitionController.rejectRequisition);

router.get('/:id/pdf', auth, requisitionController.generatePDF);

module.exports = router;