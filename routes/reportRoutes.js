const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/revenue', verifyToken, reportController.getRevenueReport);

module.exports = router;