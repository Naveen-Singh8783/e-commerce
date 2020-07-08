const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');
const paypal = require('paypal-rest-sdk');



paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AYWKMtm7OThF6TDn5H5F--OISQo7pA5sUMG2uNBiHVkX9owhY6ONReNoJMd5bUli0rZqWF_Zl2opVEbT',
  'client_secret': 'EF-YGtHDTa_R4Gq02qtITbslDKkA4lKBNkYuMFoGpb7TTZAA9ohLmdJUakH-jN5HTxfoyYWbNiYY3hKS'
});


const ITEMS_PER_PAGE = 10;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
  .countDocuments()
  .then(numItems =>{
    totalItems = numItems;
    return Product.find()
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE);
  })
 .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
      
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
      
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
  .countDocuments()
  .then(numItems =>{
    totalItems = numItems;
    return Product.find()
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE);
  })
 .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
      
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
       
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
      
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
      
    });
};


exports.getCheckout = (req, res, next) => {
  req.user
  .populate('cart.items.productId')
  .execPopulate()
  .then(user => {
    const products = user.cart.items;
    let total = 0;
    products.forEach(p => {
      total += p.quantity * p.productId.price;
    });
   
    res.render('shop/checkout', {
      path: '/checkout',
      pageTitle: 'Checkout',
      products: products,
      totalSum: total
     
    });
  })
  .catch(err => {
    console.log(err);
   const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error); 
    
  });
}



exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
      
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
        
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
      
    });
};


exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  
  Order.findById(orderId).then(order => {  
    if(!order){ 
      return next(new Error("No order Found!"));
    }
    if(order.user.userId.toString() !== req.user._id.toString()){ 
      return next(new Error('This order not belong to this user!'));
    }

    const invoiceName = 'invoice-'+ orderId + '.pdf';
    const invoicePath = path.join('data','Invoice', invoiceName);  

    const PdfDoc = new PDFDocument();
    res.setHeader('Content-type', 'application/pdf');
    res.setHeader('Content-Disposition','inline; filename= "' + invoiceName + '"');
    PdfDoc.pipe(fs.createWriteStream(invoicePath));
    PdfDoc.pipe(res);
 

    PdfDoc.fontSize(26).text("Invoice",{
      underline: true
    });
    PdfDoc.fontSize(14).text('-------------------------------------------');
    let totalPrice = 0;
    order.products.forEach(prod => {
      totalPrice = totalPrice + prod.quantity * prod.product.price;
      PdfDoc.fontSize(14).text(prod.product.title + ' - ' + prod.quantity + ' X ' + ' INR' + prod.product.price);      
  });
  PdfDoc.text('--------------------------------------------');
  PdfDoc.fontSize(20).text('Total - INR'+totalPrice);
  PdfDoc.end();


  })
  .catch(err => {
    return next(err);
  })

}



//payment handling

exports.postPay = (req,res,next) => {
  const totalSum = req.body.totalSum;
  const create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://localhost:3000/create-order",
        "cancel_url": "http://localhost:3000/failed"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "shop",
                "sku": "001",
                "price": totalSum,
                "currency": "INR",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "INR",
            "total": totalSum
        },
        "description": "just test"
    }]
};

paypal.payment.create(create_payment_json, function (error, payment) {
  if (error) {
    console.log(error);
      throw error;
  } else {
      for(let i = 0; i < payment.links.length; i++){
        if(payment.links[i].rel === 'approval_url'){
          res.redirect(payment.links[i].href);
        }
      }
  }
});
 
}

exports.getPaymentFail = (req, res, next) => {
  console.log("in failed");
  res.render('shop/paymentfailed', {
    path: '/orders',
    pageTitle: 'Your Orders'
  });
}