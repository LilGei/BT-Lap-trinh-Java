const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const verifyToken = require('../middlewares/authMiddleware');

// Tất cả API sản phẩm đều cần verifyToken
router.get('/', verifyToken, productController.getProducts);
router.post('/', verifyToken, productController.createProduct);

module.exports = router;