const Product = require('../models/product');
const fileHelper = require('../util/file');
const { validationResult } = require('express-validator/check');
const Ads = require('../models/ads');


exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMassge: false,
    validationError: [] 
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const errors = validationResult(req);

  if(!image){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/edit-product',
      editing: false,
      hasError: true,
      errorMassge: 'Attached file is not a image type!',
      product: {
        title: title,
        price: price,
        description: description,
        
      },
      validationError: []
    });
  }
 
  console.log(errors);
  
  if(!errors.isEmpty()){
    
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/edit-product',
      editing: false,
      hasError: true,
      errorMassge: errors.array()[0].msg,
      product: {
        title: title,
        price: price,
        description: description,   
      },
      validationError: errors.array()
    });

  }
  
  const imageUrl = image.path;

  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user
  });
  product
    .save()
    .then(result => {
      res.redirect('/admin/products');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
      
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        hasError: false,
        errorMassge: false,
        product: product,
        validationError: []     

      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
      
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;

  const errors = validationResult(req);
  console.log(errors);
  
  if(!errors.isEmpty()){
    
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasError: true,
      errorMassge: errors.array()[0].msg,
      product: {
        title: updatedTitle,
        imageUrl:updatedImageUrl ,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId
      },
      validationError: errors.array()
    });

  }
  


  Product.findById(prodId)
    .then(product => {
      if(product.userId.toString() !== req.user._id.toString()){
        return res.redirect('/');
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if(image){
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }
      return product.save()
      .then(result => {
        res.redirect('/admin/products');
      })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
      
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({userId: req.user._id})
    .then(products => {
      console.log(products);
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
      
    });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId).then(product =>{
    if(!product){
      return next(new Error("No Product Found!"));
    }
    fileHelper.deleteFile(product.imageUrl);
    return Product.deleteOne({_id: prodId, userId: req.user._id})
  })
  .then(() => {
      console.log('DESTROYED PRODUCT');
      res.status(200).json({ message: 'Success!'});
    })
    .catch(err => {
        res.status(500).json({message: 'Product not Deleted!'}); 
    });
};




exports.getAddAds = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/ads', {
        pageTitle: 'Add Ads',
        path: '/admin/edit-product',
        hasError: false,
        errorMassge: false,
        product: product,
        validationError: []     

      });
    })
    .catch(err => {
      console.log(prodId);
      console.log(err);
    });
};


exports.postAddAds = (req, res, next) => {
  const prodId = req.body.productId;
  const bid = req.body.bid;
  const image = req.file;
  const errors = validationResult(req);
    if(!image){
      console.log("in ads");
      res.render('admin/ads', {
        pageTitle: 'Add Ads',
        path: '/admin/ads',
        hasError: true,
        product: {
          _id: prodId
        },
        bid: bid,
        errorMassge: 'Attached file is not a image type!',
        validationError: []     
  
      });
    }
  
    console.log(errors);
    if(!errors.isEmpty()){
      return res.status(422).render('admin/ads', {
        pageTitle: 'Add Ads',
        path: '/admin/Ads',
        hasError: true,
        errorMassge: errors.array()[0].msg,
        bid: bid,
        product: {
          _id: prodId
        },
        validationError: errors.array()
      });
    }

   
    const posterUrl = image.path;

    //adding in ads
    const ads = new Ads({
      userId: req.user,
      productId: prodId,
      posterUrl: posterUrl,
      bid: bid
    })

    ads.save()
    .then(result => {
      res.redirect('/');
    })
    .catch(err => console.log(err));

}


// displaying total ads
exports.getAds = (req, res, next) => {
  Ads.find({userId: req.user._id})
    .then(ads => {
        console.log(ads);
        res.render('admin/ads-list', {
          ad: ads,
          pageTitle: 'Your Ads',
          path: '/admin/ads'
      })     
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
      
    });
};

// delete Ads 
exports.postDeleteAds = (req, res, next) => {
  const adsId = req.body.adsId;
  Ads.findById(adsId).then(ads =>{
    if(!ads){
      return next(new Error("No Ad Found!"));
    }
    fileHelper.deleteFile(ads.posterUrl);
    return Ads.deleteOne({_id: adsId, userId: req.user._id})
  })
  .then(() => {
      console.log('Ad Deleted!');
      res.redirect('/admin/ads');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); 
    });
};
