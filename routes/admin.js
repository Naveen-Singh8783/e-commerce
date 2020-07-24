const path = require('path');

const { body } = require('express-validator/check');

const express = require('express');

const adminController = require('../controllers/admin');

const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product',isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products',isAuth , adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product',isAuth ,[
    body('title').isString().isLength({min: 3}).trim(),
    body('imageUrl'),
    body('price').isFloat().trim(),
    body('description').isLength({min: 8, max: 400})
], adminController.postAddProduct);

router.get('/edit-product/:productId',isAuth , adminController.getEditProduct);

router.post('/edit-product',isAuth ,[
    body('title').isString().isLength({min: 3}).trim(),
    body('imageUrl'),
    body('price').isFloat().trim(),
    body('description').isLength({min: 8, max: 400})
], adminController.postEditProduct);

// /admin/product/productID
router.delete('/product/:productId',isAuth , adminController.deleteProduct);

// /admin/ads
router.get('/ads/:productId', isAuth , adminController.getAddAds);

router.post('/ads', isAuth,[
    body('bid').isFloat().trim()
], adminController.postAddAds);


router.get('/ads', isAuth, adminController.getAds);
module.exports = router;


router.post('/delete-ads',isAuth , adminController.postDeleteAds);
