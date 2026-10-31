const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const verifyToken = require('../middlewares/authMiddleware');

router.get('/', verifyToken, orderController.getOrders);
router.post('/', verifyToken, orderController.createOrder);
router.patch('/:id/status', verifyToken, orderController.updateOrderStatus);
router.post('/webhook-simulate', verifyToken, orderController.simulateWebhook);

module.exports = router;